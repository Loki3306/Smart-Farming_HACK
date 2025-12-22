"""
Fertilizer Recommendation API Endpoint
Provides ML-based fertilizer recommendations via REST API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from app.ml_models import get_fertilizer_recommender

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/fertilizer", tags=["Fertilizer Recommendations"])


class FertilizerRequest(BaseModel):
    """Request model for fertilizer recommendations"""
    temperature: float = Field(..., ge=-10, le=50, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage")
    soil_type: str = Field(..., description="Type of soil (Sandy, Loamy, Black, Red, Clayey)")
    crop_type: str = Field(..., description="Type of crop being grown")
    current_nitrogen: Optional[float] = Field(0, ge=0, description="Current nitrogen level in soil")
    current_phosphorous: Optional[float] = Field(0, ge=0, description="Current phosphorous level in soil")
    current_potassium: Optional[float] = Field(0, ge=0, description="Current potassium level in soil")
    
    class Config:
        schema_extra = {
            "example": {
                "temperature": 32,
                "humidity": 60,
                "moisture": 45,
                "soil_type": "Loamy",
                "crop_type": "Wheat",
                "current_nitrogen": 15,
                "current_phosphorous": 10,
                "current_potassium": 120
            }
        }


class FertilizerResponse(BaseModel):
    """Response model for fertilizer recommendations"""
    success: bool
    data: Optional[Dict[str, Any]]
    error: Optional[str] = None


@router.post("/recommend", response_model=FertilizerResponse)
async def get_fertilizer_recommendation(request: FertilizerRequest):
    """
    Get AI-powered fertilizer recommendation
    
    Returns optimal fertilizer type, quantity (NPK), application rate, and timing
    based on current soil and environmental conditions.
    """
    try:
        logger.info(f"📊 Fertilizer recommendation request: {request.crop_type} on {request.soil_type} soil")
        
        # Get the recommender instance
        recommender = get_fertilizer_recommender()
        
        # Get prediction
        recommendation = recommender.predict_fertilizer(
            temperature=request.temperature,
            humidity=request.humidity,
            moisture=request.moisture,
            soil_type=request.soil_type,
            crop_type=request.crop_type,
            current_n=request.current_nitrogen,
            current_p=request.current_phosphorous,
            current_k=request.current_potassium
        )
        
        logger.info(f"✅ Recommendation generated: {recommendation['fertilizer_name']}")
        
        return FertilizerResponse(
            success=True,
            data=recommendation
        )
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"❌ Error generating recommendation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")


@router.get("/crops/{crop_type}/guidelines")
async def get_crop_guidelines(crop_type: str):
    """
    Get general fertilizer guidelines for a specific crop
    
    Returns crop-specific information about nutrient requirements,
    application timing, and typical fertilizer types.
    """
    try:
        recommender = get_fertilizer_recommender()
        guidelines = recommender.get_crop_specific_recommendations(crop_type)
        
        return {
            "success": True,
            "crop_type": crop_type,
            "guidelines": guidelines
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching guidelines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/soil-types")
async def get_supported_soil_types():
    """Get list of supported soil types"""
    return {
        "success": True,
        "soil_types": ["Sandy", "Loamy", "Black", "Red", "Clayey"]
    }


@router.get("/crop-types")
async def get_supported_crop_types():
    """Get list of supported crop types"""
    return {
        "success": True,
        "crop_types": [
            "Wheat", "Paddy", "Cotton", "Maize", "Sugarcane",
            "Barley", "Millets", "Pulses", "Oil seeds", "Ground Nuts", "Tobacco"
        ]
    }


@router.get("/fertilizer-types")
async def get_fertilizer_types():
    """Get information about different fertilizer types"""
    return {
        "success": True,
        "fertilizers": {
            "Urea": {
                "npk": "46-0-0",
                "description": "High nitrogen fertilizer for vegetative growth",
                "application": "Split doses during growing season"
            },
            "DAP": {
                "npk": "18-46-0",
                "description": "High phosphorous for root development",
                "application": "At planting time"
            },
            "17-17-17": {
                "npk": "17-17-17",
                "description": "Balanced NPK for general use",
                "application": "Throughout growing season"
            },
            "28-28-0": {
                "npk": "28-28-0",
                "description": "Balanced nitrogen and phosphorous",
                "application": "Early to mid-season"
            },
            "14-35-14": {
                "npk": "14-35-14",
                "description": "High phosphorous with balanced N and K",
                "application": "Flowering and fruiting stages"
            },
            "20-20-0": {
                "npk": "20-20-0",
                "description": "Balanced nitrogen and phosphorous",
                "application": "Early growth stages"
            }
        }
    }


@router.post("/batch-recommend")
async def batch_recommendations(requests: list[FertilizerRequest]):
    """
    Get multiple fertilizer recommendations at once
    
    Useful for analyzing multiple fields or scenarios simultaneously.
    """
    try:
        recommender = get_fertilizer_recommender()
        recommendations = []
        
        for idx, req in enumerate(requests):
            try:
                recommendation = recommender.predict_fertilizer(
                    temperature=req.temperature,
                    humidity=req.humidity,
                    moisture=req.moisture,
                    soil_type=req.soil_type,
                    crop_type=req.crop_type,
                    current_n=req.current_nitrogen,
                    current_p=req.current_phosphorous,
                    current_k=req.current_potassium
                )
                
                recommendations.append({
                    "index": idx,
                    "success": True,
                    "data": recommendation
                })
                
            except Exception as e:
                recommendations.append({
                    "index": idx,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total": len(requests),
            "successful": sum(1 for r in recommendations if r["success"]),
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"❌ Error in batch recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if the fertilizer recommendation service is operational"""
    try:
        recommender = get_fertilizer_recommender()
        return {
            "success": True,
            "status": "operational",
            "models_trained": recommender.is_trained
        }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e)
        }
