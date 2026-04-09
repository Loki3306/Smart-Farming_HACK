/**
 * server/socket/communitySocket.ts
 * Real-time community updates via Socket.IO — replaces Supabase Realtime.
 */

import { Server, Socket } from "socket.io";
import { query } from "../db/neon";

export function registerCommunitySocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Subscribe to community feed
    socket.on("community:subscribe", () => {
      socket.join("community:feed");
    });

    socket.on("community:unsubscribe", () => {
      socket.leave("community:feed");
    });

    // Subscribe to a specific post (for real-time comments/reactions)
    socket.on("community:subscribePost", (postId: string) => {
      socket.join(`post:${postId}`);
    });

    socket.on("community:unsubscribePost", (postId: string) => {
      socket.leave(`post:${postId}`);
    });

    // New reaction — broadcast to post room
    socket.on(
      "community:react",
      async (payload: {
        post_id: string;
        user_id: string;
        reaction_type: string;
      }) => {
        try {
          const existing = await query(
            `SELECT id FROM post_reactions
             WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
            [payload.post_id, payload.user_id, payload.reaction_type],
          );

          let action: string;
          if (existing.rows[0]) {
            await query(`DELETE FROM post_reactions WHERE id = $1`, [existing.rows[0].id]);
            action = "removed";
          } else {
            await query(
              `INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
              [payload.post_id, payload.user_id, payload.reaction_type],
            );
            action = "added";
          }

          io.to(`post:${payload.post_id}`).emit("community:reaction", {
            ...payload,
            action,
          });
        } catch (error: any) {
          socket.emit("community:error", { message: error.message });
        }
      },
    );

    // New comment — broadcast to post room and feed
    socket.on(
      "community:comment",
      async (payload: {
        post_id: string;
        author_id: string;
        content: string;
      }) => {
        try {
          const expertResult = await query(
            `SELECT is_verified FROM experts WHERE farmer_id = $1 LIMIT 1`,
            [payload.author_id],
          );
          const is_expert_reply = expertResult.rows[0]?.is_verified || false;

          const result = await query(
            `INSERT INTO post_comments (post_id, author_id, content, is_expert_reply, created_at)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [payload.post_id, payload.author_id, payload.content, is_expert_reply],
          );

          const comment = result.rows[0];
          io.to(`post:${payload.post_id}`).emit("community:newComment", comment);

          if (is_expert_reply) {
            await query(
              `UPDATE community_posts SET has_expert_reply = true WHERE id = $1`,
              [payload.post_id],
            );
          }
        } catch (error: any) {
          socket.emit("community:error", { message: error.message });
        }
      },
    );
  });
}

/** Broadcast a new post to all community subscribers */
export function broadcastNewPost(io: Server, post: any) {
  io.to("community:feed").emit("community:newPost", post);
}
