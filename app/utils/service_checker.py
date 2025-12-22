"""
Service availability checker
Detects which services are available and configures the system accordingly
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)


async def check_redis(host: str, port: int) -> bool:
    """Check if Redis is available"""
    try:
        import redis.asyncio as redis
        client = await redis.from_url(f"redis://{host}:{port}", socket_connect_timeout=2)
        await client.ping()
        await client.close()
        logger.info("✅ Redis is available")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Redis not available: {str(e)}")
        return False


async def check_influxdb(url: str, token: str) -> bool:
    """Check if InfluxDB is available"""
    try:
        from influxdb_client import InfluxDBClient
        client = InfluxDBClient(url=url, token=token, timeout=2000)
        # Try to ping
        client.ping()
        client.close()
        logger.info("✅ InfluxDB is available")
        return True
    except Exception as e:
        logger.warning(f"⚠️  InfluxDB not available: {str(e)}")
        return False


async def check_postgres(url: str) -> bool:
    """Check if PostgreSQL is available"""
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        engine = create_async_engine(url, connect_args={"timeout": 2})
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        await engine.dispose()
        logger.info("✅ PostgreSQL is available")
        return True
    except Exception as e:
        logger.warning(f"⚠️  PostgreSQL not available: {str(e)}")
        return False


async def check_all_services(settings) -> Dict[str, bool]:
    """Check availability of all services"""
    logger.info("🔍 Checking service availability...")
    
    services = {
        "redis": False,
        "influxdb": False,
        "postgres": False,
    }
    
    if not settings.DISABLE_REDIS and not settings.STANDALONE_MODE:
        services["redis"] = await check_redis(settings.REDIS_HOST, settings.REDIS_PORT)
    
    if not settings.DISABLE_INFLUXDB and not settings.STANDALONE_MODE:
        services["influxdb"] = await check_influxdb(settings.INFLUXDB_URL, settings.INFLUXDB_TOKEN)
    
    if not settings.DISABLE_POSTGRES and not settings.STANDALONE_MODE:
        services["postgres"] = await check_postgres(settings.DATABASE_URL)
    
    # Log summary
    logger.info("📊 Service availability summary:")
    for service, available in services.items():
        status = "✅" if available else "❌"
        logger.info(f"   {status} {service}")
    
    return services
