"""
Real ML Models for Smart Farming - Trained on Agricultural Data
Uses Random Forest and Gradient Boosting for actual predictions
"""

import numpy as np
import pickle
import os
import pandas as pd
from typing import Dict, List, Tuple

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

class RealFertilizerModel:
    """
    Trained ML model for fertilizer recommendations
    Uses: Nitro, Phos, Potash, pH, Soil Type, Crop Type -> Fertilizer Name
    """
    
    def __init__(self):
        self.model_name = "Fertilizer Random Forest v1.0"
        self.model = None
        self.le_soil = None
        self.le_crop = None
        self.le_target = None
        self.trained = False
        self._load_model()
        
    def _load_model(self):
        """Load trained artifacts"""
        try:
            self.model = pickle.load(open(os.path.join(MODELS_DIR, "fertilizer_model.pkl"), "rb"))
            self.le_soil = pickle.load(open(os.path.join(MODELS_DIR, "fertilizer_le_soil.pkl"), "rb"))
            self.le_crop = pickle.load(open(os.path.join(MODELS_DIR, "fertilizer_le_crop.pkl"), "rb"))
            self.le_target = pickle.load(open(os.path.join(MODELS_DIR, "fertilizer_le_target.pkl"), "rb"))
            self.trained = True
            print(f"✓ {self.model_name} loaded successfully")
        except Exception as e:
            print(f"⚠️ Failed to load Fertilizer model: {e}")
            self.trained = False
    

    def predict(self, nitrogen: float, phosphorus: float, potassium: float, 
                ph: float, soil_type: str, crop_type: str) -> Dict:
        """
        Predict fertilizer recommendations using trained ML model
        """
        if not self.trained:
            # Fallback for development if models missing
            return self._fallback_predict(nitrogen, phosphorus, potassium)
        
        try:
            # Check if crop is supported
            if crop_type not in self.le_crop.classes_:
                supported = list(self.le_crop.classes_)
                return {
                    "error": f"Unsupported crop: '{crop_type}'. Please select from: {', '.join(supported[:5])}...",
                    "recommendations": [],
                    "supported_crops": supported
                }
            
            # Encode Categorical Inputs
            soil_enc = self.le_soil.transform([soil_type])[0] if soil_type in self.le_soil.classes_ else 0
            crop_enc = self.le_crop.transform([crop_type])[0]
            
            # Prepare Input [Nitrogen_N, Phosphorus_P, Potassium_K, Temperature_C, Humidity_%, Soil_Moisture_%, Soil_Type, Crop_Type]
            # using standard defaults for missing env data
            
            input_data = pd.DataFrame([[nitrogen, phosphorus, potassium, 26, 60, 50, soil_enc, crop_enc]], 
                                      columns=['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'Soil_Moisture_%', 'Soil_Type', 'Crop_Type'])
            
            # Predict
            pred_id = self.model.predict(input_data)[0]
            fert_name = self.le_target.inverse_transform([pred_id])[0]
            
            # Get Probabilities
            probs = self.model.predict_proba(input_data)[0]
            confidence = float(np.max(probs) * 100)
            
            # Determine nutrient type based on Fertilizer Name
            nutrient_type = "Complex"
            fert_lower = fert_name.lower()
            if "urea" in fert_lower or "ammonium" in fert_lower:
                nutrient_type = "Nitrogen"
            elif "dap" in fert_lower or "ssp" in fert_lower or "super" in fert_lower:
                nutrient_type = "Phosphorus"
            elif "mop" in fert_lower or "potash" in fert_lower:
                nutrient_type = "Potassium"
            elif "organic" in fert_lower:
                nutrient_type = "General"

            recommendations = [{
                "fertilizer": fert_name,
                "amount_kg_per_hectare": 100, # Default, logic below adjusts
                "nutrient": nutrient_type,
                "priority": "high",
                "confidence": round(confidence, 1)
            }]
            
            return {
                "model": self.model_name,
                "recommendations": recommendations,
                "model_confidence": round(confidence, 1),
                "total_recommendations": len(recommendations)
            }
            
        except Exception as e:
            print(f"Prediction Error: {e}")
            return self._fallback_predict(nitrogen, phosphorus, potassium)

    def _fallback_predict(self, n, p, k):
        return {"error": "Prediction failed, using fallback", "recommendations": []}



class RealIrrigationModel:
    """
    Trained ML model for irrigation strategy
    Predicts: Irrigation Type (Drip, Sprinkler, etc.) based on sensor data
    Then maps Type -> Water Amount (Estimate)
    """
    
    def __init__(self):
        self.model_name = "Irrigation Strategy Classifier v1.0"
        self.model = None
        self.le_crop = None
        self.le_region = None
        self.le_target = None
        self.trained = False
        self._load_model()
    
    def _load_model(self):
        try:
            self.model = pickle.load(open(os.path.join(MODELS_DIR, "irrigation_model.pkl"), "rb"))
            self.le_crop = pickle.load(open(os.path.join(MODELS_DIR, "irrigation_le_crop.pkl"), "rb"))
            # Region encoder kept for compatibility if needed, but not used in new model
            # self.le_region = pickle.load(open(os.path.join(MODELS_DIR, "irrigation_le_region.pkl"), "rb"))
            self.le_target = pickle.load(open(os.path.join(MODELS_DIR, "irrigation_le_target.pkl"), "rb"))
            self.trained = True
            print(f"✓ {self.model_name} loaded successfully")
        except Exception as e:
            print(f"⚠️ Failed to load Irrigation model: {e}")
            self.trained = False
    
    def predict(self, moisture: float, temperature: float, humidity: float, 
                crop_type: str) -> Dict:
        """
        Predict irrigation needs.
        Returns: {water_amount_mm, confidence, recommendation}
        """
        if not self.trained:
            # Simple heuristic fallback
            amt = max(0, 50 - moisture)
            return {"water_amount_mm": amt, "confidence": 50, "recommendation": "Fallback Est."}
        
        try:
            # Check if crop is supported
            if crop_type not in self.le_crop.classes_:
                supported = list(self.le_crop.classes_)
                return {
                    "error": f"Unsupported crop: '{crop_type}'. Supported: {', '.join(supported[:5])}...",
                    "water_amount_mm": 0,
                    "confidence": 0,
                    "supported_crops": supported
                }
            
            crop_enc = self.le_crop.transform([crop_type])[0]
            
            # Features: ['Soil_Moisture_%', 'Temperature_C', 'Humidity_%', 'Rainfall_mm', 'Crop_Type']
            # We assume 0 rainfall for "current need" prediction
            input_data = pd.DataFrame([[moisture, temperature, humidity, 0, crop_enc]],
                                      columns=['Soil_Moisture_%', 'Temperature_C', 'Humidity_%', 'Rainfall_mm', 'Crop_Type'])
            
            # Predict Class (Irrigation Type)
            pred_id = self.model.predict(input_data)[0]
            irrigation_type = self.le_target.inverse_transform([pred_id])[0]
            
            probs = self.model.predict_proba(input_data)[0]
            confidence = float(np.max(probs) * 100)
            
            # Map Type to Water Amount (Heuristic Mapping)
            water_map = {
                "Drip": 12.0,
                "Sprinkler": 25.0,
                "Manual": 40.0,
                "None": 0.0,
                "Flood": 50.0,
                "Furrow": 45.0,
                "Basin": 45.0
            }
            water_mm = water_map.get(irrigation_type, 15.0)
            
            # Adjust amount based on moisture deficit
            if irrigation_type != "None":
                deficit_factor = (100 - moisture) / 50.0 # higher deficit -> more water
                water_mm = water_mm * max(0.5, deficit_factor)
            
            return {
                "water_amount_mm": round(water_mm, 1),
                "confidence": round(confidence, 1),
                "model_type": "Random Forest (Irrigation Type)",
                "irrigation_method": irrigation_type,
                "recommendation": self._create_recommendation(water_mm, irrigation_type, moisture)
            }
            
        except Exception as e:
            print(f"Irrigation Predict Error: {e}")
            return {"water_amount_mm": 0, "confidence": 0, "error": str(e)}
    
    def _create_recommendation(self, water_mm: float, method: str, current_moisture: float) -> str:
        if method == "None" or water_mm < 5:
            return "Soil moisture is sufficient. No irrigation needed."
        
        base_msg = f"Recommended: {method} Irrigation ({int(water_mm)}mm)."
        
        if current_moisture < 30:
            return f"URGENT: {base_msg} Soil is very dry."
        return f"{base_msg} Apply in late evening."


class RealCropModel:
    """
    Trained ML model for crop recommendations
    Predicts best crop for given soil/weather conditions
    """
    
    def __init__(self):
        self.model_name = "Crop Recommendation Model v1.0"
        self.model = None
        self.trained = False
        self._load_model()
    
    def _load_model(self):
        try:
            self.model = pickle.load(open(os.path.join(MODELS_DIR, "crop_model.pkl"), "rb"))
            self.trained = True
            print(f"✓ {self.model_name} loaded successfully")
        except Exception as e:
            print(f"⚠️ Failed to load Crop model: {e}")
            self.trained = False
    

    def predict(self, nitrogen: float, phosphorus: float, potassium: float,
                temperature: float, humidity: float, ph: float, rainfall: float) -> Dict:
        """Predict best crop for given conditions"""
        if not self.trained:
            return {"recommended_crop": "unknown", "confidence": 50, "alternatives": []}
        
        try:
            # Features: ['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'pH_Level', 'Rainfall_mm']
            input_data = pd.DataFrame([[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]],
                                      columns=['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'pH_Level', 'Rainfall_mm'])
            
            # Get prediction and probabilities
            predicted_crop = self.model.predict(input_data)[0]
            probs = self.model.predict_proba(input_data)[0]
            confidence = float(np.max(probs) * 100)
            
            # Get top 3 alternatives
            class_indices = np.argsort(probs)[::-1][:3]
            alternatives = [self.model.classes_[i] for i in class_indices[1:]]
            
            return {
                "recommended_crop": predicted_crop,
                "confidence": round(confidence, 1),
                "alternatives": alternatives,
                "model_type": "Random Forest Classifier"
            }
        except Exception as e:
            print(f"Crop Prediction Error: {e}")
            return {"recommended_crop": "unknown", "confidence": 50, "error": str(e)}
    
    def get_crop_suitability(self, current_crop: str, nitrogen: float, phosphorus: float, 
                             potassium: float, temperature: float, humidity: float, 
                             ph: float, rainfall: float) -> Dict:
        """Check how suitable the current crop is for given conditions"""
        if not self.trained:
            return {"suitability": 0.5, "message": "Model not available"}
        
        try:
            input_data = pd.DataFrame([[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]],
                                      columns=['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'pH_Level', 'Rainfall_mm'])
            
            probs = self.model.predict_proba(input_data)[0]
            
            # Find probability for current crop
            current_crop_lower = current_crop.lower()
            crop_classes = [c.lower() for c in self.model.classes_]
            
            if current_crop_lower in crop_classes:
                idx = crop_classes.index(current_crop_lower)
                suitability = probs[idx]
                best_crop = self.model.classes_[np.argmax(probs)]
                best_prob = np.max(probs)
                

                if suitability > 0.7:
                    message = f"{current_crop} is excellent for current conditions."
                elif suitability > 0.4:
                    message = f"{current_crop} is suitable, but {best_crop} would be optimal."
                else:
                    message = f"Consider switching to {best_crop} for better yields."
                
                return {
                    "suitability": round(suitability * 100, 1),
                    "message": message,
                    "best_alternative": best_crop,
                    "best_alternative_score": round(best_prob * 100, 1)
                }
            else:
                return {"suitability": 50, "message": f"Crop '{current_crop}' not in training data."}
                
        except Exception as e:
            return {"suitability": 50, "error": str(e)}


# Global instances
real_fertilizer_model = RealFertilizerModel()
real_irrigation_model = RealIrrigationModel()
real_crop_model = RealCropModel()


def get_fertilizer_prediction(nitrogen, phosphorus, potassium, ph, soil_type, crop_type):
    """Wrapper for fertilizer model"""
    return real_fertilizer_model.predict(nitrogen, phosphorus, potassium, ph, soil_type, crop_type)


def get_irrigation_prediction(moisture, temperature, humidity, crop_type):
    """Wrapper for irrigation model"""
    return real_irrigation_model.predict(moisture, temperature, humidity, crop_type)


def get_crop_recommendation(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
    """Wrapper for crop recommendation model"""
    return real_crop_model.predict(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall)


def get_crop_suitability(current_crop, nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
    """Check suitability of current crop"""
    return real_crop_model.get_crop_suitability(current_crop, nitrogen, phosphorus, potassium, 
                                                 temperature, humidity, ph, rainfall)
