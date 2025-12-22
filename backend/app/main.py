"""
Smart Farming AI Backend - FastAPI Server
Serves ML model predictions for agricultural recommendations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import importlib
import sys
import os

# Add backend/app to Python path for model imports
app_root = os.path.dirname(os.path.abspath(__file__))
if app_root not in sys.path:
    sys.path.insert(0, app_root)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Farming AI Backend",
    description="ML-powered agricultural recommendations API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models (Request/Response schemas)
# ============================================================================

class SensorData(BaseModel):
    """Sensor readings from farm IoT devices"""
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Air humidity percentage")
    nitrogen: float = Field(..., ge=0, description="Nitrogen content in mg/kg")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content in mg/kg")
    potassium: float = Field(..., ge=0, description="Potassium content in mg/kg")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")
    ec: float = Field(..., ge=0, description="Electrical conductivity (salinity)")
    rainfall: Optional[float] = Field(0.0, description="Recent rainfall in mm")


class RecommendationRequest(BaseModel):
    """Request for farm recommendations"""
    farm_id: str = Field(..., description="Unique farm identifier")
    crop_type: str = Field(..., description="Type of crop (Rice, Wheat, Cotton, etc.)")
    soil_type: str = Field(..., description="Soil type (Clay loam, Sandy, etc.)")
    sensor_data: SensorData
    weather_condition: Optional[str] = Field(None, description="Current weather description")


class Recommendation(BaseModel):
    """Single recommendation"""
    id: str
    type: str  # irrigation, fertilizer, pest, crop, stress_management, soil_treatment
    priority: str  # high, medium, low
    title: str
    description: str
    action: str
    confidence: float = Field(..., ge=0, le=100, description="Confidence score 0-100")
    timestamp: datetime


class RecommendationResponse(BaseModel):
    """Response with recommendations"""
    farm_id: str
    recommendations: List[Recommendation]
    generated_at: datetime
    model_version: str = "1.0"


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: dict
    timestamp: datetime


# ============================================================================
# Model Loader
# ============================================================================

class ModelLoader:
    """Load and manage compiled ML models"""
    
    def __init__(self):
        self.models = {}
        self.loaded = False
    
    def load_models(self):
        """Attempt to load compiled model modules"""
        modules_to_load = {
            'fertilizer_recommender': 'ml_models.fertilizer_recommender',
            'agronomist': 'agents.agronomist',
            'auditor': 'agents.auditor',
            'gatekeeper': 'agents.gatekeeper',
            'ingestor': 'agents.ingestor',
            'meteorologist': 'agents.meteorologist',
        }
        
        for name, module_path in modules_to_load.items():
            try:
                mod = importlib.import_module(module_path)
                self.models[name] = mod
                print(f"✓ Loaded model: {name}")
            except Exception as e:
                print(f"⚠ Could not load {name}: {e}")
                self.models[name] = None
        
        self.loaded = True
        return self.get_model_status()
    
    def get_model_status(self):
        """Get status of all models"""
        return {name: (model is not None) for name, model in self.models.items()}


# Initialize model loader
model_loader = ModelLoader()


# ============================================================================
# Recommendation Engine - Rule-based + ML hybrid
# ============================================================================

class RecommendationEngine:
    """Generate farming recommendations from sensor data"""
    
    @staticmethod
    def generate_recommendations(
        farm_id: str,
        crop_type: str,
        soil_type: str,
        sensor_data: SensorData,
        weather_condition: Optional[str] = None
    ) -> List[Recommendation]:
        """
        Generate actionable recommendations based on sensor data.
        Uses rule-based logic + ML models (when available).
        """
        recommendations = []
        timestamp = datetime.now()
        rec_id_counter = 1
        
        # --- FERTILIZER RECOMMENDATIONS ---
        
        # Nitrogen analysis
        if sensor_data.nitrogen < 40:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="high",
                title="Nitrogen Deficiency Detected",
                description=f"Soil nitrogen is critically low ({sensor_data.nitrogen:.1f} mg/kg). This affects plant growth and leaf development. Immediate fertilization recommended.",
                action="Apply 50kg/hectare urea fertilizer within 7 days",
                confidence=92,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.nitrogen > 200:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="low",
                title="Nitrogen Levels Optimal",
                description=f"Nitrogen content is sufficient ({sensor_data.nitrogen:.1f} mg/kg). No immediate action needed.",
                action="Continue monitoring. Retest in 14 days.",
                confidence=88,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Phosphorus analysis
        if sensor_data.phosphorus < 20:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="medium",
                title="Phosphorus Deficiency",
                description=f"Phosphorus is below optimal level ({sensor_data.phosphorus:.1f} mg/kg). Important for root development and flowering.",
                action="Apply 30kg/hectare phosphate fertilizer (DAP or SSP)",
                confidence=87,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Potassium analysis
        if sensor_data.potassium < 150:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="medium",
                title="Potassium Deficiency",
                description=f"Potassium level is low ({sensor_data.potassium:.1f} mg/kg). Essential for disease resistance and fruit quality.",
                action="Apply 40kg/hectare potassium chloride (MOP)",
                confidence=85,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- IRRIGATION RECOMMENDATIONS ---
        
        if sensor_data.moisture < 30:
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="high",
                title="Urgent Irrigation Needed",
                description=f"Soil moisture is critically low ({sensor_data.moisture:.1f}%). Plants are experiencing water stress. Immediate irrigation required to prevent crop damage.",
                action="Irrigate immediately with 50mm water depth. Monitor soil moisture every 6 hours.",
                confidence=96,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.moisture > 75:
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="medium",
                title="Reduce Irrigation Frequency",
                description=f"Soil moisture is high ({sensor_data.moisture:.1f}%). Risk of waterlogging and root diseases. Reduce irrigation to allow soil to drain.",
                action="Pause irrigation for next 5 days. Check drainage system.",
                confidence=91,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.moisture >= 40 and sensor_data.moisture <= 60:
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="low",
                title="Irrigation Levels Optimal",
                description=f"Soil moisture is in optimal range ({sensor_data.moisture:.1f}%). Continue current irrigation schedule.",
                action="Maintain current irrigation schedule. Monitor daily.",
                confidence=89,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- TEMPERATURE & STRESS MANAGEMENT ---
        
        if sensor_data.temperature > 35:
            recommendations.append(Recommendation(
                id=f"stress_{rec_id_counter}",
                type="stress_management",
                priority="high",
                title="Heat Stress Alert",
                description=f"Temperature is {sensor_data.temperature:.1f}°C, exceeding optimal range for most crops. Risk of heat stress, wilting, and reduced yield.",
                action="Increase irrigation frequency to 2x daily. Apply mulch to reduce soil temperature. Consider shade nets for sensitive crops.",
                confidence=93,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.temperature < 10:
            if crop_type.lower() in ['rice', 'tomato', 'cotton', 'sugarcane']:
                recommendations.append(Recommendation(
                    id=f"stress_{rec_id_counter}",
                    type="stress_management",
                    priority="medium",
                    title="Cold Weather Warning",
                    description=f"Temperature ({sensor_data.temperature:.1f}°C) is below optimal for {crop_type}. Monitor for frost risk.",
                    action="Check weather forecast for frost. Prepare frost protection (covers, smoke) if needed.",
                    confidence=86,
                    timestamp=timestamp
                ))
                rec_id_counter += 1
        
        # --- pH RECOMMENDATIONS ---
        
        if sensor_data.ph < 5.5:
            recommendations.append(Recommendation(
                id=f"ph_{rec_id_counter}",
                type="soil_treatment",
                priority="high",
                title="Soil Too Acidic",
                description=f"pH {sensor_data.ph:.1f} is too acidic. Most crops prefer pH 6.0-7.5. Acidic soil reduces nutrient availability.",
                action="Apply agricultural lime (CaCO3) at 2-3 tons/hectare. Retest pH after 2 weeks.",
                confidence=90,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.ph > 8.5:
            recommendations.append(Recommendation(
                id=f"ph_{rec_id_counter}",
                type="soil_treatment",
                priority="medium",
                title="Soil Too Alkaline",
                description=f"pH {sensor_data.ph:.1f} is too alkaline. This limits iron, zinc, and phosphorus availability.",
                action="Apply elemental sulfur (200-400 kg/hectare) or gypsum. Organic matter addition also helps.",
                confidence=87,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- WEATHER-BASED RECOMMENDATIONS ---
        
        if weather_condition and "rain" in weather_condition.lower():
            if sensor_data.moisture > 50:
                recommendations.append(Recommendation(
                    id=f"weather_{rec_id_counter}",
                    type="irrigation",
                    priority="high",
                    title="Rain Expected - Stop Irrigation",
                    description=f"Weather forecast shows rain coming. Current moisture ({sensor_data.moisture:.1f}%) is already adequate. Avoid over-watering.",
                    action="Pause irrigation until after rainfall. Monitor soil moisture post-rain.",
                    confidence=94,
                    timestamp=timestamp
                ))
                rec_id_counter += 1
        
        # --- CROP-SPECIFIC RECOMMENDATIONS ---
        
        if crop_type.lower() == "rice" and sensor_data.moisture < 70:
            recommendations.append(Recommendation(
                id=f"crop_{rec_id_counter}",
                type="irrigation",
                priority="high",
                title="Rice Requires High Moisture",
                description=f"Rice cultivation requires consistently high soil moisture. Current level ({sensor_data.moisture:.1f}%) is below optimal.",
                action="Maintain flooded conditions (2-5 cm standing water) during vegetative stage.",
                confidence=92,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Sort recommendations by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda x: priority_order.get(x.priority, 3))
        
        return recommendations


# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load models when API starts"""
    print("🚀 Starting Smart Farming AI Backend...")
    print("📦 Loading ML models...")
    status = model_loader.load_models()
    print(f"✅ API ready! Models loaded: {sum(status.values())}/{len(status)}")


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint with available routes"""
    return {
        "name": "Smart Farming AI Backend",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "predict": "/api/recommendations/predict",
            "models_status": "/api/models/status",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health and model status"""
    return HealthResponse(
        status="healthy",
        models_loaded=model_loader.get_model_status(),
        timestamp=datetime.now()
    )


@app.post("/api/recommendations/predict", response_model=RecommendationResponse, tags=["Recommendations"])
async def predict_recommendations(request: RecommendationRequest):
    """
    Generate AI-powered farming recommendations
    
    **Input**: Farm data, crop type, soil conditions, and sensor readings
    
    **Output**: Prioritized list of actionable recommendations with confidence scores
    
    **Example**:
    ```json
    {
      "farm_id": "farm_123",
      "crop_type": "Rice",
      "soil_type": "Clay loam",
      "sensor_data": {
        "moisture": 45,
        "temperature": 28,
        "humidity": 62,
        "nitrogen": 42,
        "phosphorus": 18,
        "potassium": 95,
        "ph": 6.8,
        "ec": 1.2
      }
    }
    ```
    """
    try:
        # Generate recommendations
        recommendations = RecommendationEngine.generate_recommendations(
            farm_id=request.farm_id,
            crop_type=request.crop_type,
            soil_type=request.soil_type,
            sensor_data=request.sensor_data,
            weather_condition=request.weather_condition
        )
        
        return RecommendationResponse(
            farm_id=request.farm_id,
            recommendations=recommendations,
            generated_at=datetime.now()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


@app.get("/api/models/status", tags=["Models"])
async def models_status():
    """Get detailed status of all loaded ML models"""
    status = model_loader.get_model_status()
    return {
        "models": status,
        "total": len(status),
        "loaded": sum(1 for v in status.values() if v),
        "failed": sum(1 for v in status.values() if not v),
        "timestamp": datetime.now()
    }


# ============================================================================
# Run Server (for development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
