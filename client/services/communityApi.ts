import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase client for frontend
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TYPES
// ============================================================================

export type PostType = 'success' | 'question' | 'problem' | 'update';
export type ReactionType = 'helpful' | 'tried' | 'didnt_work' | 'new_idea';

export interface Author {
  id: string;
  name: string;
  location: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface ReactionCount {
  type: ReactionType;
  count: number;
  hasReacted: boolean;
}

export interface Post {
  id: string;
  author_id: string;
  author: Author;
  post_type: PostType;
  content: string;
  crop?: string;
  method?: string;
  image_url?: string;
  tags: string[];
  is_trending: boolean;
  has_expert_reply: boolean;
  reaction_counts: Record<ReactionType, number>;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author: { id: string; name: string };
  content: string;
  is_expert_reply: boolean;
  created_at: string;
}

export interface Expert {
  id: string;
  farmer_id: string;
  name: string;
  location: string;
  specializations: string[];
  experience: string;
  is_verified: boolean;
  followers: number;
  questionsAnswered: number;
  isActiveThisWeek: boolean;
  last_active_at: string;
}

export interface CommunityStats {
  active_farmers: number;
  posts_today: number;
  questions_answered_percent: number;
}

export interface TrendingTopic {
  tag: string;
  posts: number;
  heat: 'hot' | 'warm' | 'rising';
}

export interface CreatePostData {
  author_id: string;
  post_type: PostType;
  content: string;
  crop?: string;
  method?: string;
  image_url?: string;
  tags?: string[];
}

// ============================================================================
// API BASE URL
// ============================================================================

const API_BASE = '/api/community';

// ============================================================================
// POSTS API
// ============================================================================

export const postsApi = {
  /**
   * Fetch all posts with optional filters
   */
  async getPosts(filters?: {
    crop?: string;
    type?: PostType;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: Post[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.crop) params.append('crop', filters.crop);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${API_BASE}/posts?${params}`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  /**
   * Fetch a single post by ID
   */
  async getPost(id: string): Promise<Post & { comments: Comment[] }> {
    const response = await fetch(`${API_BASE}/posts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  },

  /**
   * Delete a post
   */
  async deletePost(id: string, author_id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id }),
    });
    if (!response.ok) throw new Error('Failed to delete post');
  },
};

// ============================================================================
// REACTIONS API
// ============================================================================

export const reactionsApi = {
  /**
   * Toggle a reaction on a post
   */
  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<{ action: 'added' | 'removed'; reaction_type: ReactionType }> {
    const response = await fetch(`${API_BASE}/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, reaction_type: reactionType }),
    });
    if (!response.ok) throw new Error('Failed to toggle reaction');
    return response.json();
  },

  /**
   * Get reactions for a post
   */
  async getReactions(postId: string): Promise<{
    reactions: Array<{ reaction_type: ReactionType; user_id: string }>;
    counts: Record<ReactionType, number>;
  }> {
    const response = await fetch(`${API_BASE}/posts/${postId}/reactions`);
    if (!response.ok) throw new Error('Failed to fetch reactions');
    return response.json();
  },
};

// ============================================================================
// COMMENTS API
// ============================================================================

export const commentsApi = {
  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    authorId: string,
    content: string
  ): Promise<Comment> {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id: authorId, content }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },
};

// ============================================================================
// EXPERTS API
// ============================================================================

export const expertsApi = {
  /**
   * Get all experts
   */
  async getExperts(): Promise<{ experts: Expert[] }> {
    const response = await fetch(`${API_BASE}/experts`);
    if (!response.ok) throw new Error('Failed to fetch experts');
    return response.json();
  },

  /**
   * Toggle follow on an expert
   */
  async toggleFollow(
    expertId: string,
    followerId: string
  ): Promise<{ action: 'followed' | 'unfollowed' }> {
    const response = await fetch(`${API_BASE}/experts/${expertId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId }),
    });
    if (!response.ok) throw new Error('Failed to toggle follow');
    return response.json();
  },
};

// ============================================================================
// STATS & TRENDING API
// ============================================================================

export const statsApi = {
  /**
   * Get community statistics
   */
  async getStats(): Promise<CommunityStats> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  /**
   * Get trending topics
   */
  async getTrending(): Promise<{ trending: TrendingTopic[] }> {
    const response = await fetch(`${API_BASE}/trending`);
    if (!response.ok) throw new Error('Failed to fetch trending');
    return response.json();
  },
};

// ============================================================================
// AI SUMMARY API
// ============================================================================

export const aiApi = {
  /**
   * Generate AI summary for a post
   */
  async summarizePost(postId: string): Promise<{
    summary: {
      summary: string;
      common_solution?: string;
      warnings?: string;
      best_practice?: string;
    };
    cached: boolean;
  }> {
    const response = await fetch(`${API_BASE}/posts/${postId}/summarize`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to generate summary');
    return response.json();
  },
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export const realtime = {
  /**
   * Subscribe to new posts
   */
  subscribeToNewPosts(callback: (post: any) => void): RealtimeChannel {
    return supabase
      .channel('community-posts-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * Subscribe to post updates (trending, expert replies)
   */
  subscribeToPostUpdates(callback: (post: any) => void): RealtimeChannel {
    return supabase
      .channel('community-posts-update')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_posts' },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * Subscribe to reactions on posts
   */
  subscribeToReactions(callback: (reaction: any, eventType: 'INSERT' | 'DELETE') => void): RealtimeChannel {
    return supabase
      .channel('community-reactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_reactions' },
        (payload) => callback(payload.new, 'INSERT')
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_reactions' },
        (payload) => callback(payload.old, 'DELETE')
      )
      .subscribe();
  },

  /**
   * Subscribe to comments on a specific post
   */
  subscribeToComments(postId: string, callback: (comment: any) => void): RealtimeChannel {
    return supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * Subscribe to expert follows
   */
  subscribeToFollows(callback: (follow: any, eventType: 'INSERT' | 'DELETE') => void): RealtimeChannel {
    return supabase
      .channel('expert-follows')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expert_follows' },
        (payload) => callback(payload.new, 'INSERT')
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expert_follows' },
        (payload) => callback(payload.old, 'DELETE')
      )
      .subscribe();
  },

  /**
   * Subscribe to community stats updates
   */
  subscribeToStats(callback: (stats: CommunityStats) => void): RealtimeChannel {
    return supabase
      .channel('community-stats')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_stats' },
        (payload) => callback(payload.new as CommunityStats)
      )
      .subscribe();
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  },
};
