"""
Fertilizer Recommendation System
Uses machine learning to recommend optimal fertilizer type and quantity
based on soil conditions, crop type, and environmental factors
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import logging

logger = logging.getLogger(__name__)


class FertilizerRecommender:
    """
    Intelligent fertilizer recommendation system that predicts:
    - What fertilizer to use (type)
    - How much to apply (quantity)
    - When to apply (timing based on growth stage and conditions)
    """
    
    def __init__(self, data_path: str = "data"):
        self.data_path = Path(data_path)
        self.model_path = Path("models")
        self.model_path.mkdir(exist_ok=True)
        
        # ML models
        self.fertilizer_classifier = None
        self.npk_regressors = {
            'nitrogen': None,
            'phosphorous': None,
            'potassium': None
        }
        
        # Label encoders
        self.encoders = {
            'soil_type': LabelEncoder(),
            'crop_type': LabelEncoder(),
            'fertilizer': LabelEncoder()
        }
        
        # Training data
        self.training_data = None
        self.is_trained = False
    
    def load_datasets(self) -> pd.DataFrame:
        """Load and merge all relevant datasets"""
        logger.info("📊 Loading datasets...")
        
        # Load core data with comprehensive information
        core_df = pd.read_csv(self.data_path / "data_core.csv")
        
        # Load fertilizer data
        fertilizer_df = pd.read_csv(self.data_path / "Fertilizer.csv")
        
        # Load crop recommendation data
        crop_df = pd.read_csv(self.data_path / "Crop_recommendation.csv")
        
        logger.info(f"✅ Loaded {len(core_df)} records from core data")
        return core_df
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare data for training"""
        logger.info("🔧 Preprocessing data...")
        
        # Create a copy to avoid modifying original
        df = df.copy()
        
        # Handle missing values
        df = df.dropna()
        
        # Normalize column names
        df.columns = df.columns.str.strip()
        
        # Standardize fertilizer names
        df['Fertilizer Name'] = df['Fertilizer Name'].str.strip()
        
        # Map fertilizer names to standard format
        fertilizer_mapping = {
            '14-35-14': 'Fourteen-Thirty Five-Fourteen',
            '28-28': 'Twenty Eight-Twenty Eight',
            '17-17-17': 'Seventeen-Seventeen-Seventeen',
            '20-20': 'Twenty-Twenty'
        }
        df['Fertilizer Name'] = df['Fertilizer Name'].replace(fertilizer_mapping)
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features for better predictions"""
        logger.info("⚙️ Engineering features...")
        
        # Total NPK requirement
        df['Total_NPK'] = df['Nitrogen'] + df['Phosphorous'] + df['Potassium']
        
        # NPK ratios
        df['N_ratio'] = df['Nitrogen'] / (df['Total_NPK'] + 1)  # +1 to avoid division by zero
        df['P_ratio'] = df['Phosphorous'] / (df['Total_NPK'] + 1)
        df['K_ratio'] = df['Potassium'] / (df['Total_NPK'] + 1)
        
        # Climate indicators
        df['Heat_Index'] = df['Temparature'] * (1 - df['Humidity'] / 100)
        df['Moisture_Deficit'] = 100 - df['Moisture']
        
        # Soil-crop interaction
        df['Soil_Crop_Interaction'] = df['Soil Type'].astype(str) + '_' + df['Crop Type'].astype(str)
        
        return df
    
    def train_models(self, df: pd.DataFrame):
        """Train ML models for fertilizer recommendation"""
        logger.info("🎓 Training machine learning models...")
        
        # Encode categorical variables
        df_encoded = df.copy()
        
        # Encode soil type and crop type
        df_encoded['Soil_Encoded'] = self.encoders['soil_type'].fit_transform(df['Soil Type'])
        df_encoded['Crop_Encoded'] = self.encoders['crop_type'].fit_transform(df['Crop Type'])
        df_encoded['Fertilizer_Encoded'] = self.encoders['fertilizer'].fit_transform(df['Fertilizer Name'])
        
        # Prepare features for classification (predicting fertilizer type)
        feature_cols = [
            'Temparature', 'Humidity', 'Moisture', 
            'Soil_Encoded', 'Crop_Encoded',
            'Heat_Index', 'Moisture_Deficit'
        ]
        
        X_class = df_encoded[feature_cols]
        y_class = df_encoded['Fertilizer_Encoded']
        
        # Split data
        X_train_class, X_test_class, y_train_class, y_test_class = train_test_split(
            X_class, y_class, test_size=0.2, random_state=42
        )
        
        # Train fertilizer type classifier
        logger.info("Training fertilizer type classifier...")
        self.fertilizer_classifier = RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        self.fertilizer_classifier.fit(X_train_class, y_train_class)
        
        train_score = self.fertilizer_classifier.score(X_train_class, y_train_class)
        test_score = self.fertilizer_classifier.score(X_test_class, y_test_class)
        logger.info(f"✅ Fertilizer classifier - Train: {train_score:.3f}, Test: {test_score:.3f}")
        
        # Train NPK quantity regressors
        npk_features = feature_cols + ['Fertilizer_Encoded']
        
        for nutrient in ['Nitrogen', 'Phosphorous', 'Potassium']:
            logger.info(f"Training {nutrient} quantity regressor...")
            
            X_reg = df_encoded[npk_features]
            y_reg = df_encoded[nutrient]
            
            X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
                X_reg, y_reg, test_size=0.2, random_state=42
            )
            
            regressor = RandomForestRegressor(
                n_estimators=150,
                max_depth=15,
                random_state=42,
                n_jobs=-1
            )
            regressor.fit(X_train_reg, y_train_reg)
            
            train_score = regressor.score(X_train_reg, y_train_reg)
            test_score = regressor.score(X_test_reg, y_test_reg)
            logger.info(f"✅ {nutrient} regressor - Train: {train_score:.3f}, Test: {test_score:.3f}")
            
            self.npk_regressors[nutrient.lower()] = regressor
        
        self.is_trained = True
        logger.info("✅ All models trained successfully!")
    
    def save_models(self):
        """Save trained models to disk"""
        logger.info("💾 Saving models...")
        
        joblib.dump(self.fertilizer_classifier, self.model_path / "fertilizer_classifier.pkl")
        
        for name, model in self.npk_regressors.items():
            joblib.dump(model, self.model_path / f"{name}_regressor.pkl")
        
        for name, encoder in self.encoders.items():
            joblib.dump(encoder, self.model_path / f"{name}_encoder.pkl")
        
        logger.info("✅ Models saved successfully!")
    
    def load_models(self):
        """Load pre-trained models from disk"""
        logger.info("📂 Loading pre-trained models...")
        
        try:
            self.fertilizer_classifier = joblib.load(self.model_path / "fertilizer_classifier.pkl")
            
            for name in self.npk_regressors.keys():
                self.npk_regressors[name] = joblib.load(self.model_path / f"{name}_regressor.pkl")
            
            for name in self.encoders.keys():
                self.encoders[name] = joblib.load(self.model_path / f"{name}_encoder.pkl")
            
            self.is_trained = True
            logger.info("✅ Models loaded successfully!")
            return True
        except FileNotFoundError:
            logger.warning("⚠️ Pre-trained models not found. Need to train first.")
            return False
    
    def train_and_save(self):
        """Complete training pipeline"""
        # Load data
        df = self.load_datasets()
        
        # Preprocess
        df = self.preprocess_data(df)
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Store for later use
        self.training_data = df
        
        # Train models
        self.train_models(df)
        
        # Save models
        self.save_models()
    
    def predict_fertilizer(
        self,
        temperature: float,
        humidity: float,
        moisture: float,
        soil_type: str,
        crop_type: str,
        current_n: float = 0,
        current_p: float = 0,
        current_k: float = 0
    ) -> Dict[str, any]:
        """
        Predict optimal fertilizer recommendation
        
        Args:
            temperature: Current temperature (°C)
            humidity: Current humidity (%)
            moisture: Soil moisture level (%)
            soil_type: Type of soil (Sandy, Loamy, Black, Red, Clayey)
            crop_type: Type of crop being grown
            current_n: Current nitrogen level in soil
            current_p: Current phosphorous level in soil
            current_k: Current potassium level in soil
        
        Returns:
            Dictionary with fertilizer recommendations
        """
        if not self.is_trained:
            raise ValueError("Models not trained. Call train_and_save() or load_models() first.")
        
        # Prepare input features
        heat_index = temperature * (1 - humidity / 100)
        moisture_deficit = 100 - moisture
        
        # Encode categorical variables
        try:
            soil_encoded = self.encoders['soil_type'].transform([soil_type])[0]
            crop_encoded = self.encoders['crop_type'].transform([crop_type])[0]
        except ValueError as e:
            logger.error(f"Unknown soil or crop type: {e}")
            # Use most common values as fallback
            soil_encoded = 0
            crop_encoded = 0
        
        # Create feature array for classification
        X_class = np.array([[
            temperature, humidity, moisture,
            soil_encoded, crop_encoded,
            heat_index, moisture_deficit
        ]])
        
        # Predict fertilizer type
        fertilizer_encoded = self.fertilizer_classifier.predict(X_class)[0]
        fertilizer_proba = self.fertilizer_classifier.predict_proba(X_class)[0]
        
        # Get fertilizer name
        fertilizer_name = self.encoders['fertilizer'].inverse_transform([fertilizer_encoded])[0]
        
        # Get top 3 recommendations with probabilities
        top_indices = np.argsort(fertilizer_proba)[-3:][::-1]
        alternative_fertilizers = [
            {
                'name': self.encoders['fertilizer'].inverse_transform([idx])[0],
                'confidence': float(fertilizer_proba[idx])
            }
            for idx in top_indices
        ]
        
        # Create feature array for NPK quantity prediction
        X_reg = np.array([[
            temperature, humidity, moisture,
            soil_encoded, crop_encoded,
            heat_index, moisture_deficit,
            fertilizer_encoded
        ]])
        
        # Predict NPK quantities
        n_required = max(0, self.npk_regressors['nitrogen'].predict(X_reg)[0] - current_n)
        p_required = max(0, self.npk_regressors['phosphorous'].predict(X_reg)[0] - current_p)
        k_required = max(0, self.npk_regressors['potassium'].predict(X_reg)[0] - current_k)
        
        # Determine timing based on conditions
        timing = self._determine_application_timing(
            temperature, humidity, moisture, 
            n_required, p_required, k_required
        )
        
        # Calculate application rate (kg per hectare)
        total_npk = n_required + p_required + k_required
        application_rate = self._calculate_application_rate(
            fertilizer_name, n_required, p_required, k_required
        )
        
        return {
            'fertilizer_name': fertilizer_name,
            'confidence': float(fertilizer_proba[fertilizer_encoded]),
            'alternatives': alternative_fertilizers,
            'npk_requirements': {
                'nitrogen': round(n_required, 2),
                'phosphorous': round(p_required, 2),
                'potassium': round(k_required, 2),
                'total': round(total_npk, 2)
            },
            'application_rate_kg_per_hectare': round(application_rate, 2),
            'timing': timing,
            'conditions': {
                'temperature': temperature,
                'humidity': humidity,
                'moisture': moisture,
                'soil_type': soil_type,
                'crop_type': crop_type
            }
        }
    
    def _determine_application_timing(
        self,
        temperature: float,
        humidity: float,
        moisture: float,
        n_req: float,
        p_req: float,
        k_req: float
    ) -> Dict[str, any]:
        """Determine optimal timing for fertilizer application"""
        
        urgency = "normal"
        recommended_time = "morning"
        days_to_apply = 3
        
        # High nutrient deficiency = urgent
        total_deficit = n_req + p_req + k_req
        if total_deficit > 80:
            urgency = "urgent"
            days_to_apply = 1
        elif total_deficit > 50:
            urgency = "high"
            days_to_apply = 2
        elif total_deficit < 20:
            urgency = "low"
            days_to_apply = 7
        
        # Weather considerations
        if moisture < 30:
            recommended_time = "after_irrigation"
            timing_note = "Apply after watering to ensure nutrient absorption"
        elif humidity > 80:
            recommended_time = "mid_morning"
            timing_note = "Apply when humidity drops to avoid fungal growth"
        elif temperature > 35:
            recommended_time = "early_morning_or_evening"
            timing_note = "Avoid hot hours to prevent nutrient loss"
        else:
            recommended_time = "morning"
            timing_note = "Optimal conditions for application"
        
        return {
            'urgency': urgency,
            'recommended_time_of_day': recommended_time,
            'days_to_apply': days_to_apply,
            'note': timing_note
        }
    
    def _calculate_application_rate(
        self,
        fertilizer_name: str,
        n: float,
        p: float,
        k: float
    ) -> float:
        """Calculate fertilizer application rate based on NPK content"""
        
        # Define NPK content percentages for common fertilizers
        fertilizer_composition = {
            'Urea': {'N': 46, 'P': 0, 'K': 0},
            'DAP': {'N': 18, 'P': 46, 'K': 0},
            'Fourteen-Thirty Five-Fourteen': {'N': 14, 'P': 35, 'K': 14},
            'Twenty Eight-Twenty Eight': {'N': 28, 'P': 28, 'K': 0},
            'Seventeen-Seventeen-Seventeen': {'N': 17, 'P': 17, 'K': 17},
            'Twenty-Twenty': {'N': 20, 'P': 20, 'K': 0},
            '10-26-26': {'N': 10, 'P': 26, 'K': 26}
        }
        
        composition = fertilizer_composition.get(
            fertilizer_name,
            {'N': 20, 'P': 20, 'K': 20}  # Default balanced composition
        )
        
        # Calculate required fertilizer amount based on limiting nutrient
        required_amounts = []
        
        if composition['N'] > 0 and n > 0:
            required_amounts.append(n / (composition['N'] / 100))
        
        if composition['P'] > 0 and p > 0:
            required_amounts.append(p / (composition['P'] / 100))
        
        if composition['K'] > 0 and k > 0:
            required_amounts.append(k / (composition['K'] / 100))
        
        if required_amounts:
            # Use the maximum to ensure all nutrient needs are met
            return max(required_amounts)
        
        return 0
    
    def get_crop_specific_recommendations(self, crop_type: str) -> Dict[str, any]:
        """Get general fertilizer recommendations for a specific crop"""
        
        crop_recommendations = {
            'Maize': {
                'primary_nutrients': ['nitrogen', 'phosphorous'],
                'critical_stages': ['vegetative', 'tasseling'],
                'typical_npk': '28-28-0 or Urea + DAP',
                'frequency': 'Split application - 50% at planting, 50% at knee-high stage'
            },
            'Wheat': {
                'primary_nutrients': ['nitrogen'],
                'critical_stages': ['tillering', 'booting'],
                'typical_npk': 'Urea or 28-28-0',
                'frequency': 'Split application - 1/3 at sowing, 2/3 at first irrigation'
            },
            'Paddy': {
                'primary_nutrients': ['nitrogen', 'potassium'],
                'critical_stages': ['tillering', 'panicle_initiation'],
                'typical_npk': 'Urea + 20-20',
                'frequency': 'Multiple splits - at transplanting, tillering, and panicle'
            },
            'Cotton': {
                'primary_nutrients': ['nitrogen', 'potassium', 'phosphorous'],
                'critical_stages': ['square_formation', 'flowering'],
                'typical_npk': '17-17-17 or 14-35-14',
                'frequency': 'Balanced NPK at planting, additional N and K during flowering'
            },
            'Sugarcane': {
                'primary_nutrients': ['nitrogen', 'potassium'],
                'critical_stages': ['tillering', 'grand_growth'],
                'typical_npk': 'DAP + Urea',
                'frequency': 'Heavy feeder - multiple applications throughout growth'
            }
        }
        
        return crop_recommendations.get(crop_type, {
            'primary_nutrients': ['nitrogen', 'phosphorous', 'potassium'],
            'critical_stages': ['early_growth', 'flowering'],
            'typical_npk': '17-17-17 (balanced)',
            'frequency': 'Apply at planting and during active growth'
        })


# Singleton instance
_fertilizer_recommender = None


def get_fertilizer_recommender() -> FertilizerRecommender:
    """Get or create the global fertilizer recommender instance"""
    global _fertilizer_recommender
    
    if _fertilizer_recommender is None:
        _fertilizer_recommender = FertilizerRecommender()
        
        # Try to load pre-trained models
        if not _fertilizer_recommender.load_models():
            logger.info("Training new models...")
            _fertilizer_recommender.train_and_save()
    
    return _fertilizer_recommender
