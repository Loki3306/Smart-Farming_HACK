import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// ============================================================================
// TYPES
// ============================================================================

interface CreatePostBody {
  author_id: string;
  post_type: 'success' | 'question' | 'problem' | 'update';
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
  reaction_type: 'helpful' | 'tried' | 'didnt_work' | 'new_idea';
}

// ============================================================================
// POSTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/posts
 * Fetch all posts with author info and reaction counts
 */
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { crop, type, tag, search, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:farmers!author_id(id, name, phone, farm:farms!farmer_id(city, district, village)),
        reactions:post_reactions(reaction_type),
        comment_count:post_comments(count)
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters
    if (crop) {
      query = query.eq('crop', crop);
    }
    if (type) {
      query = query.eq('post_type', type);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    if (search) {
      query = query.or(`content.ilike.%${search}%,crop.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to include reaction counts
    const posts = data?.map(post => {
      const reactionCounts = post.reactions?.reduce((acc: Record<string, number>, r: any) => {
        acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get location from farm data if available
      const farm = Array.isArray(post.author?.farm) ? post.author?.farm[0] : post.author?.farm;
      const location = farm 
        ? `${farm.village || farm.city}, ${farm.district}` 
        : 'India';

      return {
        ...post,
        reactions: undefined, // Remove raw reactions
        reaction_counts: reactionCounts,
        comment_count: post.comment_count?.[0]?.count || 0,
        author: {
          id: post.author?.id,
          name: post.author?.name,
          location: location,
        }
      };
    });

    res.json({ posts, count: posts?.length || 0 });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id
 * Fetch single post with full details
 */
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:farmers!author_id(id, name, phone, farm:farms!farmer_id(city, district, village)),
        comments:post_comments(
          id, content, is_expert_reply, created_at,
          author:farmers!author_id(id, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get reaction counts
    const { data: reactions } = await supabase
      .from('post_reactions')
      .select('reaction_type, user_id')
      .eq('post_id', id);

    const reactionCounts = reactions?.reduce((acc: Record<string, number>, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get location from farm data
    const farm = Array.isArray(post.author?.farm) ? post.author?.farm[0] : post.author?.farm;
    const location = farm 
      ? `${farm.village || farm.city}, ${farm.district}` 
      : 'India';

    const transformedPost = {
      ...post,
      author: {
        id: post.author?.id,
        name: post.author?.name,
        location: location,
      },
      reaction_counts: reactionCounts,
      reactions_list: reactions // For checking if current user reacted
    };

    res.json(transformedPost);
  } catch (error: any) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/posts
 * Create a new post
 */
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const body: CreatePostBody = req.body;

    // Validate required fields
    if (!body.author_id || !body.post_type || !body.content) {
      return res.status(400).json({ error: 'Missing required fields: author_id, post_type, content' });
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert([{
        author_id: body.author_id,
        post_type: body.post_type,
        content: body.content,
        crop: body.crop || null,
        method: body.method || null,
        image_url: body.image_url || null,
        tags: body.tags || [],
      }])
      .select(`
        *,
        author:farmers!author_id(id, name, phone)
      `)
      .single();

    if (error) throw error;

    // Update community stats
    await supabase.rpc('update_community_stats');

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/community/posts/:id
 * Delete a post (author only)
 */
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author_id } = req.body;

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', id)
      .eq('author_id', author_id); // Only author can delete

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/community/posts/:id
 * Update a post (author only)
 */
router.patch('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author_id, content, post_type, crop, method, tags, image_url } = req.body;

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (content !== undefined) updates.content = content;
    if (post_type !== undefined) updates.post_type = post_type;
    if (crop !== undefined) updates.crop = crop || null;
    if (method !== undefined) updates.method = method || null;
    if (tags !== undefined) updates.tags = tags || [];
    if (image_url !== undefined) updates.image_url = image_url || null;

    const { data, error } = await supabase
      .from('community_posts')
      .update(updates)
      .eq('id', id)
      .eq('author_id', author_id) // Only author can update
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REACTIONS ENDPOINTS
// ============================================================================

/**
 * POST /api/community/posts/:id/react
 * Toggle a reaction on a post
 */
router.post('/posts/:id/react', async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { user_id, reaction_type }: ReactionBody = req.body;

    if (!user_id || !reaction_type) {
      return res.status(400).json({ error: 'Missing required fields: user_id, reaction_type' });
    }

    // Check if reaction exists
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .eq('reaction_type', reaction_type)
      .single();

    if (existing) {
      // Remove reaction (toggle off)
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      res.json({ action: 'removed', reaction_type });
    } else {
      // Add reaction
      const { error } = await supabase
        .from('post_reactions')
        .insert([{ post_id, user_id, reaction_type }]);

      if (error) throw error;
      res.json({ action: 'added', reaction_type });
    }
  } catch (error: any) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/posts/:id/reactions
 * Get all reactions for a post
 */
router.get('/posts/:id/reactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('post_reactions')
      .select('reaction_type, user_id')
      .eq('post_id', id);

    if (error) throw error;

    // Aggregate counts
    const counts = data?.reduce((acc: Record<string, number>, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({ reactions: data, counts });
  } catch (error: any) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/posts/:id/comments
 * Get all comments for a post
 */
router.get('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:farmers!author_id(id, name:name)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ comments: data });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/posts/:id/comments
 * Add a comment to a post
 */
router.post('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;
    const { author_id, content }: CreateCommentBody = req.body;

    if (!author_id || !content) {
      return res.status(400).json({ error: 'Missing required fields: author_id, content' });
    }

    // Check if author is an expert
    const { data: expert } = await supabase
      .from('experts')
      .select('id, is_verified')
      .eq('farmer_id', author_id)
      .single();

    const is_expert_reply = expert?.is_verified || false;

    const { data, error } = await supabase
      .from('post_comments')
      .insert([{
        post_id,
        author_id,
        content,
        is_expert_reply,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        author:farmers!author_id(id, name)
      `)
      .single();

    if (error) throw error;

    // Update has_expert_reply on post if this is an expert
    if (is_expert_reply) {
      await supabase
        .from('community_posts')
        .update({ has_expert_reply: true })
        .eq('id', post_id);
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPERTS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/experts
 * Get all experts with stats
 */
router.get('/experts', async (req: Request, res: Response) => {
  try {
    const { data: experts, error } = await supabase
      .from('experts')
      .select(`
        *,
        farmer:farmers!farmer_id(id, name, phone, farm:farms!farmer_id(city, district, village))
      `)
      .eq('is_verified', true)
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    // Get follower counts and questions answered for each expert
    const enrichedExperts = await Promise.all(
      (experts || []).map(async (expert) => {
        const { count: followerCount } = await supabase
          .from('expert_follows')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', expert.id);

        const { count: questionsAnswered } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', expert.farmer_id)
          .eq('is_expert_reply', true);

        const isActiveThisWeek = new Date(expert.last_active_at) > 
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get location from farm data
        const farm = Array.isArray(expert.farmer?.farm) ? expert.farmer?.farm[0] : expert.farmer?.farm;
        const location = farm 
          ? `${farm.village || farm.city}, ${farm.district}` 
          : 'India';

        return {
          ...expert,
          name: expert.farmer?.name,
          location: location,
          followers: followerCount || 0,
          questionsAnswered: questionsAnswered || 0,
          isActiveThisWeek
        };
      })
    );

    res.json({ experts: enrichedExperts });
  } catch (error: any) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/experts/:id/follow
 * Follow or unfollow an expert
 */
router.post('/experts/:id/follow', async (req: Request, res: Response) => {
  try {
    const { id: expert_id } = req.params;
    const { follower_id } = req.body;

    if (!follower_id) {
      return res.status(400).json({ error: 'Missing required field: follower_id' });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('expert_follows')
      .select('id')
      .eq('expert_id', expert_id)
      .eq('follower_id', follower_id)
      .single();

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('expert_follows')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      res.json({ action: 'unfollowed' });
    } else {
      // Follow
      const { error } = await supabase
        .from('expert_follows')
        .insert([{ expert_id, follower_id }]);

      if (error) throw error;
      res.json({ action: 'followed' });
    }
  } catch (error: any) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/stats
 * Get community statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // First, update stats
    await supabase.rpc('update_community_stats');

    const { data, error } = await supabase
      .from('community_stats')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    res.json(data || {
      active_farmers: 0,
      posts_today: 0,
      questions_answered_percent: 0
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TRENDING TOPICS ENDPOINTS
// ============================================================================

/**
 * GET /api/community/trending
 * Get trending topics based on tag usage
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    // Get posts from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('tags')
      .gte('created_at', sevenDaysAgo);

    if (error) throw error;

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    posts?.forEach(post => {
      post.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and get top 5
    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count], index) => ({
        tag,
        posts: count,
        heat: index < 2 ? 'hot' : index < 4 ? 'warm' : 'rising'
      }));

    res.json({ trending });
  } catch (error: any) {
    console.error('Error fetching trending:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI SUMMARY ENDPOINTS
// ============================================================================

/**
 * POST /api/community/posts/:id/summarize
 * Generate AI summary for a post
 */
router.post('/posts/:id/summarize', async (req: Request, res: Response) => {
  try {
    const { id: post_id } = req.params;

    // Check cache first
    const { data: cached } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('post_id', post_id)
      .single();

    if (cached) {
      return res.json({ summary: cached, cached: true });
    }

    // Fetch post and comments
    const { data: post } = await supabase
      .from('community_posts')
      .select('content')
      .eq('id', post_id)
      .single();

    const { data: comments } = await supabase
      .from('post_comments')
      .select('content, is_expert_reply')
      .eq('post_id', post_id);

    // Build content for AI
    const contentForAI = {
      post: post?.content,
      comments: comments?.map(c => ({
        content: c.content,
        is_expert: c.is_expert_reply
      }))
    };

    // Call Python AI backend (using existing PYTHON_AI_URL)
    const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    
    try {
      const aiResponse = await fetch(`${PYTHON_AI_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentForAI)
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        
        // Cache the result
        const { data: savedSummary } = await supabase
          .from('ai_summaries')
          .insert([{
            post_id,
            summary: aiData.summary || 'No summary available',
            common_solution: aiData.common_solution,
            warnings: aiData.warnings,
            best_practice: aiData.best_practice
          }])
          .select()
          .single();

        return res.json({ summary: savedSummary, cached: false });
      }
    } catch (aiError) {
      console.log('AI service unavailable, using fallback');
    }

    // Fallback if AI is unavailable
    const fallbackSummary = {
      post_id,
      summary: `This discussion has ${comments?.length || 0} comments. ${
        comments?.some(c => c.is_expert_reply) ? 'An expert has responded.' : ''
      }`,
      common_solution: null,
      warnings: null,
      best_practice: null
    };

    res.json({ summary: fallbackSummary, cached: false, fallback: true });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
