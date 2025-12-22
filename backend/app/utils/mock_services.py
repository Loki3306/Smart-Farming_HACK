"""
Mock services for standalone mode
Provides in-memory replacements for Redis, InfluxDB, PostgreSQL
"""

import asyncio
import logging
from typing import Dict, List, Any
from collections import defaultdict
from datetime import datetime

logger = logging.getLogger(__name__)


class MockRedis:
    """In-memory Redis replacement using asyncio queues"""
    
    def __init__(self):
        self.channels: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self.data: Dict[str, str] = {}
        logger.info("📦 Using in-memory Redis (standalone mode)")
    
    async def publish(self, channel: str, message: str):
        """Publish message to channel"""
        if channel in self.channels:
            for queue in self.channels[channel]:
                await queue.put({"type": "message", "channel": channel, "data": message})
        logger.debug(f"📤 Published to {channel} (in-memory)")
    
    def pubsub(self):
        """Create pubsub instance"""
        return MockPubSub(self)
    
    async def ping(self):
        """Ping (always succeeds)"""
        return True
    
    async def close(self):
        """Close connection"""
        pass


class MockPubSub:
    """Mock Redis PubSub"""
    
    def __init__(self, redis: MockRedis):
        self.redis = redis
        self.subscribed_channels: List[str] = []
        self.queue = asyncio.Queue()
    
    async def subscribe(self, *channels):
        """Subscribe to channels"""
        for channel in channels:
            self.subscribed_channels.append(channel)
            self.redis.channels[channel].append(self.queue)
        logger.info(f"👂 Subscribed to channels: {', '.join(channels)} (in-memory)")
    
    async def listen(self):
        """Listen for messages"""
        while True:
            message = await self.queue.get()
            yield message


class MockInfluxDB:
    """In-memory InfluxDB replacement"""
    
    def __init__(self):
        self.data: List[Dict[str, Any]] = []
        logger.info("📦 Using in-memory InfluxDB (standalone mode)")
    
    def write(self, bucket: str, org: str, record):
        """Write data point"""
        self.data.append({
            "bucket": bucket,
            "org": org,
            "record": str(record),
            "timestamp": datetime.utcnow()
        })
        logger.debug(f"💾 Wrote to InfluxDB (in-memory): {len(self.data)} points total")
    
    def close(self):
        """Close connection"""
        pass


class MockWriteApi:
    """Mock InfluxDB Write API"""
    
    def __init__(self, db: MockInfluxDB):
        self.db = db
    
    def write(self, bucket: str, org: str, record):
        """Write record"""
        self.db.write(bucket, org, record)


class MockDatabase:
    """In-memory database for farm data"""
    
    def __init__(self):
        self.farms: List[Dict[str, Any]] = []
        self.sensors: List[Dict[str, Any]] = []
        self.actions: List[Dict[str, Any]] = []
        logger.info("📦 Using in-memory database (standalone mode)")
    
    async def add_farm(self, farm_data: Dict[str, Any]):
        """Add farm"""
        farm_data["id"] = len(self.farms) + 1
        self.farms.append(farm_data)
        return farm_data
    
    async def add_sensor(self, sensor_data: Dict[str, Any]):
        """Add sensor"""
        sensor_data["id"] = len(self.sensors) + 1
        self.sensors.append(sensor_data)
        return sensor_data
    
    async def add_action(self, action_data: Dict[str, Any]):
        """Add action log"""
        action_data["id"] = len(self.actions) + 1
        self.actions.append(action_data)
        return action_data
    
    async def get_farms(self) -> List[Dict[str, Any]]:
        """Get all farms"""
        return self.farms
    
    async def get_sensors(self, farm_id: int = None) -> List[Dict[str, Any]]:
        """Get sensors"""
        if farm_id:
            return [s for s in self.sensors if s.get("farm_id") == farm_id]
        return self.sensors


# Global instances (singleton pattern)
_mock_redis = None
_mock_influxdb = None
_mock_database = None


def get_mock_redis() -> MockRedis:
    """Get or create mock Redis instance"""
    global _mock_redis
    if _mock_redis is None:
        _mock_redis = MockRedis()
    return _mock_redis


def get_mock_influxdb() -> MockInfluxDB:
    """Get or create mock InfluxDB instance"""
    global _mock_influxdb
    if _mock_influxdb is None:
        _mock_influxdb = MockInfluxDB()
    return _mock_influxdb


def get_mock_database() -> MockDatabase:
    """Get or create mock database instance"""
    global _mock_database
    if _mock_database is None:
        _mock_database = MockDatabase()
    return _mock_database
