import { useState, useEffect, useCallback } from 'react';
import { chatService, Conversation } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await chatService.getConversations(user.id);
      setConversations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = chatService.subscribeToConversations(user.id, (updatedConv) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === updatedConv.id);
        if (index >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[index] = { ...updated[index], ...updatedConv };
          return updated.sort((a, b) => 
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        } else {
          // Add new conversation
          return [updatedConv, ...prev];
        }
      });
    });

    return unsubscribe;
  }, [user?.id]);

  const startConversation = useCallback(async (farmerId: string, expertId: string) => {
    try {
      const { conversation } = await chatService.startConversation({ farmer_id: farmerId, expert_id: expertId });
      
      if (conversation) {
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversation.id);
          if (exists) return prev;
          return [conversation, ...prev];
        });
      }
      
      return conversation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
    startConversation,
  };
}
