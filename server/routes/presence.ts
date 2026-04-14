import { Router, Request, Response } from "express";
import { query } from "../db/neon.js";

const router = Router();

// In-memory presence store for ultra-fast reads (Socket.IO will replace this)
const presenceCache = new Map<string, { status: string; updated_at: string }>();

// =====================================================
// USER PRESENCE ENDPOINTS
// =====================================================

/**
 * GET /api/presence/:userId
 */
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check in-memory cache first
    if (presenceCache.has(userId)) {
      const cached = presenceCache.get(userId)!;
      return res.json({ user_id: userId, status: cached.status, updated_at: cached.updated_at });
    }

    const result = await query(
      `SELECT * FROM user_presence WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    if (!result.rows[0]) {
      return res.json({ user_id: userId, status: "offline", updated_at: null });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching user presence:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user presence" });
  }
});

/**
 * PUT /api/presence
 * Update current user's presence status
 */
router.put("/", async (req: Request, res: Response) => {
  try {
    const { user_id, status } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    if (!status || !["online", "offline", "away"].includes(status)) {
      return res.status(400).json({ error: "status must be one of: online, offline, away" });
    }

    const now = new Date().toISOString();

    try {
      const result = await query(
        `INSERT INTO user_presence (user_id, status, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
         SET status = $2, updated_at = $3
         RETURNING *`,
        [user_id, status, now],
      );

      // Update in-memory cache
      presenceCache.set(user_id, { status, updated_at: now });

      return res.json(result.rows[0]);
    } catch (dbError) {
      console.warn("Presence write fallback triggered:", dbError);
      presenceCache.set(user_id, { status, updated_at: now });
      return res.json({ success: true, user_id, status, updated_at: now });
    }
  } catch (error: any) {
    console.error("Error updating presence:", error);
    res.status(500).json({ error: error.message || "Failed to update presence" });
  }
});

/**
 * POST /api/presence/heartbeat
 */
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const now = new Date().toISOString();

    await query(
      `INSERT INTO user_presence (user_id, status, updated_at)
       VALUES ($1, 'online', $2)
       ON CONFLICT (user_id) DO UPDATE
       SET status = 'online', updated_at = $2`,
      [user_id, now],
    );

    // Update in-memory cache
    presenceCache.set(user_id, {
      status: "online",
      updated_at: now,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error sending heartbeat:", error);
    res.status(500).json({ error: error.message || "Failed to send heartbeat" });
  }
});

/**
 * GET /api/presence/bulk
 */
router.get("/bulk", async (req: Request, res: Response) => {
  try {
    const { user_ids } = req.query;
    if (!user_ids) return res.status(400).json({ error: "user_ids is required" });

    const userIdArray = (user_ids as string).split(",").filter((id) => id.trim());
    if (userIdArray.length === 0) return res.json({ presence: [] });

    const result = await query(
      `SELECT * FROM user_presence WHERE user_id = ANY($1)`,
      [userIdArray],
    );

    const presenceMap = new Map(result.rows.map((p: any) => [p.user_id, p]));

    const presence = userIdArray.map((userId) =>
      presenceMap.get(userId) || { user_id: userId, status: "offline", updated_at: null },
    );

    res.json({ presence });
  } catch (error: any) {
    console.error("Error fetching bulk presence:", error);
    res.status(500).json({ error: error.message || "Failed to fetch bulk presence" });
  }
});

/**
 * POST /api/presence/cleanup
 * Run maintenance tasks
 */
router.post("/cleanup", async (req: Request, res: Response) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [typingResult, awayResult, offlineResult] = await Promise.all([
      // Clear old typing indicators
      query(
        `DELETE FROM typing_indicators WHERE is_typing = true AND updated_at < $1`,
        [fiveMinutesAgo],
      ),
      // Set away for users not seen in 30 min
      query(
        `UPDATE user_presence SET status = 'away'
         WHERE status = 'online' AND updated_at < $1`,
        [thirtyMinutesAgo],
      ),
      // Set offline for users not seen in 1 hour
      query(
        `UPDATE user_presence SET status = 'offline', last_seen = NOW()
         WHERE status IN ('online', 'away') AND updated_at < $1`,
        [oneHourAgo],
      ),
    ]);

    res.json({
      success: true,
      cleaned: {
        typing_indicators: typingResult.rowCount,
        set_away: awayResult.rowCount,
        set_offline: offlineResult.rowCount,
      },
    });
  } catch (error: any) {
    console.error("Error running presence cleanup:", error);
    res.status(500).json({ error: error.message || "Failed to run cleanup" });
  }
});

export default router;

