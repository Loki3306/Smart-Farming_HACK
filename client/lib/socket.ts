/**
 * client/lib/socket.ts
 *
 * Socket.IO client singleton — replaces Supabase Realtime channels.
 * Import { socket, connectSocket, disconnectSocket } from here.
 */

import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

/** Get or create the Socket.IO singleton */
export function getSocket(): Socket {
  if (_socket && _socket.connected) return _socket;

  _socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    withCredentials: true,
  });

  _socket.on("connect", () => {
    console.log("[Socket] Connected:", _socket?.id);
  });

  _socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  _socket.on("connect_error", (error) => {
    console.warn("[Socket] Connection error:", error.message);
  });

  return _socket;
}

/** Connect and announce presence */
export function connectSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) s.connect();

  s.once("connect", () => {
    s.emit("presence:online", userId);
    s.emit("notifications:subscribe", userId);
  });

  // If already connected, emit immediately
  if (s.connected) {
    s.emit("presence:online", userId);
    s.emit("notifications:subscribe", userId);
  }

  return s;
}

/** Gracefully disconnect */
export function disconnectSocket(userId?: string) {
  if (!_socket) return;
  if (userId) {
    _socket.emit("notifications:unsubscribe", userId);
  }
  _socket.disconnect();
}

// Export the raw socket for advanced use
export { _socket as socket };
export default getSocket;
