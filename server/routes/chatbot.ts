import { Router, Request, Response } from 'express';

const router = Router();

// Provider selection: 'groq' or 'ollama' (default to 'groq' to disable Ollama by default)
const CHATBOT_PROVIDER = process.env.CHATBOT_PROVIDER || 'groq'; // 'groq' or 'ollama'

// Ollama endpoint (local or remote)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Default models for providers
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// ============================================================================
// AGRICULTURE CONTEXT & SYSTEM PROMPTS
// ============================================================================

const AGRICULTURE_SYSTEM_PROMPT = `You are an AI Assistant for Indian farmers. You provide practical, clear, and affordable farming advice.

Guidelines:
- Keep answers concise and easy to understand.
- Use Markdown formatting.
- Use numbered lists for steps or recommendations.
- Limit lists to a maximum of 4–5 points.
- Use **bold** for key terms only.
- Always complete the final point.
- End every response with a short concluding sentence.
- If space is limited, summarize instead of starting a new section.
- Never leave headings, bullet points, or sentences unfinished.

Context:
- Assume Indian farming conditions.
- Prefer low-cost and locally available solutions.
- Encourage consulting local experts when needed.
`;

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

// Maximum number of history messages we send to the model to bound prompt size
const MAX_HISTORY_MESSAGES = 6;

/**
 * Truncate conversation history to the last N messages
 */
function limitConversationHistory(history: ChatMessage[] = []): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Call Ollama API with streaming support
 */
async function callOllama(
  prompt: string,
  model: string = DEFAULT_OLLAMA_MODEL,
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
 * Call Groq cloud (OpenAI-compatible) for chat completions
 */
async function callGroq(messages: any[], model: string = DEFAULT_GROQ_MODEL): Promise<string> {
  try {
    console.log(`📤 Calling Groq model: ${model}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return (content || '').trim();
  } catch (error) {
    console.error('❌ Groq API error:', error);
    throw error;
  }
}

/**
 * Check if Groq is available (simple models list check)
 */
async function checkGroqAvailability(): Promise<boolean> {
  try {
    // Check if API key exists first
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found in environment');
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Groq API is available');
      return true;
    }
    
    console.error('❌ Groq API returned:', response.status, response.statusText);
    return false;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Groq availability check timed out');
    } else {
      console.error('❌ Groq not available:', error.message);
    }
    return false;
  }
}

/**
 * Get available models from the selected provider
 */
async function getAvailableModels(): Promise<string[]> {
  try {
    if (CHATBOT_PROVIDER === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Groq models');
      }

      const data = await response.json();
      return (data.data || []).map((m: any) => m.id || m.name).filter(Boolean);
    }

    // Fallback: Ollama
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error('Failed to fetch Ollama models');
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [CHATBOT_PROVIDER === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OLLAMA_MODEL];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [CHATBOT_PROVIDER === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OLLAMA_MODEL];
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

    // Check selected provider availability
    const isAvailable = CHATBOT_PROVIDER === 'groq' ? await checkGroqAvailability() : await checkOllamaAvailability();
    if (!isAvailable) {
      if (CHATBOT_PROVIDER === 'groq') {
        return res.status(503).json({
          error: 'AI chatbot service unavailable',
          message: 'Groq service unavailable or invalid API key; check GROQ_API_KEY',
          suggestion: 'Set GROQ_API_KEY and verify access in the Groq console',
        });
      }

      return res.status(503).json({
        error: 'AI chatbot service unavailable',
        message: 'Please ensure Ollama is running on ' + OLLAMA_URL,
        suggestion: `Run: ollama run ${DEFAULT_OLLAMA_MODEL}`,
      });
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(crop, context);

    console.log(`🤖 Processing message from user ${userId || 'anonymous'}`);

    let responseText = '';
    let modelToUse = CHATBOT_PROVIDER === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OLLAMA_MODEL;

    // Prepare messages for Groq (or fallback to prompt string for Ollama)
    if (CHATBOT_PROVIDER === 'groq') {
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      const trimmedHistory = limitConversationHistory(conversationHistory);

      for (const msg of trimmedHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
      messages.push({ role: 'user', content: message });

      responseText = await callGroq(messages, modelToUse);

      // Safety net: if response ends abruptly or seems incomplete, append a brief summary
      if (
        responseText &&
        (responseText.trim().endsWith("**") || responseText.trim().endsWith(":") || responseText.trim().endsWith("-"))
      ) {
        responseText += "\n\n**Summary:** Focus on practical steps, efficient resource use, and local conditions for best results.";
      }
    } else {
      let prompt = message;
      if (conversationHistory.length > 0) {
        prompt = buildConversationPrompt(conversationHistory, message);
      }

      responseText = await callOllama(prompt, modelToUse, systemPrompt);

      if (
        responseText &&
        (responseText.trim().endsWith("**") || responseText.trim().endsWith(":") || responseText.trim().endsWith("-"))
      ) {
        responseText += "\n\n**Summary:** Focus on practical steps, efficient resource use, and local conditions for best results.";
      }
    }

    // Generate response ID
    const responseId = `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const chatbotResponse: ChatbotResponse = {
      id: responseId,
      message: responseText,
      timestamp: new Date().toISOString(),
      model: modelToUse,
      sources: [CHATBOT_PROVIDER === 'groq' ? 'Groq Cloud' : 'Local AI Model (Ollama)'],
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
    const isAvailable = CHATBOT_PROVIDER === 'groq' ? await checkGroqAvailability() : await checkOllamaAvailability();
    const models = await getAvailableModels();

    res.json({
      status: isAvailable ? 'healthy' : 'unavailable',
      provider: CHATBOT_PROVIDER,
      default_model: CHATBOT_PROVIDER === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OLLAMA_MODEL,
      available_models: models,
      suggestion: isAvailable ? 'All good!' : (CHATBOT_PROVIDER === 'groq' ? 'Verify GROQ_API_KEY and network access' : `Start Ollama: ollama run ${DEFAULT_OLLAMA_MODEL}`),
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

    // Check selected provider availability
    const isAvailable = CHATBOT_PROVIDER === 'groq' ? await checkGroqAvailability() : await checkOllamaAvailability();
    if (!isAvailable) {
      // Instead of returning 503, send a helpful fallback message via stream
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const fallbackMsg = `I apologize, but the AI service is currently unavailable. This could be due to:\n\n` +
        `- Network connectivity issues\n` +
        `- API rate limits\n` +
        `- Service maintenance\n\n` +
        `Please try again in a few moments. For urgent farming advice, you can:\n` +
        `1. Check the Weather and Recommendations sections\n` +
        `2. Browse the Learning resources\n` +
        `3. Ask questions in the Community forum`;
      
      res.write(`data: ${JSON.stringify({ chunk: fallbackMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, error: 'service_unavailable' })}\n\n`);
      res.end();
      return;
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = buildSystemPrompt(crop, context);

    try {
      if (CHATBOT_PROVIDER === 'groq') {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        const trimmedHistory = limitConversationHistory(conversationHistory);

        for (const msg of trimmedHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: message });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: DEFAULT_GROQ_MODEL,
            messages,
            stream: true,
            temperature: 0.5,
            max_tokens: 300,
          }),
        });

        if (!response.ok) {
          res.write(`data: ${JSON.stringify({ error: 'Groq error' })}\n\n`);
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
        let streamCollected = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Before finishing, check if the accumulated stream looks incomplete and append a summary if needed
            const lastTrim = streamCollected.trim();
            if (lastTrim.endsWith('**') || lastTrim.endsWith(':') || lastTrim.endsWith('-')) {
              res.write(`data: ${JSON.stringify({ chunk: "\n\n**Summary:** Focus on practical steps, efficient resource use, and local conditions for best results." })}\n\n`);
            }

            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Groq sends SSE-like data lines starting with 'data:'
            const raw = line.startsWith('data:') ? line.replace(/^data:\s*/, '') : line;

            if (raw === '[DONE]') {
              // Provider signaled done; handled by 'done' above eventually
              continue;
            }

            try {
              const data = JSON.parse(raw);

              // Try to extract streamed delta content (OpenAI-like format)
              const delta = data.choices?.[0]?.delta;
              if (delta && delta.content) {
                const chunk = delta.content;
                streamCollected += chunk;
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                continue;
              }

              // Fallback: full message pieces
              const resp = data.choices?.[0]?.message?.content || data.response || data.text;
              if (resp) {
                streamCollected += resp;
                res.write(`data: ${JSON.stringify({ chunk: resp })}\n\n`);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }

          buffer = lines[lines.length - 1];
        }
      } else {
        // Ollama streaming (existing implementation)
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: DEFAULT_OLLAMA_MODEL,
            prompt: buildConversationPrompt(conversationHistory, message),
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
