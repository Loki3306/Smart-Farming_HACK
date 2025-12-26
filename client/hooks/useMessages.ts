import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, Message } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const fetchMessages = useCallback(async (limit = 50, offset = 0) => {
    if (!conversationId || !user?.id || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const data = await chatService.getMessages(conversationId, user.id, limit, offset);
      
      if (offset === 0) {
        setMessages(data.reverse()); // Reverse to show oldest first
      } else {
        setMessages((prev) => [...data.reverse(), ...prev]);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [conversationId, user?.id, toast]);

  // Initial fetch - Removed fetchMessages from dependencies to prevent subscription churn
  useEffect(() => {
    if (conversationId && user?.id) {
      setMessages([]);
      setHasMore(true);
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribeNew = chatService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    const unsubscribeUpdate = chatService.subscribeToMessageUpdates(conversationId, (updatedMessage) => {
      setMessages((prev) => 
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, [conversationId]);

  // Auto-mark messages as read when they appear
  useEffect(() => {
    if (!conversationId || !user?.id || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) => !m.read && m.receiver_id === user.id
    );

    if (unreadMessages.length > 0) {
      // Mark conversation as read (marks all messages)
      chatService.markConversationRead(conversationId, user.id).catch(console.error);
    }
  }, [messages, conversationId, user?.id]);

  const sendMessage = useCallback(async (content: string, receiverId: string, imageUrl?: string) => {
    if (!conversationId || !user?.id || (!content.trim() && !imageUrl)) return;

    try {
      setIsSending(true);
      
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        image_url: imageUrl,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);

      // Send message
      const sentMessage = await chatService.sendMessage({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        image_url: imageUrl,
      });

      // Replace optimistic message with real one
      setMessages((prev) => 
        prev.map((m) => (m.id === tempId ? sentMessage : m))
      );
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      
      const message = err instanceof Error ? err.message : 'Failed to send message';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, user?.id, toast]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    try {
      await chatService.deleteMessage(messageId, user.id);
      
      // Optimistically remove message
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      
      toast({
        title: 'Success',
        description: 'Message deleted',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete message';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchMessages(50, messages.length);
    }
  }, [hasMore, isLoading, messages.length, fetchMessages]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    loadMore,
    refetch: () => fetchMessages(),
  };
}
