"""
Meteorologist Agent
Weather analysis and agricultural weather recommendations
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta


class MeteorologistAgent:
    """
    Weather analysis agent for agricultural applications
    Provides weather-based farming recommendations
    """
    
    def __init__(self):
        self.agent_name = "AI Meteorologist v1.0"
        self.loaded = True
        
    def analyze_weather(self, temperature: float, humidity: float, 
                       rainfall: float, wind_speed: float = 0,
                       weather_condition: str = "Clear",
                       forecast: Optional[List[Dict]] = None) -> Dict:
        """
        Analyze weather conditions and provide agricultural recommendations
        
        Args:
            temperature: Current temperature in Celsius
            humidity: Current humidity percentage
            rainfall: Recent rainfall in mm
            wind_speed: Wind speed in km/h
            weather_condition: Weather description
            forecast: Optional 7-day forecast data
            
        Returns:
            Weather analysis with farming recommendations
        """
        recommendations = []
        alerts = []
        
        # Temperature-based recommendations
        if temperature > 35:
            alerts.append({
                "type": "heat_wave",
                "severity": "high",
                "message": f"High temperature alert: {temperature}°C",
                "farming_impact": "Risk of heat stress in crops and livestock",
                "actions": [
                    "Increase irrigation frequency to twice daily",
                    "Apply mulch to reduce soil temperature",
                    "Provide shade for livestock",
                    "Avoid field work during peak heat (12-4 PM)"
                ]
            })
        elif temperature < 5:
            alerts.append({
                "type": "frost_risk",
                "severity": "high",
                "message": f"Low temperature alert: {temperature}°C - Frost risk",
                "farming_impact": "Risk of frost damage to sensitive crops",
                "actions": [
                    "Cover sensitive crops with frost blankets",
                    "Use sprinkler irrigation for frost protection",
                    "Delay planting of warm-season crops",
                    "Harvest mature crops before frost"
                ]
            })
        
        # Rainfall-based recommendations
        if rainfall > 100:
            alerts.append({
                "type": "heavy_rainfall",
                "severity": "high",
                "message": f"Heavy rainfall recorded: {rainfall}mm",
                "farming_impact": "Risk of waterlogging, soil erosion, and nutrient leaching",
                "actions": [
                    "Check and clean drainage systems",
                    "Postpone fertilizer application",
                    "Avoid field operations to prevent soil compaction",
                    "Monitor for disease outbreaks in high moisture"
                ]
            })
            
            recommendations.append({
                "category": "irrigation",
                "priority": "high",
                "recommendation": "Stop all irrigation operations immediately",
                "duration": "3-5 days",
                "rationale": "Soil moisture is saturated from heavy rainfall"
            })
        elif rainfall > 0 and rainfall < 10:
            recommendations.append({
                "category": "irrigation",
                "priority": "low",
                "recommendation": "Light rainfall received. Reduce irrigation by 50%",
                "duration": "24-48 hours",
                "rationale": "Recent light rainfall provides some moisture"
            })
        elif rainfall == 0 and humidity < 40:
            recommendations.append({
                "category": "irrigation",
                "priority": "high",
                "recommendation": "No rainfall and low humidity. Increase irrigation",
                "duration": "Until next rain",
                "rationale": "Dry conditions increase evapotranspiration"
            })
        
        # Humidity-based recommendations
        if humidity > 85:
            recommendations.append({
                "category": "disease_management",
                "priority": "high",
                "recommendation": "High humidity increases fungal disease risk",
                "actions": [
                    "Scout fields for early disease symptoms",
                    "Ensure good air circulation in crop canopy",
                    "Consider preventive fungicide application",
                    "Avoid overhead irrigation"
                ]
            })
        elif humidity < 30:
            recommendations.append({
                "category": "crop_protection",
                "priority": "medium",
                "recommendation": "Very low humidity may stress plants",
                "actions": [
                    "Increase irrigation frequency",
                    "Monitor plants for wilting",
                    "Consider misting for sensitive crops"
                ]
            })
        
        # Wind-based recommendations
        if wind_speed > 40:
            alerts.append({
                "type": "high_wind",
                "severity": "medium",
                "message": f"High wind speed: {wind_speed} km/h",
                "farming_impact": "Risk of crop lodging and physical damage",
                "actions": [
                    "Postpone pesticide/herbicide spraying",
                    "Check greenhouse structures and supports",
                    "Secure loose equipment and materials",
                    "Harvest ripe crops if possible"
                ]
            })
        
        # Weather condition specific advice
        weather_lower = weather_condition.lower()
        if "rain" in weather_lower or "storm" in weather_lower:
            recommendations.append({
                "category": "operations",
                "priority": "high",
                "recommendation": "Postpone all field operations during rainy period",
                "rationale": "Working wet soil causes compaction and damage"
            })
        
        # Forecast-based planning
        if forecast:
            forecast_insights = self._analyze_forecast(forecast)
            recommendations.extend(forecast_insights)
        
        # Calculate comfort index for field work
        comfort_index = self._calculate_comfort_index(temperature, humidity)
        
        return {
            "agent": self.agent_name,
            "timestamp": datetime.now().isoformat(),
            "current_conditions": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "wind_speed": wind_speed,
                "weather": weather_condition,
                "comfort_index": comfort_index
            },
            "alerts": alerts,
            "recommendations": recommendations,
            "field_work_suitability": self._assess_field_work_conditions(
                temperature, humidity, rainfall, wind_speed
            ),
            "confidence": 0.89
        }
    
    def _calculate_comfort_index(self, temperature: float, humidity: float) -> Dict:
        """Calculate comfort index for outdoor work"""
        # Simple heat index calculation
        heat_index = temperature + (0.5 * humidity / 100 * (temperature - 14))
        
        if heat_index < 20:
            comfort = "comfortable"
            description = "Good conditions for outdoor work"
        elif heat_index < 30:
            comfort = "moderate"
            description = "Acceptable for outdoor work with precautions"
        elif heat_index < 40:
            comfort = "uncomfortable"
            description = "Limit outdoor work, take frequent breaks"
        else:
            comfort = "dangerous"
            description = "Avoid outdoor work during peak hours"
        
        return {
            "index": round(heat_index, 1),
            "rating": comfort,
            "description": description
        }
    
    def _assess_field_work_conditions(self, temperature: float, humidity: float,
                                     rainfall: float, wind_speed: float) -> Dict:
        """Assess suitability for field operations"""
        suitability_score = 100
        limiting_factors = []
        
        # Temperature limits
        if temperature < 5 or temperature > 40:
            suitability_score -= 40
            limiting_factors.append("Extreme temperature")
        elif temperature < 10 or temperature > 35:
            suitability_score -= 20
            limiting_factors.append("Suboptimal temperature")
        
        # Rainfall
        if rainfall > 5:
            suitability_score -= 60
            limiting_factors.append("Recent/current rainfall")
        
        # Wind
        if wind_speed > 30:
            suitability_score -= 30
            limiting_factors.append("High wind speed")
        
        # Humidity
        if humidity > 90:
            suitability_score -= 20
            limiting_factors.append("Very high humidity")
        
        suitability_score = max(0, suitability_score)
        
        if suitability_score >= 80:
            rating = "excellent"
            recommendation = "Ideal conditions for field work"
        elif suitability_score >= 60:
            rating = "good"
            recommendation = "Suitable for most field operations"
        elif suitability_score >= 40:
            rating = "fair"
            recommendation = "Proceed with caution, monitor conditions"
        else:
            rating = "poor"
            recommendation = "Postpone field operations if possible"
        
        return {
            "score": suitability_score,
            "rating": rating,
            "recommendation": recommendation,
            "limiting_factors": limiting_factors
        }
    
    def _analyze_forecast(self, forecast: List[Dict]) -> List[Dict]:
        """Analyze weather forecast for planning recommendations"""
        recommendations = []
        
        # Look for rain in next 3 days
        rain_coming = any(
            "rain" in day.get("condition", "").lower() 
            for day in forecast[:3]
        )
        
        if rain_coming:
            recommendations.append({
                "category": "planning",
                "priority": "high",
                "recommendation": "Rain expected in next 3 days - plan operations accordingly",
                "actions": [
                    "Complete pending harvests",
                    "Apply fertilizers before rain",
                    "Postpone irrigation"
                ]
            })
        
        # Look for temperature extremes
        max_temps = [day.get("max_temp", 25) for day in forecast]
        if max(max_temps) > 38:
            recommendations.append({
                "category": "planning",
                "priority": "medium",
                "recommendation": "Heat wave expected - prepare heat stress mitigation",
                "actions": [
                    "Ensure irrigation systems are functioning",
                    "Prepare mulching materials",
                    "Plan early morning or evening field work"
                ]
            })
        
        return recommendations


# Global instance
agent = MeteorologistAgent()


def analyze(temperature, humidity, rainfall, wind_speed=0, weather_condition="Clear", forecast=None):
    """Wrapper function for easy usage"""
    return agent.analyze_weather(temperature, humidity, rainfall, wind_speed, weather_condition, forecast)
