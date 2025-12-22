"""
Gatekeeper Agent - WebSocket Manager for Real-time Frontend Updates
Provides WebSocket endpoint for React frontend
Broadcasts all agent events and system status in real-time
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
import redis.asyncio as redis

from app.models import AgentStatus

logger = logging.getLogger(__name__)

# Router for WebSocket endpoints
router = APIRouter()

# Active WebSocket connections
active_connections: Set[WebSocket] = set()


class ConnectionManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"🔌 New WebSocket connection. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"🔌 WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message_json = json.dumps(message)
        
        # Send to all connections, remove dead ones
        dead_connections = set()
        
        for connection in self.active_connections:
            try:
                if connection.client_state == WebSocketState.CONNECTED:
                    await connection.send_text(message_json)
                else:
                    dead_connections.add(connection)
            except Exception as e:
                logger.error(f"❌ Error sending to WebSocket: {str(e)}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        for connection in dead_connections:
            self.disconnect(connection)
    
    async def send_personal(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json(message)
        except Exception as e:
            logger.error(f"❌ Error sending personal message: {str(e)}")


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    Frontend connects to: ws://localhost:8000/api/ws
    """
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await manager.send_personal({
            "type": "connection",
            "status": "connected",
            "message": "Connected to Smart Farming System",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive message from client (optional - for client commands)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client commands
                command = message.get("command")
                
                if command == "ping":
                    await manager.send_personal({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
                
                elif command == "get_status":
                    # Send current system status
                    await manager.send_personal({
                        "type": "system_status",
                        "agents": {
                            "ingestor": "active",
                            "meteorologist": "active",
                            "agronomist": "active",
                            "auditor": "active",
                            "gatekeeper": "active"
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                logger.warning("⚠️ Invalid JSON from WebSocket client")
            except Exception as e:
                logger.error(f"❌ WebSocket error: {str(e)}")
                break
    
    finally:
        manager.disconnect(websocket)


async def broadcast_event(event_type: str, data: dict):
    """Helper function to broadcast events to all connected clients"""
    message = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)


async def listen_to_redis_events(redis_client: redis.Redis):
    """
    Subscribe to all Redis event channels and broadcast to WebSocket clients
    """
    try:
        pubsub = redis_client.pubsub()
        
        # Subscribe to all event channels
        await pubsub.subscribe(
            "events:sensor_update",
            "events:environmental_context",
            "events:action_instruction",
            "events:blockchain_audit"
        )
        
        logger.info("👂 Gatekeeper listening to all event channels...")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    channel = message["channel"]
                    data = json.loads(message["data"])
                    
                    # Determine event type
                    event_type = channel.replace("events:", "")
                    
                    # Broadcast to all WebSocket clients
                    await broadcast_event(event_type, data)
                    
                    logger.debug(f"📡 Broadcasted {event_type} to {len(manager.active_connections)} clients")
                    
                except Exception as e:
                    logger.error(f"❌ Error broadcasting event: {str(e)}")
    
    except Exception as e:
        logger.error(f"❌ Redis subscription error in Gatekeeper: {str(e)}")


async def send_agent_heartbeat(redis_client: redis.Redis):
    """
    Periodically send agent status updates to connected clients
    """
    while True:
        try:
            await asyncio.sleep(30)  # Every 30 seconds
            
            if manager.active_connections:
                # Send heartbeat with agent status
                status_update = {
                    "type": "agent_heartbeat",
                    "agents": [
                        AgentStatus(
                            agent_name="Ingestor",
                            status="active",
                            last_activity=datetime.utcnow(),
                            message="Monitoring MQTT sensor data"
                        ).model_dump(),
                        AgentStatus(
                            agent_name="Meteorologist",
                            status="active",
                            last_activity=datetime.utcnow(),
                            message="Fetching environmental data"
                        ).model_dump(),
                        AgentStatus(
                            agent_name="Agronomist",
                            status="active",
                            last_activity=datetime.utcnow(),
                            message="Analyzing farm conditions"
                        ).model_dump(),
                        AgentStatus(
                            agent_name="Auditor",
                            status="active",
                            last_activity=datetime.utcnow(),
                            message="Logging to blockchain"
                        ).model_dump(),
                        AgentStatus(
                            agent_name="Gatekeeper",
                            status="active",
                            last_activity=datetime.utcnow(),
                            message=f"Broadcasting to {len(manager.active_connections)} clients"
                        ).model_dump()
                    ],
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await manager.broadcast(status_update)
        
        except Exception as e:
            logger.error(f"❌ Heartbeat error: {str(e)}")


async def start_gatekeeper_tasks(redis_client: redis.Redis):
    """Start all Gatekeeper background tasks"""
    await asyncio.gather(
        listen_to_redis_events(redis_client),
        send_agent_heartbeat(redis_client)
    )


# This function is called from main.py but doesn't block
async def start_gatekeeper_listener(redis_client: redis.Redis):
    """
    Initialize and start the Gatekeeper agent
    This runs as a background task in the FastAPI app
    """
    try:
        logger.info("🚀 Starting Gatekeeper Agent...")
        
        # Start all gatekeeper tasks
        await start_gatekeeper_tasks(redis_client)
        
    except Exception as e:
        logger.error(f"❌ Gatekeeper Agent failed: {str(e)}")
        raise


# Additional REST endpoints for frontend

@router.get("/agents/status")
async def get_agents_status():
    """Get current status of all agents"""
    return {
        "agents": [
            {
                "name": "Ingestor",
                "status": "active",
                "description": "MQTT sensor data ingestion"
            },
            {
                "name": "Meteorologist",
                "status": "active",
                "description": "Weather and satellite data collection"
            },
            {
                "name": "Agronomist",
                "status": "active",
                "description": "AI decision-making for farm management"
            },
            {
                "name": "Auditor",
                "status": "active",
                "description": "Blockchain audit trail logging"
            },
            {
                "name": "Gatekeeper",
                "status": "active",
                "description": f"WebSocket broadcasting ({len(manager.active_connections)} connections)"
            }
        ],
        "active_connections": len(manager.active_connections),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/system/metrics")
async def get_system_metrics():
    """Get system metrics and statistics"""
    return {
        "websocket_connections": len(manager.active_connections),
        "uptime": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }
