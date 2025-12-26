import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStatusRef = useRef(false);

  // Subscribe to typing updates
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const unsubscribe = chatService.subscribeToTyping(conversationId, (isTyping, typingUserId) => {
      // Ignore own typing events
      if (typingUserId === user.id) return;

      setTypingUsers((prev) => {
        if (isTyping) {
          // Add user to typing list
          return prev.includes(typingUserId) ? prev : [...prev, typingUserId];
        } else {
          // Remove user from typing list
          return prev.filter((id) => id !== typingUserId);
        }
      });
    });

    return unsubscribe;
  }, [conversationId, user?.id]);

  // Update isTyping based on typingUsers
  useEffect(() => {
    setIsTyping(typingUsers.length > 0);
  }, [typingUsers]);

  const startTyping = useCallback(() => {
    if (!conversationId || !user?.id) return;

    // Send typing = true
    if (!lastTypingStatusRef.current) {
      chatService.updateTypingStatus(conversationId, user.id, true).catch(console.error);
      lastTypingStatusRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, user?.id]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !user?.id) return;

    // Send typing = false
    if (lastTypingStatusRef.current) {
      chatService.updateTypingStatus(conversationId, user.id, false).catch(console.error);
      lastTypingStatusRef.current = false;
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
  };
}
