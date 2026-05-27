import { useCallback, useState } from 'react';
import { useCompileSocket } from './useCompileSocket';
import {
  createTerminalState,
  appendStreamBlock,
  appendCompileLogBlock,
  upsertStatusBlock,
  upsertDiagnosticsBlock,
  addEndBlock,
} from '../utils/terminalState';

const HIDDEN_PHASES = new Set(['starting', 'queued']);

export function useTerminalRunner() {
  const { runCode, cancelRun } = useCompileSocket();
  const [terminal, setTerminal] = useState(createTerminalState);

  const resetTerminal = useCallback(() => {
    setTerminal(createTerminalState());
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminal({
      blocks: [{ id: 'cleared', type: 'system', text: 'Terminal cleared.' }],
      durationMs: null,
      running: false,
    });
  }, []);

  const execute = useCallback(
    async ({ language, code, fileName, stdin }) => {
      setTerminal({
        blocks: [],
        durationMs: null,
        running: true,
      });

      try {
        const endPayload = await runCode(
          { language, code, fileName, stdin },
          {
            onStart: () => {},
            onOutput: (payload) => {
              if (payload.chunkType === 'status') {
                const phase = payload.phase || '';
                if (HIDDEN_PHASES.has(phase)) return;

                const label =
                  payload.message ||
                  (phase === 'compiling'
                    ? `Compiling ${language}...`
                    : phase === 'running'
                      ? 'Running program...'
                      : null);

                if (!label) return;

                setTerminal((t) => ({
                  ...t,
                  blocks: upsertStatusBlock(t.blocks, phase, label),
                }));
                return;
              }

              if (payload.chunkType === 'stdout' && payload.chunk) {
                const stream = payload.stream || 'run';
                setTerminal((t) => ({
                  ...t,
                  blocks:
                    stream === 'compile'
                      ? appendCompileLogBlock(t.blocks, payload.chunk)
                      : appendStreamBlock(t.blocks, 'stdout', payload.chunk, 'run'),
                }));
              }
            },
            onError: (payload) => {
              if (payload.chunkType === 'diagnostics' && payload.diagnostics?.length) {
                setTerminal((t) => ({
                  ...t,
                  blocks: upsertDiagnosticsBlock(
                    t.blocks,
                    payload.diagnostics,
                    payload.errorType || 'compile'
                  ),
                }));
                return;
              }
              if (payload.chunkType === 'stderr' && payload.chunk) {
                const stream = payload.stream || 'compile';
                setTerminal((t) => ({
                  ...t,
                  blocks:
                    stream === 'compile'
                      ? appendCompileLogBlock(t.blocks, payload.chunk)
                      : appendStreamBlock(t.blocks, 'stderr', payload.chunk, 'run'),
                }));
                return;
              }
              if (payload.chunkType === 'fatal' && payload.message) {
                setTerminal((t) => {
                  if (t.blocks.some((b) => b.type === 'diagnostics')) return t;
                  return {
                    ...t,
                    blocks: addEndBlock(
                      t.blocks,
                      false,
                      null,
                      payload.errorType || 'unknown',
                      payload.message
                    ),
                  };
                });
              }
            },
            onSuccess: (payload) => {
              setTerminal((t) => ({
                ...t,
                durationMs: payload.durationMs ?? t.durationMs,
              }));
            },
            onEnd: (payload) => {
              setTerminal((t) => ({
                ...t,
                running: false,
                durationMs: payload.durationMs ?? t.durationMs,
                blocks: addEndBlock(
                  t.blocks,
                  payload.success,
                  payload.durationMs,
                  payload.errorType,
                  payload.message
                ),
              }));
            },
          }
        );
        return endPayload;
      } catch (err) {
        setTerminal((t) => ({
          ...t,
          running: false,
          blocks: addEndBlock(t.blocks, false, null, 'unknown', err.message),
        }));
        throw err;
      }
    },
    [runCode]
  );

  const stop = useCallback(() => {
    cancelRun();
    setTerminal((t) => ({
      ...t,
      running: false,
      blocks: addEndBlock(t.blocks, false, null, 'cancelled', 'Run cancelled'),
    }));
  }, [cancelRun]);

  return {
    terminal,
    execute,
    stop,
    resetTerminal,
    clearTerminal,
  };
}
