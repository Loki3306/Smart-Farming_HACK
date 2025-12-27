import { Router, Request, Response } from 'express';

const router = Router();

// Ollama endpoint (local or remote)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Default model - lightweight and fast
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b';

// ============================================================================
// AGRICULTURE CONTEXT & SYSTEM PROMPTS
// ============================================================================

const AGRICULTURE_SYSTEM_PROMPT = `You are an AI Assistant for Indian farmers. You provide helpful, practical advice on:
- Crop selection and rotation
- Irrigation and water management
- Fertilizer recommendations (organic and inorganic)
- Pest and disease management
- Soil health and treatment
- Weather adaptation
- Cost optimization
- Traditional and modern farming techniques

Always provide answers in a simple, easy-to-understand manner. Consider the Indian farming context.
Be encouraging and supportive. If unsure, suggest consulting with local agricultural experts.
Keep responses concise and practical.`;

// ============================================================================
// TYPES
// ============================================================================

interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  system?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatbotRequest {
  message: string;
  userId?: string;
  crop?: string;
  context?: string;
  conversationHistory?: ChatMessage[];
}

interface ChatbotResponse {
  id: string;
  message: string;
  sources?: string[];
  timestamp: string;
  model: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build context-aware system prompt based on user's farm
 */
function buildSystemPrompt(crop?: string, context?: string): string {
  let prompt = AGRICULTURE_SYSTEM_PROMPT;

  if (crop) {
    prompt += `\n\nThe farmer is growing: ${crop}. Tailor your advice accordingly.`;
  }

  if (context) {
    prompt += `\n\nAdditional context: ${context}`;
  }

  return prompt;
}

/**
 * Build conversation history as a prompt for the model
 */
function buildConversationPrompt(history: ChatMessage[], newMessage: string): string {
  let prompt = '';

  // Add conversation history
  for (const msg of history) {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }

  // Add new message
  prompt += `User: ${newMessage}\nAssistant:`;

  return prompt;
}

/**
 * Call Ollama API with streaming support
 */
async function callOllama(
  prompt: string,
  model: string = DEFAULT_MODEL,
  systemPrompt?: string
): Promise<string> {
  try {
    console.log(`📤 Calling Ollama model: ${model}`);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: systemPrompt,
        stream: false, // Set to false for simpler handling
        temperature: 0.7,
        top_p: 0.9,
      } as OllamaRequest),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error('No response from Ollama model');
    }

    return data.response.trim();
  } catch (error) {
    console.error('❌ Ollama API error:', error);
    throw error;
  }
}

/**
 * Check if Ollama is running and available
 */
async function checkOllamaAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('❌ Ollama not available:', error);
    return false;
  }
}

/**
 * Get available models from Ollama
 */
async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [DEFAULT_MODEL];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [DEFAULT_MODEL];
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/chatbot/chat
 * Send a message to the AI chatbot
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      userId,
      crop,
      context,
      conversationHistory = [],
    }: ChatbotRequest = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check Ollama availability
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      return res.status(503).json({
        error: 'AI chatbot service unavailable',
        message: 'Please ensure Ollama is running on ' + OLLAMA_URL,
        suggestion: 'Run: ollama run mistral:7b',
      });
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(crop, context);
    let prompt = message;

    // If conversation history provided, build conversation context
    if (conversationHistory.length > 0) {
      prompt = buildConversationPrompt(conversationHistory, message);
    }

    console.log(`🤖 Processing message from user ${userId || 'anonymous'}`);

    // Call Ollama
    const response = await callOllama(prompt, DEFAULT_MODEL, systemPrompt);

    // Generate response ID
    const responseId = `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const chatbotResponse: ChatbotResponse = {
      id: responseId,
      message: response,
      timestamp: new Date().toISOString(),
      model: DEFAULT_MODEL,
      sources: ['Local AI Model (Ollama)'],
    };

    res.json(chatbotResponse);
  } catch (error: any) {
    console.error('❌ Chatbot error:', error);

    // Check if it's Ollama unavailability
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'Ollama service not running',
        message: 'Please start Ollama: ollama run mistral:7b',
      });
    }

    res.status(500).json({
      error: error.message || 'Chatbot error',
      suggestion: 'Try again or check Ollama is running',
    });
  }
});

/**
 * GET /api/chatbot/health
 * Check chatbot service health and available models
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isAvailable = await checkOllamaAvailability();
    const models = await getAvailableModels();

    res.json({
      status: isAvailable ? 'healthy' : 'unavailable',
      ollama_url: OLLAMA_URL,
      default_model: DEFAULT_MODEL,
      available_models: models,
      suggestion: isAvailable ? 'All good!' : `Start Ollama: ollama run ${DEFAULT_MODEL}`,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/models
 * Get available models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await getAvailableModels();
    res.json({ models });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chatbot/chat-stream
 * Send a message with streaming response (for real-time chat)
 */
router.post('/chat-stream', async (req: Request, res: Response) => {
  try {
    const { message, crop, context, conversationHistory = [] }: ChatbotRequest = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check Ollama availability
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      return res.status(503).json({
        error: 'Ollama service unavailable',
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = buildSystemPrompt(crop, context);
    let prompt = message;

    if (conversationHistory.length > 0) {
      prompt = buildConversationPrompt(conversationHistory, message);
    }

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt,
          system: systemPrompt,
          stream: true, // Enable streaming
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: 'Ollama error' })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`);
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          try {
            const data = JSON.parse(lines[i]);
            if (data.response) {
              res.write(`data: ${JSON.stringify({ chunk: data.response })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
