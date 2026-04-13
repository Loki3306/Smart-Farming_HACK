/**
 * server/socket/presenceSocket.ts
 * Real-time user presence tracking via Socket.IO — replaces Supabase Realtime.
 * Uses in-memory Map; no Redis needed for hackathon scale.
 */

import { Server, Socket } from "socket.io";
import { query } from "../db/neon.js";

// In-memory presence store: userId → { status, socketId, last_seen }
const onlineUsers = new Map<string, { status: string; socketId: string; last_seen: string }>();

export function registerPresenceSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    let currentUserId: string | null = null;

    // User comes online
    socket.on("presence:online", async (userId: string) => {
      currentUserId = userId;
      const now = new Date().toISOString();

      // Join personal room for direct notifications
      socket.join(`user:${userId}`);

      onlineUsers.set(userId, { status: "online", socketId: socket.id, last_seen: now });

      // Persist to DB (fire-and-forget)
      query(
        `INSERT INTO user_presence (user_id, status, updated_at)
         VALUES ($1, 'online', $2)
         ON CONFLICT (user_id) DO UPDATE SET status = 'online', updated_at = $2`,
        [userId, now],
      ).catch(() => {});

      // Broadcast to everyone
      io.emit("presence:update", { user_id: userId, status: "online" });
    });

    // Heartbeat
    socket.on("presence:heartbeat", (userId: string) => {
      if (onlineUsers.has(userId)) {
        const entry = onlineUsers.get(userId)!;
        onlineUsers.set(userId, { ...entry, last_seen: new Date().toISOString() });
      }
    });

    // Query bulk presence
    socket.on("presence:query", (userIds: string[], callback: Function) => {
      const result = userIds.map((uid) => ({
        user_id: uid,
        status: onlineUsers.get(uid)?.status || "offline",
        last_seen: onlineUsers.get(uid)?.last_seen || null,
      }));
      if (typeof callback === "function") callback(result);
    });

    // Disconnect — mark offline
    socket.on("disconnect", async () => {
      if (!currentUserId) return;

      onlineUsers.delete(currentUserId);
      const now = new Date().toISOString();

      query(
        `UPDATE user_presence SET status = 'offline', last_seen = $1 WHERE user_id = $2`,
        [now, currentUserId],
      ).catch(() => {});

      io.emit("presence:update", { user_id: currentUserId, status: "offline", last_seen: now });
    });
  });

  // Periodic cleanup: set away for users with stale heartbeats (every 2 min)
  setInterval(() => {
    const threshold = Date.now() - 3 * 60 * 1000; // 3 minutes
    for (const [userId, data] of onlineUsers.entries()) {
      if (data.status === "online" && new Date(data.last_seen).getTime() < threshold) {
        onlineUsers.set(userId, { ...data, status: "away" });
        io.emit("presence:update", { user_id: userId, status: "away" });
      }
    }
  }, 2 * 60 * 1000);
}

/** Get current online count (for stats endpoints) */
export function getOnlineCount() {
  return onlineUsers.size;
}

