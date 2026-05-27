import { useCallback, useEffect, useRef } from 'react';
import { getCompileSocket, disconnectCompileSocket } from '../api/socket';

/**
 * Run code via Socket.IO with streaming terminal updates.
 */
export function useCompileSocket() {
  const handlersRef = useRef(null);
  const runIdRef = useRef(null);

  useEffect(() => {
    return () => {
      const socket = getCompileSocket();
      if (socket && handlersRef.current) {
        const h = handlersRef.current;
        socket.off('compile:start', h.onStart);
        socket.off('compile:output', h.onOutput);
        socket.off('compile:error', h.onError);
        socket.off('compile:success', h.onSuccess);
        socket.off('compile:end', h.onEnd);
      }
    };
  }, []);

  const cancelRun = useCallback(() => {
    const socket = getCompileSocket();
    socket?.emit('compile:cancel');
  }, []);

  const runCode = useCallback(
    ({ language, code, fileName, stdin }, callbacks) => {
      return new Promise((resolve, reject) => {
        const socket = getCompileSocket();
        if (!socket) {
          reject(new Error('Not logged in'));
          return;
        }

        const runId = `run-${Date.now()}`;
        runIdRef.current = runId;

        const cleanup = () => {
          if (!handlersRef.current) return;
          const h = handlersRef.current;
          socket.off('compile:start', h.onStart);
          socket.off('compile:output', h.onOutput);
          socket.off('compile:error', h.onError);
          socket.off('compile:success', h.onSuccess);
          socket.off('compile:end', h.onEnd);
          handlersRef.current = null;
        };

        const onStart = (payload) => {
          if (payload.runId !== runId) return;
          callbacks.onStart?.(payload);
        };

        const onOutput = (payload) => {
          if (payload.runId !== runId) return;
          callbacks.onOutput?.(payload);
        };

        const onError = (payload) => {
          if (payload.runId !== runId) return;
          callbacks.onError?.(payload);
        };

        const onSuccess = (payload) => {
          if (payload.runId !== runId) return;
          callbacks.onSuccess?.(payload);
        };

        const onEnd = (payload) => {
          if (payload.runId !== runId) return;
          callbacks.onEnd?.(payload);
          cleanup();
          resolve(payload);
        };

        handlersRef.current = { onStart, onOutput, onError, onSuccess, onEnd };

        socket.on('compile:start', onStart);
        socket.on('compile:output', onOutput);
        socket.on('compile:error', onError);
        socket.on('compile:success', onSuccess);
        socket.on('compile:end', onEnd);

        const connectAndRun = () => {
          socket.emit(
            'compile:run',
            { language, code, fileName, stdin, runId },
            (ack) => {
              if (ack && !ack.ok && ack.message) {
                cleanup();
                reject(new Error(ack.message));
              }
            }
          );
        };

        if (socket.connected) {
          connectAndRun();
        } else {
          socket.once('connect', connectAndRun);
          socket.once('connect_error', (err) => {
            cleanup();
            reject(new Error(err.message || 'Socket connection failed'));
          });
          if (!socket.active) socket.connect();
        }
      });
    },
    []
  );

  return { runCode, cancelRun, disconnectCompileSocket };
}
