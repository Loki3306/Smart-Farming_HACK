/**
 * server/socket/notificationSocket.ts
 * Real-time push notifications via Socket.IO — replaces Supabase Realtime.
 */

import { Server, Socket } from "socket.io";
import { query } from "../db/neon.js";

export function registerNotificationSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Each user joins their own notification room on connect
    socket.on("notifications:subscribe", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("notifications:unsubscribe", (userId: string) => {
      socket.leave(`user:${userId}`);
    });
  });
}

/**
 * Push a notification to a specific user.
 * Call this from route handlers instead of Supabase Realtime inserts.
 */
export async function pushNotification(
  io: Server,
  payload: {
    user_id: string;
    actor_id?: string;
    type: string;
    message: string;
    post_id?: string;
    comment_id?: string;
    data?: any;
  },
) {
  try {
    // Persist to DB
    const result = await query(
      `INSERT INTO notifications
         (user_id, actor_id, type, message, post_id, comment_id, data, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [
        payload.user_id,
        payload.actor_id || "system",
        payload.type,
        payload.message,
        payload.post_id || null,
        payload.comment_id || null,
        payload.data ? JSON.stringify(payload.data) : null,
      ],
    );

    // Push to connected client
    io.to(`user:${payload.user_id}`).emit("notification:new", result.rows[0]);

    return result.rows[0];
  } catch (error: any) {
    console.error("[Notification Socket] Error pushing notification:", error.message);
  }
}

