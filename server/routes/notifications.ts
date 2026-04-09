import { Router, Request, Response } from "express";
import { query } from "../db/neon";

const router = Router();

// =====================================================
// NOTIFICATION ENDPOINTS
// =====================================================

/**
 * GET /api/notifications
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, offset = 0, unread_only } = req.query;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    let sql = `SELECT n.*, f.name as actor_name
               FROM notifications n
               LEFT JOIN farmers f ON f.id = n.actor_id
               WHERE n.user_id = $1`;
    const values: any[] = [user_id];
    let idx = 2;

    if (unread_only === "true") {
      sql += ` AND n.read = false`;
    }

    sql += ` ORDER BY n.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    values.push(Number(limit), Number(offset));

    const result = await query(sql, values);

    res.json({ notifications: result.rows });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message || "Failed to fetch notifications" });
  }
});

/**
 * GET /api/notifications/count
 */
router.get("/count", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`,
      [user_id],
    );

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error: any) {
    console.error("Error getting notification count:", error);
    res.status(500).json({ error: error.message || "Failed to get notification count" });
  }
});

/**
 * POST /api/notifications
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { user_id, actor_id, type, message, post_id, comment_id, data: notificationData } = req.body;

    if (!user_id || !type || !message) {
      return res.status(400).json({ error: "user_id, type, and message are required" });
    }

    const result = await query(
      `INSERT INTO notifications
         (user_id, actor_id, type, message, post_id, comment_id, data, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [
        user_id, actor_id || "system", type, message,
        post_id || null, comment_id || null,
        notificationData ? JSON.stringify(notificationData) : null,
      ],
    );

    res.status(201).json({ notification: result.rows[0] });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: error.message || "Failed to create notification" });
  }
});

/**
 * PUT /api/notifications/:id/read
 */
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id],
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Notification not found" });

    res.json({ notification: result.rows[0] });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: error.message || "Failed to mark notification as read" });
  }
});

/**
 * PUT /api/notifications/read-all
 */
router.put("/read-all", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [user_id],
    );

    res.json({ updated_count: result.rowCount });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: error.message || "Failed to mark all as read" });
  }
});

/**
 * DELETE /api/notifications/clear-all
 */
router.delete("/clear-all", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    await query(`DELETE FROM notifications WHERE user_id = $1`, [user_id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: error.message || "Failed to clear notifications" });
  }
});

/**
 * DELETE /api/notifications/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: error.message || "Failed to delete notification" });
  }
});

export default router;
