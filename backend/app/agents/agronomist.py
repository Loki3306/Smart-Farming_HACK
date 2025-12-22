"""
Agronomist Agent
Provides expert crop management and cultivation advice
"""

from typing import Dict, List
from datetime import datetime


class AgronomistAgent:
    """
    AI Agronomist that provides crop-specific cultivation guidance
    Analyzes growth stage, soil conditions, and provides expert advice
    """
    
    def __init__(self):
        self.agent_name = "AI Agronomist v1.0"
        self.expertise = [
            "Crop rotation planning",
            "Pest and disease management",
            "Soil health optimization",
            "Seasonal planning",
            "Yield optimization"
        ]
        self.loaded = True
        
    def analyze_crop_health(self, crop_type: str, growth_stage: str, 
                           temperature: float, humidity: float, 
                           rainfall: float = 0) -> Dict:
        """
        Analyze crop health and provide cultivation recommendations
        
        Args:
            crop_type: Type of crop
            growth_stage: Current growth stage (germination, vegetative, flowering, maturity)
            temperature: Current temperature in Celsius
            humidity: Air humidity percentage
            rainfall: Recent rainfall in mm
            
        Returns:
            Dictionary with agronomic recommendations
        """
        recommendations = []
        alerts = []
        
        # Temperature-based crop health analysis
        crop_temp_ranges = {
            "rice": {"optimal": (25, 32), "min": 20, "max": 35},
            "wheat": {"optimal": (15, 25), "min": 10, "max": 30},
            "cotton": {"optimal": (25, 35), "min": 15, "max": 40},
            "maize": {"optimal": (20, 30), "min": 15, "max": 35},
            "sugarcane": {"optimal": (25, 32), "min": 20, "max": 38},
        }
        
        crop_info = crop_temp_ranges.get(crop_type.lower(), {"optimal": (20, 30), "min": 15, "max": 35})
        
        if temperature < crop_info["min"]:
            alerts.append({
                "type": "temperature",
                "severity": "high",
                "message": f"Temperature too low for {crop_type} ({temperature}°C < {crop_info['min']}°C)",
                "action": "Monitor for cold damage. Consider frost protection if temperature drops further."
            })
        elif temperature > crop_info["max"]:
            alerts.append({
                "type": "temperature",
                "severity": "high",
                "message": f"Temperature too high for {crop_type} ({temperature}°C > {crop_info['max']}°C)",
                "action": "Increase irrigation frequency. Apply mulch. Monitor for heat stress symptoms."
            })
        
        # Humidity-based disease risk
        if humidity > 80:
            alerts.append({
                "type": "disease_risk",
                "severity": "medium",
                "message": f"High humidity ({humidity}%) increases fungal disease risk",
                "action": "Monitor for signs of fungal diseases (leaf spots, blights). Ensure good air circulation. Consider preventive fungicide spray."
            })
        
        # Growth stage specific recommendations
        stage_recommendations = self._get_stage_recommendations(crop_type, growth_stage)
        recommendations.extend(stage_recommendations)
        
        # Pest monitoring based on conditions
        if temperature > 25 and humidity > 60:
            recommendations.append({
                "category": "pest_management",
                "recommendation": "Favorable conditions for pest activity. Conduct regular field scouting.",
                "frequency": "Daily inspection recommended",
                "priority": "medium"
            })
        
        return {
            "agent": self.agent_name,
            "crop": crop_type,
            "growth_stage": growth_stage,
            "recommendations": recommendations,
            "alerts": alerts,
            "confidence": 0.91,
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_stage_recommendations(self, crop_type: str, stage: str) -> List[Dict]:
        """Get stage-specific recommendations"""
        stage = stage.lower()
        recommendations = []
        
        if stage == "germination":
            recommendations.append({
                "category": "water_management",
                "recommendation": "Maintain consistent soil moisture for uniform germination",
                "priority": "high"
            })
            recommendations.append({
                "category": "monitoring",
                "recommendation": "Check emergence rate daily. Target >85% germination",
                "priority": "medium"
            })
            
        elif stage == "vegetative":
            recommendations.append({
                "category": "fertilization",
                "recommendation": "Apply nitrogen fertilizer for vigorous vegetative growth",
                "priority": "high"
            })
            recommendations.append({
                "category": "weed_control",
                "recommendation": "Critical period for weed control. Keep field weed-free",
                "priority": "high"
            })
            
        elif stage == "flowering":
            recommendations.append({
                "category": "water_management",
                "recommendation": "Maintain optimal soil moisture. Avoid water stress during flowering",
                "priority": "high"
            })
            recommendations.append({
                "category": "pest_management",
                "recommendation": "Monitor for flower-feeding pests. Protect pollinators",
                "priority": "medium"
            })
            
        elif stage == "maturity":
            recommendations.append({
                "category": "harvest_planning",
                "recommendation": "Monitor crop maturity indicators. Plan harvest logistics",
                "priority": "high"
            })
            recommendations.append({
                "category": "water_management",
                "recommendation": "Reduce irrigation frequency as crop approaches maturity",
                "priority": "medium"
            })
        
        return recommendations
    
    def recommend_crop_rotation(self, previous_crop: str, soil_type: str, 
                                season: str) -> Dict:
        """Recommend next crop based on rotation principles"""
        rotation_suggestions = {
            "rice": ["wheat", "pulses", "vegetables"],
            "wheat": ["rice", "cotton", "pulses"],
            "cotton": ["wheat", "maize", "pulses"],
            "maize": ["wheat", "soybean", "vegetables"],
            "pulses": ["rice", "wheat", "cotton"]
        }
        
        suggestions = rotation_suggestions.get(previous_crop.lower(), ["rice", "wheat", "maize"])
        
        return {
            "previous_crop": previous_crop,
            "recommended_crops": suggestions,
            "rationale": "Crop rotation improves soil health, breaks pest cycles, and enhances nutrient management",
            "confidence": 0.88
        }


# Global instance
agent = AgronomistAgent()


def analyze(crop_type, growth_stage, temperature, humidity, rainfall=0):
    """Wrapper function for easy usage"""
    return agent.analyze_crop_health(crop_type, growth_stage, temperature, humidity, rainfall)
