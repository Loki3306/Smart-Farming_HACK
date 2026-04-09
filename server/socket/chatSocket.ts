/**
 * server/socket/chatSocket.ts
 * Real-time messaging via Socket.IO — replaces Supabase Realtime for chat.
 */

import { Server, Socket } from "socket.io";
import { query } from "../db/neon";

export function registerChatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Join a conversation room
    socket.on("chat:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("chat:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send a message
    socket.on(
      "chat:send",
      async (payload: {
        conversation_id: string;
        sender_id: string;
        receiver_id: string;
        content: string;
        image_url?: string;
      }) => {
        try {
          const { conversation_id, sender_id, receiver_id, content, image_url } = payload;

          // Validate
          if (!conversation_id || !sender_id || !receiver_id) return;
          if (!content?.trim() && !image_url) return;

          // Verify participant
          const conv = await query(
            `SELECT farmer_id, expert_id FROM conversations WHERE id = $1`,
            [conversation_id],
          );
          if (!conv.rows[0]) return;
          if (conv.rows[0].farmer_id !== sender_id && conv.rows[0].expert_id !== sender_id) return;

          // Persist message
          const result = await query(
            `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, image_url)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [conversation_id, sender_id, receiver_id, content?.trim() || "", image_url],
          );

          const message = result.rows[0];

          // Broadcast to room
          io.to(`conversation:${conversation_id}`).emit("chat:message", message);

          // Also notify receiver in their personal room
          io.to(`user:${receiver_id}`).emit("chat:notification", {
            conversation_id,
            sender_id,
            preview: content?.substring(0, 60) || "[Image]",
          });
        } catch (error: any) {
          socket.emit("chat:error", { message: error.message });
        }
      },
    );

    // Typing indicators
    socket.on(
      "chat:typing",
      (payload: { conversation_id: string; user_id: string; is_typing: boolean }) => {
        socket
          .to(`conversation:${payload.conversation_id}`)
          .emit("chat:typing", payload);
      },
    );

    // Mark messages as read
    socket.on(
      "chat:read",
      async (payload: { conversation_id: string; user_id: string }) => {
        try {
          await query(
            `UPDATE messages SET read = true, read_at = NOW()
             WHERE conversation_id = $1 AND receiver_id = $2 AND read = false`,
            [payload.conversation_id, payload.user_id],
          );
          io.to(`conversation:${payload.conversation_id}`).emit("chat:read", payload);
        } catch (error: any) {
          socket.emit("chat:error", { message: error.message });
        }
      },
    );
  });
}
