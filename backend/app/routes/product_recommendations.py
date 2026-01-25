"""
Product Recommendation API Routes
Endpoints for generating product recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from app.db.base import get_db_connection
from app.services.product_recommendation import ProductRecommendationEngine


router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


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
        # Connect to database
        db = await get_db_connection()
        
        try:
            # Initialize recommendation engine
            engine = ProductRecommendationEngine(db)
            
            # Generate recommendations
            report = await engine.generate_recommendations(
                soil_data=request.soil_data,
                crop_type=request.crop_type,
                farm_size_hectares=request.farm_size_hectares,
                budget_preference=request.budget_preference
            )
            
            # Save report to database
            report_id = await save_recommendation_report(
                db=db,
                farmer_id=request.farmer_id,
                farm_id=request.farm_id,
                report_data=report
            )
            
            # Return response
            return RecommendationResponse(
                report_id=report_id,
                **report,
                generated_at=datetime.now()
            )
            
        finally:
            await db.close()
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/reports/{report_id}")
async def get_recommendation_report(report_id: str):
    """Retrieve a saved recommendation report"""
    try:
        db = await get_db_connection()
        
        try:
            query = """
                SELECT 
                    id, farmer_id, farm_id, generated_at,
                    soil_analysis, nutrient_gaps, crop_type,
                    farm_size_hectares, recommended_products,
                    total_estimated_cost, estimated_yield_improvement_percent,
                    status
                FROM recommendation_reports
                WHERE id = $1
            """
            
            report = await db.fetchrow(query, report_id)
            
            if not report:
                raise HTTPException(status_code=404, detail="Report not found")
            
            return dict(report)
            
        finally:
            await db.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve report: {str(e)}"
        )


@router.get("/reports/farmer/{farmer_id}")
async def get_farmer_reports(farmer_id: str, limit: int = 10):
    """Get all recommendation reports for a farmer"""
    try:
        db = await get_db_connection()
        
        try:
            query = """
                SELECT 
                    id, generated_at, crop_type, farm_size_hectares,
                    total_estimated_cost, status
                FROM recommendation_reports
                WHERE farmer_id = $1
                ORDER BY generated_at DESC
                LIMIT $2
            """
            
            reports = await db.fetch(query, farmer_id, limit)
            
            return [dict(row) for row in reports]
            
        finally:
            await db.close()
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve reports: {str(e)}"
        )


@router.get("/products/fertilizers")
async def get_all_fertilizers(
    manufacturer: Optional[str] = None,
    product_type: Optional[str] = None
):
    """Get all available fertilizer products"""
    try:
        db = await get_db_connection()
        
        try:
            query = """
                SELECT 
                    id, product_name, manufacturer, npk_ratio,
                    nitrogen_percent, phosphorus_percent, potassium_percent,
                    price_per_unit, unit_type, product_type,
                    is_available
                FROM fertilizer_products
                WHERE is_available = true
            """
            
            params = []
            if manufacturer:
                query += " AND manufacturer = $1"
                params.append(manufacturer)
            if product_type:
                param_num = len(params) + 1
                query += f" AND product_type = ${param_num}"
                params.append(product_type)
            
            query += " ORDER BY product_name"
            
            products = await db.fetch(query, *params)
            
            return [dict(row) for row in products]
            
        finally:
            await db.close()
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve products: {str(e)}"
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    """
    
    report_id = await db.fetchval(
        query,
        farmer_id,
        farm_id,
        json.dumps(report_data["soil_analysis"]),
        json.dumps(report_data["nutrient_gaps"]),
        report_data["crop_type"],
        report_data["farm_size_hectares"],
        json.dumps(report_data["recommended_products"]),
        report_data["total_estimated_cost"],
        report_data["estimated_yield_improvement_percent"],
        "generated"
    )
    
    return str(report_id)
