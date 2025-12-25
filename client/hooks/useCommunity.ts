import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Post,
  Comment,
  Expert,
  CommunityStats,
  TrendingTopic,
  PostType,
  ReactionType,
  CreatePostData,
  postsApi,
  reactionsApi,
  commentsApi,
  expertsApi,
  statsApi,
  aiApi,
  realtime,
} from '../services/communityApi';

// ============================================================================
// useCommunityPosts - Main posts feed with real-time updates
// ============================================================================

interface UsePostsOptions {
  crop?: string;
  type?: PostType;
  tag?: string;
  search?: string;
  limit?: number;
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post | null>;
  deletePost: (id: string, authorId: string) => Promise<boolean>;
}

export function useCommunityPosts(options: UsePostsOptions = {}): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateChannelRef = useRef<RealtimeChannel | null>(null);
  const limit = options.limit ?? 20;

  // Fetch posts
  const fetchPosts = useCallback(async (resetOffset = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = resetOffset ? 0 : offset;
      const result = await postsApi.getPosts({
        ...options,
        limit,
        offset: currentOffset,
      });

      if (resetOffset) {
        setPosts(result.posts);
        setOffset(limit);
      } else {
        setPosts((prev) => [...prev, ...result.posts]);
        setOffset((prev) => prev + limit);
      }
      
      setHasMore(result.posts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [options.crop, options.type, options.tag, options.search, limit, offset]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchPosts(true);

    // Subscribe to new posts
    channelRef.current = realtime.subscribeToNewPosts((newPost) => {
      // Only add if it matches current filters
      const matchesCrop = !options.crop || newPost.crop === options.crop;
      const matchesType = !options.type || newPost.post_type === options.type;
      
      if (matchesCrop && matchesType) {
        setPosts((prev) => [newPost, ...prev]);
      }
    });

    // Subscribe to post updates
    updateChannelRef.current = realtime.subscribeToPostUpdates((updatedPost) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
      );
    });

    return () => {
      if (channelRef.current) realtime.unsubscribe(channelRef.current);
      if (updateChannelRef.current) realtime.unsubscribe(updateChannelRef.current);
    };
  }, [options.crop, options.type, options.tag, options.search]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts(false);
    }
  }, [loading, hasMore, fetchPosts]);

  // Refresh posts
  const refresh = useCallback(async () => {
    await fetchPosts(true);
  }, [fetchPosts]);

  // Create new post
  const createPost = useCallback(async (data: CreatePostData): Promise<Post | null> => {
    try {
      const newPost = await postsApi.createPost(data);
      // Real-time will handle adding it to the list
      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (id: string, authorId: string): Promise<boolean> => {
    try {
      await postsApi.deletePost(id, authorId);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    }
  }, []);

  return { posts, loading, error, hasMore, loadMore, refresh, createPost, deletePost };
}

// ============================================================================
// usePostReactions - Real-time reaction counts and toggling
// ============================================================================

interface UseReactionsReturn {
  reactionCounts: Record<ReactionType, number>;
  userReactions: Set<ReactionType>;
  toggleReaction: (type: ReactionType) => Promise<void>;
  loading: boolean;
}

export function usePostReactions(
  postId: string,
  userId: string,
  initialCounts: Record<ReactionType, number> = { helpful: 0, tried: 0, didnt_work: 0, new_idea: 0 }
): UseReactionsReturn {
  const [reactionCounts, setReactionCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set());
  const [loading, setLoading] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial reaction data
  useEffect(() => {
    const loadReactions = async () => {
      try {
        const result = await reactionsApi.getReactions(postId);
        setReactionCounts((prev) => ({
          ...prev,
          helpful: result.counts?.helpful || 0,
          tried: result.counts?.tried || 0,
          didnt_work: result.counts?.didnt_work || 0,
          new_idea: result.counts?.new_idea || 0,
        }));
        
        // Set user's own reactions
        const userReactionsList = result.reactions
          .filter((r) => r.user_id === userId)
          .map((r) => r.reaction_type as ReactionType);
        setUserReactions(new Set(userReactionsList));
      } catch (err) {
        console.error('Failed to load reactions:', err);
      }
    };
    
    loadReactions();
  }, [postId, userId]);

  // Subscribe to reaction changes
  useEffect(() => {
    channelRef.current = realtime.subscribeToReactions((reaction, eventType) => {
      if (reaction.post_id !== postId) return;

      setReactionCounts((prev) => {
        const type = reaction.reaction_type as ReactionType;
        const change = eventType === 'INSERT' ? 1 : -1;
        return { ...prev, [type]: Math.max(0, (prev[type] || 0) + change) };
      });

      if (reaction.user_id === userId) {
        setUserReactions((prev) => {
          const newSet = new Set(prev);
          if (eventType === 'INSERT') {
            newSet.add(reaction.reaction_type);
          } else {
            newSet.delete(reaction.reaction_type);
          }
          return newSet;
        });
      }
    });

    return () => {
      if (channelRef.current) realtime.unsubscribe(channelRef.current);
    };
  }, [postId, userId]);

  // Toggle reaction
  const toggleReaction = useCallback(async (type: ReactionType) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Optimistic update
      const isRemoving = userReactions.has(type);
      setUserReactions((prev) => {
        const newSet = new Set(prev);
        if (isRemoving) {
          newSet.delete(type);
        } else {
          newSet.add(type);
        }
        return newSet;
      });
      setReactionCounts((prev) => ({
        ...prev,
        [type]: prev[type] + (isRemoving ? -1 : 1),
      }));

      await reactionsApi.toggleReaction(postId, userId, type);
    } catch (err) {
      // Revert on error
      setUserReactions((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(type)) {
          newSet.delete(type);
        } else {
          newSet.add(type);
        }
        return newSet;
      });
      console.error('Failed to toggle reaction:', err);
    } finally {
      setLoading(false);
    }
  }, [postId, userId, loading, userReactions]);

  return { reactionCounts, userReactions, toggleReaction, loading };
}

// ============================================================================
// usePostComments - Real-time comments for a post
// ============================================================================

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (content: string) => Promise<Comment | null>;
  refresh: () => Promise<void>;
}

export function usePostComments(postId: string, authorId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await commentsApi.getComments(postId);
      setComments(result.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchComments();

    channelRef.current = realtime.subscribeToComments(postId, (newComment) => {
      setComments((prev) => [...prev, newComment]);
    });

    return () => {
      if (channelRef.current) realtime.unsubscribe(channelRef.current);
    };
  }, [postId, fetchComments]);

  // Add comment
  const addComment = useCallback(async (content: string): Promise<Comment | null> => {
    try {
      const newComment = await commentsApi.addComment(postId, authorId, content);
      // Real-time will handle adding it
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return null;
    }
  }, [postId, authorId]);

  return { comments, loading, error, addComment, refresh: fetchComments };
}

// ============================================================================
// useCommunityExperts - Experts list with follow functionality
// ============================================================================

interface UseExpertsReturn {
  experts: Expert[];
  loading: boolean;
  error: string | null;
  followedExperts: Set<string>;
  toggleFollow: (expertId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCommunityExperts(userId: string): UseExpertsReturn {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followedExperts, setFollowedExperts] = useState<Set<string>>(new Set());
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const recentToggleRef = useRef<{ expertId: string; timestamp: number; action: 'follow' | 'unfollow' } | null>(null);
  const DEDUPE_WINDOW_MS = 2000;

  // Fetch experts
  const fetchExperts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await expertsApi.getExperts();
      setExperts(result.experts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch experts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchExperts();

    channelRef.current = realtime.subscribeToFollows((follow, eventType) => {
      if (follow.follower_id !== userId) return;

      // Check if this is a duplicate from our recent toggle (account for slower realtime delivery)
      let isRecentToggle = false;
      if (recentToggleRef.current) {
        const timeSinceToggle = Date.now() - recentToggleRef.current.timestamp;
        const expectedAction = eventType === 'INSERT' ? 'follow' : 'unfollow';
        if (
          recentToggleRef.current.expertId === follow.expert_id &&
          recentToggleRef.current.action === expectedAction &&
          timeSinceToggle < DEDUPE_WINDOW_MS
        ) {
          isRecentToggle = true;
          recentToggleRef.current = null;
        }
      }

      // Always update the followed set based on event type
      setFollowedExperts((prev) => {
        const newSet = new Set(prev);
        if (eventType === 'INSERT') {
          newSet.add(follow.expert_id);
        } else {
          newSet.delete(follow.expert_id);
        }
        return newSet;
      });

      // Only update follower count if NOT a recent toggle (to avoid double-counting)
      if (!isRecentToggle) {
        setExperts((prev) =>
          prev.map((e) => {
            if (e.id === follow.expert_id) {
              return {
                ...e,
                followers: e.followers + (eventType === 'INSERT' ? 1 : -1),
              };
            }
            return e;
          })
        );
      }
    });

    return () => {
      if (channelRef.current) realtime.unsubscribe(channelRef.current);
    };
  }, [userId, fetchExperts]);

  // Toggle follow
  const toggleFollow = useCallback(async (expertId: string) => {
    try {
      const isUnfollowing = followedExperts.has(expertId);

      // Mark this toggle to avoid duplicate subscription updates
      recentToggleRef.current = { expertId, timestamp: Date.now(), action: isUnfollowing ? 'unfollow' : 'follow' };
      
      // Optimistic update
      setFollowedExperts((prev) => {
        const newSet = new Set(prev);
        if (isUnfollowing) {
          newSet.delete(expertId);
        } else {
          newSet.add(expertId);
        }
        return newSet;
      });
      
      // Optimistic update for follower count
      setExperts((prev) =>
        prev.map((e) =>
          e.id === expertId
            ? { ...e, followers: e.followers + (isUnfollowing ? -1 : 1) }
            : e
        )
      );

      // Call API - subscription will confirm the change
      await expertsApi.toggleFollow(expertId, userId);
    } catch (err) {
      // Revert on error - use the saved isUnfollowing value
      const wasUnfollowing = followedExperts.has(expertId) === false; // Current state is opposite of what we tried
      
      setFollowedExperts((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(expertId)) {
          newSet.delete(expertId);
        } else {
          newSet.add(expertId);
        }
        return newSet;
      });
      
      // Revert follower count based on what we tried to do
      setExperts((prev) =>
        prev.map((e) =>
          e.id === expertId
            ? { ...e, followers: e.followers + (wasUnfollowing ? 1 : -1) }
            : e
        )
      );
      console.error('Failed to toggle follow:', err);
    }
  }, [userId, followedExperts]);

  return { experts, loading, error, followedExperts, toggleFollow, refresh: fetchExperts };
}

// ============================================================================
// useCommunityStats - Real-time community statistics
// ============================================================================

interface UseStatsReturn {
  stats: CommunityStats | null;
  trending: TrendingTopic[];
  loading: boolean;
  error: string | null;
}

export function useCommunityStats(): UseStatsReturn {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [statsResult, trendingResult] = await Promise.all([
          statsApi.getStats(),
          statsApi.getTrending(),
        ]);
        
        setStats(statsResult);
        setTrending(trendingResult.trending);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to stats updates
    channelRef.current = realtime.subscribeToStats((newStats) => {
      setStats(newStats);
    });

    return () => {
      if (channelRef.current) realtime.unsubscribe(channelRef.current);
    };
  }, []);

  return { stats, trending, loading, error };
}

// ============================================================================
// useAISummary - Generate AI summary for a post
// ============================================================================

interface UseAISummaryReturn {
  summary: {
    summary: string;
    common_solution?: string;
    warnings?: string;
    best_practice?: string;
  } | null;
  loading: boolean;
  error: string | null;
  generateSummary: () => Promise<void>;
  cached: boolean;
}

export function useAISummary(postId: string): UseAISummaryReturn {
  const [summary, setSummary] = useState<UseAISummaryReturn['summary']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const generateSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await aiApi.summarizePost(postId);
      setSummary(result.summary);
      setCached(result.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  return { summary, loading, error, generateSummary, cached };
}

// ============================================================================
// useOptimisticUpdate - Generic optimistic update helper
// ============================================================================

export function useOptimisticUpdate<T>(
  initialValue: T,
  onUpdate: (value: T) => Promise<void>,
  onError?: (error: Error) => void
) {
  const [value, setValue] = useState(initialValue);
  const [pendingValue, setPendingValue] = useState<T | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const update = useCallback(async (newValue: T) => {
    const previousValue = value;
    setPendingValue(newValue);
    setValue(newValue);
    setIsUpdating(true);

    try {
      await onUpdate(newValue);
      setPendingValue(null);
    } catch (err) {
      setValue(previousValue);
      setPendingValue(null);
      onError?.(err instanceof Error ? err : new Error('Update failed'));
    } finally {
      setIsUpdating(false);
    }
  }, [value, onUpdate, onError]);

  return { value, update, isUpdating, pendingValue };
}

// ============================================================================
// useSavedPosts - Bookmark/Save posts functionality
// ============================================================================

interface UseSavedPostsReturn {
  savedPostIds: Set<string>;
  loading: boolean;
  error: string | null;
  toggleSave: (postId: string) => Promise<void>;
  isSaved: (postId: string) => boolean;
  refresh: () => Promise<void>;
}

export function useSavedPosts(userId: string): UseSavedPostsReturn {
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch saved post IDs
  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { savedPostsApi } = await import('../services/communityApi');
      const ids = await savedPostsApi.getSavedPostIds(userId);
      setSavedPostIds(ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved posts');
      console.error('[useSavedPosts] Error fetching saved posts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  // Subscribe to real-time updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { savedPostsApi } = await import('../services/communityApi');
      
      channelRef.current = savedPostsApi.subscribeSavedPosts(
        userId,
        (savedPost, eventType) => {
          if (eventType === 'INSERT') {
            setSavedPostIds(prev => new Set([...prev, savedPost.post_id]));
          } else if (eventType === 'DELETE') {
            setSavedPostIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(savedPost.post_id);
              return newSet;
            });
          }
        }
      );
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        realtime.unsubscribe(channelRef.current);
      }
    };
  }, [userId]);

  // Toggle save/unsave
  const toggleSave = useCallback(async (postId: string) => {
    const wasSaved = savedPostIds.has(postId);
    
    // Optimistic update
    setSavedPostIds(prev => {
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      const { savedPostsApi } = await import('../services/communityApi');
      await savedPostsApi.toggleSave(userId, postId);
    } catch (err) {
      // Revert on error
      setSavedPostIds(prev => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      console.error('[useSavedPosts] Error toggling save:', err);
      throw err;
    }
  }, [userId, savedPostIds]);

  const isSaved = useCallback((postId: string) => {
    return savedPostIds.has(postId);
  }, [savedPostIds]);

  return {
    savedPostIds,
    loading,
    error,
    toggleSave,
    isSaved,
    refresh: fetchSavedPosts,
  };
}

// ============================================================================
// useReportedPosts - Track posts user has reported
// ============================================================================

interface UseReportedPostsReturn {
  reportedPostIds: Set<string>;
  loading: boolean;
  error: string | null;
  hasReported: (postId: string) => boolean;
  addReport: (postId: string) => void;
  userReports: any[];
  refresh: () => Promise<void>;
}

export function useReportedPosts(userId: string): UseReportedPostsReturn {
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportedPosts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { reportingApi } = await import('../services/communityApi');
      const reports = await reportingApi.getUserReports(userId);
      
      const postIds = new Set(reports.map(r => r.post_id));
      setReportedPostIds(postIds);
      setUserReports(reports);
      setError(null);
    } catch (err) {
      console.error('[useReportedPosts] Error fetching reports:', err);
      setError('Failed to load reported posts');
      setReportedPostIds(new Set());
      setUserReports([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReportedPosts();
  }, [fetchReportedPosts]);

  const hasReported = useCallback((postId: string) => {
    return reportedPostIds.has(postId);
  }, [reportedPostIds]);

  const addReport = useCallback((postId: string) => {
    setReportedPostIds(prev => new Set([...prev, postId]));
  }, []);

  return {
    reportedPostIds,
    loading,
    error,
    hasReported,
    addReport,
    userReports,
    refresh: fetchReportedPosts,
  };
}

// ============================================================================
// useNotifications - Real-time notifications
// ============================================================================

interface UseNotificationsReturn {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { notificationsApi } = await import('../services/communityApi');
      const [notifs, count] = await Promise.all([
        notificationsApi.getNotifications(userId, 50),
        notificationsApi.getUnreadCount(userId),
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('[useNotifications] Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const setupSubscription = async () => {
      const { notificationsApi } = await import('../services/communityApi');
      
      channelRef.current = notificationsApi.subscribeToNotifications(
        userId,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      );
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { notificationsApi } = await import('../services/communityApi');
      await notificationsApi.markAsRead(id);
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { notificationsApi } = await import('../services/communityApi');
      await notificationsApi.markAllAsRead(userId);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { notificationsApi } = await import('../services/communityApi');
      await notificationsApi.deleteNotification(id);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n.id === id);
        return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('[useNotifications] Error deleting notification:', err);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
