"""
FastAPI Router for IoT Irrigation System
Handles WebSocket connections and MQTT integration
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

from .models import SensorData, IrrigationCommand, ActuationCommand
from .mqtt_client import MQTTIoTClient

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/iot", tags=["IoT Irrigation"])

# Farm ID mapping: MQTT farm_id -> Frontend UUID
# This allows MQTT to use simple IDs while frontend uses UUIDs
FARM_ID_MAPPING = {
    "farm_001": "80ac1084-67f8-4d05-ba21-68e3201213a8",
    "farm_002": "farm_002",  # Add more mappings as needed
}

def map_farm_id(mqtt_farm_id: str) -> str:
    """Map MQTT farm_id to frontend UUID"""
    return FARM_ID_MAPPING.get(mqtt_farm_id, mqtt_farm_id)

def reverse_map_farm_id(frontend_id: str) -> str:
    """Map frontend UUID back to MQTT farm_id"""
    for mqtt_id, frontend_id_mapped in FARM_ID_MAPPING.items():
        if frontend_id_mapped == frontend_id:
            return mqtt_id
    return frontend_id

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time sensor data broadcasting"""

    def __init__(self):
        # farm_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, farm_id: str):
        """Accept and register a new WebSocket connection"""
        try:
            await websocket.accept()
            async with self.lock:
                if farm_id not in self.active_connections:
                    self.active_connections[farm_id] = set()
                self.active_connections[farm_id].add(websocket)
            logger.info(f"✅ WebSocket connected for farm: {farm_id}. Total: {len(self.active_connections[farm_id])}")
        except Exception as e:
            logger.error(f"❌ Error accepting WebSocket connection: {e}")
            raise

    async def disconnect(self, websocket: WebSocket, farm_id: str):
        """Remove a WebSocket connection"""
        async with self.lock:
            if farm_id in self.active_connections:
                self.active_connections[farm_id].discard(websocket)
                if not self.active_connections[farm_id]:
                    del self.active_connections[farm_id]
        logger.info(f"❌ WebSocket disconnected for farm: {farm_id}")

    async def broadcast(self, farm_id: str, message: dict):
        """
        Broadcast message to all connected clients for a farm
        Handles RuntimeError and connection errors gracefully
        """
        if farm_id not in self.active_connections:
            logger.debug(f"No active connections for farm: {farm_id}")
            return

        disconnected = set()
        async with self.lock:
            connections = list(self.active_connections.get(farm_id, set()))
        
        for connection in connections:
            try:
                # Check if connection is still open
                if connection.client_state.name == "CONNECTED":
                    await connection.send_json(message)
                else:
                    disconnected.add(connection)
            except RuntimeError as e:
                # Handle "Unexpected ASGI message" errors
                logger.warning(f"RuntimeError during broadcast: {e}")
                disconnected.add(connection)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                disconnected.add(connection)

        # Clean up disconnected clients
        if disconnected:
            async with self.lock:
                if farm_id in self.active_connections:
                    self.active_connections[farm_id] -= disconnected
                    logger.info(f"Cleaned up {len(disconnected)} disconnected WebSocket(s) for farm: {farm_id}")

    def get_connection_count(self, farm_id: str) -> int:
        """Get number of active connections for a farm"""
        return len(self.active_connections.get(farm_id, set()))


# Global instances
manager = ConnectionManager()
mqtt_client: MQTTIoTClient = None

# Event loop for async tasks (set during startup)
event_loop: asyncio.AbstractEventLoop = None

# In-memory storage for latest sensor data (per farm)
latest_sensor_data: Dict[str, SensorData] = {}

# Database throttling
last_db_write: Dict[str, datetime] = {}
DB_WRITE_INTERVAL_SECONDS = 30  # Write to DB every 30 seconds
WS_BROADCAST_INTERVAL_SECONDS = 3  # Broadcast to WebSocket every 3 seconds

# Broadcast throttling
last_ws_broadcast: Dict[str, datetime] = {}


async def handle_sensor_data(sensor_data: SensorData):
    """
    Process incoming sensor data from MQTT
    - Store in memory
    - Throttle database writes (every 30s)
    - Broadcast to WebSocket clients (every 3s)
    - Evaluate irrigation logic
    """
    mqtt_farm_id = sensor_data.farm_id or "default"
    frontend_farm_id = map_farm_id(mqtt_farm_id)  # Map to frontend UUID
    now = datetime.utcnow()
    
    # ========== TESTING: PRINT RECEIVED VALUES ==========
    print("\n" + "="*70)
    print(f"🔔 MQTT MESSAGE RECEIVED - {now.strftime('%H:%M:%S')}")
    print("="*70)
    print(f"📍 MQTT Farm ID:   {mqtt_farm_id}")
    print(f"📍 Frontend ID:    {frontend_farm_id}")
    print(f"💧 Moisture:       {sensor_data.moisture}%")
    print(f"🌡️  Temperature:    {sensor_data.temp}°C")
    print(f"💨 Humidity:       {sensor_data.humidity}%")
    print(f"🟢 NPK Raw:        {sensor_data.npk}")
    
    # Advanced Sensors (if present)
    if sensor_data.ec_salinity:
        print(f"🧂 Salinity (EC):   {sensor_data.ec_salinity} dS/m")
    if sensor_data.wind_speed:
        print(f"🌬️  Wind Speed:     {sensor_data.wind_speed} km/h")
    if sensor_data.soil_ph:
        print(f"🧪 Soil pH:        {sensor_data.soil_ph}")
        
    print(f"⏰ Timestamp:      {sensor_data.timestamp}")
    print("="*70 + "\n")
    # ====================================================

    # Store latest data in memory (use both IDs for compatibility)
    latest_sensor_data[mqtt_farm_id] = sensor_data
    latest_sensor_data[frontend_farm_id] = sensor_data

    # Throttled database write (every 30 seconds)
    should_write_db = (
        mqtt_farm_id not in last_db_write or
        (now - last_db_write[mqtt_farm_id]).total_seconds() >= DB_WRITE_INTERVAL_SECONDS
    )

    if should_write_db:
        await store_sensor_data_to_db(sensor_data)
        last_db_write[mqtt_farm_id] = now

    # Throttled WebSocket broadcast (every 3 seconds for "live" feel)
    # DEMO CHANGE: Broadcast EVERY message for instant feedback
    should_broadcast = True
    
    if should_broadcast:
        broadcast_message = {
            "type": "sensor_update",
            "data": sensor_data.model_dump(),
            "timestamp": now.isoformat()
        }
        
        # Debug connections
        logger.info(f"🔍 Active connections keys: {list(manager.active_connections.keys())}")
        
        # Broadcast to frontend UUID (primary)
        logger.info(f"📤 Broadcasting to {frontend_farm_id}...")
        await manager.broadcast(frontend_farm_id, broadcast_message)
        
        # Also broadcast to MQTT ID (for backward compatibility)
        if mqtt_farm_id != frontend_farm_id:
            await manager.broadcast(mqtt_farm_id, broadcast_message)
        
        last_ws_broadcast[mqtt_farm_id] = now



    # Evaluate irrigation logic (non-blocking)
    # Use event loop to schedule task from MQTT thread
    if event_loop and event_loop.is_running():
        asyncio.run_coroutine_threadsafe(evaluate_irrigation_logic(sensor_data), event_loop)
    
    # Advanced Agronomy Analysis (Precision Agriculture 4.0)
    if event_loop and event_loop.is_running():
        asyncio.run_coroutine_threadsafe(evaluate_agronomy_logic(sensor_data), event_loop)
    else:
        # Fallback: run synchronously if no event loop
        await evaluate_irrigation_logic(sensor_data)


async def store_sensor_data_to_db(sensor_data: SensorData):
    """
    Store sensor data to Supabase (or time-series DB)
    This is throttled to prevent rate-limiting
    """
    try:
        # TODO: Implement Supabase storage
        # For now, just log
        logger.info(f"💾 [DB Write] Farm: {sensor_data.farm_id}, Moisture: {sensor_data.moisture}%, Temp: {sensor_data.temp}°C")
        
        # Example Supabase integration:
        # from supabase import create_client
        # supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        # supabase.table("sensor_logs").insert({
        #     "farm_id": sensor_data.farm_id,
        #     "moisture": sensor_data.moisture,
        #     "temp": sensor_data.temp,
        #     "humidity": sensor_data.humidity,
        #     "npk": sensor_data.npk,
        #     "timestamp": sensor_data.timestamp or datetime.utcnow().isoformat()
        # }).execute()

    except Exception as e:
        logger.error(f"❌ Failed to store sensor data to DB: {e}")


async def evaluate_irrigation_logic(sensor_data: SensorData):
    """
    Evaluate if irrigation is needed based on sensor data
    Trigger WATER_ON command if moisture < 35%
    """
    try:
        if sensor_data.moisture < 35:
            logger.warning(f"🚨 LOW MOISTURE ALERT: {sensor_data.moisture}% for farm {sensor_data.farm_id}")
            
            # Publish WATER_ON command
            if mqtt_client and mqtt_client.is_connected:
                success = mqtt_client.publish_command("WATER_ON", sensor_data.farm_id)
                if success:
                    logger.info(f"💧 Irrigation triggered for farm {sensor_data.farm_id}")
                    
                    # Broadcast irrigation event to WebSocket clients
                    await manager.broadcast(sensor_data.farm_id, {
                        "type": "irrigation_triggered",
                        "reason": f"Low moisture detected: {sensor_data.moisture}%",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Send alert notification
                    await manager.broadcast(sensor_data.farm_id, {
                        "type": "notification",
                        "level": "info",
                        "message": f"Irrigation started. Soil moisture is low ({sensor_data.moisture}%).",
                        "timestamp": datetime.utcnow().isoformat()
                    })
            else:
                logger.warning("⚠️ MQTT not connected. Cannot trigger irrigation.")

    except Exception as e:
        logger.error(f"❌ Error in irrigation logic: {e}")


async def evaluate_agronomy_logic(sensor_data: SensorData):
    """
    Advanced agronomic analysis (Precision Agriculture 4.0)
    - Salinity stress monitoring
    - Wind safety checks
    - Nutrient availability assessment
    """
    try:
        from app.agents.agronomy_expert import agronomy_expert
        
        # Check if advanced sensors are available
        has_ec = sensor_data.ec_salinity is not None
        has_wind = sensor_data.wind_speed is not None
        has_ph = sensor_data.soil_ph is not None
        
        if not (has_ec or has_wind or has_ph):
            return  # No advanced sensors, skip analysis
        
        # Salinity stress analysis
        if has_ec and has_ph:
            should_leach, leach_params = agronomy_expert.should_trigger_leaching(
                sensor_data.ec_salinity,
                crop_type="wheat"  # TODO: Get from farm config
            )
            
            if should_leach:
                logger.warning(
                    f"🚨 SALINITY STRESS DETECTED! EC: {sensor_data.ec_salinity} dS/m. "
                    f"Triggering leaching cycle..."
                )
                
                # Trigger leaching cycle
                if mqtt_client and mqtt_client.is_connected:
                    success = mqtt_client.publish_command(
                        leach_params["command"],
                        sensor_data.farm_id
                    )
                    
                    if success:
                        logger.info(f"💧 Leaching cycle triggered for farm {sensor_data.farm_id}")
                        
                        # Broadcast leaching event
                        await manager.broadcast(sensor_data.farm_id, {
                            "type": "leaching_triggered",
                            "reason": leach_params["reason"],
                            "ec_measured": leach_params["ec_measured"],
                            "leaching_requirement": leach_params["leaching_requirement"],
                            "duration_seconds": leach_params["duration_seconds"],
                            "timestamp": datetime.utcnow().isoformat()
                        })

                        # Send alert notification
                        await manager.broadcast(sensor_data.farm_id, {
                            "type": "notification",
                            "level": "error",
                            "message": f"Critical Salinity (EC {sensor_data.ec_salinity} dS/m). Leaching cycle triggered.",
                            "timestamp": datetime.utcnow().isoformat()
                        })
        
        # Wind safety check
        if has_wind:
            wind_safety = agronomy_expert.engine.check_wind_safety(sensor_data.wind_speed)
            
            if not wind_safety["is_safe_for_spraying"]:
                logger.warning(
                    f"⚠️ WIND SAFETY ALERT: {sensor_data.wind_speed} km/h. "
                    f"Chemical application blocked. Risk: {wind_safety['risk_level']}"
                )
                
                # Broadcast wind safety alert
                await manager.broadcast(sensor_data.farm_id, {
                    "type": "wind_safety_alert",
                    "wind_speed": sensor_data.wind_speed,
                    "risk_level": wind_safety["risk_level"],
                    "blocked_operations": wind_safety["blocked_operations"],
                    "timestamp": datetime.utcnow().isoformat()
                })

                # Send alert notification
                await manager.broadcast(sensor_data.farm_id, {
                    "type": "notification",
                    "level": "warning",
                    "message": f"High Wind ({sensor_data.wind_speed} km/h). Spraying operations blocked.",
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Get comprehensive analysis
        if has_ec or has_wind or has_ph:
            try:
                # logger.info("🔍 Running comprehensive agronomy analysis...")
                analysis = agronomy_expert.get_comprehensive_analysis(
                    ec_salinity=sensor_data.ec_salinity,
                    wind_speed=sensor_data.wind_speed,
                    ph=sensor_data.soil_ph,
                    temperature=sensor_data.temp,
                    humidity=sensor_data.humidity,
                    moisture=sensor_data.moisture
                )
                
                # Flatten recommendations for frontend
                recommendations = []
                try:
                    if "soil_health" in analysis and "recommendations" in analysis["soil_health"]:
                        for rec in analysis["soil_health"]["recommendations"]:
                            if isinstance(rec, dict) and "reason" in rec:
                                recommendations.append(rec["reason"])
                            elif isinstance(rec, str):
                                recommendations.append(rec)
                    
                    if has_wind:
                        ws = analysis.get("atmospheric", {}).get("wind_safety", {})
                        if not ws.get("is_safe_for_spraying"):
                            recommendations.append(f"Do not spray. Wind risk: {ws.get('risk_level')}")
                except Exception as e:
                    logger.warning(f"⚠️ Error flattening recommendations: {e}")

                # Backward Compatibility: Send full analysis
                await manager.broadcast(sensor_data.farm_id, {
                    "type": "agronomy_analysis",
                    "analysis": analysis,
                    "recommendations": recommendations,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # NEW: Industrial AI Event Contract
                # Broadcast individual AI Decisions as discrete events
                if "ai_decisions" in analysis:
                    for decision in analysis["ai_decisions"]:
                        # Ensure structure matches contract
                        payload = {
                            "type": "AI_DECISION",
                            "subsystem": decision["subsystem"],
                            "payload": decision["payload"],
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await manager.broadcast(sensor_data.farm_id, payload)
                        logger.info(f"🤖 AI Decision Broadcast: {decision['subsystem']}")

                logger.info(f"🌱 Agronomy analysis completed for farm {sensor_data.farm_id}")
            except Exception as e:
                logger.error(f"❌ Error in comprehensive analysis: {e}")
                import traceback
                traceback.print_exc()
                
        # ============================================================================
        # AI AUTO-LOGIC: Automatic Actuation Triggers
        # ============================================================================
        # Check if auto mode is enabled (stored in-memory or from DB)
        # For now, we'll trigger based on conditions regardless of mode
        # Frontend will control mode via /control endpoint
        
        # Auto-Irrigation: If moisture < 35%
        if sensor_data.moisture < 35:
            logger.warning(f"⚠️ AUTO-TRIGGER: Low moisture ({sensor_data.moisture}%) detected")
            # Note: Actual auto-trigger would check mode from state management
            # This is logged for visibility
        
        # Auto-Fertilization: Check NPK status from analysis
        if has_ec and has_ph:
            try:
                npk_status = analysis.get("soil_health", {}).get("nutrients", {})
                if npk_status:
                    # Check if any NPK is critically low
                    n_low = npk_status.get("nitrogen_available_ppm", 999) < 100
                    p_low = npk_status.get("phosphorus_available_ppm", 999) < 20
                    k_low = npk_status.get("potassium_available_ppm", 999) < 50
                    
                    if n_low or p_low or k_low:
                        logger.warning(f"⚠️ AUTO-TRIGGER: Low NPK detected (N:{n_low}, P:{p_low}, K:{k_low})")
                        # Note: Actual auto-trigger would check mode and wind safety
            except Exception as e:
                logger.debug(f"NPK auto-check skipped: {e}")
    
    except Exception as e:
        logger.error(f"❌ Error in agronomy logic: {e}")
        import traceback
        traceback.print_exc()


# ============================================================================
# Control Endpoints (Manual & Auto Actuation)
# ============================================================================

# In-memory state for control modes (farm_id -> {"irrigation": "manual/auto", "fertilization": "manual/auto"})
control_modes: Dict[str, Dict[str, str]] = {}

@router.post("/control")
async def control_actuation(command: ActuationCommand):
    """
    Manual/Auto Actuation Control Endpoint
    
    Handles:
    - Manual control commands from frontend
    - Safety checks (wind speed for fertilization)
    - MQTT command publishing to ESP32
    - Supabase audit logging
    """
    from datetime import datetime
    
    global mqtt_client
    
    # Map frontend UUID to MQTT farm_id
    mqtt_farm_id = reverse_map_farm_id(command.farm_id)
    
    logger.info(f"🎛️  Control command received: {command.action}={command.value} (mode:{command.mode}) for {mqtt_farm_id}")
    
    # ============================================================================
    # SAFETY CHECK: Wind Speed for Fertilization
    # ============================================================================
    if command.action == "fertilization" and command.value:
        # Check latest sensor data for wind speed
        if mqtt_farm_id in latest_sensor_data:
            sensor_data = latest_sensor_data[mqtt_farm_id]
            if sensor_data.wind_speed and sensor_data.wind_speed > 20:
                logger.warning(f"🚫 SAFETY BLOCK: Fertilization rejected due to high wind ({sensor_data.wind_speed} km/h)")
                raise HTTPException(
                    status_code=403,
                    detail=f"Fertilization blocked: Wind speed ({sensor_data.wind_speed} km/h) exceeds safety threshold (20 km/h)"
                )
    
    # ============================================================================
    # MQTT Command Publishing
    # ============================================================================
    if not mqtt_client or not mqtt_client.is_connected:
        logger.error("❌ MQTT client not connected")
        raise HTTPException(status_code=503, detail="MQTT broker not available")
    
    # Publish actuation command to ESP32
    success = mqtt_client.publish_actuation_command(
        farm_id=mqtt_farm_id,
        action=command.action,
        status=command.value
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to publish MQTT command")
    
    # ============================================================================
    # Supabase Audit Logging
    # ============================================================================
    try:
        from app.database import supabase
        
        if supabase:
            audit_entry = {
                "farm_id": mqtt_farm_id,
                "action": command.action,
                "value": command.value,
                "mode": command.mode,
                "reason": command.reason or "Manual trigger",
                "timestamp": command.timestamp or datetime.utcnow().isoformat() + "Z",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("commands_history").insert(audit_entry).execute()
            logger.info(f"✅ Command logged to Supabase: {command.action}")
    except Exception as e:
        logger.warning(f"⚠️ Failed to log command to Supabase: {e}")
        # Don't fail the request if logging fails
    
    # ============================================================================
    # Update Control Mode State
    # ============================================================================
    if mqtt_farm_id not in control_modes:
        control_modes[mqtt_farm_id] = {}
    
    control_modes[mqtt_farm_id][command.action] = command.mode
    
    # ============================================================================
    # Broadcast to WebSocket Clients
    # ============================================================================
    await manager.broadcast(command.farm_id, {
        "type": "actuation_command",
        "action": command.action,
        "value": command.value,
        "mode": command.mode,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "status": "success",
        "message": f"{command.action} {'activated' if command.value else 'deactivated'}",
        "farm_id": command.farm_id,
        "mode": command.mode
    }


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/status")
async def get_iot_status():
    """Get IoT system status"""
    mqtt_status = mqtt_client.get_status() if mqtt_client else {"connected": False}
    
    return {
        "mqtt": mqtt_status,
        "websocket_connections": {
            farm_id: manager.get_connection_count(farm_id)
            for farm_id in manager.active_connections.keys()
        },
        "latest_data_farms": list(latest_sensor_data.keys())
    }


@router.get("/latest/{farm_id}")
async def get_latest_sensor_data(farm_id: str):
    """Get the latest sensor data for a farm"""
    if farm_id not in latest_sensor_data:
        raise HTTPException(status_code=404, detail="No data available for this farm")
    
    return {
        "farm_id": farm_id,
        "data": latest_sensor_data[farm_id].model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/command")
async def send_irrigation_command(command: IrrigationCommand):
    """Manually send an irrigation command"""
    if not mqtt_client or not mqtt_client.is_connected:
        raise HTTPException(status_code=503, detail="MQTT broker not connected")
    
    success = mqtt_client.publish_command(command.command, command.farm_id)
    
    if success:
        return {
            "success": True,
            "message": f"Command '{command.command}' sent to farm {command.farm_id}",
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to publish command")


@router.websocket("/ws/telemetry/{farm_id}")
async def websocket_telemetry(websocket: WebSocket, farm_id: str):
    """
    WebSocket endpoint for real-time sensor data
    Clients connect here to receive live updates
    
    Note: This endpoint works even if MQTT is not connected
    """
    # Accept connection immediately (no MQTT check)
    await websocket.accept()
    
    # Add to connection manager
    async with manager.lock:
        if farm_id not in manager.active_connections:
            manager.active_connections[farm_id] = set()
        manager.active_connections[farm_id].add(websocket)
    
    logger.info(f"✅ WebSocket connected for farm: {farm_id}")
    
    try:
        # Send initial data if available
        if farm_id in latest_sensor_data:
            await websocket.send_json({
                "type": "initial_data",
                "data": latest_sensor_data[farm_id].model_dump(),
                "timestamp": datetime.utcnow().isoformat()
            })
            logger.info(f"📤 Sent initial data to {farm_id}")

        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client (e.g., ping/pong)
            data = await websocket.receive_text()
            
            # Echo back for heartbeat
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        logger.info(f"❌ WebSocket disconnected for farm: {farm_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {farm_id}: {e}")
    finally:
        # Clean up connection
        async with manager.lock:
            if farm_id in manager.active_connections:
                manager.active_connections[farm_id].discard(websocket)
                if not manager.active_connections[farm_id]:
                    del manager.active_connections[farm_id]
        logger.info(f"🧹 Cleaned up WebSocket for farm: {farm_id}")


# ============================================================================
# Lifecycle Management
# ============================================================================

async def initialize_mqtt():
    """Initialize MQTT client on application startup"""
    global mqtt_client, event_loop

    # Capture the current event loop
    try:
        event_loop = asyncio.get_running_loop()
        logger.info(f"✅ Captured event loop: {event_loop}")
    except RuntimeError:
        event_loop = asyncio.get_event_loop()
        logger.warning(f"⚠️ No running loop, using default: {event_loop}")

    # Get MQTT configuration from environment
    broker_host = os.getenv("MQTT_BROKER_HOST", "127.0.0.1")
    broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    username = os.getenv("MQTT_USERNAME")
    password = os.getenv("MQTT_PASSWORD")

    logger.info(f"🔧 Initializing MQTT client for broker: {broker_host}:{broker_port}")

    try:
        mqtt_client = MQTTIoTClient(
            broker_host=broker_host,
            broker_port=broker_port,
            username=username,
            password=password
        )

        # Register callback for telemetry topic
        mqtt_client.register_callback("farm/telemetry", handle_sensor_data)

        # Start MQTT client
        mqtt_client.start()

        logger.info("✅ MQTT client initialized successfully")

    except Exception as e:
        logger.error(f"❌ Failed to initialize MQTT client: {e}")
        logger.warning("⚠️ Application will continue without MQTT. Web UI will still work.")


async def shutdown_mqtt():
    """Shutdown MQTT client on application shutdown"""
    global mqtt_client
    if mqtt_client:
        mqtt_client.stop()
        logger.info("🛑 MQTT client shutdown complete")
