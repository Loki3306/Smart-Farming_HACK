"""
Agronomist Agent - AI Decision Logic for Irrigation & Fertilization
Consumes SensorUpdate and EnvironmentalContext events
Implements predictive decision-making algorithm
Publishes ActionInstruction events when intervention is needed
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from collections import defaultdict

import redis.asyncio as redis

from app.config import settings
from app.models import (
    SensorUpdate, 
    EnvironmentalContext, 
    ActionInstruction, 
    ActionType,
    SensorType
)
from app.ml_models import get_fertilizer_recommender

logger = logging.getLogger(__name__)


class AgronomistAgent:
    """AI-driven decision maker for autonomous farm management"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        
        # Store latest sensor readings by farm_id
        self.sensor_data: Dict[int, Dict[str, Any]] = defaultdict(dict)
        
        # Store latest environmental context by farm_id
        self.environmental_context: Dict[int, EnvironmentalContext] = {}
        
        # Track recent actions to avoid redundant triggers
        self.recent_actions: Dict[int, Dict[str, datetime]] = defaultdict(dict)
        
        # Initialize ML-based fertilizer recommender
        try:
            self.fertilizer_recommender = get_fertilizer_recommender()
            logger.info("✅ Fertilizer recommender initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize fertilizer recommender: {e}")
            self.fertilizer_recommender = None
    
    def update_sensor_data(self, sensor_update: SensorUpdate):
        """Store latest sensor reading"""
        farm_id = sensor_update.farm_id
        sensor_type = sensor_update.sensor_type.value
        
        self.sensor_data[farm_id][sensor_type] = {
            "value": sensor_update.value,
            "unit": sensor_update.unit,
            "timestamp": sensor_update.timestamp,
            "sensor_id": sensor_update.sensor_id
        }
        
        logger.debug(f"📊 Updated sensor data for farm {farm_id}: {sensor_type}={sensor_update.value}")
    
    def update_environmental_context(self, context: EnvironmentalContext):
        """Store latest environmental context"""
        self.environmental_context[context.farm_id] = context
        logger.debug(f"🌍 Updated environmental context for farm {context.farm_id}")
    
    def calculate_irrigation_need(
        self,
        farm_id: int,
        soil_moisture: float,
        forecast_rain: float,
        temperature: float,
        evapotranspiration: Optional[float],
        humidity: float
    ) -> Optional[Dict[str, Any]]:
        """
        AI Decision Logic for Irrigation
        
        Triggers irrigation if:
        1. Soil moisture < threshold AND
        2. Forecast rain < threshold AND
        3. High temperature or high ET
        """
        try:
            # Decision thresholds
            moisture_threshold = settings.SOIL_MOISTURE_MIN_THRESHOLD
            rain_threshold = settings.FORECAST_RAIN_THRESHOLD
            temp_threshold = settings.TEMPERATURE_MAX_THRESHOLD
            
            # Calculate water stress index (0-1, higher = more stress)
            moisture_stress = max(0, (moisture_threshold - soil_moisture) / moisture_threshold)
            
            # Evapotranspiration factor (higher ET = more water needed)
            et_factor = 1.0
            if evapotranspiration:
                et_factor = min(2.0, evapotranspiration / 4.0)  # Normalize around 4mm/day
            
            # Temperature stress (higher temp = more water needed)
            temp_stress = max(0, (temperature - 25) / 15)  # Normalize around 25°C
            
            # Humidity factor (lower humidity = more water needed)
            humidity_factor = max(0, (70 - humidity) / 70)  # Normalize around 70%
            
            # Combined water need score (0-1)
            water_need_score = (
                moisture_stress * 0.5 + 
                temp_stress * 0.2 + 
                et_factor * 0.2 + 
                humidity_factor * 0.1
            )
            
            # Decision logic
            should_irrigate = (
                soil_moisture < moisture_threshold and
                forecast_rain < rain_threshold and
                water_need_score > 0.4  # Minimum threshold for action
            )
            
            if should_irrigate:
                # Calculate recommended irrigation amount (liters per hectare)
                # Base amount adjusted by water need score
                base_amount = 1000  # liters per hectare
                recommended_amount = base_amount * water_need_score * 2
                
                # Duration in seconds (assuming 100L/min flow rate)
                recommended_duration = int((recommended_amount / 100) * 60)
                
                # Determine priority
                if water_need_score > 0.8:
                    priority = "critical"
                elif water_need_score > 0.6:
                    priority = "high"
                elif water_need_score > 0.4:
                    priority = "medium"
                else:
                    priority = "low"
                
                logger.info(f"💧 Irrigation recommended for farm {farm_id}: {recommended_amount:.0f}L/ha")
                
                return {
                    "should_act": True,
                    "action_type": ActionType.IRRIGATION,
                    "priority": priority,
                    "recommended_amount": recommended_amount,
                    "recommended_duration": recommended_duration,
                    "reasoning": {
                        "soil_moisture": soil_moisture,
                        "moisture_threshold": moisture_threshold,
                        "forecast_rain_24h": forecast_rain,
                        "temperature": temperature,
                        "evapotranspiration": evapotranspiration,
                        "humidity": humidity,
                        "water_need_score": round(water_need_score, 3),
                        "moisture_stress": round(moisture_stress, 3),
                        "temp_stress": round(temp_stress, 3)
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error calculating irrigation need: {str(e)}")
            return None
    
    def calculate_fertilization_need(
        self,
        farm_id: int,
        nitrogen: Optional[float],
        phosphorus: Optional[float],
        potassium: Optional[float],
        ndvi: Optional[float],
        temperature: float = 25.0,
        humidity: float = 60.0,
        moisture: float = 50.0,
        soil_type: str = "Loamy",
        crop_type: str = "Wheat"
    ) -> Optional[Dict[str, Any]]:
        """
        Enhanced AI Decision Logic for Fertilization using ML model
        
        Uses trained ML model to predict:
        1. Optimal fertilizer type
        2. Required NPK quantities
        3. Application timing
        
        Falls back to rule-based logic if ML model is unavailable
        """
        try:
            # Decision thresholds (in ppm or appropriate units)
            nitrogen_threshold = 20.0
            phosphorus_threshold = 15.0
            potassium_threshold = 150.0
            ndvi_threshold = settings.NDVI_MIN_THRESHOLD
            
            deficiencies = []
            fertilizer_needed = False
            
            # Check nitrogen
            if nitrogen is not None and nitrogen < nitrogen_threshold:
                deficiencies.append({
                    "nutrient": "nitrogen",
                    "current": nitrogen,
                    "threshold": nitrogen_threshold,
                    "deficit": nitrogen_threshold - nitrogen
                })
                fertilizer_needed = True
            
            # Check phosphorus
            if phosphorus is not None and phosphorus < phosphorus_threshold:
                deficiencies.append({
                    "nutrient": "phosphorus",
                    "current": phosphorus,
                    "threshold": phosphorus_threshold,
                    "deficit": phosphorus_threshold - phosphorus
                })
                fertilizer_needed = True
            
            # Check potassium
            if potassium is not None and potassium < potassium_threshold:
                deficiencies.append({
                    "nutrient": "potassium",
                    "current": potassium,
                    "threshold": potassium_threshold,
                    "deficit": potassium_threshold - potassium
                })
                fertilizer_needed = True
            
            # Check NDVI (vegetation health)
            poor_vegetation_health = ndvi is not None and ndvi < ndvi_threshold
            
            if poor_vegetation_health:
                fertilizer_needed = True
            
            if fertilizer_needed:
                # Use ML model for intelligent recommendations
                ml_recommendation = None
                if self.fertilizer_recommender:
                    try:
                        ml_recommendation = self.fertilizer_recommender.predict_fertilizer(
                            temperature=temperature,
                            humidity=humidity,
                            moisture=moisture,
                            soil_type=soil_type,
                            crop_type=crop_type,
                            current_n=nitrogen or 0,
                            current_p=phosphorus or 0,
                            current_k=potassium or 0
                        )
                        logger.info(f"🤖 ML Recommendation for farm {farm_id}: {ml_recommendation['fertilizer_name']}")
                    except Exception as e:
                        logger.warning(f"⚠️ ML prediction failed, using rule-based approach: {e}")
                
                # Determine priority
                if len(deficiencies) >= 2 or poor_vegetation_health:
                    priority = "high"
                else:
                    priority = "medium"
                
                # Calculate recommended amount (kg per hectare)
                if ml_recommendation:
                    recommended_amount = ml_recommendation['application_rate_kg_per_hectare']
                else:
                    recommended_amount = 50.0 * len(deficiencies)  # Fallback calculation
                
                logger.info(f"🌱 Fertilization recommended for farm {farm_id}")
                
                decision = {
                    "should_act": True,
                    "action_type": ActionType.FERTILIZATION,
                    "priority": priority,
                    "recommended_amount": recommended_amount,
                    "reasoning": {
                        "deficiencies": deficiencies,
                        "ndvi": ndvi,
                        "ndvi_threshold": ndvi_threshold,
                        "poor_vegetation_health": poor_vegetation_health
                    }
                }
                
                # Add ML-based recommendations if available
                if ml_recommendation:
                    decision["ml_recommendation"] = ml_recommendation
                    decision["fertilizer_type"] = ml_recommendation["fertilizer_name"]
                    decision["npk_requirements"] = ml_recommendation["npk_requirements"]
                    decision["timing"] = ml_recommendation["timing"]
                    decision["alternatives"] = ml_recommendation["alternatives"]
                
                return decision
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error calculating fertilization need: {str(e)}")
            return None
    
    async def evaluate_and_decide(self, farm_id: int):
        """
        Main decision-making function
        Evaluates all available data and publishes ActionInstruction if needed
        """
        try:
            # Check if we have both sensor data and environmental context
            if farm_id not in self.sensor_data or farm_id not in self.environmental_context:
                logger.debug(f"⏳ Insufficient data for farm {farm_id}")
                return
            
            sensors = self.sensor_data[farm_id]
            context = self.environmental_context[farm_id]
            
            # Extract relevant data
            soil_moisture = sensors.get(SensorType.SOIL_MOISTURE.value, {}).get("value")
            temperature = sensors.get(SensorType.TEMPERATURE.value, {}).get("value")
            humidity = sensors.get(SensorType.HUMIDITY.value, {}).get("value")
            nitrogen = sensors.get(SensorType.NITROGEN.value, {}).get("value")
            phosphorus = sensors.get(SensorType.PHOSPHORUS.value, {}).get("value")
            potassium = sensors.get(SensorType.POTASSIUM.value, {}).get("value")
            
            # Extract environmental data
            forecast_rain = context.weather_forecast.get("total_rain_24h", 0)
            ndvi = context.nasa_ndvi
            evapotranspiration = context.nasa_evapotranspiration
            
            # Use weather data if sensor data is missing
            if temperature is None:
                temperature = context.weather_current.get("temperature", 25)
            if humidity is None:
                humidity = context.weather_current.get("humidity", 50)
            
            # Get soil moisture value
            if soil_moisture is None:
                soil_moisture = 50.0  # Default value
            
            # Evaluate irrigation need
            if soil_moisture is not None:
                irrigation_decision = self.calculate_irrigation_need(
                    farm_id=farm_id,
                    soil_moisture=soil_moisture,
                    forecast_rain=forecast_rain,
                    temperature=temperature,
                    evapotranspiration=evapotranspiration,
                    humidity=humidity
                )
                
                if irrigation_decision and irrigation_decision["should_act"]:
                    await self.publish_action_instruction(
                        farm_id=farm_id,
                        decision=irrigation_decision,
                        sensor_data=sensors,
                        environmental_context=context.model_dump()
                    )
            
            # Evaluate fertilization need with enhanced ML-based recommendations
            fertilization_decision = self.calculate_fertilization_need(
                farm_id=farm_id,
                nitrogen=nitrogen,
                phosphorus=phosphorus,
                potassium=potassium,
                ndvi=ndvi,
                temperature=temperature,
                humidity=humidity,
                moisture=soil_moisture,
                soil_type=context.farm_metadata.get("soil_type", "Loamy"),
                crop_type=context.farm_metadata.get("crop_type", "Wheat")
            )
            
            if fertilization_decision and fertilization_decision["should_act"]:
                await self.publish_action_instruction(
                    farm_id=farm_id,
                    decision=fertilization_decision,
                    sensor_data=sensors,
                    environmental_context=context.model_dump()
                )
                
        except Exception as e:
            logger.error(f"❌ Error in decision evaluation: {str(e)}")
    
    async def publish_action_instruction(
        self,
        farm_id: int,
        decision: Dict[str, Any],
        sensor_data: Dict,
        environmental_context: Dict
    ):
        """Publish ActionInstruction event to Redis"""
        try:
            action_instruction = ActionInstruction(
                farm_id=farm_id,
                action_type=decision["action_type"],
                priority=decision["priority"],
                trigger_conditions=decision["reasoning"],
                ai_reasoning=decision["reasoning"],
                recommended_amount=decision.get("recommended_amount"),
                recommended_duration=decision.get("recommended_duration"),
                timestamp=datetime.utcnow(),
                sensor_data=sensor_data,
                environmental_context=environmental_context
            )
            
            # Publish to Redis
            await self.redis_client.publish(
                "events:action_instruction",
                action_instruction.model_dump_json()
            )
            
            logger.info(f"📤 Published ActionInstruction: {decision['action_type'].value} for farm {farm_id}")
            
        except Exception as e:
            logger.error(f"❌ Error publishing action instruction: {str(e)}")
    
    async def listen_for_events(self):
        """Subscribe to both SensorUpdate and EnvironmentalContext events"""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("events:sensor_update", "events:environmental_context")
            
            logger.info("👂 Listening for SensorUpdate and EnvironmentalContext events...")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        channel = message["channel"]
                        data = json.loads(message["data"])
                        
                        if channel == "events:sensor_update":
                            sensor_update = SensorUpdate(**data)
                            self.update_sensor_data(sensor_update)
                            
                            # Trigger decision evaluation
                            asyncio.create_task(self.evaluate_and_decide(sensor_update.farm_id))
                        
                        elif channel == "events:environmental_context":
                            context = EnvironmentalContext(**data)
                            self.update_environmental_context(context)
                            
                            # Trigger decision evaluation
                            asyncio.create_task(self.evaluate_and_decide(context.farm_id))
                    
                    except Exception as e:
                        logger.error(f"❌ Error processing event: {str(e)}")
                        
        except Exception as e:
            logger.error(f"❌ Redis subscription error: {str(e)}")


async def start_agronomist_listener(redis_client: redis.Redis):
    """
    Initialize and start the Agronomist agent
    This runs as a background task in the FastAPI app
    """
    try:
        logger.info("🚀 Starting Agronomist Agent...")
        
        agent = AgronomistAgent(redis_client)
        
        # Start listening for events
        await agent.listen_for_events()
        
    except Exception as e:
        logger.error(f"❌ Agronomist Agent failed: {str(e)}")
        raise
