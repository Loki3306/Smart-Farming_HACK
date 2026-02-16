import { Router, Request, Response } from 'express';
<<<<<<< Updated upstream
=======
import { SmsNotificationService } from '../services/SmsNotificationService';
>>>>>>> Stashed changes
import { supabase } from '../db/supabase';

const router = Router();

<<<<<<< Updated upstream
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
=======
/**
 * POST /api/notifications/sms/call
 * Send SMS notification when someone tries to call
 */
router.post('/sms/call', async (req: Request, res: Response) => {
  try {
    const { recipientId, callerId, callType } = req.body;

    if (!recipientId || !callerId || !callType) {
      return res.status(400).json({
        success: false,
        error: 'recipientId, callerId, and callType are required'
      });
    }

    // Get recipient details
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('name, phone_number, sms_notifications_enabled')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Get caller details
    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', callerId)
      .single();

    if (callerError || !caller) {
      return res.status(404).json({
        success: false,
        error: 'Caller not found'
      });
    }

    // Check if SMS notifications are enabled
    if (!recipient.sms_notifications_enabled || !recipient.phone_number) {
      console.log(`[Notification] SMS disabled or no phone for user ${recipientId}`);
      return res.status(200).json({
        success: true,
        message: 'SMS notifications disabled for this user',
        sent: false
      });
    }

    // Send appropriate notification based on call type
    let sent = false;
    if (callType === 'voice') {
      sent = await SmsNotificationService.sendVoiceCallNotification(
        recipient.phone_number,
        caller.name,
        caller.phone_number
      );
    } else if (callType === 'video') {
      sent = await SmsNotificationService.sendVideoCallNotification(
        recipient.phone_number,
        caller.name,
        caller.phone_number
      );
    }

    return res.status(200).json({
      success: true,
      sent,
      message: sent ? 'SMS notification sent' : 'Failed to send SMS'
    });

  } catch (error: any) {
    console.error('[Notification] Error sending call notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
>>>>>>> Stashed changes
  }
});

/**
<<<<<<< Updated upstream
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
=======
 * POST /api/notifications/sms/message
 * Send SMS notification for new chat message
 */
router.post('/sms/message', async (req: Request, res: Response) => {
  try {
    const { recipientId, senderId, messagePreview } = req.body;

    if (!recipientId || !senderId || !messagePreview) {
      return res.status(400).json({
        success: false,
        error: 'recipientId, senderId, and messagePreview are required'
      });
    }

    // Get recipient details
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('name, phone_number, sms_notifications_enabled')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', senderId)
      .single();

    if (senderError || !sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found'
      });
    }

    // Check if SMS notifications are enabled
    if (!recipient.sms_notifications_enabled || !recipient.phone_number) {
      console.log(`[Notification] SMS disabled or no phone for user ${recipientId}`);
      return res.status(200).json({
        success: true,
        message: 'SMS notifications disabled for this user',
        sent: false
      });
    }

    // Send chat message notification
    const sent = await SmsNotificationService.sendChatMessageNotification(
      recipient.phone_number,
      sender.name,
      messagePreview
    );

    return res.status(200).json({
      success: true,
      sent,
      message: sent ? 'SMS notification sent' : 'Failed to send SMS'
    });

  } catch (error: any) {
    console.error('[Notification] Error sending message notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
>>>>>>> Stashed changes
  }
});

/**
<<<<<<< Updated upstream
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
=======
 * POST /api/notifications/sms/ai-recommendation
 * Send SMS notification for new AI recommendation
 */
router.post('/sms/ai-recommendation', async (req: Request, res: Response) => {
  try {
    const { userId, recommendationType, summary } = req.body;

    if (!userId || !recommendationType || !summary) {
      return res.status(400).json({
        success: false,
        error: 'userId, recommendationType, and summary are required'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, phone_number, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if SMS notifications are enabled
    if (!user.sms_notifications_enabled || !user.phone_number) {
      console.log(`[Notification] SMS disabled or no phone for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'SMS notifications disabled for this user',
        sent: false
      });
    }

    // Send AI recommendation notification
    const sent = await SmsNotificationService.sendAiRecommendationNotification(
      user.phone_number,
      user.name,
      recommendationType,
      summary
    );

    return res.status(200).json({
      success: true,
      sent,
      message: sent ? 'SMS notification sent' : 'Failed to send SMS'
    });

  } catch (error: any) {
    console.error('[Notification] Error sending AI recommendation notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications/sms/weather-alert
 * Send SMS notification for critical weather alerts
 */
router.post('/sms/weather-alert', async (req: Request, res: Response) => {
  try {
    const { userId, alertType, alertMessage } = req.body;

    if (!userId || !alertType || !alertMessage) {
      return res.status(400).json({
        success: false,
        error: 'userId, alertType, and alertMessage are required'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, phone_number, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if SMS notifications are enabled
    if (!user.sms_notifications_enabled || !user.phone_number) {
      console.log(`[Notification] SMS disabled or no phone for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'SMS notifications disabled for this user',
        sent: false
      });
    }

    // Send weather alert
    const sent = await SmsNotificationService.sendWeatherAlert(
      user.phone_number,
      user.name,
      alertType,
      alertMessage
    );

    return res.status(200).json({
      success: true,
      sent,
      message: sent ? 'SMS notification sent' : 'Failed to send SMS'
    });

  } catch (error: any) {
    console.error('[Notification] Error sending weather alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

/**
 * GET /api/notifications/preferences/:userId
 * Get user's notification preferences
 */
router.get('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('sms_notifications_enabled, phone_number, phone_verified')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      preferences: {
        smsEnabled: user.sms_notifications_enabled || false,
        phoneNumber: user.phone_number || null,
        phoneVerified: user.phone_verified || false
      }
    });

  } catch (error: any) {
    console.error('[Notification] Error fetching preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
      details: error.message
    });
  }
});

/**
 * PATCH /api/notifications/preferences/:userId
 * Update user's notification preferences
 */
router.patch('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { smsEnabled } = req.body;

    if (typeof smsEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'smsEnabled must be a boolean'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ sms_notifications_enabled: smsEnabled })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        smsEnabled: data.sms_notifications_enabled
      }
    });

  } catch (error: any) {
    console.error('[Notification] Error updating preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error.message
    });
>>>>>>> Stashed changes
  }
});

export default router;
