# 🤖 AI CHATBOT FEATURE - SETUP GUIDE

## Overview

Your Smart Farming platform now has a **FREE, lightweight AI chatbot** powered by Ollama that provides instant support to farmers without any API costs.

### Key Features:
- ✅ **100% FREE** - No API costs, open-source
- ✅ **Offline Support** - Works even without internet (runs locally)
- ✅ **Lightweight** - Models as small as 2-3GB
- ✅ **Agriculture-Focused** - Pre-configured for farming advice
- ✅ **Real-time Streaming** - Type-effect for natural conversation
- ✅ **Context-Aware** - Adapts to user's crop, soil type, location
- ✅ **Floating Widget** - Always available on dashboard
- ✅ **Conversation Memory** - Remembers previous messages in session

---

## 🚀 Quick Start (5 minutes)

### Step 1: Download & Install Ollama

**Windows/Mac/Linux:**
1. Visit: https://ollama.ai
2. Download the installer for your OS
3. Install and launch Ollama

### Step 2: Start a Model

Open terminal/command prompt and run:

```bash
# Recommended: Fast and smart
ollama run mistral:7b

# OR: Lightweight (small GPU/CPU)
ollama run orca-mini:3b

# OR: Optimized for chat
ollama run neural-chat:7b
```

This downloads the model (~2-4GB) and starts the server on `http://localhost:11434`

### Step 3: Start Your Application

```bash
# Install dependencies (if not done)
npm install

# Start the development server
npm run dev
```

### Step 4: Use the Chatbot

- Navigate to any dashboard page
- Look for the floating green **Chat** button in bottom-right corner
- Click it to open the AI assistant
- Ask about farming!

---

## 📋 Available Models & Performance

### Lightweight Models (For CPU/Weak GPUs)

| Model | Size | Speed | Memory | Best For |
|-------|------|-------|--------|----------|
| **orca-mini:3b** | 2GB | ⚡⚡⚡ Fast | 4GB RAM | Simple Q&A, weak devices |
| **phi:latest** | 2.5GB | ⚡⚡⚡ Fast | 4GB RAM | Quick answers, low latency |
| **neural-chat:7b** | 4GB | ⚡⚡ Good | 8GB RAM | Chat-optimized, balanced |
| **mistral:7b** | 4GB | ⚡⚡ Good | 8GB RAM | Smart + fast (RECOMMENDED) |

### Standard Models (For Medium GPUs)

| Model | Size | Speed | Memory | Best For |
|-------|------|-------|--------|----------|
| **llama2:7b** | 4GB | ⚡⚡ Good | 8GB RAM | General knowledge |
| **llama2:13b** | 7GB | ⚡ Slower | 16GB RAM | Better responses |

### Powerful Models (For Strong GPUs)

| Model | Size | Speed | Memory | Best For |
|-------|------|-------|--------|----------|
| **mistral:latest** | 5GB | Medium | 12GB RAM | Best quality |
| **llama2:70b** | 40GB | Slow | 48GB RAM | Expert-level answers |

### Recommended for Farmers:
- **weak device** → `orca-mini:3b`
- **normal laptop** → `mistral:7b` ⭐
- **with GPU** → `mistral:latest` or `llama2:13b`

---

## 🔧 Configuration

### 1. Check Environment Variables

Create/Update `.env` file:

```bash
# Ollama server (change if running on different machine)
OLLAMA_URL=http://localhost:11434

# Model to use
OLLAMA_MODEL=mistral:7b
```

### 2. Remote Ollama Server

If running Ollama on a different machine (server):

```bash
# On the server machine, allow network access:
OLLAMA_HOST=0.0.0.0:11434 ollama run mistral:7b

# In your .env on client:
OLLAMA_URL=http://192.168.x.x:11434
```

### 3. Check Health Status

Visit this URL to verify chatbot is healthy:
```
http://localhost:5000/api/chatbot/health
```

You should see:
```json
{
  "status": "healthy",
  "ollama_url": "http://localhost:11434",
  "default_model": "mistral:7b",
  "available_models": ["mistral:7b"],
  "suggestion": "All good!"
}
```

---

## 💻 API Endpoints

### Send Message (Regular)
```
POST /api/chatbot/chat
Content-Type: application/json

{
  "message": "What should I do for wheat crops in winter?",
  "userId": "farmer_id",
  "crop": "wheat",
  "context": "North India, loamy soil, irrigated",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ]
}
```

Response:
```json
{
  "id": "chatbot_1234567890",
  "message": "For winter wheat in North India...",
  "timestamp": "2024-12-27T10:00:00Z",
  "model": "mistral:7b",
  "sources": ["Local AI Model (Ollama)"]
}
```

### Send Message with Streaming
```
POST /api/chatbot/chat-stream
```

Returns Server-Sent Events (SSE) stream:
```
data: {"chunk": "For "}
data: {"chunk": "winter "}
data: {"chunk": "wheat..."}
data: {"done": true}
```

### Check Health
```
GET /api/chatbot/health
```

### Get Available Models
```
GET /api/chatbot/models
```

---

## 🎯 Using the Chatbot Component

### In Dashboard (Already Integrated)

The chatbot is automatically available as a floating widget on all dashboard pages.

```tsx
// Already added in DashboardLayout.tsx
<Chatbot floating={true} compact={true} />
```

### Manual Integration

```tsx
import { Chatbot } from '@/components/chat/Chatbot';

export function MyPage() {
  return (
    <div>
      {/* Your content */}
      
      {/* Chatbot */}
      <Chatbot floating={true} onClose={() => console.log('closed')} />
    </div>
  );
}
```

### Using the Hook Directly

```tsx
import { useChatbot } from '@/hooks/useChatbot';

export function MyComponent() {
  const {
    messages,           // Array of ChatMessage
    isLoading,         // Boolean
    isStreaming,       // Boolean (for stream mode)
    error,             // Error message
    isHealthy,         // Is chatbot available
    sendMessage,       // Send without streaming
    sendMessageStream, // Send with streaming
    clearMessages,     // Clear chat history
    checkHealth,       // Check Ollama status
  } = useChatbot({
    context: {
      crop: 'wheat',
      soilType: 'loamy',
      season: 'winter',
    }
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <p>{msg.role === 'user' ? 'You' : 'Bot'}: {msg.message}</p>
        </div>
      ))}

      <button onClick={() => sendMessageStream('How do I prevent pest?')}>
        Ask AI
      </button>
    </div>
  );
}
```

---

## 🌾 Agriculture Prompts & Best Practices

### What the Chatbot Can Help With:

✅ **Crop Selection**
- "Which crop should I grow with clay soil?"
- "What crops are good for monsoon season?"

✅ **Irrigation**
- "How often should I water cotton?"
- "What irrigation methods are cost-effective?"

✅ **Fertilizer**
- "What NPK ratio for rice?"
- "How to make organic fertilizer?"

✅ **Pest Management**
- "How to identify and treat yellow leaf disease?"
- "Natural ways to control aphids?"

✅ **Soil Health**
- "Is my pH level good?"
- "How to improve soil quality?"

✅ **Cost Optimization**
- "How to reduce farming costs?"
- "What are cheap alternatives?"

✅ **Weather Adaptation**
- "What to do if heavy rain is coming?"
- "How to handle drought conditions?"

### Example Prompts:

```
"I'm growing wheat in North India with loamy soil. 
It's winter season and I'm seeing yellow spots on leaves. 
What could it be and how do I treat it?"

"My mung bean crop is getting small yields. 
Soil moisture is 45%, temperature is 28°C. 
What should I do?"

"I have 2 hectares and want to grow the most profitable 
crop this season. I have drip irrigation. 
What do you recommend?"
```

---

## ⚠️ Troubleshooting

### "Chatbot Unavailable" Error

**Problem:** See error "Ollama service not running"

**Solution:**
1. Make sure Ollama is running:
   ```bash
   ollama run mistral:7b
   ```
2. Check if running on correct port (default 11434)
3. Verify `.env` has correct `OLLAMA_URL`

### Slow Responses

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Model too large for CPU | Use smaller model: `orca-mini:3b` |
| First request slow | Normal (model loads into memory). Subsequent requests faster |
| Network latency | Keep Ollama on same machine or local network |
| Weak CPU/GPU | Use `phi` or `orca-mini` models |

### "Connection Refused" Error

**Problem:** Can't connect to Ollama

**Solution:**
```bash
# Make sure Ollama is running
ollama run mistral:7b

# Check it's accessible
curl http://localhost:11434/api/tags

# If remote server:
# Change OLLAMA_URL in .env to server IP
OLLAMA_URL=http://192.168.1.100:11434
```

### Model Not Found

**Problem:** Error "Model 'mistral:7b' not found"

**Solution:**
```bash
# List available models
ollama list

# Pull a model
ollama pull mistral:7b

# Or run it (auto-downloads)
ollama run mistral:7b
```

---

## 📊 Performance Metrics

### Expected Response Times:

| Model | First Response | Subsequent | Per Token |
|-------|---|---|---|
| orca-mini:3b | 5-10s | 1-3s | 50-100ms |
| mistral:7b | 8-15s | 2-5s | 80-150ms |
| llama2:13b | 15-25s | 5-10s | 150-300ms |

**Note:** First response slower because model loads into memory. Subsequent responses faster.

---

## 🔐 Privacy & Security

✅ **All Data Local**
- Ollama runs on your machine (not cloud)
- No data sent to external servers
- Completely private

✅ **Open Source**
- Ollama: https://github.com/ollama/ollama
- Models: Freely available

✅ **No Tracking**
- No analytics
- No user data collection

---

## 🚀 Advanced: Fine-tuning for Agriculture

Want to fine-tune the model on your farming data? (Advanced)

```bash
# Later tutorials will cover:
# 1. Create training data from forum posts
# 2. Fine-tune model on agriculture data
# 3. Deploy custom model
# 4. Update OLLAMA_MODEL in .env

# For now, base models work great for general farming advice
```

---

## 📚 Resources

- **Ollama Docs:** https://github.com/ollama/ollama
- **Available Models:** https://ollama.ai/library
- **Agriculture AI:** https://huggingface.co/models?task=text-generation&domain=agriculture

---

## 🎉 Summary

You now have:

✅ Free AI chatbot (no API costs)
✅ Works offline
✅ Agriculture-focused
✅ Lightweight and fast
✅ Context-aware responses
✅ Floating widget for farmers
✅ Streaming for natural chat
✅ Conversation memory
✅ Easy setup (download + run)

**Start farming with AI support today!** 🌾🤖

---

## 💡 Next Steps

1. **Download Ollama** from https://ollama.ai
2. **Run**: `ollama run mistral:7b`
3. **Start app**: `npm run dev`
4. **Click the chatbot** in dashboard
5. **Ask your questions!**

Happy farming! 🚜
