import { supabase } from '@/lib/supabase';

// =====================================================
// API NOTIFICATION TYPES
// =====================================================

export interface ApiNotification {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_phone: string;
  type: 'reaction' | 'comment' | 'reply' | 'mention' | 'share' | 'follow' | 'message' | 'recommendation';
  post_id?: string;
  comment_id?: string;
  message?: string;
  read: boolean;
  created_at: string;
  data?: any;
}

// =====================================================
// API NOTIFICATION SERVICE
// =====================================================

export const apiNotificationService = {
  async getNotifications(
    userId: string, 
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<ApiNotification[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options || {};
    
    const response = await fetch(
      `/api/notifications?user_id=${userId}&limit=${limit}&offset=${offset}&unread_only=${unreadOnly}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }

    const data = await response.json();
    return data.notifications;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const response = await fetch(`/api/notifications/count?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get notification count');
    }

    const data = await response.json();
    return data.count;
  },

  async markAsRead(notificationId: string, userId: string): Promise<ApiNotification> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark notification as read');
    }

    const data = await response.json();
    return data.notification;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark all as read');
    }

    const data = await response.json();
    return data.updated_count;
  },

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/notifications/${notificationId}?user_id=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete notification');
    }
  },

  async clearAll(userId: string): Promise<void> {
    const response = await fetch(`/api/notifications/clear-all?user_id=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear notifications');
    }
  },

  async createNotification(
    userId: string,
    actorId: string,
    type: ApiNotification['type'],
    message: string,
    postId?: string | null,
    commentId?: string | null,
    data?: any
  ): Promise<ApiNotification> {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        actor_id: actorId,
        type,
        message,
        post_id: postId,
        comment_id: commentId,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create notification');
    }

    const result = await response.json();
    return result.notification;
  },

  subscribeToNotifications(userId: string, callback: (notification: ApiNotification) => void) {
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
          const { data } = await supabase
            .from('notification_details')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data as ApiNotification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// Export individual functions for convenience
export const createNotification = apiNotificationService.createNotification.bind(apiNotificationService);
