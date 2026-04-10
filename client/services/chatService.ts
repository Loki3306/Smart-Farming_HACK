import { getSocket } from "@/lib/socket";

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
  message_type?: "text" | "system" | "image";
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
  status: "online" | "away" | "offline";
  last_seen: string;
}

// =====================================================
// CHAT SERVICE
// =====================================================

export const chatService = {
  /**
   * Start a new conversation or get existing one
   */
  async startConversation(
    payload: CreateConversationPayload,
  ): Promise<{ conversation: Conversation; is_new: boolean }> {
    const response = await fetch("/api/chat/conversations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start conversation");
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
      throw new Error(error.error || "Failed to fetch conversations");
    }

    const data = await response.json();
    return data.conversations;
  },

  /**
   * Get conversation details by ID
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}?user_id=${userId}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch conversation");
    }

    const data = await response.json();
    return data.conversation;
  },

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/messages?user_id=${userId}&limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch messages");
    }

    const data = await response.json();
    return data.messages;
  },

  /**
   * Send a message
   */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await fetch("/api/chat/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send message");
    }

    const data = await response.json();
    return data.message;
  },

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/messages/${messageId}/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to mark message as read");
    }
  },

  /**
   * Mark all messages in conversation as read
   */
  async markConversationRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/mark-read`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to mark conversation as read");
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/messages/${messageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete message");
    }
  },

  /**
   * Update typing indicator
   */
  async updateTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/typing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, is_typing: isTyping }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update typing status");
    }
  },

  /**
   * Get typing status
   */
  async getTypingStatus(
    conversationId: string,
    userId: string,
  ): Promise<{ is_typing: boolean }> {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/typing?user_id=${userId}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch typing status");
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
      throw new Error(error.error || "Failed to fetch chat stats");
    }

    return response.json();
  },

  /**
   * Get list of online/active farmers
   */
  async getOnlineFarmers(currentUserId: string): Promise<OnlineFarmer[]> {
    try {
      const response = await fetch(`/api/chat/online-farmers?current_user_id=${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch online farmers");
      const data = await response.json();
      return data.farmers || [];
    } catch (error) {
      console.error("Failed to fetch online farmers:", error);
      return [];
    }
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void,
  ) {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("chat:subscribe", conversationId);

    const handler = (msg: Message) => {
      // Check if it's the current conversation
      if (msg.conversation_id === conversationId) {
          console.log("📨 New message received via realtime:", msg);
          callback(msg);
      }
    };
    
    socket.on("chat:message:new", handler);

    return () => {
      console.log(`🔌 Unsubscribing from messages:${conversationId}`);
      socket.off("chat:message:new", handler);
      socket.emit("chat:unsubscribe", conversationId);
    };
  },

  /**
   * Subscribe to message updates (read status, etc.)
   */
  subscribeToMessageUpdates(
    conversationId: string,
    callback: (message: Message) => void,
  ) {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    
    const handler = (msg: Message) => {
      if (msg.conversation_id === conversationId) {
        callback(msg);
      }
    };

    socket.on("chat:message:updated", handler);

    return () => {
      socket.off("chat:message:updated", handler);
    };
  },

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversations(
    userId: string,
    callback: (conversation: Conversation) => void,
  ) {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    
    // Server expects user to be joined to their own userId room for updates
    const handler = (conv: Conversation) => {
      callback(conv);
    };

    socket.on("chat:conversation:updated", handler);

    return () => {
      socket.off("chat:conversation:updated", handler);
    };
  },

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    conversationId: string,
    callback: (isTyping: boolean, userId: string) => void,
  ) {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    
    // Start listening on this conversation
    socket.emit("chat:typing:subscribe", conversationId);
    
    const handler = (payload: { is_typing: boolean, user_id: string, conversation_id: string }) => {
        if (payload.conversation_id === conversationId) {
            callback(payload.is_typing, payload.user_id);
        }
    };

    socket.on("chat:typing", handler);

    return () => {
      socket.off("chat:typing", handler);
      socket.emit("chat:typing:unsubscribe", conversationId);
    };
  },
};

export default chatService;
