import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface Conversation {
  id: string;
  farmer_id: string;
  expert_id: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface CreateConversationRequest {
  farmer_id: string;
  expert_id: string;
}

interface SendMessageRequest {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
}

// =====================================================
// CONVERSATION ENDPOINTS
// =====================================================

/**
 * POST /api/chat/conversations/start
 * Start a new conversation or get existing one
 */
router.post('/conversations/start', async (req: Request, res: Response) => {
  try {
    const { farmer_id, expert_id }: CreateConversationRequest = req.body;

    if (!farmer_id || !expert_id) {
      return res.status(400).json({ 
        error: 'farmer_id and expert_id are required' 
      });
    }

    if (farmer_id === expert_id) {
      return res.status(400).json({ 
        error: 'Cannot create conversation with yourself' 
      });
    }

    // Try to find existing conversation
    const { data: existingConv, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(farmer_id.eq.${farmer_id},expert_id.eq.${expert_id}),and(farmer_id.eq.${expert_id},expert_id.eq.${farmer_id})`)
      .single();

    if (existingConv) {
      return res.json({ 
        conversation: existingConv,
        is_new: false 
      });
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{ farmer_id, expert_id }])
      .select()
      .single();

    if (createError) throw createError;

    res.status(201).json({ 
      conversation: newConv,
      is_new: true 
    });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: error.message || 'Failed to start conversation' });
  }
});

/**
 * GET /api/chat/conversations
 * Get all conversations for a user
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get conversations where user is participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(`farmer_id.eq.${user_id},expert_id.eq.${user_id}`)
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    // Get participant details and unread counts for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Determine the other participant
        const otherUserId = conv.farmer_id === user_id ? conv.expert_id : conv.farmer_id;

        // Get other user's details
        const { data: otherUser } = await supabase
          .from('farmers')
          .select('id, name, phone, email')
          .eq('id', otherUserId)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('receiver_id', user_id)
          .eq('read', false)
          .eq('deleted_by_receiver', false);

        return {
          ...conv,
          other_user: otherUser,
          unread_count: unreadCount || 0,
        };
      })
    );

    res.json({ conversations: conversationsWithDetails });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get conversation details by ID
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError) throw convError;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user is a participant
    if (conversation.farmer_id !== user_id && conversation.expert_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get other participant details
    const otherUserId = conversation.farmer_id === user_id ? conversation.expert_id : conversation.farmer_id;
    const { data: otherUser } = await supabase
      .from('farmers')
      .select('id, name, phone, email')
      .eq('id', otherUserId)
      .single();

    res.json({ 
      conversation: {
        ...conversation,
        other_user: otherUser,
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversation' });
  }
});

// =====================================================
// MESSAGE ENDPOINTS
// =====================================================

/**
 * GET /api/chat/conversations/:id/messages
 * Get messages in a conversation (with pagination)
 */
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, limit = '50', offset = '0' } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Verify user is a participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('farmer_id, expert_id')
      .eq('id', id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.farmer_id !== user_id && conversation.expert_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .not('deleted_by_sender', 'eq', true)
      .not('deleted_by_receiver', 'eq', true)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (messagesError) throw messagesError;

    res.json({ messages: messages || [] });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat/messages/send
 * Send a new message
 */
router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const { conversation_id, sender_id, receiver_id, content, image_url }: SendMessageRequest = req.body;

    if (!conversation_id || !sender_id || !receiver_id) {
      return res.status(400).json({ 
        error: 'conversation_id, sender_id, and receiver_id are required' 
      });
    }

    if (!content?.trim() && !image_url) {
      return res.status(400).json({ 
        error: 'Either content or image_url is required' 
      });
    }

    // Verify conversation exists and sender is a participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('farmer_id, expert_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.farmer_id !== sender_id && conversation.expert_id !== sender_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([{ 
        conversation_id, 
        sender_id, 
        receiver_id, 
        content: content?.trim() || '',
        image_url 
      }])
      .select()
      .single();

    if (messageError) throw messageError;

    // Create notification for receiver
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: receiver_id,
          actor_id: sender_id,
          type: 'message',
          message: `sent you a message: ${content?.substring(0, 50) || '[Image]'}`,
        }]);
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError);
      // Don't fail the message send if notification fails
    }

    res.status(201).json({ message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

/**
 * PUT /api/chat/messages/:id/read
 * Mark a message as read
 */
router.put('/messages/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Verify user is the receiver
    const { data: message } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiver_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark message as read' });
  }
});

/**
 * POST /api/chat/conversations/:id/mark-read
 * Mark all messages in conversation as read
 */
router.post('/conversations/:id/mark-read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Call database function
    const { data, error } = await supabase
      .rpc('mark_conversation_read', {
        p_conversation_id: id,
        p_user_id: user_id,
      });

    if (error) throw error;

    res.json({ success: true, updated_count: data });
  } catch (error: any) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark conversation as read' });
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Soft delete a message
 */
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get message
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Determine which field to update
    const updateField = message.sender_id === user_id 
      ? 'deleted_by_sender' 
      : message.receiver_id === user_id 
        ? 'deleted_by_receiver' 
        : null;

    if (!updateField) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('messages')
      .update({ [updateField]: true })
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
});

// =====================================================
// TYPING INDICATORS
// =====================================================

/**
 * POST /api/chat/conversations/:id/typing
 * Update typing status
 */
router.post('/conversations/:id/typing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, is_typing } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Verify user is a participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('farmer_id, expert_id')
      .eq('id', id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.farmer_id !== user_id && conversation.expert_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update typing indicator
    const { error: typingError } = await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: id,
        user_id,
        is_typing: is_typing ?? true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id'
      });

    if (typingError) throw typingError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating typing status:', error);
    res.status(500).json({ error: error.message || 'Failed to update typing status' });
  }
});

/**
 * GET /api/chat/conversations/:id/typing
 * Get typing status for conversation
 */
router.get('/conversations/:id/typing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get typing indicators (exclude current user, only active ones)
    const { data: indicators, error } = await supabase
      .from('typing_indicators')
      .select('user_id, is_typing, updated_at')
      .eq('conversation_id', id)
      .neq('user_id', user_id)
      .eq('is_typing', true)
      .gte('updated_at', new Date(Date.now() - 10000).toISOString()); // Last 10 seconds

    if (error) throw error;

    res.json({ 
      is_typing: (indicators || []).length > 0,
      typing_users: indicators || []
    });
  } catch (error: any) {
    console.error('Error fetching typing status:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch typing status' });
  }
});

// =====================================================
// STATISTICS
// =====================================================

/**
 * GET /api/chat/stats
 * Get chat statistics for a user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Get total unread count
    const { data: unreadCount, error: unreadError } = await supabase
      .rpc('get_unread_message_count', { p_user_id: user_id });

    if (unreadError) throw unreadError;

    // Get total conversations
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .or(`farmer_id.eq.${user_id},expert_id.eq.${user_id}`);

    res.json({
      unread_count: unreadCount || 0,
      conversation_count: conversationCount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat stats' });
  }
});

export default router;
