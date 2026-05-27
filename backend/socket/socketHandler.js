import {
  executeCodeStream,
  isSupportedLanguage,
} from '../services/compilerService.js';
import { cleanupStaleRuns } from '../utils/cleanup.js';
import { socketAuth } from '../middleware/socketAuth.js';

const activeBySocket = new Map();

export function setupSocketHandler(io) {
  io.use(socketAuth);

  cleanupStaleRuns().catch(() => {});

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.user?.email || socket.id}`);

    socket.on('compile:run', async (payload, ack) => {
      const { language, code, fileName, stdin, runId: clientRunId } = payload || {};

      if (!language || !code) {
        const err = { message: 'language and code are required' };
        socket.emit('compile:error', {
          runId: clientRunId,
          chunkType: 'fatal',
          message: err.message,
          fatal: true,
        });
        socket.emit('compile:end', { runId: clientRunId, success: false });
        if (typeof ack === 'function') ack({ ok: false, ...err });
        return;
      }

      if (!isSupportedLanguage(language)) {
        const err = {
          message: `${language} runs in the browser preview only.`,
        };
        socket.emit('compile:error', {
          runId: clientRunId,
          chunkType: 'fatal',
          message: err.message,
          fatal: true,
        });
        socket.emit('compile:end', { runId: clientRunId, success: false });
        if (typeof ack === 'function') ack({ ok: false, ...err });
        return;
      }

      const previous = activeBySocket.get(socket.id);
      if (previous) previous.abort();

      const controller = new AbortController();
      activeBySocket.set(socket.id, controller);

      const runId = clientRunId || `${socket.id}-${Date.now()}`;

      socket.emit('compile:start', { runId, language, fileName });

      const hooks = {
        onStatus: (phase, message) => {
          socket.emit('compile:output', {
            runId,
            chunkType: 'status',
            phase,
            message,
          });
        },
        onStdout: (chunk, stream) => {
          if (!chunk) return;
          socket.emit('compile:output', {
            runId,
            chunkType: 'stdout',
            stream: stream || 'run',
            chunk,
          });
        },
        onStderr: (chunk, stream) => {
          if (!chunk) return;
          socket.emit('compile:error', {
            runId,
            chunkType: 'stderr',
            stream: stream || 'run',
            chunk,
            fatal: false,
          });
        },
      };

      try {
        const result = await executeCodeStream({
          language,
          code,
          fileName,
          stdin: stdin ?? '',
          hooks,
          signal: controller.signal,
        });

        if (result.diagnostics?.length > 0) {
          socket.emit('compile:error', {
            runId,
            chunkType: 'diagnostics',
            errorType: 'compile',
            diagnostics: result.diagnostics,
            fatal: true,
          });
        }

        if (result.success) {
          socket.emit('compile:success', {
            runId,
            message: result.message,
            durationMs: result.durationMs,
          });
        } else if (
          !result.run?.cancelled &&
          !(result.diagnostics?.length > 0)
        ) {
          socket.emit('compile:error', {
            runId,
            chunkType: 'fatal',
            errorType: result.errorType || 'unknown',
            message: result.message,
            fatal: true,
          });
        }

        socket.emit('compile:end', {
          runId,
          success: result.success,
          message: result.message,
          durationMs: result.durationMs,
          errorType: result.errorType,
          errorTitle: result.errorTitle,
        });

        if (typeof ack === 'function') {
          ack({ ok: true, runId, success: result.success, durationMs: result.durationMs });
        }
      } catch (err) {
        console.error('[socket] compile:run error:', err.message);
        socket.emit('compile:error', {
          runId,
          chunkType: 'fatal',
          errorType: 'unknown',
          message: err.message,
          fatal: true,
        });
        socket.emit('compile:end', {
          runId,
          success: false,
          message: err.message,
        });
        if (typeof ack === 'function') ack({ ok: false, message: err.message });
      } finally {
        if (activeBySocket.get(socket.id) === controller) {
          activeBySocket.delete(socket.id);
        }
      }
    });

    socket.on('compile:cancel', () => {
      const controller = activeBySocket.get(socket.id);
      if (controller) {
        controller.abort();
        activeBySocket.delete(socket.id);
      }
    });

    socket.on('disconnect', () => {
      const controller = activeBySocket.get(socket.id);
      if (controller) {
        controller.abort();
        activeBySocket.delete(socket.id);
      }
    });
  });
}
