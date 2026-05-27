/** Status phases — only compiling & running shown in terminal */
export const STATUS_META = {
  compiling: { label: 'Compiling...' },
  running: { label: 'Running program...' },
};

const HIDDEN_PHASES = new Set(['starting', 'queued']);

export function createTerminalState() {
  return {
    blocks: [
      {
        id: 'welcome',
        type: 'system',
        text: 'Ready — press Run to execute.',
      },
    ],
    durationMs: null,
    running: false,
  };
}

let blockId = 0;
export function nextBlockId() {
  blockId += 1;
  return `b-${blockId}-${Date.now()}`;
}

export function upsertStatusBlock(blocks, phase, message) {
  if (HIDDEN_PHASES.has(phase)) return blocks;
  const text = message || STATUS_META[phase]?.label;
  if (!text) return blocks;

  const without = blocks.filter((b) => b.type !== 'status');
  return [
    ...without,
    { id: 'status-current', type: 'status', phase, text },
  ];
}

export function appendStreamBlock(blocks, type, chunk, stream = 'run') {
  if (!chunk) return blocks;
  const last = blocks[blocks.length - 1];
  if (last?.type === type && last?.stream === stream) {
    return [
      ...blocks.slice(0, -1),
      { ...last, content: (last.content || '') + chunk },
    ];
  }
  return [
    ...blocks,
    { id: nextBlockId(), type, stream, content: chunk },
  ];
}

export function appendCompileLogBlock(blocks, chunk) {
  if (!chunk) return blocks;
  const existing = blocks.find((b) => b.type === 'compileLogs');
  if (existing) {
    return blocks.map((b) =>
      b.type === 'compileLogs'
        ? { ...b, content: (b.content || '') + chunk }
        : b
    );
  }
  return [...blocks, { id: nextBlockId(), type: 'compileLogs', content: chunk }];
}

function dedupeDiagnostics(diagnostics) {
  const seen = new Set();
  return (diagnostics || []).filter((d) => {
    const key = `${d.file}:${d.line}:${d.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Format like compiler stderr (same style as compilation logs) */
export function formatDiagnosticLogLine(d) {
  if (d.raw?.trim()) {
    const first = d.raw.trim().split('\n')[0];
    if (first) return first;
  }
  if (d.file && d.line != null) {
    return `${d.file}:${d.line}: error: ${d.message}`;
  }
  if (d.file) return `${d.file}: error: ${d.message}`;
  return d.message || 'error';
}

export function diagnosticsToLogText(diagnostics) {
  return dedupeDiagnostics(diagnostics).map(formatDiagnosticLogLine).join('\n');
}

/** Problems as plain log text (compile-logs style), not card UI */
export function upsertDiagnosticsBlock(blocks, diagnostics, errorType = 'compile') {
  const unique = dedupeDiagnostics(diagnostics);
  if (!unique.length) return blocks;

  const without = blocks.filter(
    (b) =>
      b.type !== 'diagnostics' &&
      b.type !== 'failure' &&
      b.type !== 'status' &&
      b.type !== 'compileLogs'
  );

  return [
    ...without,
    {
      id: 'problems-current',
      type: 'diagnostics',
      errorType,
      diagnostics: unique,
      content: diagnosticsToLogText(unique),
    },
  ];
}

export function addEndBlock(blocks, success, durationMs, errorType, message) {
  const withoutStatus = blocks.filter((b) => b.type !== 'status');
  const hasProblems = withoutStatus.some((b) => b.type === 'diagnostics');
  const next = [...withoutStatus];

  if (success) {
    next.push({
      id: nextBlockId(),
      type: 'success',
      text: 'Program finished successfully',
      durationMs,
    });
  } else if (!hasProblems) {
    next.push({
      id: nextBlockId(),
      type: 'failure',
      text: message || 'Execution failed',
      errorType,
      durationMs,
    });
  } else if (durationMs != null) {
    const prob = next.find((b) => b.type === 'diagnostics');
    if (prob) {
      const idx = next.indexOf(prob);
      next[idx] = { ...prob, durationMs };
    }
  }

  return next;
}

export function getCopyableOutput(blocks) {
  return blocks
    .map((b) => {
      if (b.type === 'stdout' || b.type === 'stderr' || b.type === 'compileLogs') {
        return b.content || '';
      }
      if (b.type === 'diagnostics') {
        return b.content || diagnosticsToLogText(b.diagnostics);
      }
      if (b.type === 'status' || b.type === 'system' || b.type === 'success' || b.type === 'failure') {
        return b.text || '';
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

export function formatProblemLine(d) {
  return formatDiagnosticLogLine(d);
}

export function countProblems(blocks) {
  const diag = blocks.find((b) => b.type === 'diagnostics');
  return diag?.diagnostics?.length || 0;
}

export function addDiagnosticsBlock(blocks, diagnostics, errorType) {
  return upsertDiagnosticsBlock(blocks, diagnostics, errorType);
}

export function addStatusBlock(blocks, phase, message) {
  return upsertStatusBlock(blocks, phase, message);
}
