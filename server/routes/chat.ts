import { Router, Request, Response } from "express";
import { query } from "../db/neon.js";

const router = Router();

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface CreateConversationRequest {
  farmer_id: string;
  expert_id: string;
}

interface SendMessageRequest {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
}

// =====================================================
// CONVERSATION ENDPOINTS
// =====================================================

/**
 * POST /api/chat/conversations/start
 */
router.post("/conversations/start", async (req: Request, res: Response) => {
  try {
    const { farmer_id, expert_id }: CreateConversationRequest = req.body;

    if (!farmer_id || !expert_id) {
      return res.status(400).json({ error: "farmer_id and expert_id are required" });
    }
    if (farmer_id === expert_id) {
      return res.status(400).json({ error: "Cannot create conversation with yourself" });
    }

    // Try to find existing conversation (either direction)
    const existing = await query(
      `SELECT * FROM conversations
       WHERE (farmer_id = $1 AND expert_id = $2)
          OR (farmer_id = $2 AND expert_id = $1)
       LIMIT 1`,
      [farmer_id, expert_id],
    );

    if (existing.rows[0]) {
      const conv = existing.rows[0];
      const otherUserId = conv.farmer_id === farmer_id ? conv.expert_id : conv.farmer_id;
      const otherUser = await query(
        `SELECT id, name, phone, email FROM farmers WHERE id = $1`,
        [otherUserId],
      );
      return res.json({
        conversation: { ...conv, other_user: otherUser.rows[0] },
        is_new: false,
      });
    }

    // Create new conversation
    const newConv = await query(
      `INSERT INTO conversations (farmer_id, expert_id) VALUES ($1, $2) RETURNING *`,
      [farmer_id, expert_id],
    );
    const conv = newConv.rows[0];
    const otherUserId = conv.farmer_id === farmer_id ? conv.expert_id : conv.farmer_id;
    const otherUser = await query(
      `SELECT id, name, phone, email FROM farmers WHERE id = $1`,
      [otherUserId],
    );

    res.status(201).json({
      conversation: { ...conv, other_user: otherUser.rows[0] },
      is_new: true,
    });
  } catch (error: any) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ error: error.message || "Failed to start conversation" });
  }
});

/**
 * GET /api/chat/conversations
 */
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const conversations = await query(
      `SELECT * FROM conversations
       WHERE farmer_id = $1 OR expert_id = $1
       ORDER BY last_message_at DESC`,
      [user_id],
    );

    const conversationsWithDetails = await Promise.all(
      conversations.rows.map(async (conv: any) => {
        const otherUserId = conv.farmer_id === user_id ? conv.expert_id : conv.farmer_id;
        const [otherUser, unreadCount] = await Promise.all([
          query(`SELECT id, name, phone, email FROM farmers WHERE id = $1`, [otherUserId]),
          query(
            `SELECT COUNT(*) FROM messages
             WHERE conversation_id = $1 AND receiver_id = $2
               AND read = false AND deleted_by_receiver = false`,
            [conv.id, user_id],
          ),
        ]);
        return {
          ...conv,
          other_user: otherUser.rows[0],
          unread_count: parseInt(unreadCount.rows[0].count, 10),
        };
      }),
    );

    res.json({ conversations: conversationsWithDetails });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message || "Failed to fetch conversations" });
  }
});

/**
 * GET /api/chat/conversations/:id
 */
router.get("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Conversation not found" });

    const conversation = result.rows[0];
    if (conversation.farmer_id !== user_id && conversation.expert_id !== user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const otherUserId = conversation.farmer_id === user_id ? conversation.expert_id : conversation.farmer_id;
    const otherUser = await query(
      `SELECT id, name, phone, email FROM farmers WHERE id = $1`,
      [otherUserId],
    );

    res.json({ conversation: { ...conversation, other_user: otherUser.rows[0] } });
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: error.message || "Failed to fetch conversation" });
  }
});

// =====================================================
// MESSAGE ENDPOINTS
// =====================================================

/**
 * GET /api/chat/conversations/:id/messages
 */
router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, limit = "50", offset = "0" } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const conv = await query(`SELECT farmer_id, expert_id FROM conversations WHERE id = $1`, [id]);
    if (!conv.rows[0]) return res.status(404).json({ error: "Conversation not found" });
    if (conv.rows[0].farmer_id !== user_id && conv.rows[0].expert_id !== user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await query(
      `SELECT * FROM messages
       WHERE conversation_id = $1
         AND deleted_by_sender = false
         AND deleted_by_receiver = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit as string), parseInt(offset as string)],
    );

    res.json({ messages: messages.rows });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message || "Failed to fetch messages" });
  }
});

/**
 * POST /api/chat/messages/send
 */
router.post("/messages/send", async (req: Request, res: Response) => {
  try {
    const { conversation_id, sender_id, receiver_id, content, image_url }: SendMessageRequest = req.body;

    if (!conversation_id || !sender_id || !receiver_id) {
      return res.status(400).json({ error: "conversation_id, sender_id, and receiver_id are required" });
    }
    if (!content?.trim() && !image_url) {
      return res.status(400).json({ error: "Either content or image_url is required" });
    }

    const conv = await query(
      `SELECT farmer_id, expert_id FROM conversations WHERE id = $1`,
      [conversation_id],
    );
    if (!conv.rows[0]) return res.status(404).json({ error: "Conversation not found" });
    if (conv.rows[0].farmer_id !== sender_id && conv.rows[0].expert_id !== sender_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const message = await query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversation_id, sender_id, receiver_id, content?.trim() || "", image_url],
    );

    // Create notification (non-critical)
    query(
      `INSERT INTO notifications (user_id, actor_id, message, read)
       VALUES ($1, $2, $3, false)`,
      [receiver_id, sender_id, `sent you a message: ${content?.substring(0, 50) || "[Image]"}`],
    ).catch((e) => console.warn("Notification insert failed:", e.message));

    res.status(201).json({ message: message.rows[0] });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
});

/**
 * PUT /api/chat/messages/:id/read
 */
router.put("/messages/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const msg = await query(`SELECT receiver_id FROM messages WHERE id = $1`, [id]);
    if (!msg.rows[0]) return res.status(404).json({ error: "Message not found" });
    if (msg.rows[0].receiver_id !== user_id) return res.status(403).json({ error: "Access denied" });

    await query(
      `UPDATE messages SET read = true, read_at = NOW() WHERE id = $1`,
      [id],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: error.message || "Failed to mark message as read" });
  }
});

/**
 * POST /api/chat/conversations/:id/mark-read
 */
router.post("/conversations/:id/mark-read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `UPDATE messages
       SET read = true, read_at = NOW()
       WHERE conversation_id = $1 AND receiver_id = $2 AND read = false`,
      [id, user_id],
    );

    res.json({ success: true, updated_count: result.rowCount });
  } catch (error: any) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ error: error.message || "Failed to mark conversation as read" });
  }
});

/**
 * DELETE /api/chat/messages/:id
 */
router.delete("/messages/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const msg = await query(`SELECT sender_id, receiver_id FROM messages WHERE id = $1`, [id]);
    if (!msg.rows[0]) return res.status(404).json({ error: "Message not found" });

    const updateField =
      msg.rows[0].sender_id === user_id ? "deleted_by_sender"
      : msg.rows[0].receiver_id === user_id ? "deleted_by_receiver"
      : null;

    if (!updateField) return res.status(403).json({ error: "Access denied" });

    await query(`UPDATE messages SET ${updateField} = true WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: error.message || "Failed to delete message" });
  }
});

// =====================================================
// TYPING INDICATORS
// =====================================================

/**
 * POST /api/chat/conversations/:id/typing
 */
router.post("/conversations/:id/typing", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, is_typing } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const conv = await query(`SELECT farmer_id, expert_id FROM conversations WHERE id = $1`, [id]);
    if (!conv.rows[0]) return res.status(404).json({ error: "Conversation not found" });
    if (conv.rows[0].farmer_id !== user_id && conv.rows[0].expert_id !== user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await query(
      `INSERT INTO typing_indicators (conversation_id, user_id, is_typing, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (conversation_id, user_id) DO UPDATE
       SET is_typing = $3, updated_at = NOW()`,
      [id, user_id, is_typing ?? true],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error updating typing status:", error);
    res.status(500).json({ error: error.message || "Failed to update typing status" });
  }
});

/**
 * GET /api/chat/conversations/:id/typing
 */
router.get("/conversations/:id/typing", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const result = await query(
      `SELECT user_id, is_typing, updated_at
       FROM typing_indicators
       WHERE conversation_id = $1
         AND user_id != $2
         AND is_typing = true
         AND updated_at >= $3`,
      [id, user_id, tenSecondsAgo],
    );

    res.json({ is_typing: result.rows.length > 0, typing_users: result.rows });
  } catch (error: any) {
    console.error("Error fetching typing status:", error);
    res.status(500).json({ error: error.message || "Failed to fetch typing status" });
  }
});

// =====================================================
// STATISTICS
// =====================================================

/**
 * GET /api/chat/stats
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const [unreadResult, convResult] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM messages
         WHERE receiver_id = $1 AND read = false AND deleted_by_receiver = false`,
        [user_id],
      ),
      query(
        `SELECT COUNT(*) FROM conversations WHERE farmer_id = $1 OR expert_id = $1`,
        [user_id],
      ),
    ]);

    res.json({
      unread_count: parseInt(unreadResult.rows[0].count, 10),
      conversation_count: parseInt(convResult.rows[0].count, 10),
    });
  } catch (error: any) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch chat stats" });
  }
});

/**
 * GET /api/chat/online-farmers
 */
router.get("/online-farmers", async (req: Request, res: Response) => {
  try {
    const { current_user_id } = req.query;
    if (!current_user_id) return res.status(400).json({ error: "current_user_id is required" });

    // Assuming neon is connected, we will join farmers with user_presence
    const result = await query(
      `SELECT f.id, f.name, f.phone, f.email,
              p.status, p.updated_at AS last_seen
       FROM farmers f
       LEFT JOIN user_presence p ON p.user_id = f.id
       WHERE f.id != $1
       ORDER BY f.name ASC`,
      [current_user_id]
    );

    const farmers = result.rows.map((farmer: any) => ({
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      email: farmer.email,
      status: farmer.status || "offline",
      last_seen: farmer.last_seen || new Date().toISOString(),
    }));

    // Sort by status
    farmers.sort((a, b) => {
      const statusOrder: Record<string, number> = { online: 0, away: 1, offline: 2 };
      const statusDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });

    res.json({ farmers });
  } catch (error: any) {
    console.error("Error fetching online farmers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/user/:id
 * Get a user's basic info like phone number
 */
router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, name, phone, location FROM farmers WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/calls/:id
 */
router.get("/calls/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM calls WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Call not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/chat/calls/:id/status
 */
router.put("/calls/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let updateQuery = `UPDATE calls SET status = $1, updated_at = NOW() `;
    let values: any[] = [status, id];
    
    if (status === 'accepted') {
       updateQuery += `, started_at = NOW() `;
    } else if (status === 'ended' || status === 'rejected' || status === 'missed' || status === 'failed') {
       updateQuery += `, ended_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - COALESCE(started_at, NOW()))) `;
    }
    
    updateQuery += ` WHERE id = $2 RETURNING *`;
    
    const result = await query(updateQuery, values);
    
    if (!result.rows[0]) return res.status(404).json({ error: "Call not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
      console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/calls
 */
router.post("/calls", async (req: Request, res: Response) => {
    try {
        const { conversation_id, caller_id, receiver_id, call_type } = req.body;
        const result = await query(
            `INSERT INTO calls (conversation_id, caller_id, receiver_id, call_type, status) 
             VALUES ($1, $2, $3, $4, 'ringing') RETURNING *`,
             [conversation_id, caller_id, receiver_id, call_type]
        );
        res.json({ id: result.rows[0].id });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/chat/call_signaling
 */
router.post("/call_signaling", async (req: Request, res: Response) => {
    try {
        const { call_id, sender_id, receiver_id, signal_type, signal_data } = req.body;
        await query(
            `INSERT INTO call_signaling (call_id, sender_id, receiver_id, signal_type, signal_data)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
             [call_id, sender_id, receiver_id, signal_type, signal_data]
        );
        res.json({ success: true });
    } catch(err: any){
        res.status(500).json({ error: err.message });
    }
});

export default router;

