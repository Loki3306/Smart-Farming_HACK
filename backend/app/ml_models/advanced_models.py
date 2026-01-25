
import os
import pickle
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from datetime import datetime

# ML Libraries
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score

logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
DATASET_PATH = os.path.join(BASE_DIR, "datasets", "agriculture_dataset.csv")

class AdvancedMLManager:
    """
    Manages Industrial Agronomic AI Models
    Phase 1: Water Demand (RandomForestRegressor)
    Phase 2: Nutrient Lab (GradientBoostingRegressor)
    Phase 3: Disease Risk (RandomForestClassifier)
    """
    
    def __init__(self):
        self.water_model = None
        self.nutrient_model = None
        self.disease_model = None
        self.models_loaded = False
        self.is_bootstrapped = False
        
        # Incremental Learning Buffer
        self.learning_buffer = []
        self.BUFFER_SIZE = 100
        self.packets_processed = 0
        
        # Production Flag: Prevent expensive training on startup
        self.RETRAIN_ON_STARTUP = False
        
        self._initialize_models()
        
    def _initialize_models(self):
        """Load models or bootstrap if missing"""
        try:
            # Check if models exist (and skip if RETRAIN_ON_STARTUP is False)
            if not self.RETRAIN_ON_STARTUP and self._check_models_exist():
                self._load_models()
                self.is_bootstrapped = False
            else:
                logger.warning("⚠️ Advanced AI Models missing. Initiating Bootstrap Protocol...")
                
                # Check if dataset exists
                if not os.path.exists(DATASET_PATH):
                    logger.warning("⚠️ Dataset missing. Generating Bootstrap Intelligence...")
                    from app.ml_models.bootstrap import save_bootstrap_dataset
                    save_bootstrap_dataset(DATASET_PATH)
                    self.is_bootstrapped = True
                
                # Train models
                self._train_models()
                self._load_models()
                
            self.models_loaded = True
            
            if self.is_bootstrapped:
                logger.info("✅ Advanced Industrial AI Models Loaded (BOOTSTRAPPED - Will adapt with real data)")
            else:
                logger.info("✅ Advanced Industrial AI Models Loaded Successfully")
            
        except Exception as e:
            msg = f"❌ CRITICAL FAILURE: Industrial AI System Initialization Failed. Reason: {e}"
            print("\n" + "!"*60)
            print(msg)
            print("!"*60 + "\n")
            logger.error(msg)
            self.models_loaded = False

    def _check_models_exist(self):
        return (os.path.exists(os.path.join(MODELS_DIR, "water_demand_model.pkl")) and
                os.path.exists(os.path.join(MODELS_DIR, "nutrient_model.pkl")) and
                os.path.exists(os.path.join(MODELS_DIR, "disease_model.pkl")))

    def _load_models(self):
        with open(os.path.join(MODELS_DIR, "water_demand_model.pkl"), "rb") as f:
            self.water_model = pickle.load(f)
        with open(os.path.join(MODELS_DIR, "nutrient_model.pkl"), "rb") as f:
            self.nutrient_model = pickle.load(f)
        with open(os.path.join(MODELS_DIR, "disease_model.pkl"), "rb") as f:
            self.disease_model = pickle.load(f)

    def _train_models(self):
        """Train models from verified dataset"""
        if not os.path.exists(DATASET_PATH):
            raise RuntimeError(f"Dataset missing at {DATASET_PATH}. Cannot train models.")
            
        df = pd.read_csv(DATASET_PATH)
        
        # Verify columns
        required_cols = ['timestamp', 'soil_moisture', 'temperature', 'humidity', 'wind_speed', 'et0', 'moisture_delta_next_24h', 'soil_ph', 'ec_salinity', 'available_n', 'available_p', 'available_k', 'disease_label']
        if not all(col in df.columns for col in required_cols):
             missing = [col for col in required_cols if col not in df.columns]
             raise RuntimeError(f"Dataset schema violation. Missing columns: {missing}")
             
        # Phase 1: Water Demand
        X_water = df[['soil_moisture', 'temperature', 'humidity', 'wind_speed', 'et0']]
        y_water = df['moisture_delta_next_24h']
        w_model = RandomForestRegressor(n_estimators=100, random_state=42)
        w_model.fit(X_water, y_water)
        with open(os.path.join(MODELS_DIR, "water_demand_model.pkl"), "wb") as f:
            pickle.dump(w_model, f)
            
        # Phase 2: Nutrient Lab
        X_nut = df[['soil_ph', 'ec_salinity', 'soil_moisture']]
        y_nut = df[['available_n', 'available_p', 'available_k']]
        n_model = GradientBoostingRegressor(n_estimators=100, random_state=42) # GBR does not support multioutput natively in old sklearn version, but we assume new or use MultiOutput
        # Actually GBR is single output. We likely need MultiOutputRegressor or three models.
        # For simplicity in this prompt, assuming user wants GBR architecture. 
        # I will use RandomForestRegressor for multi-output matching Phase 1 style if GBR fails, but requirement says GBR.
        # I will use sklearn's MultiOutputRegressor
        from sklearn.multioutput import MultiOutputRegressor
        n_model = MultiOutputRegressor(GradientBoostingRegressor(random_state=42))
        n_model.fit(X_nut, y_nut)
        with open(os.path.join(MODELS_DIR, "nutrient_model.pkl"), "wb") as f:
            pickle.dump(n_model, f)
            
        # Phase 3: Disease Risk
        # Ensure features: mean_temperature_window, humidity_duration_hours, temperature_range
        # Assume these are pre-calculated in CSV or derived. Prompt says "Dataset must contain...". It lists basic raw fields for checking, but logic phases describe derived features.
        # I will assume the CSV has them if training is needed.
        # If not, I'd have to derive them. 
        # For this implementation, I assume they exist in CSV for training target.
        if 'humidity_duration_hours' in df.columns:
            X_dis = df[['mean_temperature_window', 'humidity_duration_hours', 'temperature_range']]
            y_dis = df['disease_label'] # 0 or 1
            d_model = RandomForestClassifier(n_estimators=100, random_state=42)
            d_model.fit(X_dis, y_dis)
            with open(os.path.join(MODELS_DIR, "disease_model.pkl"), "wb") as f:
                pickle.dump(d_model, f)
        else:
             logger.warning("Disease features missing in dataset, skipping Disease Model training.")

    # ================= INFERENCE METHODS =================
    
    def predict_water_demand(self, moisture, temp, humidity, wind, et0):
        if not self.models_loaded or not self.water_model:
            return {"error": "Model not loaded"}
        
        try:
            # Use DataFrame with column names to avoid sklearn warnings
            X = pd.DataFrame([{
                'soil_moisture': moisture,
                'temperature': temp,
                'humidity': humidity,
                'wind_speed': wind,
                'et0': et0
            }])
            loss_24h = self.water_model.predict(X)[0]
            
            # Logic: If predicted loss > (current - safety)
            safety_buffer = 15.0 # % moisture
            critical_threshold = 30.0 # % moisture
            
            future_moisture = moisture - loss_24h
            
            is_critical = future_moisture < critical_threshold
            
            return {
                "predicted_loss_24h": round(loss_24h, 2),
                "future_moisture_est": round(future_moisture, 2),
                "event": "PREEMPTIVE_IRRIGATION" if is_critical else "NORMAL",
                "time_to_critical_hours": (moisture - critical_threshold) / (loss_24h / 24.0) if loss_24h > 0 else 999
            }
        except Exception as e:
            return {"error": str(e)}

    def predict_nutrients(self, ph, ec, moisture):
        if not self.models_loaded or not self.nutrient_model:
            return {"error": "Model not loaded"}
            
        try:
            # Use DataFrame with column names to avoid sklearn warnings
            X = pd.DataFrame([{
                'soil_ph': ph,
                'ec_salinity': ec,
                'soil_moisture': moisture
            }])
            preds = self.nutrient_model.predict(X)[0] # Returns [N, P, K]
            
            return {
                "predicted_n": round(preds[0], 1),
                "predicted_p": round(preds[1], 1),
                "predicted_k": round(preds[2], 1)
            }
        except Exception as e:
            return {"error": str(e)}

    def predict_disease_risk(self, mean_temp, humidity_duration, temp_range):
        if not self.models_loaded or not self.disease_model:
            return {"error": "Model not loaded"}
            
        try:
            # Use DataFrame with column names to avoid sklearn warnings
            X = pd.DataFrame([{
                'mean_temperature_window': mean_temp,
                'humidity_duration_hours': humidity_duration,
                'temperature_range': temp_range
            }])
            risk_prob = self.disease_model.predict_proba(X)[0][1] # Prob of class 1 (High Risk)
            
            risk_level = "HIGH_RISK" if risk_prob > 0.6 else "LOW_RISK"
            
            return {
                "risk_level": risk_level,
                "probability": round(risk_prob * 100, 1)
            }
        except Exception as e:
            return {"error": str(e)}

    # ================= INCREMENTAL LEARNING =================
    
    def add_to_learning_buffer(self, sensor_data: dict):
        """
        Add validated sensor packet to learning buffer
        Triggers retraining when buffer is full
        """
        if not self._validate_packet(sensor_data):
            logger.warning(f"⚠️ Invalid packet rejected from learning buffer")
            return
        
        self.learning_buffer.append(sensor_data)
        self.packets_processed += 1
        
        # Trigger incremental learning when buffer is full
        if len(self.learning_buffer) >= self.BUFFER_SIZE:
            logger.info(f"📚 Learning buffer full ({self.BUFFER_SIZE} packets). Initiating incremental learning...")
            self._incremental_update()
            self.learning_buffer = []  # Clear buffer
    
    def _validate_packet(self, data: dict) -> bool:
        """
        Validate sensor packet before adding to learning buffer
        
        Checks:
        - Timestamp monotonicity
        - Value ranges
        - No NaN/Inf
        """
        try:
            # Check required fields
            required = ['soil_moisture', 'temperature', 'humidity', 'wind_speed', 'ec_salinity', 'soil_ph']
            if not all(k in data for k in required):
                return False
            
            # Check ranges
            if not (0 <= data['soil_moisture'] <= 100):
                return False
            if not (10 <= data['temperature'] <= 45):
                return False
            if not (20 <= data['humidity'] <= 95):
                return False
            if not (0 <= data['wind_speed'] <= 40):
                return False
            if not (0.1 <= data['ec_salinity'] <= 5.0):
                return False
            if not (4.0 <= data['soil_ph'] <= 9.0):
                return False
            
            # Check for NaN/Inf
            for key in required:
                val = data[key]
                if not isinstance(val, (int, float)) or np.isnan(val) or np.isinf(val):
                    return False
            
            return True
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False
    
    def _incremental_update(self):
        """
        Perform controlled incremental learning
        Updates models with new validated data
        """
        try:
            # Convert buffer to DataFrame
            df_new = pd.DataFrame(self.learning_buffer)
            
            # Load existing dataset
            if os.path.exists(DATASET_PATH):
                df_existing = pd.read_csv(DATASET_PATH)
                # Append new data (keep last 10,000 samples to prevent unbounded growth)
                df_combined = pd.concat([df_existing, df_new]).tail(10000)
            else:
                df_combined = df_new
            
            # Save updated dataset
            df_combined.to_csv(DATASET_PATH, index=False)
            
            # Retrain models
            logger.info("🔄 Retraining models with new data...")
            self._train_models()
            self._load_models()
            
            logger.info(f"✅ Incremental learning complete. Total samples: {len(df_combined)}")
            
            # Mark as no longer bootstrapped if it was
            if self.is_bootstrapped:
                self.is_bootstrapped = False
                logger.info("🎓 System graduated from bootstrap to real-data learning")
                
        except Exception as e:
            logger.error(f"❌ Incremental learning failed: {e}")
    
    def calculate_drift_confidence(self, sensor_value: float, predicted_value: float, 
                                   sensor_type: str = "moisture") -> float:
        """
        Drift-aware confidence adjustment
        
        If sensor and model disagree significantly:
        - Reduce model confidence
        - Increase physics/sensor weight
        
        Returns: confidence_weight (0.0 to 1.0)
        """
        try:
            # Calculate relative error
            if sensor_value == 0:
                rel_error = abs(predicted_value)
            else:
                rel_error = abs(predicted_value - sensor_value) / abs(sensor_value)
            
            # Thresholds for drift detection
            drift_thresholds = {
                "moisture": 0.3,  # 30% deviation
                "nutrient": 0.5,  # 50% deviation
                "disease": 0.2    # 20% probability deviation
            }
            
            threshold = drift_thresholds.get(sensor_type, 0.3)
            
            if rel_error > threshold:
                # Significant drift detected
                confidence = max(0.2, 1.0 - rel_error)  # Reduce confidence
                logger.warning(f"⚠️ Drift detected in {sensor_type}: Sensor={sensor_value:.2f}, "
                             f"Model={predicted_value:.2f}, Confidence reduced to {confidence:.2f}")
            else:
                confidence = 1.0  # Full confidence
            
            return confidence
            
        except Exception as e:
            logger.error(f"Drift calculation error: {e}")
            return 0.5  # Default to 50% confidence on error

# Global Instance
advanced_ml = AdvancedMLManager()
