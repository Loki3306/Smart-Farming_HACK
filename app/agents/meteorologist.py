"""
Meteorologist Agent - External Environmental Data Collector
Listens for SensorUpdate events and enriches with:
- OpenWeatherMap current weather and 5-day forecast
- NASA Earthdata satellite imagery (NDVI, soil moisture, evapotranspiration)
Publishes EnvironmentalContext events to Redis
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

import httpx
import redis.asyncio as redis

from app.config import settings
from app.models import SensorUpdate, EnvironmentalContext

logger = logging.getLogger(__name__)


class MeteorologistAgent:
    """Gathers external environmental data from APIs"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.http_client = httpx.AsyncClient(timeout=settings.EXTERNAL_API_TIMEOUT)
        self.nasa_http_client = httpx.AsyncClient(timeout=settings.NASA_API_TIMEOUT)
        
        # Cache for farm locations (to avoid repeated lookups)
        self.farm_locations: Dict[int, tuple] = {}
    
    async def fetch_openweather_current(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Fetch current weather from OpenWeatherMap API"""
        try:
            url = f"{settings.OPENWEATHER_BASE_URL}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": "metric"
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"☁️ Fetched current weather for ({lat}, {lon})")
            
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "weather": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "clouds": data["clouds"]["all"],
                "timestamp": datetime.fromtimestamp(data["dt"]).isoformat()
            }
            
        except httpx.TimeoutException:
            logger.error("⏰ OpenWeather API timeout")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ OpenWeather API error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"❌ OpenWeather fetch failed: {str(e)}")
            return None
    
    async def fetch_openweather_forecast(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Fetch 5-day weather forecast from OpenWeatherMap API"""
        try:
            url = f"{settings.OPENWEATHER_BASE_URL}/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": "metric"
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Extract relevant forecast data
            forecast_list = []
            total_rain = 0.0
            
            for item in data["list"][:8]:  # Next 24 hours (3-hour intervals)
                rain_3h = item.get("rain", {}).get("3h", 0)
                total_rain += rain_3h
                
                forecast_list.append({
                    "datetime": item["dt_txt"],
                    "temperature": item["main"]["temp"],
                    "humidity": item["main"]["humidity"],
                    "rain_3h": rain_3h,
                    "weather": item["weather"][0]["main"]
                })
            
            logger.info(f"🌦️ Fetched forecast for ({lat}, {lon}). Total rain (24h): {total_rain}mm")
            
            return {
                "forecast_24h": forecast_list,
                "total_rain_24h": total_rain,
                "city": data["city"]["name"]
            }
            
        except httpx.TimeoutException:
            logger.error("⏰ OpenWeather forecast API timeout")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ OpenWeather forecast API error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"❌ OpenWeather forecast fetch failed: {str(e)}")
            return None
    
    async def fetch_nasa_ndvi(self, lat: float, lon: float) -> Optional[float]:
        """
        Fetch NDVI (Normalized Difference Vegetation Index) from NASA Earthdata
        NDVI range: -1 to 1 (higher values = healthier vegetation)
        """
        try:
            # Using NASA AppEEARS API (simplified approach)
            # In production, you'd need to submit a task and retrieve results
            # For now, we'll use a mock implementation
            
            # Mock NDVI calculation (replace with actual API call)
            # In reality, you'd use NASA's MODIS or Landsat data
            logger.info(f"🛰️ Fetching NDVI for ({lat}, {lon})")
            
            # Placeholder: Return a mock value
            # TODO: Implement actual NASA AppEEARS API integration
            mock_ndvi = 0.65  # Healthy vegetation
            
            return mock_ndvi
            
        except Exception as e:
            logger.error(f"❌ NASA NDVI fetch failed: {str(e)}")
            return None
    
    async def fetch_nasa_soil_moisture(self, lat: float, lon: float) -> Optional[float]:
        """
        Fetch soil moisture from NASA SMAP (Soil Moisture Active Passive) satellite
        Returns volumetric soil moisture (0-1 scale)
        """
        try:
            # NASA SMAP data endpoint
            # This is a simplified implementation
            logger.info(f"🌍 Fetching NASA soil moisture for ({lat}, {lon})")
            
            # Using NASA Earthdata Search API with bearer token
            headers = {
                "Authorization": f"Bearer {settings.NASA_EARTHDATA_TOKEN}"
            }
            
            # Placeholder: Mock implementation
            # TODO: Implement actual SMAP data retrieval
            mock_soil_moisture = 0.25  # 25% volumetric
            
            return mock_soil_moisture
            
        except Exception as e:
            logger.error(f"❌ NASA soil moisture fetch failed: {str(e)}")
            return None
    
    async def fetch_nasa_evapotranspiration(self, lat: float, lon: float) -> Optional[float]:
        """
        Fetch evapotranspiration data from NASA
        Returns ET in mm/day
        """
        try:
            logger.info(f"💧 Fetching evapotranspiration for ({lat}, {lon})")
            
            # Placeholder: Mock implementation
            # TODO: Implement actual NASA MODIS ET product retrieval
            mock_et = 4.5  # mm/day
            
            return mock_et
            
        except Exception as e:
            logger.error(f"❌ NASA ET fetch failed: {str(e)}")
            return None
    
    async def process_sensor_update(self, sensor_update: SensorUpdate):
        """Process SensorUpdate event and enrich with environmental data"""
        try:
            farm_id = sensor_update.farm_id
            
            # Get farm location (mock - in production, query from PostgreSQL)
            # For now, using a default location (example: Delhi, India)
            lat, lon = self.farm_locations.get(farm_id, (28.6139, 77.2090))
            
            logger.info(f"🌐 Processing environmental data for farm {farm_id}")
            
            # Fetch all external data concurrently
            weather_current, weather_forecast, ndvi, soil_moisture, et = await asyncio.gather(
                self.fetch_openweather_current(lat, lon),
                self.fetch_openweather_forecast(lat, lon),
                self.fetch_nasa_ndvi(lat, lon),
                self.fetch_nasa_soil_moisture(lat, lon),
                self.fetch_nasa_evapotranspiration(lat, lon),
                return_exceptions=True
            )
            
            # Handle any exceptions from gather
            def safe_result(result):
                return result if not isinstance(result, Exception) else None
            
            weather_current = safe_result(weather_current)
            weather_forecast = safe_result(weather_forecast)
            ndvi = safe_result(ndvi)
            soil_moisture = safe_result(soil_moisture)
            et = safe_result(et)
            
            # Create EnvironmentalContext event
            context = EnvironmentalContext(
                farm_id=farm_id,
                timestamp=datetime.utcnow(),
                weather_current=weather_current or {},
                weather_forecast=weather_forecast or {},
                nasa_ndvi=ndvi,
                nasa_soil_moisture=soil_moisture,
                nasa_evapotranspiration=et,
                metadata={
                    "location": {"lat": lat, "lon": lon},
                    "trigger_sensor": sensor_update.sensor_id
                }
            )
            
            # Publish to Redis
            await self.redis_client.publish(
                "events:environmental_context",
                context.model_dump_json()
            )
            
            logger.info(f"📤 Published EnvironmentalContext for farm {farm_id}")
            
        except Exception as e:
            logger.error(f"❌ Error processing sensor update: {str(e)}")
    
    async def listen_for_sensor_updates(self):
        """Subscribe to SensorUpdate events from Redis"""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("events:sensor_update")
            
            logger.info("👂 Listening for SensorUpdate events...")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        sensor_update = SensorUpdate(**data)
                        
                        # Process in background to avoid blocking
                        asyncio.create_task(self.process_sensor_update(sensor_update))
                        
                    except Exception as e:
                        logger.error(f"❌ Error parsing SensorUpdate: {str(e)}")
                        
        except Exception as e:
            logger.error(f"❌ Redis subscription error: {str(e)}")
    
    async def cleanup(self):
        """Clean up HTTP clients"""
        await self.http_client.aclose()
        await self.nasa_http_client.aclose()


async def start_meteorologist_listener(redis_client: redis.Redis):
    """
    Initialize and start the Meteorologist agent
    This runs as a background task in the FastAPI app
    """
    try:
        logger.info("🚀 Starting Meteorologist Agent...")
        
        agent = MeteorologistAgent(redis_client)
        
        # Start listening for sensor updates
        await agent.listen_for_sensor_updates()
        
    except Exception as e:
        logger.error(f"❌ Meteorologist Agent failed: {str(e)}")
        raise
    finally:
        await agent.cleanup()
