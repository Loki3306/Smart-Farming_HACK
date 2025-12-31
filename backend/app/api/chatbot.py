from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict

import os
# Set environment variable to disable TensorFlow in transformers
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TORCH"] = "1"
import json
import asyncio
from datetime import datetime
# Hugging Face imports
from transformers import pipeline

router = APIRouter()

# Ollama config (disabled, backup)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
RACE_MODELS = [ "phi:latest"]  # Models to race

from transformers import pipeline
import os

# Hugging Face pipeline setup (conversational)
HF_MODEL = os.getenv("HF_MODEL", "microsoft/DialoGPT-small")
# Load tokenizer and model explicitly so we can set pad tokens / attention mask reliably
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from types import SimpleNamespace

def _make_result(text: str):
    r = SimpleNamespace()
    r.generated_responses = [text]
    return r

try:
    tokenizer = AutoTokenizer.from_pretrained(HF_MODEL)
    model = AutoModelForCausalLM.from_pretrained(HF_MODEL)
    # If tokenizer has no pad token, set it to eos token so padding and attention_mask work
    if tokenizer.pad_token is None and tokenizer.eos_token is not None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id
    # Ensure model config has pad_token_id set
    if getattr(model.config, "pad_token_id", None) is None:
        model.config.pad_token_id = model.config.eos_token_id

    # Define a small wrapper that behaves like the conversational pipeline (returns .generated_responses)
    def _hf_chat(conversation, max_new_tokens=150, do_sample=True, top_k=50, top_p=0.95):
        prompt = conversation.text if hasattr(conversation, "text") else str(conversation)
        inputs = tokenizer(prompt, return_tensors="pt")
        if torch.cuda.is_available():
            model.to("cuda")
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        outputs = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=do_sample, top_k=top_k, top_p=top_p)
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return _make_result(text)

    # Prefer the official conversational pipeline if available, otherwise use our wrapper
    try:
        chatbot = pipeline("conversational", model=model, tokenizer=tokenizer)
    except Exception:
        chatbot = _hf_chat

except Exception as e:
    # Fall back to a text-generation pipeline wrapper if explicit model/tokenizer fails
    print(f"[HF] Warning: failed to load HF model/tokenizer explicitly: {e}. Falling back to default pipeline behavior.")
    try:
        _txt_pipe = pipeline("text-generation", model=HF_MODEL)

        def _pipe_wrapper(conversation):
            prompt = conversation.text if hasattr(conversation, "text") else str(conversation)
            out = _txt_pipe(prompt, max_new_tokens=150)
            # pipeline returns list of dicts with 'generated_text'
            text = out[0].get("generated_text") if isinstance(out, list) and out else str(out)
            return _make_result(text)

        chatbot = _pipe_wrapper
    except Exception as e2:
        print(f"[HF] Error: failed to initialize any HF pipeline: {e2}. Falling back to a simple echo responder.")

        def _echo(conversation):
            prompt = conversation.text if hasattr(conversation, "text") else str(conversation)
            return _make_result("Sorry, the chatbot service is currently unavailable.")

        chatbot = _echo


# In-memory conversation history (for demo; use persistent store for production)
conversation_histories = {}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # Optional session ID for tracking user conversation
    crop: Optional[str] = None
    context: Optional[str] = None
    conversationHistory: Optional[List[Dict]] = None




@router.post("/chat")
async def chat_with_huggingface(request: ChatRequest):
    """Conversational endpoint using Hugging Face transformers (DialoGPT-small) with context and history."""
    try:
        model_name = "microsoft/DialoGPT-small"
        session_id = request.session_id or "default"
        # Debug log: show received session id and a preview of the message
        print(f"[HF] Received chat request - session_id={session_id}, message_preview={request.message[:100]!r}")
        # System context for farming assistant
        system_context = "You are a helpful AI assistant for Indian farmers. Provide practical, region-specific, and crop-specific advice in simple language."

        # Retrieve or initialize conversation history
        if session_id not in conversation_histories:
            conversation_histories[session_id] = []

        # Log incoming optional fields
        if request.crop:
            print(f"[HF] Received crop context: {request.crop}")
        if request.context:
            print(f"[HF] Received context: {request.context[:200]!r}")
        if request.conversationHistory:
            print(f"[HF] Received conversationHistory with {len(request.conversationHistory)} turns")

        # Merge provided conversationHistory into server-side history (avoid duplicates)
        if request.conversationHistory:
            for turn in request.conversationHistory:
                role = turn.get('role')
                content = turn.get('content')
                if not any(h.get('role') == role and h.get('content') == content for h in conversation_histories[session_id]):
                    conversation_histories[session_id].append({"role": role, "content": content})

        # Build conversation history for the pipeline
        from transformers import Conversation
        # Prepend system context as the first message if history is empty
        if not conversation_histories[session_id]:
            conversation_histories[session_id].append({"role": "system", "content": system_context})
        # Add the new user message
        conversation_histories[session_id].append({"role": "user", "content": request.message})

        # Build the conversation object
        conversation = Conversation(
            text=system_context + "\n" + "\n".join([
                ("User: " + m["content"]) if m["role"] == "user" else ("Assistant: " + m["content"]) for m in conversation_histories[session_id] if m["role"] != "system"
            ] + ["User: " + request.message])
        )
        result = chatbot(conversation)
        bot_reply = result.generated_responses[-1] if result.generated_responses else ""
        # Add assistant reply to history
        conversation_histories[session_id].append({"role": "assistant", "content": bot_reply})
        return {
            "id": "hf-response",
            "message": bot_reply,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "role": "assistant",
            "model": model_name,
            "sources": []
        }
    except Exception as e:
        print(f"[HF] Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hugging Face error: {str(e)}")


# Streaming endpoint with model racing
# Streaming endpoint with model racing (Ollama only, currently disabled)
# @router.post("/chat-stream")
# async def chat_with_ollama_stream(request: ChatRequest):
#     ...
