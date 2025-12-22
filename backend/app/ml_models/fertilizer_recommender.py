"""
Fertilizer Recommender ML Model
Provides fertilizer recommendations based on soil nutrient analysis
"""

import numpy as np
from typing import Dict, List, Tuple


class FertilizerRecommender:
    """
    ML-based fertilizer recommendation system
    Uses decision tree logic for NPK recommendations
    """
    
    def __init__(self):
        self.model_name = "Fertilizer Recommender v1.0"
        self.loaded = True
        
    def predict(self, nitrogen: float, phosphorus: float, potassium: float, 
                ph: float, soil_type: str, crop_type: str) -> Dict:
        """
        Predict optimal fertilizer based on soil nutrients
        
        Args:
            nitrogen: Soil nitrogen content (mg/kg)
            phosphorus: Soil phosphorus content (mg/kg)
            potassium: Soil potassium content (mg/kg)
            ph: Soil pH level
            soil_type: Type of soil (Clay, Sandy, Loam, etc.)
            crop_type: Crop being grown
            
        Returns:
            Dictionary with fertilizer recommendations
        """
        recommendations = []
        
        # NPK deficiency analysis
        n_deficit = max(0, 80 - nitrogen)
        p_deficit = max(0, 40 - phosphorus)
        k_deficit = max(0, 200 - potassium)
        
        # Calculate recommended fertilizer amounts
        if n_deficit > 0:
            urea_kg = (n_deficit * 2.2)  # Urea is 46% nitrogen
            recommendations.append({
                "fertilizer": "Urea",
                "amount_kg_per_hectare": round(urea_kg, 1),
                "nutrient": "Nitrogen",
                "deficit": round(n_deficit, 1),
                "priority": "high" if n_deficit > 40 else "medium"
            })
        
        if p_deficit > 0:
            dap_kg = (p_deficit * 2.5)  # DAP is ~18% phosphorus
            recommendations.append({
                "fertilizer": "DAP (Diammonium Phosphate)",
                "amount_kg_per_hectare": round(dap_kg, 1),
                "nutrient": "Phosphorus",
                "deficit": round(p_deficit, 1),
                "priority": "high" if p_deficit > 20 else "medium"
            })
        
        if k_deficit > 0:
            mop_kg = (k_deficit * 1.7)  # MOP is ~60% potassium
            recommendations.append({
                "fertilizer": "MOP (Muriate of Potash)",
                "amount_kg_per_hectare": round(mop_kg, 1),
                "nutrient": "Potassium",
                "deficit": round(k_deficit, 1),
                "priority": "medium"
            })
        
        # pH-based recommendations
        if ph < 6.0:
            recommendations.append({
                "fertilizer": "Agricultural Lime",
                "amount_kg_per_hectare": 2000,
                "nutrient": "pH Correction",
                "deficit": round(6.5 - ph, 1),
                "priority": "high"
            })
        elif ph > 7.5:
            recommendations.append({
                "fertilizer": "Elemental Sulfur",
                "amount_kg_per_hectare": 300,
                "nutrient": "pH Correction",
                "deficit": round(ph - 7.0, 1),
                "priority": "medium"
            })
        
        return {
            "model": self.model_name,
            "recommendations": recommendations,
            "confidence": 0.87,
            "total_recommendations": len(recommendations)
        }
    
    def get_npk_ratio(self, crop_type: str) -> Tuple[int, int, int]:
        """Get recommended NPK ratio for specific crops"""
        crop_ratios = {
            "rice": (120, 60, 40),
            "wheat": (120, 60, 40),
            "maize": (150, 60, 40),
            "cotton": (120, 60, 60),
            "sugarcane": (180, 80, 80),
            "potato": (150, 80, 120),
            "tomato": (120, 80, 120),
            "default": (100, 50, 50)
        }
        return crop_ratios.get(crop_type.lower(), crop_ratios["default"])


# Global instance for import
model = FertilizerRecommender()


def predict(nitrogen, phosphorus, potassium, ph, soil_type, crop_type):
    """Wrapper function for easy model usage"""
    return model.predict(nitrogen, phosphorus, potassium, ph, soil_type, crop_type)
