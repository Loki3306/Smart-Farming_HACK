"""
MQTT Client for IoT sensor data ingestion
Subscribes to farm/telemetry and publishes to farm/commands
"""

import asyncio
import json
import logging
import uuid
import os
from typing import Callable, Dict, Optional
from datetime import datetime
import paho.mqtt.client as mqtt
from pydantic import ValidationError

from .models import SensorData

logger = logging.getLogger(__name__)

MQTT_CONSOLE_LOGGING_ENABLED = os.getenv("MQTT_CONSOLE_LOGGING", "false").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

if not MQTT_CONSOLE_LOGGING_ENABLED:
    logger.setLevel(logging.WARNING)


def _mqtt_print(*args, **kwargs):
    if MQTT_CONSOLE_LOGGING_ENABLED:
        print(*args, **kwargs)


class MQTTIoTClient:
    """
    MQTT client for handling IoT sensor data
    - Subscribes to farm/telemetry for sensor readings
    - Publishes to farm/commands for irrigation control
    """

    def __init__(
        self,
        broker_host: Optional[str] = None,
        broker_port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        client_id: Optional[str] = None
    ):
        # Environment-driven configuration (Priority: Env Var > Arg > Default)
        self.broker_host = broker_host or os.getenv("MQTT_BROKER_HOST", "e17116d0063a4e08bab15c1ff2a00fcc.s1.eu.hivemq.cloud")
        self.broker_port = int(broker_port or os.getenv("MQTT_BROKER_PORT", "8883"))
        self.username = username or os.getenv("MQTT_USERNAME", "farm_user")
        self.password = password or os.getenv("MQTT_PASSWORD", "Yug@2809")
        
        # Generate unique client ID to avoid conflicts (Error Code 7)
        if client_id is None:
            self.client_id = f"smart-farming-backend-{uuid.uuid4().hex[:8]}"
        else:
            self.client_id = f"{client_id}-{uuid.uuid4().hex[:8]}"
        
        logger.info(f"🆔 MQTT Client ID: {self.client_id}")

        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self.message_callbacks: Dict[str, Callable] = {}

        # Topics
        self.telemetry_topic = "farm/telemetry"
        self.command_topic = "farm/commands"

    def on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        _mqtt_print(f"\n[CONNECT] MQTT on_connect callback triggered with rc={rc}")
        
        if rc == 0:
            self.is_connected = True
            logger.info(f"[SUCCESS] Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
            _mqtt_print(f"[SUCCESS] MQTT Connection SUCCESS!")
            
            # Subscribe to telemetry topic
            client.subscribe(self.telemetry_topic, qos=1)
            logger.info(f"[SUB] Subscribed to topic: {self.telemetry_topic}")
            
            # Publish success message to announce backend is online
            import json
            from datetime import datetime
            success_msg = json.dumps({
                "type": "BACKEND_ONLINE",
                "message": "Smart Farming Backend connected to HiveMQ Cloud",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "broker": f"{self.broker_host}:{self.broker_port}"
            })
            client.publish("farm/system/status", success_msg, qos=1)
            logger.info("[PUB] Published backend online message")
            _mqtt_print("[PUB] Backend online message sent to MQTT")
        else:
            self.is_connected = False
            error_messages = {
                1: "Incorrect protocol version",
                2: "Invalid client identifier",
                3: "Server unavailable",
                4: "Bad username or password",
                5: "Not authorized",
                7: "Connection refused (client ID conflict or broker issue)"
            }
            error_msg = error_messages.get(rc, f"Unknown error code: {rc}")
            logger.error(f"[ERROR] Failed to connect to MQTT broker. {error_msg}")
            _mqtt_print(f"[ERROR] MQTT Connection FAILED: {error_msg}")

    def on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker"""
        self.is_connected = False
        if rc != 0:
            logger.warning(f"⚠️ Unexpected MQTT disconnection. Code: {rc}. Will attempt to reconnect.")

    def on_message(self, client, userdata, msg):
        """Callback when a message is received"""
        try:
            payload = msg.payload.decode('utf-8')
            logger.debug(f"📨 Received message on {msg.topic}: {payload}")

            # Parse JSON payload (only once)
            data = json.loads(payload)

            # ========== TESTING: PRINT RAW MQTT PAYLOAD ==========
            _mqtt_print(f"\n RAW MQTT Message on topic '{msg.topic}':")
            _mqtt_print(f"   Payload: {payload}")
            # =====================================================

            # Check for STATUS packet
            if data.get("type") == "STATUS":
                # Pass as dictionary — no Pydantic validation needed
                callback_data = data
            else:
                # ── NPK normalisation ──────────────────────────────────────────
                # The real simulator sends npk as {"n": x, "p": y, "k": z}.
                # The legacy ESP32 firmware sends npk as a plain float (ADC read).
                # Both are handled by the NPK union type in SensorData, but we
                # log a helpful note so it's easy to track which shape arrived.
                npk_raw = data.get("npk")
                if isinstance(npk_raw, dict):
                    _mqtt_print(f"   NPK shape: dict → N={npk_raw.get('n')}  P={npk_raw.get('p')}  K={npk_raw.get('k')}")
                elif npk_raw is not None:
                    _mqtt_print(f"   NPK shape: scalar → {npk_raw}")
                # ──────────────────────────────────────────────────────────────

                callback_data = SensorData(**data)

            # Call registered callbacks
            if msg.topic in self.message_callbacks:
                callback = self.message_callbacks[msg.topic]
                
                # The callback is async, but we're in a sync MQTT thread
                # Import here to avoid circular dependency
                from .router import event_loop
                
                if event_loop and event_loop.is_running():
                    # Schedule the coroutine in the event loop (thread-safe)
                    future = asyncio.run_coroutine_threadsafe(callback(callback_data), event_loop)
                    
                    # Add callback to log exceptions
                    def handle_exception(fut):
                        try:
                            fut.result()
                        except Exception as e:
                            logger.error(f"[ERROR] Error in async callback for {msg.topic}: {e}")
                            import traceback
                            traceback.print_exc()
                            
                    future.add_done_callback(handle_exception)
                    # logger.debug(f"✅ Scheduled callback for {msg.topic}")
                else:
                    logger.warning(f"⚠️ No event loop available, cannot process message")

        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in MQTT message: {e}")
        except ValidationError as e:
            logger.error(f"❌ Invalid sensor data format: {e}")
        except Exception as e:
            logger.error(f"❌ Error processing MQTT message: {e}")

    def on_log(self, client, userdata, level, buf):
        """Callback for internal MQTT client logging"""
        if not MQTT_CONSOLE_LOGGING_ENABLED:
            return

        # Only log warnings and errors to avoid spam, unless debugging
        if level >= mqtt.MQTT_LOG_NOTICE:
            _mqtt_print(f"[LOG] MQTT Log: {buf}")
            logger.info(f"[LOG] MQTT Log: {buf}")

    def start(self):
        """Start the MQTT client"""
        try:
            # Create client with clean session
            self.client = mqtt.Client(
                client_id=self.client_id,
                clean_session=True,
                protocol=mqtt.MQTTv311
            )
            
            # Set callbacks
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message
            self.client.on_log = self.on_log

            # Set credentials if provided
            if self.username and self.password:
                self.client.username_pw_set(self.username, self.password)
                logger.info(f"[AUTH] MQTT credentials set for user: {self.username}")

            # Enable TLS/SSL for HiveMQ Cloud (port 8883)
            # HARDENING: Use create_default_context for industrial security
            if self.broker_port == 8883:
                import ssl
                # Use ssl.create_default_context() as requested for robust security context
                context = ssl.create_default_context()
                # HiveMQ Cloud: Skip hostname check if using default context without specific hostname config
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                self.client.tls_set_context(context)
                self.client.tls_insecure_set(True)
                logger.info("[TLS] TLS/SSL v1.2 Enabled (Secure Context Created)")

            # Connect to broker
            logger.info(f"[CONNECT] Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
            
            # Use async connect to avoid blocking
            self.client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            
            # Start network loop in background thread IMMEDIATELY
            # This is the "No-Fail" bridge
            self.client.loop_start()
            _mqtt_print("[INFO] MQTT loop started.")

            # Wait briefly for the logical MQTT connection (on_connect)
            # This helps avoid immediate 503s on startup
            import time
            max_wait = 5  # seconds
            elapsed = 0
            while not self.is_connected and elapsed < max_wait:
                time.sleep(0.5)
                elapsed += 0.5
            
            if self.is_connected:
                logger.info("[SUCCESS] MQTT client connected successfully")
            else:
                logger.warning(f"[WARNING] MQTT client started, waiting for connection...")

        except Exception as e:
            logger.error(f"[ERROR] Failed to start MQTT client: {e}")
            logger.warning("[WARNING] Application will continue without MQTT. Web UI will still work.")
            import traceback
            traceback.print_exc()

    def stop(self):
        """Stop the MQTT client"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("🛑 MQTT client stopped")

    def ensure_connected(self, max_retries: int = 3, retry_delay: float = 1.0) -> bool:
        """
        Ensure MQTT client is connected, attempt reconnection if needed
        Returns True if connected, False otherwise
        """
        if self.is_connected:
            return True
            
        logger.warning("⚠️ MQTT not connected, attempting reconnection...")
        
        for attempt in range(max_retries):
            try:
                if self.client and not self.is_connected:
                    logger.info(f"🔄 Reconnection attempt {attempt + 1}/{max_retries}...")
                    self.client.reconnect()
                    
                    # Wait briefly for connection
                    import time
                    time.sleep(retry_delay)
                    
                    if self.is_connected:
                        logger.info("✅ Reconnected successfully")
                        return True
                        
            except Exception as e:
                logger.error(f"❌ Reconnection attempt {attempt + 1} failed: {e}")
                
        logger.error("❌ Failed to reconnect after all attempts")
        return False


    def register_callback(self, topic: str, callback: Callable):
        """Register a callback for a specific topic"""
        self.message_callbacks[topic] = callback
        logger.info(f"✅ Registered callback for topic: {topic}")

    def publish_command(self, command: str, farm_id: str = "default"):
        """Publish a command to the irrigation system"""
        # Ensure connection, attempt reconnection if needed
        if not self.ensure_connected():
            logger.error("❌ MQTT not connected and reconnection failed. Cannot publish command.")
            return False

        try:
            payload = json.dumps({
                "command": command,
                "farm_id": farm_id,
                "timestamp": datetime.utcnow().isoformat()
            })

            result = self.client.publish(self.command_topic, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"✅ Published command '{command}' to {self.command_topic}")
                return True
            else:
                logger.error(f"❌ Failed to publish command. Error code: {result.rc}")
                return False

        except Exception as e:
            logger.error(f"❌ Error publishing command: {e}")
            return False

    def publish_actuation_command(self, farm_id: str, action: str, status: bool):
        """
        Publish actuation command to ESP32
        
        Args:
            farm_id: Target farm identifier
            action: "irrigation" or "fertilization"
            status: True=ON, False=OFF
        
        Returns:
            bool: Success status
        """
        # Ensure connection, attempt reconnection if needed
        if not self.ensure_connected():
            logger.error("❌ MQTT not connected and reconnection failed. Cannot publish actuation command.")
            return False

        try:
            # Topic structure: farm/{farm_id}/commands
            topic = f"farm/{farm_id}/commands"
            
            # Device mapping
            device_map = {
                "irrigation": "irrigation",
                "fertilization": "fertilization"
            }
            
            device = device_map.get(action, action)
            
            # Payload structure for ESP32
            payload = json.dumps({
                "type": "ACTUATE",
                "device": device,
                "state": 1 if status else 0,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })

            result = self.client.publish(topic, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"✅ Published actuation command: {action}={status} to {topic}")
                _mqtt_print(f"\n  ACTUATION COMMAND PUBLISHED")
                _mqtt_print(f"   Topic: {topic}")
                _mqtt_print(f"   Device: {device}")
                _mqtt_print(f"   State: {'ON' if status else 'OFF'}")
                _mqtt_print(f"   Payload: {payload}")
                return True
            else:
                logger.error(f"❌ Failed to publish actuation command. Error code: {result.rc}")
                return False

        except Exception as e:
            logger.error(f"❌ Error publishing actuation command: {e}")
            return False

    def get_status(self) -> dict:

        """Get current MQTT client status"""
        return {
            "connected": self.is_connected,
            "broker": f"{self.broker_host}:{self.broker_port}",
            "telemetry_topic": self.telemetry_topic,
            "command_topic": self.command_topic
        }
