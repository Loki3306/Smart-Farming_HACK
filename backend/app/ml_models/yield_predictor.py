"""
Crop Yield Prediction Model
Trained on Smart_Farming_Crop_Yield_2024.csv dataset
Uses Random Forest Regressor for yield prediction
"""

import os
import pickle
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Training imports (only used when training)
try:
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.neural_network import MLPRegressor
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import r2_score, mean_absolute_error
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("⚠️ sklearn not available - using pre-trained model only")


@dataclass
class YieldPrediction:
    """Yield prediction result"""
    predicted_yield_kg_per_hectare: float
    confidence: float  # 0-100
    yield_potential_percent: float  # 0-100 (compared to max possible)
    factors: Dict[str, float]  # Feature importance
    improvement_tips: List[Dict]


class YieldPredictor:
    """ML model for crop yield prediction"""
    
    # Crop-specific yield benchmarks (kg/hectare) from India data
    CROP_BENCHMARKS = {
        'wheat': {'min': 2000, 'avg': 3500, 'max': 6000},
        'rice': {'min': 2500, 'avg': 4000, 'max': 6500},
        'maize': {'min': 2000, 'avg': 4500, 'max': 7000},
        'cotton': {'min': 1500, 'avg': 3000, 'max': 5500},
        'soybean': {'min': 1500, 'avg': 3500, 'max': 6000},
    }
    
    # Optimal ranges for each feature (for improvement suggestions)
    OPTIMAL_RANGES = {
        'soil_moisture': (25, 45),
        'soil_ph': (6.0, 7.5),
        'temperature': (20, 30),
        'rainfall': (100, 250),
        'humidity': (50, 80),
        'sunlight_hours': (6, 9),
    }
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_columns = None
        self.feature_importances = None
        self.is_trained = False
        self.model_path = os.path.join(os.path.dirname(__file__), 'yield_model.pkl')
        
        # Try to load pre-trained model
        self._load_model()
    
    def _load_model(self) -> bool:
        """Load pre-trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.model = data['model']
                    self.scaler = data['scaler']
                    self.label_encoders = data['label_encoders']
                    self.feature_columns = data['feature_columns']
                    self.feature_importances = data.get('feature_importances', {})
                    self.is_trained = True
                    print("✓ Loaded pre-trained yield prediction model")
                    return True
        except Exception as e:
            print(f"⚠️ Could not load yield model: {e}")
        return False
    
    def _save_model(self):
        """Save trained model to disk"""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'scaler': self.scaler,
                    'label_encoders': self.label_encoders,
                    'feature_columns': self.feature_columns,
                    'feature_importances': self.feature_importances,
                }, f)
            print(f"✓ Saved yield model to {self.model_path}")
        except Exception as e:
            print(f"⚠️ Could not save model: {e}")
    
    def train(self, csv_path: str) -> Dict:
        """Train the yield prediction model on the dataset"""
        if not HAS_SKLEARN:
            return {'success': False, 'error': 'sklearn not installed'}
        
        print("\n" + "="*60)
        print("🌾 TRAINING YIELD PREDICTION MODEL")
        print("="*60)
        
        # Load dataset
        df = pd.read_csv(csv_path)
        print(f"📊 Loaded {len(df)} records from dataset")
        
        # Define features
        feature_cols = [
            'soil_moisture_%', 'soil_pH', 'temperature_C', 'rainfall_mm',
            'humidity_%', 'sunlight_hours', 'pesticide_usage_ml', 'total_days',
            'NDVI_index'
        ]
        categorical_cols = ['crop_type', 'irrigation_type', 'fertilizer_type', 'crop_disease_status']
        target_col = 'yield_kg_per_hectare'
        
        # Encode categorical variables
        for col in categorical_cols:
            if col in df.columns:
                le = LabelEncoder()
                df[f'{col}_encoded'] = le.fit_transform(df[col].fillna('None'))
                self.label_encoders[col] = le
                feature_cols.append(f'{col}_encoded')
        
        # Prepare features
        X = df[feature_cols].fillna(0)
        y = df[target_col]
        
        self.feature_columns = feature_cols
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        print("🚀 Training XGBoost Model (Industry Standard)...")
        self.model = xgb.XGBRegressor(
            n_estimators=500,        # Number of trees
            max_depth=8,             # Tree depth
            learning_rate=0.05,      # Conservative learning
            subsample=0.8,           # Row sampling
            colsample_bytree=0.8,    # Feature sampling
            min_child_weight=3,      # Regularization
            gamma=0.1,               # Minimum loss reduction
            reg_alpha=0.1,           # L1 regularization
            reg_lambda=1.0,          # L2 regularization
            random_state=42,
            n_jobs=-1,               # Use all CPU cores
            verbosity=1              # Show progress
        )
        
        # Train with evaluation set for early stopping
        eval_set = [(X_train_scaled, y_train), (X_test_scaled, y_test)]
        self.model.fit(
            X_train_scaled, y_train,
            eval_set=eval_set,
            verbose=True
        )
        
        # Evaluate
        train_pred = self.model.predict(X_train_scaled)
        test_pred = self.model.predict(X_test_scaled)
        
        train_r2 = r2_score(y_train, train_pred)
        test_r2 = r2_score(y_test, test_pred)
        test_mae = mean_absolute_error(y_test, test_pred)
        
        print(f"\n📈 XGBoost Model Performance:")
        print(f"   Train R² Score: {train_r2:.4f}")
        print(f"   Test R² Score: {test_r2:.4f} {'✅ EXCELLENT!' if test_r2 > 0.85 else '⚠️ Needs tuning' if test_r2 > 0.70 else '❌ Poor'}")
        print(f"   Test MAE: {test_mae:.2f} kg/hectare")
        
        # Get feature importances (XGBoost provides this!)
        importance_dict = self.model.get_booster().get_score(importance_type='weight')
        # Map feature indices back to names
        self.feature_importances = {}
        for idx, col in enumerate(feature_cols):
            feat_name = f'f{idx}'
            self.feature_importances[col] = importance_dict.get(feat_name, 0)
        
        # Normalize importances
        total_importance = sum(self.feature_importances.values())
        if total_importance > 0:
            self.feature_importances = {k: v/total_importance for k, v in self.feature_importances.items()}
        
        print(f"\n🎯 Top 5 Important Features:")
        sorted_features = sorted(
            self.feature_importances.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        for feat, imp in sorted_features:
            print(f"   - {feat}: {imp:.4f}")
        
        self.is_trained = True
        self._save_model()
        
        print("="*60 + "\n")
        
        return {
            'success': True,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'feature_importances': self.feature_importances
        }
    
    def predict(
        self,
        crop_type: str,
        soil_moisture: float,
        soil_ph: float,
        temperature: float,
        rainfall: float,
        humidity: float,
        sunlight_hours: float = 7.0,
        irrigation_type: str = 'None',
        fertilizer_type: str = 'Mixed',
        pesticide_usage: float = 20.0,
        growing_days: int = 120,
        ndvi_index: float = 0.6,
        disease_status: str = 'None'
    ) -> YieldPrediction:
        """
        Predict crop yield based on current conditions
        
        Returns:
            YieldPrediction with predicted yield, confidence, and improvement tips
        """
        
        if not self.is_trained:
            # Return estimate based on benchmarks
            return self._fallback_prediction(crop_type, soil_moisture, soil_ph, temperature)
        
        try:
            # Prepare input features
            input_data = {
                'soil_moisture_%': soil_moisture,
                'soil_pH': soil_ph,
                'temperature_C': temperature,
                'rainfall_mm': rainfall,
                'humidity_%': humidity,
                'sunlight_hours': sunlight_hours,
                'pesticide_usage_ml': pesticide_usage,
                'total_days': growing_days,
                'NDVI_index': ndvi_index,
            }
            
            # Encode categorical variables
            for col, le in self.label_encoders.items():
                value = {
                    'crop_type': crop_type,
                    'irrigation_type': irrigation_type,
                    'fertilizer_type': fertilizer_type,
                    'crop_disease_status': disease_status
                }.get(col, 'None')
                
                try:
                    encoded = le.transform([value])[0]
                except ValueError:
                    # Unknown category - use most common
                    encoded = 0
                input_data[f'{col}_encoded'] = encoded
            
            # Create feature array in correct order
            features = np.array([[input_data.get(col, 0) for col in self.feature_columns]])
            
            # Scale and predict
            features_scaled = self.scaler.transform(features)
            predicted_yield = self.model.predict(features_scaled)[0]
            
            # Calculate confidence based on how close to optimal conditions
            confidence = self._calculate_confidence(
                soil_moisture, soil_ph, temperature, humidity, disease_status
            )
            
            # Calculate yield potential
            crop_lower = crop_type.lower()
            benchmark = self.CROP_BENCHMARKS.get(crop_lower, self.CROP_BENCHMARKS['wheat'])
            yield_potential = min(100, max(0, 
                (predicted_yield - benchmark['min']) / 
                (benchmark['max'] - benchmark['min']) * 100
            ))
            
            # Generate improvement tips
            improvement_tips = self._generate_improvement_tips(
                crop_type, soil_moisture, soil_ph, temperature, 
                humidity, ndvi_index, disease_status, predicted_yield
            )
            
            return YieldPrediction(
                predicted_yield_kg_per_hectare=round(predicted_yield, 2),
                confidence=round(confidence, 1),
                yield_potential_percent=round(yield_potential, 1),
                factors=self.feature_importances or {},
                improvement_tips=improvement_tips
            )
            
        except Exception as e:
            print(f"⚠️ Prediction error: {e}")
            return self._fallback_prediction(crop_type, soil_moisture, soil_ph, temperature)
    
    def _calculate_confidence(
        self, 
        moisture: float, 
        ph: float, 
        temp: float, 
        humidity: float,
        disease_status: str
    ) -> float:
        """Calculate prediction confidence based on input quality"""
        confidence = 85.0  # Base confidence
        
        # Adjust for optimal ranges
        if 25 <= moisture <= 45:
            confidence += 3
        elif moisture < 15 or moisture > 50:
            confidence -= 5
        
        if 6.0 <= ph <= 7.5:
            confidence += 3
        elif ph < 5.5 or ph > 8.0:
            confidence -= 5
        
        if 20 <= temp <= 30:
            confidence += 2
        elif temp < 15 or temp > 35:
            confidence -= 4
        
        if 50 <= humidity <= 80:
            confidence += 2
        
        # Disease penalty
        if disease_status.lower() == 'severe':
            confidence -= 10
        elif disease_status.lower() == 'moderate':
            confidence -= 5
        
        return min(98, max(60, confidence))
    
    def _generate_improvement_tips(
        self,
        crop_type: str,
        moisture: float,
        ph: float,
        temp: float,
        humidity: float,
        ndvi: float,
        disease_status: str,
        current_yield: float
    ) -> List[Dict]:
        """Generate actionable tips to improve yield"""
        tips = []
        
        crop_lower = crop_type.lower()
        benchmark = self.CROP_BENCHMARKS.get(crop_lower, self.CROP_BENCHMARKS['wheat'])
        
        # Moisture optimization
        if moisture < 20:
            potential_gain = min(20, (25 - moisture) * 1.5)
            tips.append({
                'factor': 'Soil Moisture',
                'current': f'{moisture:.1f}%',
                'optimal': '25-45%',
                'action': 'Increase irrigation frequency',
                'potential_yield_gain': f'+{potential_gain:.0f}%',
                'priority': 'high'
            })
        elif moisture > 50:
            tips.append({
                'factor': 'Soil Moisture',
                'current': f'{moisture:.1f}%',
                'optimal': '25-45%',
                'action': 'Reduce irrigation, improve drainage',
                'potential_yield_gain': '+8%',
                'priority': 'medium'
            })
        
        # pH optimization
        if ph < 5.8:
            tips.append({
                'factor': 'Soil pH',
                'current': f'{ph:.1f}',
                'optimal': '6.0-7.5',
                'action': 'Apply agricultural lime',
                'potential_yield_gain': '+12%',
                'priority': 'high'
            })
        elif ph > 7.8:
            tips.append({
                'factor': 'Soil pH',
                'current': f'{ph:.1f}',
                'optimal': '6.0-7.5',
                'action': 'Apply sulfur or organic matter',
                'potential_yield_gain': '+10%',
                'priority': 'medium'
            })
        
        # Disease management
        if disease_status.lower() in ['moderate', 'severe']:
            gain = 25 if disease_status.lower() == 'severe' else 15
            tips.append({
                'factor': 'Disease Status',
                'current': disease_status,
                'optimal': 'None',
                'action': 'Apply appropriate fungicide/pesticide treatment',
                'potential_yield_gain': f'+{gain}%',
                'priority': 'high'
            })
        
        # NDVI (crop health) optimization
        if ndvi < 0.5:
            tips.append({
                'factor': 'Crop Health (NDVI)',
                'current': f'{ndvi:.2f}',
                'optimal': '0.6-0.8',
                'action': 'Apply foliar nutrients, check for stress factors',
                'potential_yield_gain': '+15%',
                'priority': 'high'
            })
        
        # Temperature considerations
        if temp > 35:
            tips.append({
                'factor': 'Temperature',
                'current': f'{temp:.1f}°C',
                'optimal': '20-30°C',
                'action': 'Apply shade nets, increase irrigation',
                'potential_yield_gain': '+10%',
                'priority': 'medium'
            })
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        tips.sort(key=lambda x: priority_order.get(x['priority'], 2))
        
        return tips[:5]  # Return top 5 tips
    
    def _fallback_prediction(
        self,
        crop_type: str,
        moisture: float,
        ph: float,
        temperature: float
    ) -> YieldPrediction:
        """Fallback prediction when model is not trained"""
        crop_lower = crop_type.lower()
        benchmark = self.CROP_BENCHMARKS.get(crop_lower, self.CROP_BENCHMARKS['wheat'])
        
        # Simple heuristic-based prediction
        base_yield = benchmark['avg']
        
        # Adjust based on conditions
        if 25 <= moisture <= 45:
            base_yield *= 1.1
        elif moisture < 15 or moisture > 55:
            base_yield *= 0.8
        
        if 6.0 <= ph <= 7.5:
            base_yield *= 1.05
        elif ph < 5.5 or ph > 8.0:
            base_yield *= 0.85
        
        if 20 <= temperature <= 30:
            base_yield *= 1.05
        elif temperature > 38 or temperature < 10:
            base_yield *= 0.75
        
        yield_potential = (base_yield - benchmark['min']) / (benchmark['max'] - benchmark['min']) * 100
        
        return YieldPrediction(
            predicted_yield_kg_per_hectare=round(base_yield, 2),
            confidence=65.0,  # Lower confidence for fallback
            yield_potential_percent=round(min(100, max(0, yield_potential)), 1),
            factors={},
            improvement_tips=[
                {
                    'factor': 'Model Training',
                    'current': 'Not trained',
                    'optimal': 'Trained',
                    'action': 'Train model on yield dataset for better predictions',
                    'potential_yield_gain': '+25%',
                    'priority': 'high'
                }
            ]
        )
    
    def get_regional_benchmark(self, region: str, crop_type: str) -> Dict:
        """Get yield benchmarks for a region and crop"""
        crop_lower = crop_type.lower()
        benchmark = self.CROP_BENCHMARKS.get(crop_lower, self.CROP_BENCHMARKS['wheat'])
        
        # Could be enhanced with actual regional data
        return {
            'region': region,
            'crop_type': crop_type,
            'min_yield': benchmark['min'],
            'avg_yield': benchmark['avg'],
            'max_yield': benchmark['max'],
            'unit': 'kg/hectare'
        }


# Create singleton instance
yield_predictor = YieldPredictor()


def get_yield_prediction(
    crop_type: str,
    soil_moisture: float,
    soil_ph: float,
    temperature: float,
    humidity: float,
    rainfall: float = 150.0,
    **kwargs
) -> Dict:
    """
    Convenience function to get yield prediction as dict
    
    Args:
        crop_type: Type of crop (Wheat, Rice, Maize, etc.)
        soil_moisture: Soil moisture percentage
        soil_ph: Soil pH value
        temperature: Temperature in Celsius
        humidity: Air humidity percentage
        rainfall: Rainfall in mm
        **kwargs: Additional parameters (irrigation_type, fertilizer_type, etc.)
    
    Returns:
        Dict with prediction results
    """
    result = yield_predictor.predict(
        crop_type=crop_type,
        soil_moisture=soil_moisture,
        soil_ph=soil_ph,
        temperature=temperature,
        rainfall=rainfall,
        humidity=humidity,
        **kwargs
    )
    
    return {
        'predicted_yield': result.predicted_yield_kg_per_hectare,
        'confidence': result.confidence,
        'yield_potential': result.yield_potential_percent,
        'factors': result.factors,
        'improvement_tips': result.improvement_tips,
        'unit': 'kg/hectare'
    }


def train_yield_model(csv_path: str = None) -> Dict:
    """Train the yield model on dataset"""
    if csv_path is None:
        # Default path - go up 3 levels: ml_models -> app -> backend -> project_root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        csv_path = os.path.join(base_dir, 'datasets', 'Final_Real_Yield_Data.csv')
    
    return yield_predictor.train(csv_path)


# Auto-train on import if model doesn't exist
if not yield_predictor.is_trained and HAS_SKLEARN:
    try:
        # Default path - go up 3 levels: ml_models -> app -> backend -> project_root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        csv_path = os.path.join(base_dir, 'datasets', 'Final_Real_Yield_Data.csv')
        if os.path.exists(csv_path):
            print("🌾 Auto-training yield model...")
            train_yield_model(csv_path)
        else:
            print(f"⚠️ Dataset not found at: {csv_path}")
    except Exception as e:
        print(f"⚠️ Auto-training failed: {e}")
