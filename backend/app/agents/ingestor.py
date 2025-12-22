"""
Ingestor Agent - MQTT Client & InfluxDB Writer
Subscribes to farm/sensors/# topic via HiveMQ Cloud
Writes sensor data to InfluxDB and publishes SensorUpdate events to Redis
"""

import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import ASYNCHRONOUS
import redis.asyncio as redis

from app.config import settings
from app.models import SensorUpdate, SensorType

logger = logging.getLogger(__name__)


class MQTTIngestor:
    """MQTT client for ingesting sensor data from field devices"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.mqtt_client = None
        self.influx_client = None
        self.write_api = None
        
    def setup_influxdb(self):
        """Initialize InfluxDB client and write API"""
        try:
            if settings.STANDALONE_MODE or settings.DISABLE_INFLUXDB:
                from app.utils.mock_services import get_mock_influxdb, MockWriteApi
                self.influx_client = get_mock_influxdb()
                self.write_api = MockWriteApi(self.influx_client)
                logger.info("✅ Using mock InfluxDB (standalone mode)")
            else:
                self.influx_client = InfluxDBClient(
                    url=settings.INFLUXDB_URL,
                    token=settings.INFLUXDB_TOKEN,
                    org=settings.INFLUXDB_ORG
                )
                self.write_api = self.influx_client.write_api(write_options=ASYNCHRONOUS)
                logger.info("✅ InfluxDB client initialized")
        except Exception as e:
            logger.warning(f"⚠️  InfluxDB initialization failed, using mock: {str(e)}")
            from app.utils.mock_services import get_mock_influxdb, MockWriteApi
            self.influx_client = get_mock_influxdb()
            self.write_api = MockWriteApi(self.influx_client)
    
    def on_connect(self, client, userdata, flags, rc):
        """Callback when MQTT connection is established"""
        if rc == 0:
            logger.info(f"✅ Connected to HiveMQ Cloud broker: {settings.MQTT_BROKER}")
            client.subscribe(settings.MQTT_TOPIC)
            logger.info(f"📡 Subscribed to topic: {settings.MQTT_TOPIC}")
        else:
            logger.error(f"❌ MQTT connection failed with code: {rc}")
    
    def on_message(self, client, userdata, msg):
        """Callback when MQTT message is received"""
        try:
            # Parse MQTT payload
            payload = json.loads(msg.payload.decode())
            topic = msg.topic
            
            logger.info(f"📨 Received message on {topic}: {payload}")
            
            # Extract sensor data
            sensor_id = payload.get("sensor_id")
            farm_id = payload.get("farm_id", 1)  # Default to farm 1
            sensor_type = payload.get("sensor_type")
            value = payload.get("value")
            unit = payload.get("unit", "")
            timestamp = payload.get("timestamp", datetime.utcnow().isoformat())
            
            # Validate required fields
            if not all([sensor_id, sensor_type, value is not None]):
                logger.warning(f"⚠️ Incomplete sensor data: {payload}")
                return
            
            # Write to InfluxDB
            self.write_to_influxdb(
                sensor_id=sensor_id,
                farm_id=farm_id,
                sensor_type=sensor_type,
                value=value,
                unit=unit,
                timestamp=timestamp
            )
            
            # Publish SensorUpdate event to Redis (async)
            asyncio.create_task(self.publish_sensor_update(
                sensor_id=sensor_id,
                farm_id=farm_id,
                sensor_type=sensor_type,
                value=value,
                unit=unit,
                timestamp=timestamp,
                metadata=payload.get("metadata", {})
            ))
            
        except json.JSONDecodeError:
            logger.error(f"❌ Invalid JSON payload: {msg.payload}")
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}")
    
    def write_to_influxdb(
        self,
        sensor_id: str,
        farm_id: int,
        sensor_type: str,
        value: float,
        unit: str,
        timestamp: str
    ):
        """Write sensor data point to InfluxDB"""
        try:
            # Create InfluxDB point
            point = (
                Point("sensor_reading")
                .tag("sensor_id", sensor_id)
                .tag("farm_id", str(farm_id))
                .tag("sensor_type", sensor_type)
                .field("value", float(value))
                .field("unit", unit)
                .time(timestamp)
            )
            
            # Write to InfluxDB
            self.write_api.write(
                bucket=settings.INFLUXDB_BUCKET,
                org=settings.INFLUXDB_ORG,
                record=point
            )
            
            logger.info(f"💾 Wrote to InfluxDB: {sensor_id} = {value} {unit}")
            
        except Exception as e:
            logger.error(f"❌ InfluxDB write failed: {str(e)}")
    
    async def publish_sensor_update(
        self,
        sensor_id: str,
        farm_id: int,
        sensor_type: str,
        value: float,
        unit: str,
        timestamp: str,
        metadata: Dict[str, Any]
    ):
        """Publish SensorUpdate event to Redis Pub/Sub"""
        try:
            # Parse timestamp
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            # Create SensorUpdate event
            sensor_update = SensorUpdate(
                sensor_id=sensor_id,
                farm_id=farm_id,
                sensor_type=SensorType(sensor_type),
                value=value,
                unit=unit,
                timestamp=timestamp,
                metadata=metadata
            )
            
            # Publish to Redis channel
            await self.redis_client.publish(
                "events:sensor_update",
                sensor_update.model_dump_json()
            )
            
            logger.info(f"📤 Published SensorUpdate event for {sensor_id}")
            
        except Exception as e:
            logger.error(f"❌ Redis publish failed: {str(e)}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback when MQTT connection is lost"""
        if rc != 0:
            logger.warning(f"⚠️ Unexpected MQTT disconnection. Code: {rc}")
    
    def setup_mqtt(self):
        """Initialize MQTT client with TLS"""
        try:
            self.mqtt_client = mqtt.Client()
            
            # Set callbacks
            self.mqtt_client.on_connect = self.on_connect
            self.mqtt_client.on_message = self.on_message
            self.mqtt_client.on_disconnect = self.on_disconnect
            
            # Set credentials
            self.mqtt_client.username_pw_set(
                settings.MQTT_USERNAME,
                settings.MQTT_PASSWORD
            )
            
            # Enable TLS for secure connection
            if settings.MQTT_USE_TLS:
                self.mqtt_client.tls_set()
            
            # Connect to broker
            self.mqtt_client.connect(
                settings.MQTT_BROKER,
                settings.MQTT_PORT,
                keepalive=60
            )
            
            logger.info("🔌 MQTT client configured")
            
        except Exception as e:
            logger.error(f"❌ MQTT setup failed: {str(e)}")
            raise
    
    def start_loop(self):
        """Start MQTT loop in non-blocking mode"""
        self.mqtt_client.loop_start()
        logger.info("🔄 MQTT loop started")


async def start_mqtt_ingestor(redis_client: redis.Redis):
    """
    Initialize and start the MQTT Ingestor agent
    This runs as a background task in the FastAPI app
    """
    try:
        logger.info("🚀 Starting MQTT Ingestor Agent...")
        
        ingestor = MQTTIngestor(redis_client)
        ingestor.setup_influxdb()
        ingestor.setup_mqtt()
        ingestor.start_loop()
        
        logger.info("✅ MQTT Ingestor Agent is operational")
        
        # Keep the task alive
        while True:
            await asyncio.sleep(60)  # Health check every minute
            
    except Exception as e:
        logger.error(f"❌ MQTT Ingestor Agent failed: {str(e)}")
        raise
