"""
Row Spacing Optimizer Service
Provides optimal spacing recommendations based on crop, soil, and equipment
"""

from typing import Dict, List, Optional, Tuple
import asyncpg
import joblib
import os
import pandas as pd
import numpy as np


# Optimal spacing data from ICAR research
OPTIMAL_SPACING_DATA = {
    'rice': {
        'optimal_row_spacing': 20,
        'optimal_plant_spacing': 20,
        'baseline_spacing': 15,
        'max_improvement_percent': 37.8,
        'optimal_yield_kg_ha': 4190,
        'plants_per_hectare': 250000,
        'source': 'ICAR-NRRI SRI Study 2023'
    },
    'wheat': {
        'optimal_row_spacing': 15,
        'optimal_plant_spacing': 5,
        'baseline_spacing': 25,
        'max_improvement_percent': 19.2,
        'optimal_yield_kg_ha': 4554,
        'plants_per_hectare': 1333333,
        'source': 'ICAR-IIWBR Karnal 2022'
    },
    'maize': {
        'optimal_row_spacing': 60,
        'optimal_plant_spacing': 20,
        'baseline_spacing': 75,
        'max_improvement_percent': 21.0,
        'optimal_yield_kg_ha': 7500,
        'plants_per_hectare': 83333,
        'source': 'ICAR-IIMR 2023'
    },
    'cotton': {
        'optimal_row_spacing': 60,
        'optimal_plant_spacing': 30,
        'baseline_spacing': 90,
        'max_improvement_percent': 27.3,
        'optimal_yield_kg_ha': 2800,
        'plants_per_hectare': 55556,
        'source': 'ICAR-CICR Nagpur 2023'
    },
    'soybean': {
        'optimal_row_spacing': 30,
        'optimal_plant_spacing': 10,
        'baseline_spacing': 45,
        'max_improvement_percent': 22.2,
        'optimal_yield_kg_ha': 2200,
        'plants_per_hectare': 333333,
        'source': 'ICAR-IISR Indore 2023'
    },
    'tomato': {
        'optimal_row_spacing': 60,
        'optimal_plant_spacing': 30,
        'baseline_spacing': 75,
        'max_improvement_percent': 33.3,
        'optimal_yield_kg_ha': 40000,
        'plants_per_hectare': 55556,
        'source': 'ICAR-IIHR Bangalore 2023'
    },
    'potato': {
        'optimal_row_spacing': 50,
        'optimal_plant_spacing': 20,
        'baseline_spacing': 60,
        'max_improvement_percent': 25.0,
        'optimal_yield_kg_ha': 25000,
        'plants_per_hectare': 100000,
        'source': 'ICAR-CPRI Shimla 2023'
    },
    'onion': {
        'optimal_row_spacing': 15,
        'optimal_plant_spacing': 10,
        'baseline_spacing': 20,
        'max_improvement_percent': 25.0,
        'optimal_yield_kg_ha': 25000,
        'plants_per_hectare': 666667,
        'source': 'ICAR-DOGR Pune 2023'
    }
}


class SpacingOptimizerService:
    """Service for row spacing optimization recommendations"""
    
    def __init__(self):
        self.model = None
        self.crop_encoder = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained spacing-aware model"""
        try:
            model_path = 'app/ml_models/compiled_models/yield_predictor_with_spacing.pkl'
            encoder_path = 'app/ml_models/compiled_models/crop_type_encoder.pkl'
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print("[SpacingOptimizer] ✅ Model loaded successfully")
            else:
                print(f"[SpacingOptimizer] ⚠️ Model not found at {model_path}")
            
            if os.path.exists(encoder_path):
                self.crop_encoder = joblib.load(encoder_path)
                print("[SpacingOptimizer] ✅ Encoder loaded successfully")
        except Exception as e:
            print(f"[SpacingOptimizer] ❌ Error loading model: {e}")
    
    def get_optimal_spacing(
        self,
        crop_type: str,
        soil_fertility_level: str = 'medium',
        farm_equipment: str = 'manual'
    ) -> Dict:
        """
        Get optimal spacing recommendation for a crop
        
        Args:
            crop_type: Type of crop (rice, wheat, maize, etc.)
            soil_fertility_level: low, medium, or high
            farm_equipment: manual, tractor, transplanter, seed_drill
        
        Returns:
            Dictionary with optimal spacing and expected results
        """
        crop_lower = crop_type.lower()
        
        if crop_lower not in OPTIMAL_SPACING_DATA:
            return {
                "error": f"Crop '{crop_type}' not yet supported. Available: {list(OPTIMAL_SPACING_DATA.keys())}"
            }
        
        optimal_data = OPTIMAL_SPACING_DATA[crop_lower]
        
        # Adjust spacing based on fertility level
        row_spacing = optimal_data['optimal_row_spacing']
        plant_spacing = optimal_data['optimal_plant_spacing']
        
        # Lower fertility = wider spacing (less competition)
        if soil_fertility_level == 'low':
            row_spacing *= 1.15
            plant_spacing *= 1.15
        elif soil_fertility_level == 'high':
            row_spacing *= 0.95
            plant_spacing *= 0.95
        
        # Calculate plant density
        plants_per_sqm = (100 / row_spacing) * (100 / plant_spacing)
        plants_per_hectare = int(plants_per_sqm * 10000)
        
        return {
            "crop_type": crop_type,
            "optimal_row_spacing_cm": round(row_spacing, 1),
            "optimal_plant_spacing_cm": round(plant_spacing, 1),
            "plants_per_hectare": plants_per_hectare,
            "expected_yield_kg_ha": optimal_data['optimal_yield_kg_ha'],
            "yield_improvement_percent": optimal_data['max_improvement_percent'],
            "baseline_spacing_cm": optimal_data['baseline_spacing'],
            "soil_fertility_level": soil_fertility_level,
            "farm_equipment": farm_equipment,
            "source": optimal_data['source']
        }
    
    def predict_yield_at_spacing(
        self,
        crop_type: str,
        row_spacing_cm: float,
        soil_data: Dict,
        weather_data: Dict
    ) -> float:
        """
        Predict yield at a specific row spacing using ML model
        
        Args:
            crop_type: Type of crop
            row_spacing_cm: Row spacing to test
            soil_data: Soil parameters (N, P, K, pH, moisture)
            weather_data: Weather parameters (temp, rainfall, etc.)
        
        Returns:
            Predicted yield in kg/ha
        """
        if self.model is None or self.crop_encoder is None:
            # Fallback to simple calculation
            return self._simple_yield_estimate(crop_type, row_spacing_cm)
        
        try:
            # Prepare features
            crop_encoded = self.crop_encoder.transform([crop_type.lower()])[0]
            plant_spacing = row_spacing_cm * 0.4  # Approximate plant spacing
            plant_density = (100 / row_spacing_cm) * (100 / plant_spacing)
            
            features = {
                'crop_type_encoded': crop_encoded,
                'soil_moisture_%': soil_data.get('moisture', 70),
                'soil_pH': soil_data.get('pH', 6.5),
                'nitrogen_ppm': soil_data.get('N', 80),
                'phosphorus_ppm': soil_data.get('P', 50),
                'potassium_ppm': soil_data.get('K', 60),
                'temperature_C': weather_data.get('temperature', 28),
                'rainfall_mm': weather_data.get('rainfall', 800),
                'humidity_%': weather_data.get('humidity', 75),
                'sunlight_hours': weather_data.get('sunlight', 7),
                'row_spacing_cm': row_spacing_cm,
                'plant_spacing_cm': plant_spacing,
                'plant_density_per_sqm': plant_density,
                'pesticide_usage_ml': 200,
                'total_days': 120,
                'NDVI_index': 0.75
            }
            
            X = pd.DataFrame([features])
            prediction = self.model.predict(X)[0]
            return float(prediction)
            
        except Exception as e:
            print(f"[SpacingOptimizer] ❌ Prediction error: {e}")
            return self._simple_yield_estimate(crop_type, row_spacing_cm)
    
    def _simple_yield_estimate(self, crop_type: str, row_spacing_cm: float) -> float:
        """Simple fallback yield estimate"""
        crop_lower = crop_type.lower()
        if crop_lower not in OPTIMAL_SPACING_DATA:
            return 3000.0
        
        optimal_data = OPTIMAL_SPACING_DATA[crop_lower]
        optimal_spacing = optimal_data['optimal_row_spacing']
        optimal_yield = optimal_data['optimal_yield_kg_ha']
        
        # Yield decreases exponentially as spacing deviates from optimal
        spacing_diff = abs(row_spacing_cm - optimal_spacing)
        impact_factor = np.exp(-0.02 * spacing_diff)
        
        yield_estimate = optimal_yield * (0.7 + 0.3 * impact_factor)
        return float(yield_estimate)
    
    def compare_spacings(
        self,
        crop_type: str,
        current_spacing_cm: float,
        soil_data: Dict,
        weather_data: Dict
    ) -> Dict:
        """
        Compare current spacing vs optimal spacing
        
        Returns:
            Comparison showing yield improvement potential
        """
        optimal_info = self.get_optimal_spacing(crop_type)
        
        if "error" in optimal_info:
            return optimal_info
        
        optimal_spacing = optimal_info['optimal_row_spacing_cm']
        
        # Predict yields
        current_yield = self.predict_yield_at_spacing(
            crop_type, current_spacing_cm, soil_data, weather_data
        )
        
        optimal_yield = self.predict_yield_at_spacing(
            crop_type, optimal_spacing, soil_data, weather_data
        )
        
        yield_diff = optimal_yield - current_yield
        improvement_percent = (yield_diff / current_yield) * 100 if current_yield > 0 else 0
        
        return {
            "current_spacing_cm": current_spacing_cm,
            "current_yield_kg_ha": round(current_yield, 2),
            "optimal_spacing_cm": optimal_spacing,
            "optimal_yield_kg_ha": round(optimal_yield, 2),
            "yield_increase_kg_ha": round(yield_diff, 2),
            "improvement_percent": round(improvement_percent, 2),
            "recommendation": f"Change spacing from {current_spacing_cm}cm to {optimal_spacing}cm for {improvement_percent:.1f}% higher yield"
        }


# Global instance
spacing_optimizer = SpacingOptimizerService()
