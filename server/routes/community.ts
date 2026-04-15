import { Router, Request, Response } from "express";
import { query } from "../db/neon.js";

const router = Router();

// ============================================================================
// TYPES
// ============================================================================

interface CreatePostBody {
  author_id: string;
  post_type: "success" | "question" | "problem" | "update";
  content: string;
  crop?: string;
  method?: string;
  image_url?: string;
  tags?: string[];
}

interface CreateCommentBody {
  author_id: string;
  content: string;
}

interface ReactionBody {
  user_id: string;
  reaction_type: "helpful" | "tried" | "didnt_work" | "new_idea";
}

// ============================================================================
// POSTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/posts
 */
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const { crop, type, tag, search, limit = 20, offset = 0 } = req.query;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (crop) { conditions.push(`cp.crop = $${idx++}`); values.push(crop); }
    if (type) { conditions.push(`cp.post_type = $${idx++}`); values.push(type); }
    if (tag) { conditions.push(`$${idx++} = ANY(cp.tags)`); values.push(tag); }
    if (search) {
      conditions.push(`(cp.content ILIKE $${idx} OR cp.crop ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const postsResult = await query(
      `SELECT cp.*,
        json_build_object('id', f.id, 'name', f.name) as author,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id)::int as comment_count
       FROM community_posts cp
       LEFT JOIN farmers f ON f.id = cp.author_id
       ${where}
       ORDER BY cp.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, Number(limit), Number(offset)],
    );

    // Get reaction counts for each post
    const posts = await Promise.all(
      postsResult.rows.map(async (post: any) => {
        const reactResult = await query(
          `SELECT reaction_type, COUNT(*)::int as count
           FROM post_reactions WHERE post_id = $1
           GROUP BY reaction_type`,
          [post.id],
        );
        const reaction_counts: Record<string, number> = {};
        reactResult.rows.forEach((r: any) => {
          reaction_counts[r.reaction_type] = r.count;
        });
        return { ...post, reaction_counts };
      }),
    );

    res.json({ posts, count: posts.length });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id
 */
router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [postResult, reactResult, commentsResult] = await Promise.all([
      query(
        `SELECT cp.*, json_build_object('id', f.id, 'name', f.name) as author
         FROM community_posts cp
         LEFT JOIN farmers f ON f.id = cp.author_id
         WHERE cp.id = $1`,
        [id],
      ),
      query(
        `SELECT reaction_type, user_id FROM post_reactions WHERE post_id = $1`,
        [id],
      ),
      query(
        `SELECT pc.*, json_build_object('id', f.id, 'name', f.name) as author
         FROM post_comments pc
         LEFT JOIN farmers f ON f.id = pc.author_id
         WHERE pc.post_id = $1
         ORDER BY pc.created_at ASC`,
        [id],
      ),
    ]);

    if (!postResult.rows[0]) {
      return res.status(404).json({ error: "Post not found" });
    }

    const reaction_counts: Record<string, number> = {};
    reactResult.rows.forEach((r: any) => {
      reaction_counts[r.reaction_type] = (reaction_counts[r.reaction_type] || 0) + 1;
    });

    res.json({
      ...postResult.rows[0],
      reaction_counts,
      reactions_list: reactResult.rows,
      comments: commentsResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/posts
 */
router.post("/posts", async (req: Request, res: Response) => {
  try {
    const body: CreatePostBody = req.body;

    if (!body.author_id || !body.post_type || !body.content) {
      return res.status(400).json({ error: "Missing required fields: author_id, post_type, content" });
    }

    const result = await query(
      `INSERT INTO community_posts
         (author_id, post_type, content, crop, method, image_url, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.author_id, body.post_type, body.content,
        body.crop || null, body.method || null,
        body.image_url || null, body.tags || [],
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/community/posts/:id
 */
router.delete("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author_id } = req.body;

    await query(
      `DELETE FROM community_posts WHERE id = $1 AND author_id = $2`,
      [id, author_id],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/community/posts/:id
 */
router.patch("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author_id, content, post_type, crop, method, tags, image_url } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (post_type !== undefined) updates.post_type = post_type;
    if (crop !== undefined) updates.crop = crop || null;
    if (method !== undefined) updates.method = method || null;
    if (tags !== undefined) updates.tags = tags || [];
    if (image_url !== undefined) updates.image_url = image_url || null;

    const keys = Object.keys(updates);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => updates[k]);

    const result = await query(
      `UPDATE community_posts SET ${setClauses}
       WHERE id = $${keys.length + 1} AND author_id = $${keys.length + 2}
       RETURNING *`,
      [...values, id, author_id],
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REACTIONS ENDPOINTS
// ============================================================================

/**
 * POST /api/community/posts/:id/react
 */
router.post("/posts/:id/react", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { user_id, reaction_type }: ReactionBody = req.body;

    if (!user_id || !reaction_type) {
      return res.status(400).json({ error: "Missing required fields: user_id, reaction_type" });
    }

    const existing = await query(
      `SELECT id FROM post_reactions
       WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
      [post_id, user_id, reaction_type],
    );

    if (existing.rows[0]) {
      await query(`DELETE FROM post_reactions WHERE id = $1`, [existing.rows[0].id]);
      res.json({ action: "removed", reaction_type });
    } else {
      await query(
        `INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
        [post_id, user_id, reaction_type],
      );
      res.json({ action: "added", reaction_type });
    }
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id/reactions
 */
router.get("/posts/:id/reactions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT reaction_type, user_id FROM post_reactions WHERE post_id = $1`,
      [id],
    );

    const counts: Record<string, number> = {};
    result.rows.forEach((r: any) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });

    res.json({ reactions: result.rows, counts });
  } catch (error: any) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/posts/:id/comments
 */
router.get("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const [countResult, result] = await Promise.all([
      query(`SELECT COUNT(*) FROM post_comments WHERE post_id = $1`, [id]),
      query(
        `SELECT pc.*, json_build_object('id', f.id, 'name', f.name) as author
         FROM post_comments pc
         LEFT JOIN farmers f ON f.id = pc.author_id
         WHERE pc.post_id = $1
         ORDER BY pc.created_at ASC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset],
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ comments: result.rows, total, hasMore: offset + limit < total });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/posts/:id/comments
 */
router.post("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { author_id, content }: CreateCommentBody = req.body;

    if (!author_id || !content) {
      return res.status(400).json({ error: "Missing required fields: author_id, content" });
    }

    const expertResult = await query(
      `SELECT id, is_verified FROM experts WHERE farmer_id = $1 LIMIT 1`,
      [author_id],
    );
    const is_expert_reply = expertResult.rows[0]?.is_verified || false;

    const result = await query(
      `INSERT INTO post_comments (post_id, author_id, content, is_expert_reply, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [post_id, author_id, content, is_expert_reply],
    );

    if (is_expert_reply) {
      await query(
        `UPDATE community_posts SET has_expert_reply = true WHERE id = $1`,
        [post_id],
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPERTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/experts
 */
router.get("/experts", async (req: Request, res: Response) => {
  try {
    const expertsResult = await query(
      `SELECT e.id,
              e.farmer_id,
              e.is_verified,
              COALESCE(e.expertise_areas, ARRAY[]::text[]) AS specializations,
              e.bio,
              e.last_active_at,
              e.created_at,
              COALESCE(NULLIF(TRIM(f.name), ''), 'Verified Expert') AS name,
              COALESCE(NULLIF(TRIM(f.location), ''), 'India') AS location,
              COALESCE(
                NULLIF(TRIM(SPLIT_PART(COALESCE(e.bio, ''), '.', 1)), ''),
                '10+ years'
              ) AS experience
       FROM experts e
       LEFT JOIN farmers f ON f.id = e.farmer_id
       WHERE e.is_verified = true
       ORDER BY e.last_active_at DESC`,
      [],
    );

    const enrichedExperts = await Promise.all(
      expertsResult.rows.map(async (expert: any) => {
        const [followResult, answerResult] = await Promise.all([
          query(`SELECT COUNT(*) FROM expert_follows WHERE expert_id = $1`, [expert.id]),
          query(
            `SELECT COUNT(*) FROM post_comments WHERE author_id = $1 AND is_expert_reply = true`,
            [expert.farmer_id],
          ),
        ]);

        const isActiveThisWeek =
          new Date(expert.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return {
          ...expert,
          followers: parseInt(followResult.rows[0].count, 10),
          questionsAnswered: parseInt(answerResult.rows[0].count, 10),
          isActiveThisWeek,
        };
      }),
    );

    res.json({ experts: enrichedExperts });
  } catch (error: any) {
    console.error("Error fetching experts:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/experts/:id/follow
 */
router.post("/experts/:id/follow", async (req: Request, res: Response) => {
  try {
    const { id: expert_id } = req.params;
    const { follower_id } = req.body;

    if (!follower_id) {
      return res.status(400).json({ error: "Missing required field: follower_id" });
    }

    const existing = await query(
      `SELECT id FROM expert_follows WHERE expert_id = $1 AND follower_id = $2`,
      [expert_id, follower_id],
    );

    if (existing.rows[0]) {
      await query(`DELETE FROM expert_follows WHERE id = $1`, [existing.rows[0].id]);
      res.json({ action: "unfollowed" });
    } else {
      await query(
        `INSERT INTO expert_follows (expert_id, follower_id) VALUES ($1, $2)`,
        [expert_id, follower_id],
      );
      res.json({ action: "followed" });
    }
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATS & TRENDING ENDPOINTS
// ============================================================================

/**
 * GET /api/community/stats
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [farmersResult, postsResult, answeredResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM farmers`, []),
      query(`SELECT COUNT(*) FROM community_posts WHERE created_at >= NOW() - INTERVAL '1 day'`, []),
      query(`SELECT COUNT(*) FROM post_comments WHERE is_expert_reply = true`, []),
    ]);

    res.json({
      active_farmers: parseInt(farmersResult.rows[0].count, 10),
      posts_today: parseInt(postsResult.rows[0].count, 10),
      questions_answered: parseInt(answeredResult.rows[0].count, 10),
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/trending
 */
router.get("/trending", async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await query(
      `SELECT tags FROM community_posts WHERE created_at >= $1`,
      [sevenDaysAgo],
    );

    const tagCounts: Record<string, number> = {};
    result.rows.forEach((post: any) => {
      (post.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count], index) => ({
        tag, posts: count,
        heat: index < 2 ? "hot" : index < 4 ? "warm" : "rising",
      }));

    res.json({ trending });
  } catch (error: any) {
    console.error("Error fetching trending:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/posts/:id/summarize
 */
router.post("/posts/:id/summarize", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;

    // Check cache
    const cached = await query(`SELECT * FROM ai_summaries WHERE post_id = $1 LIMIT 1`, [post_id]);
    if (cached.rows[0]) {
      return res.json({ summary: cached.rows[0], cached: true });
    }

    const [postResult, commentsResult] = await Promise.all([
      query(`SELECT content FROM community_posts WHERE id = $1`, [post_id]),
      query(`SELECT content, is_expert_reply FROM post_comments WHERE post_id = $1`, [post_id]),
    ]);

    const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

    try {
      const aiResponse = await fetch(`${PYTHON_AI_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: postResult.rows[0]?.content,
          comments: commentsResult.rows.map((c: any) => ({
            content: c.content,
            is_expert: c.is_expert_reply,
          })),
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const saved = await query(
          `INSERT INTO ai_summaries (post_id, summary, common_solution, warnings, best_practice)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [post_id, aiData.summary || "No summary available", aiData.common_solution, aiData.warnings, aiData.best_practice],
        );
        return res.json({ summary: saved.rows[0], cached: false });
      }
    } catch (aiError) {
      console.log("AI service unavailable, using fallback");
    }

    const fallbackSummary = {
      post_id,
      summary: `This discussion has ${commentsResult.rows.length} comments. ${commentsResult.rows.some((c: any) => c.is_expert_reply) ? "An expert has responded." : ""}`,
      common_solution: null, warnings: null, best_practice: null,
    };

    res.json({ summary: fallbackSummary, cached: false, fallback: true });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST REPORTS ENDPOINTS
// ============================================================================

/**
 * POST /api/community/posts/:id/report
 */
router.post("/posts/:id/report", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { reporter_id, reason, details } = req.body;

    if (!reporter_id || !reason) {
      return res.status(400).json({ error: "Missing required fields: reporter_id, reason" });
    }

    try {
      await query(
        `INSERT INTO post_reports (post_id, reporter_id, reason, details)
         VALUES ($1, $2, $3, $4)`,
        [post_id, reporter_id, reason, details || null]
      );
      res.status(201).json({ success: true });
    } catch (dbError: any) {
      if (dbError.code === "23505") { // Unique violation
        return res.status(409).json({ error: "You have already reported this post" });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error reporting post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id/report-status
 */
router.get("/posts/:id/report-status", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `SELECT id FROM post_reports WHERE post_id = $1 AND reporter_id = $2`,
      [post_id, user_id]
    );

    res.json({ reported: result.rows.length > 0 });
  } catch (error: any) {
    console.error("Error checking report status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id/report-count
 */
router.get("/posts/:id/report-count", async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;

    const result = await query(
      `SELECT COUNT(*) FROM post_reports WHERE post_id = $1 AND status = 'pending'`,
      [post_id]
    );

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error: any) {
    console.error("Error getting report count:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/reports
 */
router.get("/reports", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const result = await query(
      `SELECT * FROM post_reports WHERE reporter_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({ reports: result.rows });
  } catch (error: any) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/saved/ids
 */
router.get("/saved/ids", async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await query(
      `SELECT post_id FROM saved_posts WHERE user_id = $1`,
      [user_id],
    );

    res.json({ ids: result.rows.map((row: any) => row.post_id) });
  } catch (error: any) {
    console.error("Error fetching saved post ids:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/saved/:postId
 * Check if a post is saved by the current user
 */
router.get("/saved/:postId", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await query(
      `SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
      [user_id, postId],
    );

    res.json({ saved: result.rows.length > 0 });
  } catch (error: any) {
    console.error("Error checking saved status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/saved
 * Save a post (bookmark)
 */
router.post("/saved", async (req: Request, res: Response) => {
  try {
    const { user_id, post_id } = req.body;

    if (!user_id || !post_id) {
      return res.status(400).json({ error: "Missing required fields: user_id, post_id" });
    }

    // Check if already saved
    const existing = await query(
      `SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
      [user_id, post_id],
    );

    if (existing.rows[0]) {
      return res.status(409).json({ error: "Post already saved" });
    }

    const result = await query(
      `INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2) RETURNING *`,
      [user_id, post_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error saving post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/community/saved/:postId
 * Unsave a post (remove bookmark)
 */
router.delete("/saved/:postId", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await query(
      `DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
      [user_id, postId],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error unsaving post:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

