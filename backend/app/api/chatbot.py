from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import os
import asyncio
import json

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
RACE_MODELS = [ "phi:latest"]  # Models to race

class ChatRequest(BaseModel):
    message: str
    model: str = OLLAMA_MODEL


@router.post("/chat")
async def chat_with_ollama(request: ChatRequest):
    """Non-streaming endpoint with model racing"""
    print(f"[Race] Starting race between models: {RACE_MODELS}")
    
    async def get_response(model: str):
        """Get response from a single model"""
        payload = {
            "model": model,
            "prompt": request.message,
            "stream": False
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return {
                "model": model,
                "message": data.get("response", ""),
                "data": data
            }
    
    try:
        # Race all models
        tasks = [get_response(model) for model in RACE_MODELS]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        
        # Get winner
        winner_task = list(done)[0]
        result = await winner_task
        
        print(f"[Race] 🏆 Winner: {result['model']}")
        
        # Cancel losing tasks
        for task in pending:
            task.cancel()
            print(f"[Race] ❌ Cancelled slower model")
        
        return {
            "id": "ollama-response",
            "message": result["message"],
            "timestamp": None,
            "role": "assistant",
            "model": result["model"],
            "sources": []
        }
    except Exception as e:
        print(f"[Race] Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")


# Streaming endpoint with model racing
@router.post("/chat-stream")
async def chat_with_ollama_stream(request: ChatRequest):
    print(f"[Race] Starting race between models: {RACE_MODELS}")
    
    async def race_stream_generator(model: str, message: str, winner_queue: asyncio.Queue):
        """Stream from a single model and send first chunk to winner queue"""
        payload = {
            "model": model,
            "prompt": message,
            "stream": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", f"{OLLAMA_URL}/api/generate", json=payload) as response:
                    first_chunk = True
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                chunk = data.get("response", "")
                                if chunk:
                                    if first_chunk:
                                        # First chunk received! Signal we're the winner
                                        await winner_queue.put(model)
                                        first_chunk = False
                                    yield chunk
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            print(f"[Race] Model {model} error: {e}")
            raise

    async def event_generator():
        winner_queue = asyncio.Queue()
        winner_model = None
        
        # Create racing tasks
        tasks = {}
        generators = {}
        
        for model in RACE_MODELS:
            gen = race_stream_generator(model, request.message, winner_queue)
            generators[model] = gen
            # Pre-consume one iteration to start the race
            tasks[model] = asyncio.create_task(gen.__anext__())
        
        try:
            # Wait for first chunk from any model
            done, pending = await asyncio.wait(
                tasks.values(),
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Find which task completed first
            for model, task in tasks.items():
                if task in done:
                    winner_model = model
                    first_chunk = await task
                    print(f"[Race] 🏆 Winner: {winner_model}")
                    
                    # Send winning model metadata
                    yield f"data: {{\"model\": \"{winner_model}\"}}\n\n"
                    
                    # Send first chunk
                    if first_chunk:
                        yield f"data: {{\"chunk\": {json.dumps(first_chunk)}}}\n\n"
                    
                    # Stream rest from winner
                    try:
                        async for chunk in generators[model]:
                            yield f"data: {{\"chunk\": {json.dumps(chunk)}}}\n\n"
                            await asyncio.sleep(0)
                    except StopAsyncIteration:
                        pass
                    break
            
            # Cancel all losing tasks
            for model, task in tasks.items():
                if model != winner_model and not task.done():
                    task.cancel()
                    print(f"[Race] ❌ Cancelled: {model}")
                    
        except Exception as e:
            print(f"[Race] Exception: {e}")
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
