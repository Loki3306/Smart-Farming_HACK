# 🤖 CHATBOT QUICK REFERENCE

## ⚡ Quick Start (Copy-Paste)

```bash
# 1. Download Ollama
# https://ollama.ai

# 2. Start model (in terminal)
ollama run mistral:7b

# 3. Start app (in another terminal)
npm run dev

# 4. Visit http://localhost:5173
# Click floating chat button (bottom-right corner)
```

---

## 🔌 API Quick Reference

### Send Message
```bash
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I grow?",
    "crop": "wheat",
    "context": "North India, loamy soil"
  }'
```

**Response:**
```json
{
  "id": "chatbot_12345",
  "message": "For North India with loamy soil...",
  "timestamp": "2024-12-27T10:00:00Z",
  "model": "mistral:7b"
}
```

### Check Health
```bash
curl http://localhost:5000/api/chatbot/health
```

---

## 💻 Component Usage

### In React
```tsx
import { Chatbot } from '@/components/chat/Chatbot';

// Already included in DashboardLayout!
// To use elsewhere:

export function MyPage() {
  return (
    <Chatbot floating={true} compact={true} />
  );
}
```

### Using Hook Directly
```tsx
import { useChatbot } from '@/hooks/useChatbot';

const MyComponent = () => {
  const { messages, sendMessageStream, error } = useChatbot();

  return (
    <button onClick={() => sendMessageStream('Question?')}>
      Ask AI
    </button>
  );
};
```

---

## 📝 Environment Variables

```bash
# .env file
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

---

## 🎯 Supported Models

### Lightweight (CPU-friendly)
```bash
ollama run orca-mini:3b    # 2GB, super fast
ollama run phi:latest       # 2.5GB, very fast
```

### Recommended (Balanced)
```bash
ollama run mistral:7b       # 4GB, smart + fast ⭐
ollama run neural-chat:7b   # 4GB, chat-optimized
```

### Powerful (GPU needed)
```bash
ollama run llama2:13b       # 7GB, better quality
ollama run mistral:latest   # 5GB, best quality
```

---

## ✅ Verification Checklist

- [ ] Ollama running (`ollama run mistral:7b`)
- [ ] `npm run dev` started
- [ ] Chatbot button visible (bottom-right)
- [ ] Can click and open chatbot
- [ ] Can type messages
- [ ] Messages appear in chat
- [ ] Responses streaming in real-time

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Chatbot offline" | Run `ollama run mistral:7b` |
| Slow response | Use smaller model: `orca-mini:3b` |
| Port conflict | Change OLLAMA_URL in .env |
| No streaming | Browser issue, try refresh |
| Out of memory | Use smaller model or close other apps |

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| First response | 5-15 seconds |
| Subsequent | 1-5 seconds |
| Streaming speed | 50-150ms per token |
| Memory per request | 4GB for mistral:7b |
| Concurrent users (single machine) | 2-5 |

---

## 🔐 Data Privacy

✅ **All local** - No cloud uploads  
✅ **No tracking** - No analytics  
✅ **Open source** - See code anytime  
✅ **Full control** - Run on your machine  

---

## 📚 Files Overview

```
Smart-Farming_HACK/
├── server/routes/chatbot.ts
│   └── API endpoints for AI
├── client/
│   ├── services/chatbotService.ts
│   │   └── API client methods
│   ├── hooks/useChatbot.ts
│   │   └── State management hook
│   └── components/chat/Chatbot.tsx
│       └── UI component
├── CHATBOT_SETUP_GUIDE.md
│   └── Complete setup instructions
├── CHATBOT_FARMING_PROMPTS.md
│   └── 200+ example questions
├── FREE_AI_ALTERNATIVES.md
│   └── Other free solutions
└── CHATBOT_IMPLEMENTATION_SUMMARY.md
    └── This summary
```

---

## 🎓 Example Prompts

```
"I'm growing wheat with clay loam soil in Punjab. 
Moisture is 50%. Should I irrigate?"

"My rice has yellow leaves. What disease is it?"

"What's the most profitable crop to grow?"

"How to prevent pest damage naturally?"

"I have ₹50,000 budget. What should I grow?"
```

---

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

Ollama must be running on:
- Same machine, or
- Network-accessible server (set OLLAMA_URL)

---

## 🔗 Useful Links

- **Ollama Models**: https://ollama.ai/library
- **Ollama GitHub**: https://github.com/ollama/ollama
- **Setup Guide**: See `CHATBOT_SETUP_GUIDE.md`
- **Alternatives**: See `FREE_AI_ALTERNATIVES.md`
- **Farm Questions**: See `CHATBOT_FARMING_PROMPTS.md`

---

## 💡 Tips for Best Results

1. **Be specific** with crop type and location
2. **Include symptoms** if asking about problems
3. **Mention constraints** (budget, equipment, water)
4. **Ask follow-ups** - chatbot remembers context
5. **Try different phrasings** if unclear answer

---

## 🎯 What You Get

✅ Free forever  
✅ Works offline  
✅ No rate limits  
✅ Data private  
✅ Agriculture-focused  
✅ Always available  
✅ Real-time streaming  
✅ Context aware  
✅ Easy to use  
✅ No coding required for farmers  

---

**Happy Farming! 🌾🤖**

Need help? Check the setup guide or refer to documentation files.
