"""
MQTT Client for IoT sensor data ingestion
Subscribes to farm/telemetry and publishes to farm/commands
"""

import asyncio
import json
import logging
import uuid
from typing import Callable, Dict, Optional
from datetime import datetime
import paho.mqtt.client as mqtt
from pydantic import ValidationError

from .models import SensorData

logger = logging.getLogger(__name__)


class MQTTIoTClient:
    """
    MQTT client for handling IoT sensor data
    - Subscribes to farm/telemetry for sensor readings
    - Publishes to farm/commands for irrigation control
    """

    def __init__(
        self,
        broker_host: str,
        broker_port: int = 1883,
        username: Optional[str] = None,
        password: Optional[str] = None,
        client_id: Optional[str] = None
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.username = username
        self.password = password
        
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
        if rc == 0:
            self.is_connected = True
            logger.info(f"✅ Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
            
            # Subscribe to telemetry topic
            client.subscribe(self.telemetry_topic, qos=1)
            logger.info(f"📡 Subscribed to topic: {self.telemetry_topic}")
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
            logger.error(f"❌ Failed to connect to MQTT broker. {error_msg}")

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

            # Parse JSON payload
            data = json.loads(payload)

            # ========== TESTING: PRINT RAW MQTT PAYLOAD ==========
            print(f"\n📨 RAW MQTT Message on topic '{msg.topic}':")
            print(f"   Payload: {msg.payload.decode()}")
            # =====================================================

            # Validate with Pydantic model
            sensor_data = SensorData(**data)

            # Call registered callbacks
            if msg.topic in self.message_callbacks:
                callback = self.message_callbacks[msg.topic]
                
                # The callback is async, but we're in a sync MQTT thread
                # Import here to avoid circular dependency
                from .router import event_loop
                
                if event_loop and event_loop.is_running():
                    # Schedule the coroutine in the event loop (thread-safe)
                    future = asyncio.run_coroutine_threadsafe(callback(sensor_data), event_loop)
                    
                    # Add callback to log exceptions
                    def handle_exception(fut):
                        try:
                            fut.result()
                        except Exception as e:
                            logger.error(f"❌ Error in async callback for {msg.topic}: {e}")
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

    def start(self):
        """Start the MQTT client (non-blocking)"""
        try:
            # Create client with clean session to avoid conflicts
            self.client = mqtt.Client(
                client_id=self.client_id,
                clean_session=True,  # Don't persist session state
                protocol=mqtt.MQTTv311  # Use MQTT 3.1.1
            )
            
            # Set callbacks
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message

            # Set credentials if provided
            if self.username and self.password:
                self.client.username_pw_set(self.username, self.password)

            # Connect to broker
            logger.info(f"🔌 Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
            self.client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            
            # Start network loop in background thread
            self.client.loop_start()

            logger.info("✅ MQTT client started successfully")

        except Exception as e:
            logger.error(f"❌ Failed to start MQTT client: {e}")
            logger.warning("⚠️ Application will continue without MQTT. Web UI will still work.")

    def stop(self):
        """Stop the MQTT client"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("🛑 MQTT client stopped")

    def register_callback(self, topic: str, callback: Callable):
        """Register a callback for a specific topic"""
        self.message_callbacks[topic] = callback
        logger.info(f"✅ Registered callback for topic: {topic}")

    def publish_command(self, command: str, farm_id: str = "default"):
        """Publish a command to the irrigation system"""
        if not self.is_connected:
            logger.warning("⚠️ MQTT not connected. Cannot publish command.")
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
        if not self.is_connected:
            logger.warning("⚠️ MQTT not connected. Cannot publish actuation command.")
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
                print(f"\n🎛️  ACTUATION COMMAND PUBLISHED")
                print(f"   Topic: {topic}")
                print(f"   Device: {device}")
                print(f"   State: {'ON' if status else 'OFF'}")
                print(f"   Payload: {payload}")
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
