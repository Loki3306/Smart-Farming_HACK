import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Conversation {
  id: string;
  farmer_id: string;
  expert_id: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  farmer_id: string;
  expert_id: string;
}

export interface SendMessagePayload {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
}

export interface ChatStats {
  unread_count: number;
  conversation_count: number;
}

export interface OnlineFarmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
}

// =====================================================
// CHAT SERVICE
// =====================================================

export const chatService = {
  /**
   * Start a new conversation or get existing one
   */
  async startConversation(payload: CreateConversationPayload): Promise<{ conversation: Conversation; is_new: boolean }> {
    const response = await fetch('/api/chat/conversations/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start conversation');
    }

    return response.json();
  },

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const response = await fetch(`/api/chat/conversations?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch conversations');
    }

    const data = await response.json();
    return data.conversations;
  },

  /**
   * Get conversation details by ID
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const response = await fetch(`/api/chat/conversations/${conversationId}?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch conversation');
    }

    const data = await response.json();
    return data.conversation;
  },

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/messages?user_id=${userId}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    const data = await response.json();
    return data.messages;
  },

  /**
   * Send a message
   */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await fetch('/api/chat/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();
    return data.message;
  },

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/messages/${messageId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark message as read');
    }
  },

  /**
   * Mark all messages in conversation as read
   */
  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/conversations/${conversationId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark conversation as read');
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
  },

  /**
   * Update typing indicator
   */
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const response = await fetch(`/api/chat/conversations/${conversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_typing: isTyping }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update typing status');
    }
  },

  /**
   * Get typing status
   */
  async getTypingStatus(conversationId: string, userId: string): Promise<{ is_typing: boolean }> {
    const response = await fetch(`/api/chat/conversations/${conversationId}/typing?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch typing status');
    }

    return response.json();
  },

  /**
   * Get chat statistics
   */
  async getChatStats(userId: string): Promise<ChatStats> {
    const response = await fetch(`/api/chat/stats?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch chat stats');
    }

    return response.json();
  },

  /**
   * Get list of online/active farmers
   */
  async getOnlineFarmers(currentUserId: string): Promise<OnlineFarmer[]> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select(`
          id,
          name,
          phone,
          email,
          user_presence (
            status,
            last_seen
          )
        `)
        .neq('id', currentUserId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Map to OnlineFarmer format and sort by online status
      const farmers: OnlineFarmer[] = (data || []).map((farmer: any) => ({
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email,
        status: farmer.user_presence?.[0]?.status || 'offline',
        last_seen: farmer.user_presence?.[0]?.last_seen || new Date().toISOString(),
      }));

      // Sort by status (online first, then away, then offline) and then by name
      return farmers.sort((a, b) => {
        const statusOrder = { online: 0, away: 1, offline: 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to fetch online farmers:', error);
      return [];
    }
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('📨 New message received via realtime:', payload.new);
          callback(payload.new as Message);
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Messages subscription status for ${conversationId}:`, status);
      });

    return () => {
      console.log(`🔌 Unsubscribing from messages:${conversationId}`);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to message updates (read status, etc.)
   */
  subscribeToMessageUpdates(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`message-updates:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversations(userId: string, callback: (conversation: Conversation) => void) {
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `farmer_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Conversation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `expert_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Conversation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(conversationId: string, callback: (isTyping: boolean, userId: string) => void) {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          callback(payload.new.is_typing, payload.new.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default chatService;
