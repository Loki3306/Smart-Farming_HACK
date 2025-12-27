import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// =====================================================
// NOTIFICATION ENDPOINTS
// =====================================================

/**
 * GET /api/notifications
 * Get all notifications for a user with actor details
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, offset = 0, unread_only } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    let query = supabase
      .from('notification_details')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    res.json({ notifications: notifications || [] });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/count
 * Get unread notification count
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { p_user_id: user_id });

    if (error) throw error;

    res.json({ count: data || 0 });
  } catch (error: any) {
    console.error('Error getting notification count:', error);
    res.status(500).json({ error: error.message || 'Failed to get notification count' });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, actor_id, type, message, post_id, comment_id, data: notificationData } = req.body;

    if (!user_id || !type || !message) {
      return res.status(400).json({ error: 'user_id, type, and message are required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        actor_id: actor_id || 'system',
        type,
        message,
        post_id: post_id || null,
        comment_id: comment_id || null,
        data: notificationData || null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ notification: data });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message || 'Failed to create notification' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: data });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for a user
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .rpc('mark_all_notifications_read', { p_user_id: user_id });

    if (error) throw error;

    res.json({ updated_count: data || 0 });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for a user
 */
router.delete('/clear-all', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to clear notifications' });
  }
});

export default router;
