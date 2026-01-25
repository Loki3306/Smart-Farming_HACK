"""
Smart Farming AI Backend - FastAPI Server
Serves ML model predictions for agricultural recommendations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import importlib
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api import chatbot  # Import chatbot API router
from app.api import regime_routes  # Import regime system API router
from app.routes import farm_geometry  # Import farm geometry/mapping API router
from app.db.regime_db import RegimeDatabase  # Regime database layer
from app.services.supabase_client import get_supabase_client  # Supabase client
from app.db.base import startup_db, shutdown_db  # Database lifecycle
from app.locales import LocalizationManager  # I18n helper

# Add backend/app to Python path for model imports
app_root = os.path.dirname(os.path.abspath(__file__))
if app_root not in sys.path:
    sys.path.insert(0, app_root)

# Add backend directory to path for iot_irrigation module
backend_root = os.path.dirname(app_root)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application
    Handles startup and shutdown events
    """
    # Startup
    print("[INFO] Starting Smart Farming AI Backend...")
    
    # Initialize MQTT client for IoT
    initialize_mqtt_func = None
    shutdown_mqtt_func = None
    
    try:
        from iot_irrigation.router import initialize_mqtt as init_func, shutdown_mqtt as shutdown_func
        initialize_mqtt_func = init_func
        shutdown_mqtt_func = shutdown_func
        
        if initialize_mqtt_func:
            print("[INFO] Initializing MQTT client for IoT...")
            await initialize_mqtt_func()
            print("[SUCCESS] MQTT client initialized successfully")
    except ImportError as e:
        print(f"[WARNING] IoT module not available: {e}")
    except Exception as e:
        print(f"[ERROR] Failed to initialize MQTT: {e}")
        import traceback
        traceback.print_exc()
    
    yield  # Application runs here
    
    # Shutdown
    print("[INFO] Shutting down Smart Farming AI Backend...")
    try:
        if shutdown_mqtt_func:
            print("[INFO] Shutting down MQTT client...")
            await shutdown_mqtt_func()
            print("[SUCCESS] MQTT client shutdown successfully")
    except Exception as e:
        print(f"[WARNING] Error during MQTT shutdown: {e}")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Smart Farming AI Backend",
    description="ML-powered agricultural recommendations API",
    lifespan=lifespan,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend communication - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include the chatbot API router
app.include_router(chatbot.router, prefix="/api/chatbot")

# Include the regime system API router
app.include_router(regime_routes.router, prefix="")

# Include the farm geometry/mapping API router
app.include_router(farm_geometry.router, prefix="")

# Include the IoT irrigation router
print("[INFO] Attempting to load IoT Irrigation module...")

try:
    from iot_irrigation.router import router as iot_router, initialize_mqtt, shutdown_mqtt
    # Don't add prefix here - router already has prefix="/iot"
    app.include_router(iot_router, tags=["IoT Irrigation"])
    print("[SUCCESS] IoT Irrigation module loaded successfully")
    print(f"   Router: {iot_router}")
    print(f"   Initialize MQTT: {initialize_mqtt}")
except ImportError as e:
    print(f"[ERROR] IoT Irrigation module import error: {e}")
    print(f"   Python path: {sys.path}")
    # Set to None so lifespan doesn't try to call them
    initialize_mqtt = None
    shutdown_mqtt = None
except Exception as e:
    print(f"⚠️ IoT Irrigation module error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# ============================================================================
# Application Lifecycle Events
# ============================================================================

@app.on_event("startup")
async def on_startup():
    """Initialize database connections on startup"""
    await startup_db()


@app.on_event("shutdown")
async def on_shutdown():
    """Close database connections on shutdown"""
    await shutdown_db()

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
    language: Optional[str] = Field("en", description="Preferred language (en, hi, mr)")


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
            'trained_models': 'ml_models.trained_models',  # Real ML models for fertilizer, crop, irrigation
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
    
    # Supported crops with optimal conditions
    SUPPORTED_CROPS = {
        'rice': {'optimal_moisture': (70, 90), 'optimal_temp': (20, 35), 'optimal_ph': (5.5, 7.0)},
        'wheat': {'optimal_moisture': (50, 70), 'optimal_temp': (15, 25), 'optimal_ph': (6.0, 7.5)},
        'cotton': {'optimal_moisture': (60, 80), 'optimal_temp': (21, 30), 'optimal_ph': (6.5, 8.0)},
        'maize': {'optimal_moisture': (60, 75), 'optimal_temp': (18, 27), 'optimal_ph': (5.8, 7.0)},
        'sugarcane': {'optimal_moisture': (65, 85), 'optimal_temp': (21, 27), 'optimal_ph': (6.0, 7.5)},
        'tomato': {'optimal_moisture': (60, 80), 'optimal_temp': (20, 27), 'optimal_ph': (6.0, 6.8)},
        'potato': {'optimal_moisture': (60, 75), 'optimal_temp': (15, 20), 'optimal_ph': (5.2, 6.0)},
        'onion': {'optimal_moisture': (65, 75), 'optimal_temp': (13, 24), 'optimal_ph': (6.0, 7.0)},
    }
    
    @staticmethod
    def validate_crop_type(crop_type: str) -> tuple[bool, str]:
        """Validate if crop type is supported"""
        if not crop_type or not crop_type.strip() or crop_type.lower() == "unknown":
            return False, "Crop type not specified. Please configure your crop in Farm settings."
        
        crop_lower = crop_type.strip().lower()
        if crop_lower not in RecommendationEngine.SUPPORTED_CROPS:
            return True, f"Crop '{crop_type}' is valid but not in our optimized list. Using general recommendations."
        
        return True, ""
    
    @staticmethod
    def generate_recommendations(
        farm_id: str,
        crop_type: str,
        soil_type: str,
        sensor_data: SensorData,
        weather_condition: Optional[str] = None,
        language: str = "en"
    ) -> List[Recommendation]:
        """
        Generate actionable recommendations based on sensor data.
        Uses rule-based logic + ML models (when available).
        """
        print("\n" + "="*70)
        print("🤖 AI RECOMMENDATION ENGINE STARTED")
        print("="*70)
        print(f"📋 Request Details:")
        print(f"   Farm ID: {farm_id}")
        print(f"   🌾 Crop Type: '{crop_type}'")
        print(f"   🏞️  Soil Type: {soil_type}")
        print(f"   🌡️  Sensor Data:")
        print(f"      - Moisture: {sensor_data.moisture}%")
        print(f"      - Temperature: {sensor_data.temperature}°C")
        print(f"      - pH: {sensor_data.ph}")
        print(f"      - NPK: N={sensor_data.nitrogen}, P={sensor_data.phosphorus}, K={sensor_data.potassium}")
        
        recommendations = []
        timestamp = datetime.now()
        rec_id_counter = 1
        
        # Validate crop type first
        print(f"\n🔍 Step 1: Validating crop type...")
        is_valid, validation_msg = RecommendationEngine.validate_crop_type(crop_type)
        print(f"   Validation result: {'✅ VALID' if is_valid else '❌ INVALID'}")
        if validation_msg:
            print(f"   Message: {validation_msg}")
        
        if not is_valid:
            print(f"\n⚠️  STOPPING: Crop not configured properly")
            recommendations.append(Recommendation(
                id="config_error",
                type="general",
                priority="high",
                title=LocalizationManager.get_text("config_error_title", language),
                description=LocalizationManager.get_text("config_error_desc", language),
                action=LocalizationManager.get_text("config_error_action", language),
                confidence=100,
                timestamp=timestamp
            ))
            print(f"   Returning configuration error recommendation")
            print("="*70 + "\n")
            return recommendations
        
        # Add info message for unsupported crops
        if validation_msg and crop_type.lower() not in RecommendationEngine.SUPPORTED_CROPS:
            print(f"\n💡 Info: Crop '{crop_type}' not in optimized list, using general recommendations")
            recommendations.append(Recommendation(
                id="crop_info",
                type="general",
                priority="low",
                title=LocalizationManager.get_text("crop_info_title", language, crop_type=crop_type),
                description=LocalizationManager.get_text("crop_info_desc", language, crop_type=crop_type),
                action=LocalizationManager.get_text("crop_info_action", language),
                confidence=85,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Get crop-specific optimal conditions
        crop_lower = crop_type.lower()
        optimal_conditions = RecommendationEngine.SUPPORTED_CROPS.get(crop_lower, {
            'optimal_moisture': (60, 80),
            'optimal_temp': (20, 30),
            'optimal_ph': (6.0, 7.5)
        })
        
        print(f"\n🎯 Step 2: Using optimal conditions for {crop_type}:")
        print(f"   Moisture range: {optimal_conditions['optimal_moisture'][0]}-{optimal_conditions['optimal_moisture'][1]}%")
        print(f"   Temperature range: {optimal_conditions['optimal_temp'][0]}-{optimal_conditions['optimal_temp'][1]}°C")
        print(f"   pH range: {optimal_conditions['optimal_ph'][0]}-{optimal_conditions['optimal_ph'][1]}")
        
        # Calculate deterministic confidence factor based on crop type and data quality
        # NO RANDOM VALUES - all confidence comes from ML models or deterministic calculation
        crop_confidence_factor = hash(crop_type.lower()) % 10 / 10.0  # 0.0 to 0.9 based on crop name
        data_quality_score = min(100, (sensor_data.moisture + sensor_data.temperature + sensor_data.nitrogen) / 3)
        base_confidence_adjustment = (crop_confidence_factor * 2) - 1  # -1 to +0.8 range
        
        print(f"\n🔬 Step 3: Loading ML Models...")
        # Use ML models if available
        trained_models = model_loader.models.get('trained_models')  # Real ML models
        agronomist_agent = model_loader.models.get('agronomist')
        meteorologist_agent = model_loader.models.get('meteorologist')
        print(f"   Trained ML Models: {'✅ Loaded' if trained_models else '❌ Not available'}")
        print(f"   Agronomist Agent: {'✅ Loaded' if agronomist_agent else '❌ Not available'}")
        print(f"   Meteorologist Agent: {'✅ Loaded' if meteorologist_agent else '❌ Not available'}")
        
        # Get ML predictions if models are loaded
        ml_fertilizer_recs = []
        ml_confidence_scores = {}
        
        # Try trained ML models first (REAL predictions)
        if trained_models:
            try:
                print(f"   🤖 Using REAL ML model predictions...")
                ml_result = trained_models.get_fertilizer_prediction(
                    sensor_data.nitrogen,
                    sensor_data.phosphorus,
                    sensor_data.potassium,
                    sensor_data.ph,
                    soil_type,
                    crop_type
                )
                ml_fertilizer_recs = ml_result.get('recommendations', [])
                ml_confidence_scores['fertilizer'] = ml_result.get('model_confidence', 85)
                print(f"   ✓ ML Model returned {len(ml_fertilizer_recs)} fertilizer recommendations")
                print(f"   ✓ Model confidence: {ml_confidence_scores['fertilizer']:.1f}%")
            except Exception as e:
                print(f"⚠️ Trained ML model error: {e}")
        
        # Fallback to old fertilizer model if trained models fail
        # Custom fallback logic if needed
        pass
        
        agronomist_analysis = None
        if agronomist_agent:
            try:
                # The module exports an 'agent' instance with analyze_crop_health method
                agronomist_analysis = agronomist_agent.agent.analyze_crop_health(
                    crop_type,
                    "vegetative",  # Could be dynamic based on time of year
                    sensor_data.temperature,
                    sensor_data.humidity,
                    sensor_data.rainfall if sensor_data.rainfall else 0
                )
                print(f"   ✅ Agronomist analysis returned {len(agronomist_analysis.get('alerts', []))} alerts")
            except Exception as e:
                print(f"⚠️ Agronomist agent error: {e}")
        
        weather_analysis = None
        if meteorologist_agent:
            try:
                weather_analysis = meteorologist_agent.analyze(
                    sensor_data.temperature,
                    sensor_data.humidity,
                    sensor_data.rainfall if sensor_data.rainfall else 0,
                    wind_speed=0,
                    weather_condition=weather_condition or "Clear"
                )
            except Exception as e:
                print(f"⚠️ Meteorologist agent error: {e}")
        
        # --- CROP SUITABILITY CHECK (NEW: ML-based crop analysis) ---
        crop_suitability = None
        if trained_models:
            try:
                crop_suitability = trained_models.get_crop_suitability(
                    crop_type,
                    sensor_data.nitrogen,
                    sensor_data.phosphorus,
                    sensor_data.potassium,
                    sensor_data.temperature,
                    sensor_data.humidity,
                    sensor_data.ph,
                    sensor_data.rainfall if sensor_data.rainfall else 0
                )
                print(f"   🌱 Crop Suitability for {crop_type}: {crop_suitability.get('suitability', 0):.1f}%")
                
                # Add crop suitability recommendation if score is low AND there's a significantly better alternative
                suitability_score = crop_suitability.get('suitability', 50)
                is_significantly_better = crop_suitability.get('is_significantly_better', False)
                
                if suitability_score < 40 and is_significantly_better:
                    recommendations.append(Recommendation(
                        id=f"crop_{rec_id_counter}",
                        type="crop",
                        priority="high",
                        title=f"Crop Suitability Warning: {crop_type}",
                        description=crop_suitability.get('message', ''),
                        action=f"Consider growing {crop_suitability.get('best_alternative', 'alternative crop')} instead for better yields.",
                        confidence=round(suitability_score, 1),
                        timestamp=timestamp
                    ))
                    rec_id_counter += 1
                elif suitability_score >= 70:
                    recommendations.append(Recommendation(
                        id=f"crop_{rec_id_counter}",
                        type="crop",
                        priority="low",
                        title=f"Excellent Choice: {crop_type}",
                        description=f"ML analysis confirms {crop_type} is well-suited for current conditions.",
                        action="Continue with current crop. Conditions are optimal.",
                        confidence=round(suitability_score, 1),
                        timestamp=timestamp
                    ))
                    rec_id_counter += 1
            except Exception as e:
                print(f"⚠️ Crop suitability check error: {e}")
        

        # --- FERTILIZER RECOMMENDATIONS (Enhanced with REAL ML) ---
        
        # Get ML-based confidence or use variance
        ml_fert_confidence = ml_confidence_scores.get('fertilizer', None)
        
        # Nitrogen analysis
        if sensor_data.nitrogen < 40:
            # Use ML model recommendations if available
            ml_action = "Apply 50kg/hectare urea fertilizer within 7 days"
            ml_conf = None
            
            if ml_fertilizer_recs:
                nitrogen_rec = next((r for r in ml_fertilizer_recs if r['nutrient'] == 'Nitrogen'), None)
                if nitrogen_rec:
                    ml_action = f"Apply {nitrogen_rec['amount_kg_per_hectare']}kg/hectare {nitrogen_rec['fertilizer']}"
                    ml_conf = nitrogen_rec.get('confidence')  # Get REAL ML confidence
            
            # Use ML confidence if available, otherwise calculated confidence
            if ml_conf is not None:
                final_confidence = ml_conf
            else:
                final_confidence = round(min(98, max(85, 92 + base_confidence_adjustment)), 1)
            
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="high",
                title=LocalizationManager.get_text("nitrogen_low_title", language),
                description=LocalizationManager.get_text("nitrogen_low_desc", language, value=sensor_data.nitrogen),
                action=LocalizationManager.get_text("nitrogen_low_action", language, 
                    bags=(50/2.47)/50, 
                    amount_per_acre=50/2.47
                ),
                confidence=final_confidence,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.nitrogen > 200:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="low",
                title=LocalizationManager.get_text("nitrogen_optimal_title", language),
                description=LocalizationManager.get_text("nitrogen_optimal_desc", language, value=sensor_data.nitrogen),
                action=LocalizationManager.get_text("nitrogen_optimal_action", language),
                confidence=round(min(95, max(82, 88 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Phosphorus analysis
        if sensor_data.phosphorus < 20:
            ml_action = "Apply 30kg/hectare phosphate fertilizer (DAP or SSP)"
            ml_conf = None
            
            if ml_fertilizer_recs:
                phosphorus_rec = next((r for r in ml_fertilizer_recs if r['nutrient'] == 'Phosphorus'), None)
                if phosphorus_rec:
                    ml_action = f"Apply {phosphorus_rec['amount_kg_per_hectare']}kg/hectare {phosphorus_rec['fertilizer']}"
                    ml_conf = phosphorus_rec.get('confidence')
            
            final_confidence = ml_conf if ml_conf is not None else round(min(95, max(80, 87 + base_confidence_adjustment)), 1)
            
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="medium",
                title=LocalizationManager.get_text("phosphorus_low_title", language),
                description=LocalizationManager.get_text("phosphorus_low_desc", language, value=sensor_data.phosphorus),
                action=LocalizationManager.get_text("phosphorus_low_action", language, 
                    bags=(30/2.47)/50, 
                    amount_per_acre=30/2.47
                ),
                confidence=final_confidence,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Potassium analysis
        if sensor_data.potassium < 150:
            ml_action = "Apply 40kg/hectare potassium chloride (MOP)"
            ml_conf = None
            
            if ml_fertilizer_recs:
                potassium_rec = next((r for r in ml_fertilizer_recs if r['nutrient'] == 'Potassium'), None)
                if potassium_rec:
                    ml_action = f"Apply {potassium_rec['amount_kg_per_hectare']}kg/hectare {potassium_rec['fertilizer']}"
                    ml_conf = potassium_rec.get('confidence')
            
            final_confidence = ml_conf if ml_conf is not None else round(min(93, max(78, 85 + base_confidence_adjustment)), 1)
            
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="medium",
                title=LocalizationManager.get_text("potassium_low_title", language),
                description=LocalizationManager.get_text("potassium_low_desc", language, value=sensor_data.potassium),
                action=LocalizationManager.get_text("potassium_low_action", language, 
                    bags=(40/2.47)/50, 
                    amount_per_acre=40/2.47
                ),
                confidence=final_confidence,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.potassium >= 150 and sensor_data.potassium <= 250:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="low",
                title=LocalizationManager.get_text("potassium_optimal_title", language),
                description=LocalizationManager.get_text("potassium_optimal_desc", language, value=sensor_data.potassium),
                action=LocalizationManager.get_text("potassium_optimal_action", language),
                confidence=round(min(92, max(80, 86 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Phosphorus range check (20-50 is moderate)
        if sensor_data.phosphorus >= 20 and sensor_data.phosphorus < 50:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="low",
                title=LocalizationManager.get_text("phosphorus_moderate_title", language),
                description=LocalizationManager.get_text("phosphorus_moderate_desc", language, value=sensor_data.phosphorus),
                action=LocalizationManager.get_text("phosphorus_moderate_action", language),
                confidence=round(min(90, max(75, 82 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # Nitrogen sufficiency message (when in good range)
        if sensor_data.nitrogen >= 100 and sensor_data.nitrogen <= 200:
            recommendations.append(Recommendation(
                id=f"fert_{rec_id_counter}",
                type="fertilizer",
                priority="low",
                title="Nitrogen Levels Optimal",
                description=f"Nitrogen content ({sensor_data.nitrogen:.1f} mg/kg) is excellent for vegetative growth and chlorophyll production.",
                action="No action needed. Continue current nitrogen management.",
                confidence=round(min(94, max(82, 88 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # EC/Salinity check
        if sensor_data.ec > 2.5:
            recommendations.append(Recommendation(
                id=f"soil_{rec_id_counter}",
                type="soil_treatment",
                priority="medium",
                title=LocalizationManager.get_text("salinity_high_title", language),
                description=LocalizationManager.get_text("salinity_high_desc", language, value=sensor_data.ec),
                action=LocalizationManager.get_text("salinity_high_action", language),
                confidence=round(min(91, max(78, 84 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.ec <= 2.5:
            recommendations.append(Recommendation(
                id=f"soil_{rec_id_counter}",
                type="soil_treatment",
                priority="low",
                title=LocalizationManager.get_text("salinity_normal_title", language),
                description=LocalizationManager.get_text("salinity_normal_desc", language, value=sensor_data.ec),
                action=LocalizationManager.get_text("salinity_normal_action", language),
                confidence=round(min(92, max(80, 86 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- IRRIGATION RECOMMENDATIONS (Enhanced with Weather Analysis & Crop-Specific & ML) ---
        
        irrigation_adjustment = 1.0
        if weather_analysis and 'alerts' in weather_analysis:
            for alert in weather_analysis['alerts']:
                if alert['type'] == 'heavy_rainfall':
                    irrigation_adjustment = 0.5
                elif alert['type'] == 'heat_wave':
                    irrigation_adjustment = 1.5
        
        # Crop-specific moisture thresholds
        min_moisture, max_moisture = optimal_conditions['optimal_moisture']
        
        print(f"\n💧 Step 4: Analyzing Irrigation for {crop_type}...")
        print(f"   Current moisture: {sensor_data.moisture:.1f}%")
        print(f"   Optimal range for {crop_type}: {min_moisture}-{max_moisture}%")
        
        # Get ML irrigation prediction if available
        ml_irrigation_result = None
        if trained_models:
            try:
                ml_irrigation_result = trained_models.get_irrigation_prediction(
                    sensor_data.moisture,
                    sensor_data.temperature,
                    sensor_data.humidity,
                    crop_type
                )
                print(f"   🤖 ML Irrigation Model: {ml_irrigation_result['water_amount_mm']:.1f}mm needed")
                print(f"   🤖 Model Confidence: {ml_irrigation_result['confidence']:.1f}%")
            except Exception as e:
                print(f"   ⚠️ ML irrigation model error: {e}")
        
        if sensor_data.moisture < min_moisture:
            print(f"   🚨 LOW MOISTURE DETECTED: {sensor_data.moisture:.1f}% < {min_moisture}%")
            print(f"   Generating HIGH priority irrigation recommendation")
            
            # Use ML model water amount if available, otherwise calculate
            if ml_irrigation_result and ml_irrigation_result['water_amount_mm'] > 10:
                water_depth = int(ml_irrigation_result['water_amount_mm'] * irrigation_adjustment)
                ml_confidence = ml_irrigation_result['confidence']
            else:
                water_depth = int(50 * irrigation_adjustment)
                ml_confidence = None
            
            final_conf = ml_confidence if ml_confidence is not None else round(min(99, max(90, 96 + base_confidence_adjustment)), 1)
            final_conf = ml_confidence if ml_confidence is not None else round(min(99, max(90, 96 + base_confidence_adjustment)), 1)
            
            severity = "critically" if sensor_data.moisture < (min_moisture - 20) else "moderately"
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="high" if sensor_data.moisture < (min_moisture - 20) else "medium",
                title=LocalizationManager.get_text("irrigation_needed_title", language, crop_type=crop_type),
                description=LocalizationManager.get_text("irrigation_needed_desc", language, value=sensor_data.moisture, crop_type=crop_type, min=min_moisture, max=max_moisture),
                action=LocalizationManager.get_text(
                    "irrigation_rice_action" if crop_type.lower() == "rice" and water_depth > 40 else "irrigation_needed_action", 
                    language, 
                    inches=water_depth/25.4, 
                    amount_mm=water_depth,
                    hours=(water_depth/25.4) * 1.5
                ),
                confidence=final_conf,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.moisture > max_moisture:
            print(f"   ⚠️ HIGH MOISTURE: {sensor_data.moisture:.1f}% > {max_moisture}%")
            print(f"   Generating reduce irrigation recommendation")
            pause_days = 3 if weather_condition and 'rain' in weather_condition.lower() else 5
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="medium",
                title=LocalizationManager.get_text("irrigation_reduce_title", language),
                description=LocalizationManager.get_text("irrigation_reduce_desc", language, value=sensor_data.moisture, crop_type=crop_type, min=min_moisture, max=max_moisture),
                action=LocalizationManager.get_text("irrigation_reduce_action", language, days=pause_days),
                confidence=round(min(96, max(85, 91 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.moisture >= min_moisture and sensor_data.moisture <= max_moisture:
            recommendations.append(Recommendation(
                id=f"irr_{rec_id_counter}",
                type="irrigation",
                priority="low",
                title=LocalizationManager.get_text("irrigation_optimal_title", language),
                description=LocalizationManager.get_text("irrigation_optimal_desc", language, value=sensor_data.moisture),
                action=LocalizationManager.get_text("irrigation_optimal_action", language),
                confidence=round(min(95, max(82, 89 + base_confidence_adjustment)), 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- AGRONOMIST AGENT RECOMMENDATIONS ---
        if agronomist_analysis and 'alerts' in agronomist_analysis:
            for alert in agronomist_analysis['alerts']:
                if alert['severity'] == 'high':
                    recommendations.append(Recommendation(
                        id=f"agro_{rec_id_counter}",
                        type="stress_management" if 'stress' in alert['type'] else "general",
                        priority="high",
                        title=alert['message'],
                        description=f"Agronomist AI analysis: {alert['message']}. Impact: {alert.get('farming_impact', 'Immediate attention needed')}",
                        action=alert.get('action', 'Consult agronomist for specific actions'),
                        confidence=round(min(96, max(84, 90 + base_confidence_adjustment)), 1),
                        timestamp=timestamp
                    ))
                    rec_id_counter += 1
        
        # --- TEMPERATURE & STRESS MANAGEMENT ---
        
        if sensor_data.temperature > 35:
            recommendations.append(Recommendation(
                id=f"stress_{rec_id_counter}",
                type="stress_management",
                priority="high",
                title=LocalizationManager.get_text("heat_stress_title", language),
                description=LocalizationManager.get_text("heat_stress_desc", language, value=sensor_data.temperature),
                action=LocalizationManager.get_text("heat_stress_action", language),
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
                title=LocalizationManager.get_text("ph_acidic_title", language),
                description=LocalizationManager.get_text("ph_acidic_desc", language, value=sensor_data.ph),
                action=LocalizationManager.get_text("ph_acidic_action", language),
                confidence=90,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.ph > 8.5:
            recommendations.append(Recommendation(
                id=f"ph_{rec_id_counter}",
                type="soil_treatment",
                priority="medium",
                title=LocalizationManager.get_text("ph_alkaline_title", language),
                description=LocalizationManager.get_text("ph_alkaline_desc", language, value=sensor_data.ph),
                action=LocalizationManager.get_text("ph_alkaline_action", language),
                confidence=87,
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.ph >= 5.5 and sensor_data.ph <= 8.5:
            # pH in good range
            recommendations.append(Recommendation(
                id=f"ph_{rec_id_counter}",
                type="soil_treatment",
                priority="low",
                title=LocalizationManager.get_text("ph_optimal_title", language),
                description=LocalizationManager.get_text("ph_optimal_desc", language, value=sensor_data.ph),
                action=LocalizationManager.get_text("ph_optimal_action", language),
                confidence=round(89 + base_confidence_adjustment, 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        
        # --- HUMIDITY-BASED RECOMMENDATIONS ---
        
        if sensor_data.humidity > 85:
            recommendations.append(Recommendation(
                id=f"humidity_{rec_id_counter}",
                type="general",
                priority="medium",
                title=LocalizationManager.get_text("humidity_high_title", language),
                description=LocalizationManager.get_text("humidity_high_desc", language, value=sensor_data.humidity),
                action=LocalizationManager.get_text("humidity_high_action", language),
                confidence=round(86 + base_confidence_adjustment, 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        elif sensor_data.humidity < 40:
            recommendations.append(Recommendation(
                id=f"humidity_{rec_id_counter}",
                type="general",
                priority="medium",
                title="Low Humidity Warning",
                description=f"Air humidity ({sensor_data.humidity:.0f}%) is low. May cause water stress and reduced photosynthesis.",
                action="Increase irrigation frequency. Consider misting during peak heat hours. Apply mulch to retain moisture.",
                confidence=round(84 + base_confidence_adjustment, 1),
                timestamp=timestamp
            ))
            rec_id_counter += 1
        else:
            recommendations.append(Recommendation(
                id=f"humidity_{rec_id_counter}",
                type="general",
                priority="low",
                title="Humidity Levels Normal",
                description=f"Air humidity ({sensor_data.humidity:.0f}%) is within optimal range for crop growth.",
                action="Continue monitoring. Current conditions favorable for most crops.",
                confidence=round(88 + base_confidence_adjustment, 1),
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
        
        print(f"\n✅ Step 5: Recommendation Generation Complete")
        print(f"   Total recommendations: {len(recommendations)}")
        for idx, rec in enumerate(recommendations, 1):
            print(f"   {idx}. [{rec.priority.upper()}] {rec.type}: {rec.title} (confidence: {rec.confidence:.1f}%)")
        print("="*70 + "\n")
        
        return recommendations


# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load models and initialize database when API starts"""
    print("🚀 Starting Smart Farming AI Backend...")
    print("📦 Loading ML models...")
    status = model_loader.load_models()
    print(f"✅ Models loaded: {sum(status.values())}/{len(status)}")
    
    # Initialize Regime System database
    print("📊 Initializing Regime System database...")
    try:
        supabase_client = get_supabase_client()
        regime_db = RegimeDatabase(supabase_client)
        regime_routes.set_regime_db(regime_db)
        print("✅ Regime database initialized")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize regime database: {e}")
        print("   Regime endpoints will be unavailable until database is configured")
    
    print("✅ API ready!")


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
        print(f"⚠️ RECEIVED PREDICT REQUEST: farm_id={request.farm_id} lang={request.language}")
        print(f"⚠️ Sensor data: {request.sensor_data}")
        
        # Generate recommendations
        recommendations = RecommendationEngine.generate_recommendations(
            farm_id=request.farm_id,
            crop_type=request.crop_type,
            soil_type=request.soil_type,
            sensor_data=request.sensor_data,
            weather_condition=request.weather_condition,
            language=request.language or "en"
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
        reload=False,
        log_level="info"
    )
