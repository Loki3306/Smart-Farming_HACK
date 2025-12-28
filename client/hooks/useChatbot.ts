import { useState, useCallback, useRef } from 'react';
import { chatbotService, ChatMessage, ConversationContext } from '@/services/chatbotService';
import { useAuth } from '@/context/AuthContext';
import { useFarmContext } from '@/context/FarmContext';

interface UseChatbotOptions {
  initialMessages?: ChatMessage[];
  context?: ConversationContext;
}

export function useChatbot(options?: UseChatbotOptions) {
  const { user } = useAuth();
  const { sensorData } = useFarmContext();

  const [messages, setMessages] = useState<ChatMessage[]>(options?.initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const [healthMessage, setHealthMessage] = useState('');

  const contextRef = useRef<ConversationContext>(options?.context || {});

  // Update context
  const updateContext = useCallback((ctx: Partial<ConversationContext>) => {
    contextRef.current = { ...contextRef.current, ...ctx };
  }, []);

  // Get context string from farm data
  const getContextString = useCallback((): string => {
    let contextStr = '';

    // The FarmContext doesn't have crop/soilType directly on sensorData
    // For now, we'll skip this since FarmContext is structured differently
    // In a real implementation, you'd store this in FarmContext

    return contextStr;
  }, [sensorData]);

  // Check chatbot health on mount
  const checkHealth = useCallback(async () => {
    // For Hugging Face backend, always healthy if backend is up
    setIsHealthy(true);
    setHealthMessage('Chatbot ready!');
  }, []);

  // Send message without streaming (now delegates to streaming to ensure UI receives incremental chunks)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        message: content,
        timestamp: new Date().toISOString(),
        role: 'user',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      const assistantMessageId = `assistant_${Date.now()}`;
      let fullResponse = '';

      try {
        const contextString = getContextString();

        // Create placeholder for streaming assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            message: '',
            timestamp: new Date().toISOString(),
            role: 'assistant',
          },
        ]);

        // Stream response using the same streaming method
        await chatbotService.sendMessageStream(
          content,
          (chunk) => {
            fullResponse += chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessageId ? { ...m, message: fullResponse } : m))
            );
          },
          {
            userId: user?.id,
            crop: contextRef.current.crop,
            context: contextString,
            conversationHistory: messages.map((m) => ({ role: m.role, content: m.message })),
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);

        // Update error message in chat
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, message: `Sorry, I encountered an error: ${message}` }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, user?.id, getContextString]
  );

  // Send message with streaming
  const sendMessageStream = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        message: content,
        timestamp: new Date().toISOString(),
        role: 'user',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      const assistantMessageId = `assistant_${Date.now()}`;
      let fullResponse = '';

      try {
        const contextString = getContextString();

        // Create placeholder for streaming message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            message: '',
            timestamp: new Date().toISOString(),
            role: 'assistant',
          },
        ]);

        // Stream response
        await chatbotService.sendMessageStream(
          content,
          (chunk) => {
            fullResponse += chunk;
            // Update the streaming message in real-time
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, message: fullResponse } : m
              )
            );
          },
          {
            userId: user?.id,
            crop: contextRef.current.crop,
            context: contextString,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.message,
            })),
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get response';
        setError(message);

        // Update error message in chat
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  message: `Sorry, I encountered an error: ${message}. Please make sure Ollama is running.`,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, user?.id, getContextString]
  );

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    isHealthy,
    healthMessage,
    sendMessage,
    sendMessageStream,
    clearMessages,
    updateContext,
    checkHealth,
  };
}
