import { RealtimeChannel } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

// Export supabase for backward compatibility
export { supabase };

// ============================================================================
// REQUEST CACHE - Prevents duplicate API calls
// ============================================================================

class CommunityCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pending = new Map<string, Promise<unknown>>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttl = 30000): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached if still valid
    if (cached && now - cached.timestamp < ttl) {
      return cached.data as T;
    }

    // Return pending request if exists (deduplication)
    const pendingReq = this.pending.get(key);
    if (pendingReq) return pendingReq as Promise<T>;

    // Make new request
    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pending.delete(key);
        return data;
      })
      .catch((err) => {
        this.pending.delete(key);
        throw err;
      });

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}

const cache = new CommunityCache();

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
  author: { id: string; name: string; avatar_url?: string };
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
   * Update a post
   */
  async updatePost(id: string, author_id: string, updates: Partial<Post>): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id, ...updates }),
    });
    if (!response.ok) throw new Error('Failed to update post');
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
// COMMENTS API (with pagination)
// ============================================================================

export const commentsApi = {
  /**
   * Get comments for a post with pagination
   */
  async getComments(
    postId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));
    
    const url = `${API_BASE}/posts/${postId}/comments${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
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
// EXPERTS API (with caching)
// ============================================================================

export const expertsApi = {
  /**
   * Get all experts - CACHED for 60 seconds
   */
  async getExperts(): Promise<{ experts: Expert[] }> {
    return cache.get('experts-list', async () => {
      const response = await fetch(`${API_BASE}/experts`);
      if (!response.ok) throw new Error('Failed to fetch experts');
      return response.json();
    }, 60000); // 60 second cache
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
    cache.invalidate('experts-list'); // Invalidate cache on follow change
    return response.json();
  },
};

// ============================================================================
// STATS & TRENDING API (with caching)
// ============================================================================

export const statsApi = {
  /**
   * Get community statistics - CACHED for 30 seconds
   */
  async getStats(): Promise<CommunityStats> {
    return cache.get('community-stats', async () => {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }, 30000); // 30 second cache
  },

  /**
   * Get trending topics - CACHED for 60 seconds
   */
  async getTrending(): Promise<{ trending: TrendingTopic[] }> {
    return cache.get('trending-topics', async () => {
      const response = await fetch(`${API_BASE}/trending`);
      if (!response.ok) throw new Error('Failed to fetch trending');
      return response.json();
    }, 60000); // 60 second cache
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

// ============================================================================
// SAVED POSTS (BOOKMARKS) API
// ============================================================================

export const savedPostsApi = {
  /**
   * Get all saved posts for a user
   */
  async getSavedPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        post_id,
        community_posts (
          *,
          author:farmers!community_posts_author_id_fkey (
            id,
            name,
            location
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform nested data
    return (data || []).map((saved: any) => {
      const post = saved.community_posts;
      return {
        ...post,
        author: {
          id: post.author.id,
          name: post.author.name,
          location: post.author.location,
        },
        reaction_counts: {
          helpful: 0,
          tried: 0,
          didnt_work: 0,
          new_idea: 0,
        },
        comment_count: 0,
      };
    });
  },

  /**
   * Check if a post is saved by user
   */
  async isSaved(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

    if (error && error.code !== 'PGRST116') {
      console.error('[SavedPosts] Error checking saved status:', error);
      return false; // Return false instead of throwing
    }
    return !!data;
  },

  /**
   * Save a post (bookmark)
   */
  async savePost(userId: string, postId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: userId, post_id: postId });

    if (error) throw error;
  },

  /**
   * Unsave a post (remove bookmark)
   */
  async unsavePost(userId: string, postId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
  },

  /**
   * Toggle save status for a post
   */
  async toggleSave(userId: string, postId: string): Promise<boolean> {
    const isSaved = await this.isSaved(userId, postId);
    
    if (isSaved) {
      await this.unsavePost(userId, postId);
      return false;
    } else {
      await this.savePost(userId, postId);
      return true;
    }
  },

  /**
   * Get saved post IDs for a user (for checking saved status in bulk)
   */
  async getSavedPostIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      console.error('[SavedPosts] Error fetching saved post IDs:', error);
      return new Set(); // Return empty set instead of throwing
    }
    return new Set((data || []).map((item: any) => item.post_id));
  },

  /**
   * Subscribe to saved posts changes
   */
  subscribeSavedPosts(userId: string, callback: (savedPost: any, eventType: 'INSERT' | 'DELETE') => void): RealtimeChannel {
    return supabase
      .channel(`saved-posts-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'saved_posts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new, 'INSERT')
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'saved_posts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.old, 'DELETE')
      )
      .subscribe();
  },
};

// ============================================================================
// POST SHARING API
// ============================================================================

export type ShareMethod = 'whatsapp' | 'copy_link' | 'native_share' | 'download';

export const sharingApi = {
  /**
   * Track a share action
   */
  async trackShare(postId: string, userId: string, method: ShareMethod): Promise<void> {
    const { error } = await supabase
      .from('post_shares')
      .insert({ 
        post_id: postId, 
        user_id: userId, 
        share_method: method 
      });

    if (error) throw error;
  },

  /**
   * Get share count for a post
   */
  async getShareCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get share statistics for a post (by method)
   */
  async getShareStats(postId: string): Promise<Record<ShareMethod, number>> {
    const { data, error } = await supabase
      .from('post_shares')
      .select('share_method')
      .eq('post_id', postId);

    if (error) throw error;

    const stats: Record<ShareMethod, number> = {
      whatsapp: 0,
      copy_link: 0,
      native_share: 0,
      download: 0,
    };

    (data || []).forEach((share: any) => {
      if (share.share_method in stats) {
        stats[share.share_method as ShareMethod]++;
      }
    });

    return stats;
  },

  /**
   * Subscribe to share count changes for a post
   */
  subscribeToShares(postId: string, callback: (count: number) => void): RealtimeChannel {
    return supabase
      .channel(`shares-${postId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'post_shares',
          filter: `post_id=eq.${postId}`
        },
        async () => {
          const count = await sharingApi.getShareCount(postId);
          callback(count);
        }
      )
      .subscribe();
  },
};

// ============================================================================
// POST REPORTING API
// ============================================================================

export type ReportReason = 'spam' | 'inappropriate' | 'misinformation' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  created_at: string;
}

export const reportingApi = {
  /**
   * Submit a report for a post
   */
  async reportPost(postId: string, userId: string, reason: ReportReason, details?: string): Promise<void> {
    const { error } = await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: userId,
        reason,
        details: details || null,
      });

    if (error) {
      // Handle unique constraint violation (duplicate report)
      if (error.code === '23505') {
        throw new Error('You have already reported this post');
      }
      throw error;
    }
  },

  /**
   * Check if user has already reported a post
   */
  async hasReported(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking report status:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Get report count for a post (pending reports only)
   */
  async getReportCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('post_reports')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get user's own reports
   */
  async getUserReports(userId: string): Promise<PostReport[]> {
    const { data, error } = await supabase
      .from('post_reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PostReport[];
  },
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export type NotificationType = 'reaction' | 'comment' | 'reply' | 'mention' | 'share' | 'follow';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id?: string;
  comment_id?: string;
  message: string;
  read: boolean;
  created_at: string;
  actor_name?: string;
  actor_phone?: string;
}

export const notificationsApi = {
  /**
   * Get user's notifications with actor details
   */
  async getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notification_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Notification[];
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    actorId: string,
    type: NotificationType,
    message: string,
    postId?: string,
    commentId?: string
  ): Promise<void> {
    // Don't create notification if actor is the same as user
    if (userId === actorId) return;

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        message,
        post_id: postId || null,
        comment_id: commentId || null,
      });

    if (error) throw error;
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch the full notification with actor details
          const { data } = await supabase
            .from('notification_details')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNotification(data as Notification);
          }
        }
      )
      .subscribe();

    return channel;
  },
};

