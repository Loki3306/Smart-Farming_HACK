"""
Machine Learning Crop Recommender Service (Random Forest)
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

from .data_factory import DataFactory

MODEL_PATH = "app/ml_models/crop_model.pkl"
SCALER_PATH = "app/ml_models/scaler.pkl"
ENCODER_PATH = "app/ml_models/encoder.pkl"

class CropRecommender:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.soil_encoder = None  # Not used for label, but soil type is numeric input
        # Note: In DataFactory soil is 1,2,3 code. We can treat as numeric or category.
        # We will treat is as numeric (ordinal) for simplicity or categorical. 
        # Since it's 1,2,3, standard scaler is fine.
        
        self._load_or_train()

    def _load_or_train(self):
        """Load existing model or trigger training pipeline"""
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            print("🧠 Loading existing Crop Recommendation Model...")
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
        else:
            print("⚠️ Model not found. Starting training pipeline...")
            self.train()

    def train(self):
        """Train Random Forest model on synthetic data"""
        print("🚜 Generating training data...")
        df = DataFactory.generate_dataset(num_samples=10000)
        
        # Features & Target
        # Features: N, P, K, temperature, humidity, ph, rainfall, soil_type_code, altitude, solar_rad
        X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_type_code', 'altitude', 'solar_rad']]
        y = df['label']
        
        # Scaling
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        # Train
        print("🧠 Training Random Forest Classifier (n_estimators=100)...")
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        
        # Metrics
        y_pred = self.model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"✅ Training Complete. Accuracy: {acc:.4f}")
        
        # Save artifacts
        os.makedirs("app/ml_models", exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        print("💾 Model saved to disk.")

    def predict(self, features: dict):
        """
        Predict crop based on features
        Expects: N, P, K, temperature, humidity, ph, rainfall, soil_type_code, altitude, solar_rad
        Returns: Top 3 recommendations with probabilities
        """
        # Ensure correct order
        input_vector = pd.DataFrame([{
            'N': features.get('N'),
            'P': features.get('P'),
            'K': features.get('K'),
            'temperature': features.get('temperature'),
            'humidity': features.get('humidity'),
            'ph': features.get('ph'),
            'rainfall': features.get('rainfall'),
            'soil_type_code': features.get('soil_type_code', 2), # Default Loam
            'altitude': features.get('altitude', 100),
            'solar_rad': features.get('solar_rad', 18.0)
        }])
        
        # Scale
        vector_scaled = self.scaler.transform(input_vector)
        
        # Predict Proba
        probs = self.model.predict_proba(vector_scaled)[0]
        classes = self.model.classes_
        
        # Get Top 3
        top3_indices = np.argsort(probs)[-3:][::-1]
        
        results = []
        for idx in top3_indices:
            results.append({
                "crop": classes[idx],
                "probability": round(float(probs[idx]) * 100, 2)
            })
            
        return results

# Singleton
crop_recommender = CropRecommender()
