/**
 * Chatbot Service
 * Communicates with backend chatbot API (Ollama)
 */

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: string;
  role: 'user' | 'assistant';
  model?: string;
  sources?: string[];
}

export interface ConversationContext {
  crop?: string;
  location?: string;
  season?: string;
  soilType?: string;
  language?: string;
}

export interface ChatbotServiceOptions {
  userId?: string;
  crop?: string;
  context?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  language?: string;
}

class ChatbotService {
  private baseUrl = '/api/chatbot';

  // Persist a session id per browser (used to track conversation history server-side)
  private getSessionId(): string {
    try {
      const key = 'chat_session_id';
      let sid = localStorage.getItem(key);
      if (!sid) {
        // Use crypto.randomUUID when available
        sid = (window.crypto && (window.crypto as any).randomUUID)
          ? (window.crypto as any).randomUUID()
          : `sess_${Date.now()}`;
        localStorage.setItem(key, sid);
      }
      return sid;
    } catch (e) {
      // Fallback
      return `sess_${Date.now()}`;
    }
  }

  /**
   * Send message to chatbot
   */
  async sendMessage(message: string, options?: ChatbotServiceOptions): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: options?.model || 'llama3',
          session_id: options?.userId || this.getSessionId(),
          crop: options?.crop,
          context: options?.context,
          language: options?.language,
          conversationHistory: options?.conversationHistory || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      return {
        id: data.id,
        message: data.message,
        timestamp: data.timestamp,
        role: 'assistant',
        model: data.model,
        sources: data.sources,
      };
    } catch (error) {
      console.error('Chatbot service error:', error);
      throw error;
    }
  }

  /**
   * Send message with streaming response
   */
  async sendMessageStream(
    message: string,
    onChunk: (chunk: string) => void,
    options?: ChatbotServiceOptions
  ): Promise<{ fullMessage: string; winningModel?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          crop: options?.crop,
          context: options?.context,
          language: options?.language,
          conversationHistory: options?.conversationHistory || [],
          session_id: options?.userId || this.getSessionId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullMessage = '';
      let winningModel: string | undefined;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          if (lines[i].startsWith('data: ')) {
            try {
              const data = JSON.parse(lines[i].slice(6));
              if (data.chunk) {
                fullMessage += data.chunk;
                onChunk(data.chunk);
              }
              if (data.model) {
                winningModel = data.model;
                console.log(`🏆 Winning model: ${winningModel}`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }

        // Keep incomplete line
        buffer = lines[lines.length - 1];
      }

      return { fullMessage, winningModel };
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    }
  }

  /**
   * Check chatbot health and availability
   */
  async checkHealth(): Promise<{
    status: string;
    provider?: string;
    ollama_url?: string;
    default_model: string;
    available_models: string[];
    suggestion: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Get models error:', error);
      return [];
    }
  }
}

export const chatbotService = new ChatbotService();
