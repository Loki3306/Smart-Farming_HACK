from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

import json
import os
import re
from datetime import datetime
import httpx

router = APIRouter()
disease_router = APIRouter(prefix="/api/disease", tags=["disease"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama3-8b-8192"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

MAX_HISTORY_MESSAGES = 6


# In-memory conversation history (for demo; use persistent store for production)
conversation_histories = {}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # Optional session ID for tracking user conversation
    crop: Optional[str] = None
    context: Optional[str] = None
    conversationHistory: Optional[List[Dict]] = None


class DiseaseInfoRequest(BaseModel):
    crop: str
    disease: str
    confidence: Optional[float] = None
    language: Optional[str] = "en"


def _build_system_prompt(crop: Optional[str] = None, context: Optional[str] = None) -> str:
    prompt = (
        "You are a helpful AI assistant for Indian farmers. "
        "Provide practical, region-specific, and crop-specific advice in simple language."
    )
    if crop:
        prompt += f" Focus on crop: {crop}."
    if context:
        prompt += f" Additional context: {context}"
    return prompt


async def _groq_chat_completion(messages: List[Dict[str, str]], max_tokens: int = 300) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set")

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.4,
                "top_p": 0.9,
                "max_tokens": max_tokens,
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not text:
            raise RuntimeError("Groq returned empty response")
        return text.strip()


def _default_chat_reply(crop: Optional[str] = None) -> str:
    base = "I could not reach the AI service right now."
    if crop:
        return f"{base} For {crop}, please monitor moisture, check for visible pests, and follow local extension guidance."
    return f"{base} Please retry in a minute and continue regular field monitoring."


def _default_disease_tips(disease: str, crop: str) -> Dict[str, Any]:
    return {
        "symptoms": [
            f"Visible signs matching {disease}",
            "Leaf discoloration or spots",
            "Reduced plant vigor",
        ],
        "causes": [
            "High humidity or poor airflow",
            "Pathogen spread from infected material",
            "Stress due to water or nutrient imbalance",
        ],
        "treatments": [
            {"step": "Remove severely affected plant parts"},
            {"step": "Apply recommended crop-safe treatment as per local guidance"},
            {"step": "Adjust irrigation to avoid excess moisture"},
        ],
        "precautions": [
            "Sanitize tools after field work",
            "Inspect crop regularly for early spread",
            "Avoid overhead watering during humid periods",
        ],
        "uncertain": True,
    }


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


async def generate_ai_tips(disease: str, crop: str, language: str = "en") -> Dict[str, Any]:
    language_instructions = {
        "hi": "Respond in Hindi using Devanagari script.",
        "mr": "Respond in Marathi using Devanagari script.",
        "en": "Respond in English.",
    }
    lang_instruction = language_instructions.get(language, language_instructions["en"])

    user_prompt = (
        f"{lang_instruction} Return only valid JSON with keys: symptoms, causes, treatments, precautions. "
        "Use short practical points for farmers and low-cost actions where possible. "
        f"Crop: {crop}. Disease: {disease}. "
        "treatments must be an array of objects with key 'step' and optional 'details'."
    )

    messages = [
        {"role": "system", "content": "You are an agriculture expert for Indian farming conditions."},
        {"role": "user", "content": user_prompt},
    ]

    raw = await _groq_chat_completion(messages, max_tokens=500)
    parsed = _extract_json_object(raw)
    if parsed:
        return parsed
    raise RuntimeError("Groq returned non-JSON disease tips")




@router.post("/chat")
async def chat_with_groq(request: ChatRequest):
    """Conversational endpoint using Groq chat completions."""
    session_id = request.session_id or "default"
    history = conversation_histories.setdefault(session_id, [])

    if request.conversationHistory:
        for turn in request.conversationHistory[-MAX_HISTORY_MESSAGES:]:
            role = turn.get("role")
            content = turn.get("content")
            if role in {"user", "assistant", "system"} and isinstance(content, str) and content:
                history.append({"role": role, "content": content})

    history = history[-MAX_HISTORY_MESSAGES:]
    conversation_histories[session_id] = history

    messages = [{"role": "system", "content": _build_system_prompt(request.crop, request.context)}]
    messages.extend(history)
    messages.append({"role": "user", "content": request.message})

    model_name = GROQ_MODEL
    try:
        bot_reply = await _groq_chat_completion(messages)
    except Exception as exc:
        print(f"[Groq] chat error: {exc}")
        model_name = "fallback"
        bot_reply = _default_chat_reply(request.crop)

    conversation_histories[session_id].append({"role": "user", "content": request.message})
    conversation_histories[session_id].append({"role": "assistant", "content": bot_reply})
    conversation_histories[session_id] = conversation_histories[session_id][-MAX_HISTORY_MESSAGES:]

    return jsonable_encoder({
        "id": "groq-response",
        "message": bot_reply,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "role": "assistant",
        "model": model_name,
        "sources": [],
    })


@disease_router.post("/info")
async def disease_info(request: DiseaseInfoRequest):
    """Disease info endpoint backed by Groq with deterministic fallback."""
    try:
        tips = await generate_ai_tips(
            disease=request.disease,
            crop=request.crop,
            language=request.language or "en",
        )
        return jsonable_encoder({
            "parsed": True,
            "data": tips,
            "source": f"groq:{GROQ_MODEL}",
        })
    except Exception as exc:
        print(f"[Groq] disease/info error: {exc}")
        return jsonable_encoder({
            "parsed": True,
            "data": _default_disease_tips(request.disease, request.crop),
            "source": "fallback",
        })


# Streaming endpoint intentionally omitted in this minimal Groq migration.
