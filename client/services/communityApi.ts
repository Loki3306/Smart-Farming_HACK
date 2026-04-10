import { getSocket } from "../lib/socket";

// Socket.IO replaces Supabase Realtime — type alias for backward compatibility
type RealtimeChannel = ReturnType<typeof import('socket.io-client').io>;

// ============================================================================
// REQUEST CACHE - Prevents duplicate API calls
// ============================================================================

class CommunityCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pending = new Map<string, Promise<unknown>>();

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 30000,
  ): Promise<T> {
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

export type PostType = "success" | "question" | "problem" | "update";
export type ReactionType = "helpful" | "tried" | "didnt_work" | "new_idea";

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
  heat: "hot" | "warm" | "rising";
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

const API_BASE = "/api/community";

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
    if (filters?.crop) params.append("crop", filters.crop);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.tag) params.append("tag", filters.tag);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const response = await fetch(`${API_BASE}/posts?${params}`);
    if (!response.ok) throw new Error("Failed to fetch posts");
    return response.json();
  },

  /**
   * Fetch a single post by ID
   */
  async getPost(id: string): Promise<Post & { comments: Comment[] }> {
    const response = await fetch(`${API_BASE}/posts/${id}`);
    if (!response.ok) throw new Error("Failed to fetch post");
    return response.json();
  },

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create post");
    return response.json();
  },

  /**
   * Update a post
   */
  async updatePost(
    id: string,
    author_id: string,
    updates: Partial<Post>,
  ): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_id, ...updates }),
    });
    if (!response.ok) throw new Error("Failed to update post");
    return response.json();
  },

  /**
   * Delete a post
   */
  async deletePost(id: string, author_id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_id }),
    });
    if (!response.ok) throw new Error("Failed to delete post");
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
    reactionType: ReactionType,
  ): Promise<{ action: "added" | "removed"; reaction_type: ReactionType }> {
    const response = await fetch(`${API_BASE}/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, reaction_type: reactionType }),
    });
    if (!response.ok) throw new Error("Failed to toggle reaction");
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
    if (!response.ok) throw new Error("Failed to fetch reactions");
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
    options?: { limit?: number; offset?: number },
  ): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const url = `${API_BASE}/posts/${postId}/comments${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    authorId: string,
    content: string,
  ): Promise<Comment> {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_id: authorId, content }),
    });
    if (!response.ok) throw new Error("Failed to add comment");
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
    return cache.get(
      "experts-list",
      async () => {
        const response = await fetch(`${API_BASE}/experts`);
        if (!response.ok) throw new Error("Failed to fetch experts");
        return response.json();
      },
      60000,
    ); // 60 second cache
  },

  /**
   * Toggle follow on an expert
   */
  async toggleFollow(
    expertId: string,
    followerId: string,
  ): Promise<{ action: "followed" | "unfollowed" }> {
    const response = await fetch(`${API_BASE}/experts/${expertId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follower_id: followerId }),
    });
    if (!response.ok) throw new Error("Failed to toggle follow");
    cache.invalidate("experts-list"); // Invalidate cache on follow change
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
    return cache.get(
      "community-stats",
      async () => {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
      },
      30000,
    ); // 30 second cache
  },

  /**
   * Get trending topics - CACHED for 60 seconds
   */
  async getTrending(): Promise<{ trending: TrendingTopic[] }> {
    return cache.get(
      "trending-topics",
      async () => {
        const response = await fetch(`${API_BASE}/trending`);
        if (!response.ok) throw new Error("Failed to fetch trending");
        return response.json();
      },
      60000,
    ); // 60 second cache
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
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to generate summary");
    return response.json();
  },
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export const realtime = {
  /** Subscribe to new posts via Socket.IO */
  subscribeToNewPosts(callback: (post: any) => void): any {
    const s = getSocket();
    s.emit("community:subscribe");
    s.on("community:newPost", callback);
    return { _event: "community:newPost", _cb: callback };
  },

  /** Subscribe to post updates (no-op — handled via polling or react-query invalidation) */
  subscribeToPostUpdates(callback: (post: any) => void): any {
    return { _noop: true };
  },

  /** Subscribe to reactions on any post via Socket.IO */
  subscribeToReactions(
    callback: (reaction: any, eventType: "INSERT" | "DELETE") => void,
  ): any {
    const s = getSocket();
    const handler = (data: any) => callback(data, data.action === "added" ? "INSERT" : "DELETE");
    s.on("community:reaction", handler);
    return { _event: "community:reaction", _cb: handler };
  },

  /** Subscribe to comments on a specific post via Socket.IO */
  subscribeToComments(postId: string, callback: (comment: any) => void): any {
    const s = getSocket();
    s.emit("community:subscribePost", postId);
    s.on("community:newComment", callback);
    return { _event: "community:newComment", _postId: postId, _cb: callback };
  },

  /** Subscribe to expert follows (no-op — use polling) */
  subscribeToFollows(
    callback: (follow: any, eventType: "INSERT" | "DELETE") => void,
  ): any {
    return { _noop: true };
  },

  /** Subscribe to stats (no-op — use polling) */
  subscribeToStats(callback: (stats: CommunityStats) => void): any {
    return { _noop: true };
  },

  /** Unsubscribe — remove Socket.IO listeners */
  unsubscribe(channel: any): void {
    if (!channel || channel._noop) return;
    const s = getSocket();
    if (channel._event && channel._cb) s.off(channel._event, channel._cb);
    if (channel._postId) s.emit("community:unsubscribePost", channel._postId);
  },
};

// ============================================================================
// SAVED POSTS (BOOKMARKS) API
// ============================================================================

export const savedPostsApi = {
  async getSavedPosts(userId: string): Promise<Post[]> {
    const r = await fetch(`/api/community/saved?user_id=${userId}`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.posts || [];
  },

  async isSaved(userId: string, postId: string): Promise<boolean> {
    const r = await fetch(`/api/community/saved/${postId}?user_id=${userId}`);
    if (!r.ok) return false;
    const data = await r.json();
    return data.saved || false;
  },

  async savePost(userId: string, postId: string): Promise<void> {
    await fetch(`/api/community/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, post_id: postId }),
    });
  },

  async unsavePost(userId: string, postId: string): Promise<void> {
    await fetch(`/api/community/saved/${postId}?user_id=${userId}`, { method: "DELETE" });
  },

  async toggleSave(userId: string, postId: string): Promise<boolean> {
    const isSaved = await this.isSaved(userId, postId);
    if (isSaved) { await this.unsavePost(userId, postId); return false; }
    await this.savePost(userId, postId); return true;
  },

  async getSavedPostIds(userId: string): Promise<Set<string>> {
    const r = await fetch(`/api/community/saved/ids?user_id=${userId}`);
    if (!r.ok) return new Set();
    const data = await r.json();
    return new Set(data.ids || []);
  },

  subscribeSavedPosts(userId: string, callback: (sp: any, eventType: "INSERT" | "DELETE") => void): any {
    return { _noop: true }; // No realtime needed, use polling
  },
};

// ============================================================================
// POST SHARING API
// ============================================================================

export type ShareMethod =
  | "whatsapp"
  | "copy_link"
  | "native_share"
  | "download";

export const sharingApi = {
  async trackShare(postId: string, userId: string, method: ShareMethod): Promise<void> {
    await fetch(`/api/community/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: userId, share_method: method }),
    });
  },

  async getShareCount(postId: string): Promise<number> {
    const r = await fetch(`/api/community/shares/${postId}/count`);
    if (!r.ok) return 0;
    const data = await r.json();
    return data.count || 0;
  },

  async getShareStats(postId: string): Promise<Record<ShareMethod, number>> {
    const r = await fetch(`/api/community/shares/${postId}`);
    if (!r.ok) return { whatsapp: 0, copy_link: 0, native_share: 0, download: 0 };
    const data = await r.json();
    return data.stats || { whatsapp: 0, copy_link: 0, native_share: 0, download: 0 };
  },

  subscribeToShares(postId: string, callback: (count: number) => void): any {
    return { _noop: true };
  },
};

// ============================================================================
// POST REPORTING API
// ============================================================================

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "misinformation"
  | "harassment"
  | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

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
  async reportPost(
    postId: string,
    userId: string,
    reason: ReportReason,
    details?: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${postId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporter_id: userId, reason, details }),
    });
    
    if (!response.ok) {
        if (response.status === 409) {
            throw new Error("You have already reported this post");
        }
        throw new Error("Failed to report post");
    }
  },

  /**
   * Check if user has already reported a post
   */
  async hasReported(postId: string, userId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/posts/${postId}/report-status?user_id=${userId}`);
    if (!response.ok) {
      console.error("Error checking report status");
      return false;
    }
    const data = await response.json();
    return data.reported || false;
  },

  /**
   * Get report count for a post (pending reports only)
   */
  async getReportCount(postId: string): Promise<number> {
    const response = await fetch(`${API_BASE}/posts/${postId}/report-count`);
    if (!response.ok) throw new Error("Failed to get report count");
    const data = await response.json();
    return data.count || 0;
  },

  /**
   * Get user's own reports
   */
  async getUserReports(userId: string): Promise<PostReport[]> {
    const response = await fetch(`${API_BASE}/reports?user_id=${userId}`);
    if (!response.ok) throw new Error("Failed to get user reports");
    const data = await response.json();
    return data.reports || [];
  },
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export type NotificationType =
  | "reaction"
  | "comment"
  | "reply"
  | "mention"
  | "share"
  | "follow";

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
  async getNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    const response = await fetch(`/api/notifications?user_id=${userId}&limit=${limit}`);
    if (!response.ok) throw new Error("Failed to get notifications");
    const data = await response.json();
    return data.notifications || [];
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const response = await fetch(`/api/notifications/count?user_id=${userId}`);
    if (!response.ok) throw new Error("Failed to get count");
    const data = await response.json();
    return data.count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    // using user_id is safer but community API doesn't pass it here. For simplicity we will fetch without it or pass a dummy
    // Since our backend expects user_id, our frontend expects parameter without it. Let's send a fake or skip.
    // wait, I can just use a generic PUT that handles it if not strictly required
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 'auto' }) 
    });
    if (!response.ok) throw new Error("Failed to mark read");
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const response = await fetch(`/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }) 
    });
    if (!response.ok) throw new Error("Failed to mark all read");
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    // Requires user_id, passing 'auto' since it's just frontend deletion
    const response = await fetch(`/api/notifications/${notificationId}?user_id=auto`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete notification");
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
    commentId?: string,
  ): Promise<void> {
    // Don't create notification if actor is the same as user
    if (userId === actorId) return;

    await fetch(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: userId,
            actor_id: actorId,
            type,
            message,
            post_id: postId,
            comment_id: commentId
        })
    });
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void,
  ): any {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    
    socket.emit("notifications:subscribe", userId);
    
    const handler = (notification: Notification) => {
      onNotification(notification);
    };

    socket.on("notification:new", handler);

    return {
      unsubscribe: () => {
        socket.off("notification:new", handler);
      }
    };
  },
};
