import { useRef, useEffect, useState, useMemo } from 'react';
import { Terminal, Copy, Trash2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { stripAnsi, ansiToHtml } from '../utils/ansi';
import { getCopyableOutput, countProblems } from '../utils/terminalState';
import toast from 'react-hot-toast';

/** Same UI as compilation logs — collapsible, plain mono text */
function CollapsibleLogPanel({
  title,
  content,
  defaultOpen = false,
  variant = 'muted',
  count,
  onLineClick,
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content?.trim()) return null;

  const lines = stripAnsi(content).split('\n').filter((l, i, arr) => l.length > 0 || i < arr.length - 1);
  const textClass =
    variant === 'error'
      ? 'text-[#ff6b6b]/90'
      : 'text-zinc-500';

  const parseLineLink = (line) => {
    const m = line.match(/^([^:]+):(\d+)(?::\d+)?:\s*(?:error:\s*)?/i);
    if (m) return { file: m[1], line: parseInt(m[2], 10) };
    const m2 = line.match(/^([^:]+):(\d+)\s*→/);
    if (m2) return { file: m2[1], line: parseInt(m2[2], 10) };
    return null;
  };

  return (
    <div className="my-0.5 border-t border-zinc-700/30 pt-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-400 py-0.5 w-full text-left"
      >
        <ChevronRight
          className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <span>{title}</span>
        {count != null && count > 0 && (
          <span className="text-[#ff6b6b]/80 ml-1">✖ {count} Error{count !== 1 ? 's' : ''}</span>
        )}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <pre className={`text-[10px] leading-[1.4] whitespace-pre-wrap break-words py-0.5 pl-3.5 font-mono ${textClass}`}>
            {lines.map((line, i) => {
              const link = onLineClick ? parseLineLink(line) : null;
              if (link) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onLineClick(link.line, link.file)}
                    className="block w-full text-left hover:underline hover:text-[#ff8a8a] cursor-pointer"
                  >
                    {line}
                  </button>
                );
              }
              return (
                <span key={i} className="block">
                  {line}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ProgramOutput({ content }) {
  const raw = content || '';
  const hasAnsi = /\x1b\[/.test(raw);
  return (
    <pre
      className="font-mono text-[11px] leading-[1.4] text-[#f0f0f0] whitespace-pre-wrap break-words py-0.5"
      dangerouslySetInnerHTML={hasAnsi ? { __html: ansiToHtml(raw) } : undefined}
    >
      {hasAnsi ? null : stripAnsi(raw) || '\u00a0'}
    </pre>
  );
}

function RunStderr({ content }) {
  if (!content?.trim()) return null;
  return (
    <CollapsibleLogPanel
      title="Runtime output"
      content={content}
      defaultOpen
      variant="error"
    />
  );
}

function StdinPanel({ stdin, onStdinChange, disabled, expanded, onToggle }) {
  return (
    <div className="shrink-0 border-b border-zinc-700/50 bg-[#2a2a2b]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-2 py-0.5 text-left text-[10px] text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-zinc-500">stdin</span>
        {stdin?.trim() && !expanded && (
          <span className="ml-auto text-[10px] text-zinc-600">
            {stdin.split('\n').filter((l) => l.length > 0).length || 1} line(s)
          </span>
        )}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-2 pb-1.5">
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              rows={2}
              disabled={disabled}
              spellCheck={false}
              className="w-full bg-[#1e1e1e] border border-zinc-700/60 rounded text-[11px] text-zinc-200 px-2 py-1 font-mono resize-none min-h-[40px] focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
              placeholder={'1 2 3\nhello'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompilerTerminal({
  blocks,
  running,
  durationMs,
  stdin,
  onStdinChange,
  needsStdin,
  onClear,
  onHide,
  terminalHeight,
  onResizeStart,
  disabled,
  onGoToLine,
}) {
  const endRef = useRef(null);
  const [stdinOpen, setStdinOpen] = useState(false);

  const grouped = useMemo(() => {
    const system = [];
    const logs = [];
    let programOut = '';
    let programErr = '';
    let compileLogs = '';
    let problemsLog = '';
    let problemCount = 0;
    let success = null;
    let failure = null;

    for (const b of blocks) {
      if (b.type === 'system') system.push(b);
      else if (b.type === 'status') logs.push(b);
      else if (b.type === 'stdout' && b.stream === 'run') programOut += b.content || '';
      else if (b.type === 'stderr' && b.stream === 'run') programErr += b.content || '';
      else if (b.type === 'compileLogs') compileLogs += b.content || '';
      else if (b.type === 'diagnostics') {
        problemsLog = b.content || '';
        problemCount = b.diagnostics?.length || 0;
      } else if (b.type === 'success') success = b;
      else if (b.type === 'failure') failure = b;
    }

    return {
      system,
      logs,
      programOut,
      programErr,
      compileLogs,
      problemsLog,
      problemCount,
      success,
      failure,
    };
  }, [blocks]);

  const errorCount = countProblems(blocks) || grouped.problemCount;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: running ? 'auto' : 'smooth' });
  }, [blocks, running]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stripAnsi(getCopyableOutput(blocks)));
      toast.success('Copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleLineClick = (line) => {
    onGoToLine?.(line);
  };

  const hasProgramOutput = grouped.programOut.trim();

  return (
    <div
      className="shrink-0 flex flex-col border-t-2 border-zinc-600/50 bg-[#252526] shadow-[0_-4px_12px_rgba(0,0,0,0.25)]"
      style={{ height: terminalHeight }}
    >
      <div
        role="separator"
        className="h-1 cursor-row-resize bg-zinc-600/40 hover:bg-zinc-500/60 transition shrink-0"
        onMouseDown={onResizeStart}
        title="Drag to resize"
      />

      <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-0.5 border-b border-zinc-700/60 bg-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span className="text-zinc-400 font-medium">Terminal</span>
          {running && <span className="text-[10px] text-amber-500/70">●</span>}
          {errorCount > 0 && !running && (
            <span className="text-[10px] text-[#ff6b6b]/80">✖ {errorCount}</span>
          )}
          {durationMs != null && !running && (
            <span className="text-[10px] text-zinc-600 tabular-nums">{durationMs}ms</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition"
            title="Copy output"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onHide}
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition"
            title="Hide"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {needsStdin && (
        <StdinPanel
          stdin={stdin}
          onStdinChange={onStdinChange}
          disabled={disabled}
          expanded={stdinOpen}
          onToggle={() => setStdinOpen((o) => !o)}
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-0.5 min-h-0 bg-[#252526] font-mono">
        {grouped.system.map((block) => (
          <p key={block.id} className="text-zinc-600 text-[10px] py-px leading-tight">
            {block.text}
          </p>
        ))}

        {grouped.logs.map((block) => (
          <p
            key={block.id}
            className="text-[10px] py-px text-zinc-500 leading-tight flex items-center gap-1"
          >
            <span className="text-zinc-600">›</span>
            {block.text}
          </p>
        ))}

        {grouped.problemsLog.trim() && (
          <CollapsibleLogPanel
            title="Problems"
            content={grouped.problemsLog}
            defaultOpen
            variant="error"
            count={errorCount}
            onLineClick={onGoToLine ? handleLineClick : undefined}
          />
        )}

        <CollapsibleLogPanel
          title="Compilation logs"
          content={grouped.compileLogs}
          defaultOpen={false}
          variant="muted"
        />

        {hasProgramOutput && (
          <div className="mt-0.5 border-t border-zinc-700/30 pt-0.5">
            <p className="text-[10px] text-zinc-600 py-px pl-3.5">Output</p>
            <ProgramOutput content={grouped.programOut} />
          </div>
        )}

        <RunStderr content={grouped.programErr} />

        {grouped.success && (
          <p className="text-[11px] py-0.5 text-green-500/90 flex items-center gap-1.5 border-t border-zinc-700/30 mt-0.5 pt-1">
            <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
            <span>
              {grouped.success.text || 'Program finished successfully'}
              {grouped.success.durationMs != null && (
                <span className="text-zinc-600 font-normal ml-1.5">
                  ({grouped.success.durationMs}ms)
                </span>
              )}
            </span>
          </p>
        )}

        {grouped.failure && !grouped.problemsLog.trim() && (
          <CollapsibleLogPanel
            title="Problems"
            content={grouped.failure.text}
            defaultOpen
            variant="error"
            count={1}
          />
        )}

        <div ref={endRef} className="h-px" />
      </div>
    </div>
  );
}
