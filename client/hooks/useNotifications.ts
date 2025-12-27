import { useState, useEffect, useCallback } from 'react';
import { apiNotificationService, ApiNotification } from '@/services/apiNotificationService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound, vibrateDevice } from '@/services/NotificationService';
import { useSettings } from '@/context/SettingsContext';

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiNotificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await apiNotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user?.id]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await apiNotificationService.markAsRead(notificationId, user.id);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as read';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await apiNotificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await apiNotificationService.deleteNotification(notificationId, user.id);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Clear all
  const clearAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await apiNotificationService.clearAll(user.id);
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear notifications';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = apiNotificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Play sound and vibrate if enabled
        if (settings.notificationSound) {
          playNotificationSound();
        }
        if (settings.vibration) {
          vibrateDevice();
        }

        // Show toast notification
        toast({
          title: newNotification.actor_name,
          description: newNotification.message || getNotificationMessage(newNotification),
        });
      }
    );

    // Listen for immediate notification creation events
    const handleNotificationCreated = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notification-created', handleNotificationCreated);

    return () => {
      unsubscribe();
      window.removeEventListener('notification-created', handleNotificationCreated);
    };
  }, [user?.id, settings.notificationSound, settings.vibration, toast, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}

// Helper to generate notification message
function getNotificationMessage(notification: ApiNotification): string {
  switch (notification.type) {
    case 'reaction':
      return 'reacted to your post';
    case 'comment':
      return 'commented on your post';
    case 'reply':
      return 'replied to your comment';
    case 'mention':
      return 'mentioned you in a post';
    case 'share':
      return 'shared your post';
    case 'follow':
      return 'started following you';
    case 'message':
      return 'sent you a message';
    default:
      return 'interacted with you';
  }
}
