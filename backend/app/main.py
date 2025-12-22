"""
FastAPI Entry Point for Autonomous Smart Irrigation & Fertilization System
Initializes Redis Pub/Sub, FastAPI app, and all agent modules
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.service_checker import check_all_services
from app.utils.mock_services import get_mock_redis
from app.agents.ingestor import start_mqtt_ingestor
from app.agents.meteorologist import start_meteorologist_listener
from app.agents.agronomist import start_agronomist_listener
from app.agents.auditor import start_auditor_listener
from app.agents.gatekeeper import router as gatekeeper_router
from app.api import fertilizer_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global Redis client (can be real Redis or MockRedis)
redis_client: Any = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown"""
    global redis_client
    
    # Startup
    logger.info("🚀 Starting Autonomous Farming System...")
    
    # Check standalone mode
    if settings.STANDALONE_MODE:
        logger.warning("⚡ Running in STANDALONE MODE (no external services required)")
    
    try:
        # Check service availability
        services = await check_all_services(settings)
        app.state.services = services
        
        # Initialize Redis (real or mock)
        if services.get("redis", False):
            import redis.asyncio as redis
            redis_client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await redis_client.ping()
            logger.info("✅ Using real Redis connection")
        else:
            redis_client = get_mock_redis()
            logger.info("✅ Using mock Redis (in-memory)")
        
        # Store redis client in app state
        app.state.redis = redis_client
        
        # Start all agent listeners
        asyncio.create_task(start_mqtt_ingestor(redis_client))
        asyncio.create_task(start_meteorologist_listener(redis_client))
        asyncio.create_task(start_agronomist_listener(redis_client))
        asyncio.create_task(start_auditor_listener(redis_client))
        
        logger.info("✅ All agents initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}")
        logger.info("💡 Tip: Set STANDALONE_MODE=True in .env to run without external services")
        raise
    
    finally:
        # Shutdown
        logger.info("🔄 Shutting down...")
        if redis_client and hasattr(redis_client, 'close'):
            try:
                await redis_client.close()
            except:
                pass
        logger.info("👋 Shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="Autonomous Smart Farming System",
    description="AI-driven irrigation & fertilization with blockchain audit trail",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket router from Gatekeeper agent
app.include_router(gatekeeper_router, prefix="/api")

# Include Fertilizer Recommendation API
app.include_router(fertilizer_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "operational",
        "system": "Autonomous Smart Farming System",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check of all services"""
    health_status = {
        "api": "healthy",
        "mode": "standalone" if settings.STANDALONE_MODE else "full",
        "services": app.state.services if hasattr(app.state, 'services') else {},
        "redis": "unknown",
        "agents": ["ingestor", "meteorologist", "agronomist", "auditor", "gatekeeper"]
    }
    
    try:
        if hasattr(redis_client, 'ping'):
            await redis_client.ping()
            health_status["redis"] = "healthy"
        else:
            health_status["redis"] = "mock (in-memory)"
    except Exception as e:
        health_status["redis"] = f"unhealthy: {str(e)}"
    
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
