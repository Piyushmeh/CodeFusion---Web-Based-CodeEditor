import { io } from 'socket.io-client';

/** In dev, Vite proxies /socket.io to the backend — use same origin. */
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV
    ? window.location.origin
    : import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : window.location.origin);

let socketInstance = null;

export function getCompileSocket() {
  const token = localStorage.getItem('cf_token');
  if (!token) return null;

  if (!socketInstance || !socketInstance.connected) {
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    }

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      autoConnect: true,
    });
  } else {
    socketInstance.auth = { token };
  }

  return socketInstance;
}

export function disconnectCompileSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}
