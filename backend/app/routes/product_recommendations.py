"""
Product Recommendation API Routes
Endpoints for generating product recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import logging

from app.db.base import get_db_connection
from app.services.product_recommendation import ProductRecommendationEngine


router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])
logger = logging.getLogger(__name__)


def _fallback_fertilizer_products() -> List[Dict[str, Any]]:
    """Fallback catalog used when fertilizer_products table is not available."""
    return [
        {
            "id": "fallback-iffco-nano-urea",
            "product_name": "IFFCO Nano Urea",
            "manufacturer": "IFFCO",
            "npk_ratio": "Nano N",
            "nitrogen_percent": 46.0,
            "phosphorus_percent": 0.0,
            "potassium_percent": 0.0,
            "price_per_unit": 225.0,
            "unit_type": "bottle",
            "product_type": "nano",
            "is_available": True,
            "source": "fallback",
        },
        {
            "id": "fallback-coromandel-dap",
            "product_name": "Coromandel DAP",
            "manufacturer": "Coromandel",
            "npk_ratio": "18-46-0",
            "nitrogen_percent": 18.0,
            "phosphorus_percent": 46.0,
            "potassium_percent": 0.0,
            "price_per_unit": 1350.0,
            "unit_type": "bag",
            "product_type": "chemical",
            "is_available": True,
            "source": "fallback",
        },
        {
            "id": "fallback-iffco-npk-102626",
            "product_name": "IFFCO NPK 10-26-26",
            "manufacturer": "IFFCO",
            "npk_ratio": "10-26-26",
            "nitrogen_percent": 10.0,
            "phosphorus_percent": 26.0,
            "potassium_percent": 26.0,
            "price_per_unit": 1720.0,
            "unit_type": "bag",
            "product_type": "chemical",
            "is_available": True,
            "source": "fallback",
        },
    ]


# Request/Response Models
class ProductRecommendationRequest(BaseModel):
    farmer_id: str = Field(..., description="Farmer UUID")
    farm_id: Optional[str] = None
    soil_data: Dict[str, float] = Field(..., description="Current NPK levels {N, P, K, pH}")
    crop_type: str = Field(..., description="Crop being grown")
    farm_size_hectares: float = Field(..., gt=0, description="Farm size in hectares")
    budget_preference: str = Field(default="balanced", description="budget|balanced|premium")


class ProductRecommendation(BaseModel):
    product_id: str
    product_name: str
    manufacturer: str
    npk_ratio: str
    product_type: str
    target_nutrient: str
    quantity: int
    quantity_text: str
    unit_type: str
    price_per_unit: float
    total_cost: float
    nutrients_provided: Dict[str, float]
    cost_per_kg_nutrient: float
    efficiency_score: float


class RecommendationResponse(BaseModel):
    report_id: str
    soil_analysis: Dict[str, float]
    crop_type: str
    farm_size_hectares: float
    nutrient_gaps: Dict[str, float]
    total_nutrients_needed: Dict[str, float]
    recommended_products: List[Dict[str, Any]]
    total_estimated_cost: float
    estimated_yield_improvement_percent: float
    summary: str
    generated_at: datetime


class PredictRecommendationRequest(BaseModel):
    farm_id: str = Field(..., description="Farm UUID")
    crop_type: str = Field(..., description="Crop being grown")
    soil_type: str = Field(default="Clay loam", description="Soil type")
    sensor_data: Dict[str, float] = Field(..., description="Current sensor readings")
    language: str = Field(default="en", description="Language code")


class Recommendation(BaseModel):
    id: str
    type: str  # irrigation, fertilizer, pest, crop, general, stress_management, soil_treatment
    priority: str  # high, medium, low
    title: str
    description: str
    action: str
    confidence: float
    timestamp: str


class PredictRecommendationResponse(BaseModel):
    recommendations: List[Recommendation]
    farm_id: str
    crop_type: str
    generated_at: datetime


@router.post("/products", response_model=RecommendationResponse)
async def generate_product_recommendations(
    request: ProductRecommendationRequest
):
    """
    Generate fertilizer product recommendations based on soil analysis
    
    **Algorithm:**
    1. Calculate nutrient gaps (optimal - current)
    2. Query product database
    3. Match products to deficiencies
    4. Calculate quantities and costs
    5. Rank by efficiency score
    
    **Returns:** Top 5 recommended products with quantities and costs
    """
    try:
        db = await get_db_connection()

        # Initialize recommendation engine
        engine = ProductRecommendationEngine(db)

        # Generate recommendations
        report = await engine.generate_recommendations(
            soil_data=request.soil_data,
            crop_type=request.crop_type,
            farm_size_hectares=request.farm_size_hectares,
            budget_preference=request.budget_preference,
        )

        # Save report to database
        report_id = await save_recommendation_report(
            db=db,
            farmer_id=request.farmer_id,
            farm_id=request.farm_id,
            report_data=report,
        )

        return RecommendationResponse(
            report_id=report_id,
            **report,
            generated_at=datetime.now(),
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/reports/farmer/{farmer_id}")
async def get_farmer_reports(farmer_id: str, limit: int = 10):
    """Get all recommendation reports for a farmer"""
    try:
        db = await get_db_connection()

        query = """
            SELECT
                id, generated_at, crop_type, farm_size_hectares,
                total_estimated_cost, status
            FROM recommendation_reports
            WHERE farmer_id = :farmer_id
            ORDER BY generated_at DESC
            LIMIT :limit
        """

        reports = await db.fetch_all(query, {"farmer_id": farmer_id, "limit": limit})

        return [dict(row) for row in reports]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve reports: {str(e)}"
        )


@router.get("/reports/{report_id}")
async def get_recommendation_report(report_id: str):
    """Retrieve a saved recommendation report"""
    try:
        db = await get_db_connection()

        query = """
            SELECT
                id, farmer_id, farm_id, generated_at,
                soil_analysis, nutrient_gaps, crop_type,
                farm_size_hectares, recommended_products,
                total_estimated_cost, estimated_yield_improvement_percent,
                status
            FROM recommendation_reports
            WHERE id = :report_id
        """

        report = await db.fetch_one(query, {"report_id": report_id})

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        return dict(report)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve report: {str(e)}"
        )


@router.get("/products/fertilizers")
async def get_all_fertilizers(
    manufacturer: Optional[str] = None,
    product_type: Optional[str] = None
):
    """Get all available fertilizer products"""
    try:
        db = await get_db_connection()

        query = """
            SELECT
                id, product_name, manufacturer, npk_ratio,
                nitrogen_percent, phosphorus_percent, potassium_percent,
                price_per_unit, unit_type, product_type,
                is_available
            FROM fertilizer_products
            WHERE is_available = true
        """

        params: Dict[str, Any] = {}
        if manufacturer:
            query += " AND manufacturer = :manufacturer"
            params["manufacturer"] = manufacturer
        if product_type:
            query += " AND product_type = :product_type"
            params["product_type"] = product_type

        query += " ORDER BY product_name"

        try:
            products = await db.fetch_all(query, params)
        except Exception as db_error:
            # Keep endpoint operational even before product catalog migration is run.
            if 'relation "fertilizer_products" does not exist' in str(db_error):
                logger.warning(
                    "fertilizer_products table not found. Returning fallback fertilizer catalog."
                )
                return _fallback_fertilizer_products()
            raise

        normalized: List[Dict[str, Any]] = []
        for row in products:
            item = dict(row)
            for numeric_key in (
                "nitrogen_percent",
                "phosphorus_percent",
                "potassium_percent",
                "price_per_unit",
            ):
                if item.get(numeric_key) is not None:
                    item[numeric_key] = float(item[numeric_key])
            normalized.append(item)

        return normalized
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve products: {str(e)}"
        )


@router.post("/predict", response_model=PredictRecommendationResponse)
async def predict_recommendations(request: PredictRecommendationRequest):
    """
    Generate personalized agricultural recommendations based on farm sensor data.
    
    This endpoint analyzes:
    - Current soil NPK levels and pH
    - Crop type and season
    - Soil moisture and temperature
    - Environmental conditions
    
    Returns actionable recommendations for:
    - Irrigation management
    - Fertilizer application
    - Pest/disease management
    - Crop care
    - Stress management
    """
    import uuid
    from datetime import datetime, timedelta
    
    try:
        # Extract sensor data
        nitrogen = request.sensor_data.get("nitrogen", 50)
        phosphorus = request.sensor_data.get("phosphorus", 40)
        potassium = request.sensor_data.get("potassium", 40)
        ph = request.sensor_data.get("ph", 6.5)
        moisture = request.sensor_data.get("moisture", 45)
        temperature = request.sensor_data.get("temperature", 25)
        humidity = request.sensor_data.get("humidity", 65)
        ec = request.sensor_data.get("ec", 1.0)
        
        recommendations: List[Dict[str, Any]] = []
        
        # ===== IRRIGATION RECOMMENDATIONS =====
        if moisture < 30:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "irrigation",
                "priority": "high",
                "title": "Critical: Increase Irrigation",
                "description": f"Soil moisture is critically low at {moisture}%. Immediate irrigation needed.",
                "action": "Increase irrigation frequency. Apply 25-30mm water immediately.",
                "confidence": 0.95,
                "timestamp": datetime.utcnow().isoformat()
            })
        elif moisture < 40:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "irrigation",
                "priority": "high",
                "title": "Increase Irrigation Soon",
                "description": f"Soil moisture at {moisture}%. Irrigation needed in next 1-2 days.",
                "action": "Schedule irrigation within 24 hours. Apply 20-25mm water.",
                "confidence": 0.9,
                "timestamp": datetime.utcnow().isoformat()
            })
        elif moisture > 70:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "irrigation",
                "priority": "medium",
                "title": "Reduce Irrigation",
                "description": f"Soil moisture is high at {moisture}%. Risk of waterlogging.",
                "action": "Reduce irrigation. Ensure good drainage. Monitor for fungal diseases.",
                "confidence": 0.85,
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "irrigation",
                "priority": "low",
                "title": "Soil Moisture Optimal",
                "description": f"Soil moisture at {moisture}%. Current irrigation schedule is good.",
                "action": "Continue regular irrigation schedule. Monitor moisture levels daily.",
                "confidence": 0.85,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # ===== FERTILIZER RECOMMENDATIONS =====
        npk_deficiency = []
        
        if nitrogen < 40:
            npk_deficiency.append("nitrogen")
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "fertilizer",
                "priority": "high",
                "title": f"Apply Nitrogen Fertilizer (N={nitrogen}%)",
                "description": "Nitrogen deficiency detected. This affects leaf growth and color.",
                "action": "Apply Urea (46% N) at 50-75 kg/hectare. Split application recommended.",
                "confidence": 0.92,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        if phosphorus < 30:
            npk_deficiency.append("phosphorus")
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "fertilizer",
                "priority": "high",
                "title": f"Apply Phosphorus Fertilizer (P={phosphorus}%)",
                "description": "Phosphorus deficiency detected. Affects root development and flowering.",
                "action": "Apply DAP (18:46:0) or SSP (0:16:0) at 25-50 kg/hectare.",
                "confidence": 0.92,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        if potassium < 30:
            npk_deficiency.append("potassium")
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "fertilizer",
                "priority": "high",
                "title": f"Apply Potassium Fertilizer (K={potassium}%)",
                "description": "Potassium deficiency detected. Affects fruit quality and disease resistance.",
                "action": "Apply Muriate of Potash (60% K2O) at 40-60 kg/hectare.",
                "confidence": 0.92,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        if not npk_deficiency:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "fertilizer",
                "priority": "low",
                "title": "NPK Levels Adequate",
                "description": f"Current levels: N={nitrogen}%, P={phosphorus}%, K={potassium}%",
                "action": "Maintain current nutrition levels. Continue regular monitoring.",
                "confidence": 0.88,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # ===== pH RECOMMENDATIONS =====
        if ph < 5.5:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "soil_treatment",
                "priority": "high",
                "title": "Soil Too Acidic (pH={:.1f})".format(ph),
                "description": "Soil pH is too acidic. Many nutrients become unavailable.",
                "action": "Apply lime (CaCO3) at 2-5 tons/hectare. Wait 2-3 weeks before planting.",
                "confidence": 0.9,
                "timestamp": datetime.utcnow().isoformat()
            })
        elif ph > 8.0:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "soil_treatment",
                "priority": "high",
                "title": "Soil Too Alkaline (pH={:.1f})".format(ph),
                "description": "Soil pH is too alkaline. Risk of micronutrient deficiencies.",
                "action": "Apply sulfur (S) at 500-1000 kg/hectare or use acidifying fertilizers.",
                "confidence": 0.9,
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "soil_treatment",
                "priority": "low",
                "title": "Soil pH Optimal",
                "description": f"Soil pH at {ph:.1f}. Nutrient availability is good.",
                "action": "Continue monitoring pH. Maintain optimal conditions.",
                "confidence": 0.85,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # ===== PEST MANAGEMENT RECOMMENDATIONS =====
        if humidity > 75 and temperature > 22:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "pest",
                "priority": "high",
                "title": "High Risk: Fungal Diseases",
                "description": "High humidity ({:.0f}%) and warm temperature ({:.0f}°C) favor fungal growth.".format(humidity, temperature),
                "action": "Spray fungicide (Mancozeb 75% WP) at 2 kg/hectare. Improve ventilation.",
                "confidence": 0.88,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        if temperature > 30:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "pest",
                "priority": "medium",
                "title": "High Temperature Stress",
                "description": f"Temperature is high at {temperature}°C. Risk of heat stress.",
                "action": "Increase irrigation to cool plants. Provide shade for sensitive crops.",
                "confidence": 0.82,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # ===== GENERAL CARE =====
        recommendations.append({
            "id": str(uuid.uuid4()),
            "type": "general",
            "priority": "medium",
            "title": "Regular Monitoring",
            "description": "Continuous monitoring ensures optimal crop health.",
            "action": "Check sensor readings daily. Look for pest damage and disease signs.",
            "confidence": 0.95,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Return response
        response = PredictRecommendationResponse(
            recommendations=[Recommendation(**rec) for rec in recommendations],
            farm_id=request.farm_id,
            crop_type=request.crop_type,
            generated_at=datetime.utcnow()
        )
        
        return response
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


# Helper function
async def save_recommendation_report(
    db,
    farmer_id: str,
    farm_id: Optional[str],
    report_data: Dict
) -> str:
    """Save recommendation report to database"""
    query = """
        INSERT INTO recommendation_reports (
            farmer_id, farm_id, soil_analysis, nutrient_gaps,
            crop_type, farm_size_hectares, recommended_products,
            total_estimated_cost, estimated_yield_improvement_percent,
            status
        ) VALUES (
            :farmer_id, :farm_id, :soil_analysis, :nutrient_gaps,
            :crop_type, :farm_size_hectares, :recommended_products,
            :total_estimated_cost, :estimated_yield_improvement_percent,
            :status
        )
        RETURNING id
    """

    values = {
        "farmer_id": farmer_id,
        "farm_id": farm_id,
        "soil_analysis": json.dumps(report_data["soil_analysis"]),
        "nutrient_gaps": json.dumps(report_data["nutrient_gaps"]),
        "crop_type": report_data["crop_type"],
        "farm_size_hectares": report_data["farm_size_hectares"],
        "recommended_products": json.dumps(report_data["recommended_products"]),
        "total_estimated_cost": report_data["total_estimated_cost"],
        "estimated_yield_improvement_percent": report_data["estimated_yield_improvement_percent"],
        "status": "generated",
    }

    report_id = await db.fetch_val(query, values)
    
    return str(report_id)
