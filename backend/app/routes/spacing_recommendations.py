"""
Row Spacing Recommendation API Routes
Endpoints for spacing optimization and planting guides
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

from app.services.spacing_optimizer import spacing_optimizer
from app.utils.planting_guide import planting_guide_generator


router = APIRouter(prefix="/api/spacing", tags=["spacing"])


# Request/Response Models
class SpacingOptimizationRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop")
    farm_size_hectares: float = Field(..., gt=0, description="Farm size in hectares")
    soil_fertility_level: str = Field(default="medium", description="low|medium|high")
    farm_equipment: str = Field(default="manual", description="manual|tractor|transplanter|seed_drill")


class YieldPredictionRequest(BaseModel):
    crop_type: str
    row_spacing_cm: float = Field(..., gt=0)
    soil_data: Dict[str, float]
    weather_data: Dict[str, float]


class SpacingComparisonRequest(BaseModel):
    crop_type: str
    current_spacing_cm: float = Field(..., gt=0)
    farm_size_hectares: float = Field(..., gt=0)
    soil_data: Dict[str, float] = Field(default_factory=lambda: {
        'N': 80, 'P': 50, 'K': 60, 'pH': 6.5, 'moisture': 70
    })
    weather_data: Dict[str, float] = Field(default_factory=lambda: {
        'temperature': 28, 'rainfall': 800, 'humidity': 75, 'sunlight': 7
    })


class PlantingGuideRequest(BaseModel):
    crop_type: str
    farm_size_hectares: float = Field(..., gt=0)
    row_spacing_cm: float = Field(..., gt=0)
    plant_spacing_cm: float = Field(..., gt=0)
    farm_equipment: str = Field(default="manual")


@router.post("/optimize")
async def get_optimal_spacing(request: SpacingOptimizationRequest):
    """
    Get optimal row spacing recommendation for a crop
    
    **Algorithm:**
    1. Query ICAR research data for crop
    2. Adjust spacing based on soil fertility
    3. Calculate plant density and expected yield
    
    **Returns:** Optimal spacing with expected yield improvement
    """
    try:
        result = spacing_optimizer.get_optimal_spacing(
            crop_type=request.crop_type,
            soil_fertility_level=request.soil_fertility_level,
            farm_equipment=request.farm_equipment
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Add calculation for this specific farm
        layout = planting_guide_generator.calculate_field_layout(
            farm_size_hectares=request.farm_size_hectares,
            row_spacing_cm=result['optimal_row_spacing_cm'],
            plant_spacing_cm=result['optimal_plant_spacing_cm']
        )
        
        seed_req = planting_guide_generator.calculate_seed_requirement(
            crop_type=request.crop_type,
            total_plants=layout['total_plants']
        )
        
        return {
            **result,
            "your_farm_details": {
                "farm_size_hectares": request.farm_size_hectares,
                "total_plants_needed": layout['total_plants'],
                "seed_requirement": seed_req,
                "estimated_total_yield_kg": result['expected_yield_kg_ha'] * request.farm_size_hectares
            },
            "generated_at": datetime.now()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get spacing recommendation: {str(e)}"
        )


@router.post("/predict-yield")
async def predict_yield_at_spacing(request: YieldPredictionRequest):
    """
    Predict yield at a specific row spacing using ML model
    
    **Returns:** Predicted yield in kg/ha
    """
    try:
        yield_prediction = spacing_optimizer.predict_yield_at_spacing(
            crop_type=request.crop_type,
            row_spacing_cm=request.row_spacing_cm,
            soil_data=request.soil_data,
            weather_data=request.weather_data
        )
        
        return {
            "crop_type": request.crop_type,
            "row_spacing_cm": request.row_spacing_cm,
            "predicted_yield_kg_ha": round(yield_prediction, 2),
            "confidence": "high" if spacing_optimizer.model else "estimated"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict yield: {str(e)}"
        )


@router.post("/compare")
async def compare_spacing_options(request: SpacingComparisonRequest):
    """
    Compare current spacing vs optimal spacing
    
    **Algorithm:**
    1. Predict yield at current spacing
    2. Predict yield at optimal spacing
    3. Calculate improvement potential
    4. Estimate income increase
    
    **Returns:** Side-by-side comparison with financial impact
    """
    try:
        comparison = spacing_optimizer.compare_spacings(
            crop_type=request.crop_type,
            current_spacing_cm=request.current_spacing_cm,
            soil_data=request.soil_data,
            weather_data=request.weather_data
        )
        
        if "error" in comparison:
            raise HTTPException(status_code=400, detail=comparison["error"])
        
        # Calculate financial impact
        # Assume average crop prices (₹/kg)
        crop_prices = {
            'rice': 20,
            'wheat': 25,
            'maize': 18,
            'cotton': 50,
            'soybean': 40,
            'tomato': 15,
            'potato': 12,
            'onion': 20
        }
        
        price_per_kg = crop_prices.get(request.crop_type.lower(), 20)
        yield_increase = comparison['yield_increase_kg_ha']
        income_increase_per_ha = yield_increase * price_per_kg
        total_income_increase = income_increase_per_ha * request.farm_size_hectares
        
        return {
            **comparison,
            "financial_impact": {
                "crop_price_per_kg": price_per_kg,
                "income_increase_per_hectare": round(income_increase_per_ha, 2),
                "total_income_increase": round(total_income_increase, 2),
                "farm_size_hectares": request.farm_size_hectares,
                "currency": "INR (₹)"
            },
            "action_needed": "zero_cost_technique_change",
            "implementation_difficulty": "easy" if abs(comparison['optimal_spacing_cm'] - request.current_spacing_cm) < 10 else "moderate"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare spacings: {str(e)}"
        )


@router.post("/planting-guide")
async def generate_planting_guide(request: PlantingGuideRequest):
    """
    Generate comprehensive planting guide with visual diagrams
    
    **Returns:** 
    - Field layout calculations
    - Seed requirements
    - Tools needed
    - Step-by-step instructions
    - Visual ASCII diagram
    - Time and labor estimates
    """
    try:
        # Calculate layout
        layout = planting_guide_generator.calculate_field_layout(
            farm_size_hectares=request.farm_size_hectares,
            row_spacing_cm=request.row_spacing_cm,
            plant_spacing_cm=request.plant_spacing_cm
        )
        
        # Calculate seed requirement
        seed_req = planting_guide_generator.calculate_seed_requirement(
            crop_type=request.crop_type,
            total_plants=layout['total_plants']
        )
        
        # Generate tools list
        tools = planting_guide_generator.generate_tools_list(
            row_spacing_cm=request.row_spacing_cm,
            plant_spacing_cm=request.plant_spacing_cm,
            farm_equipment=request.farm_equipment
        )
        
        # Generate complete guide
        guide = planting_guide_generator.generate_step_by_step_guide(
            crop_type=request.crop_type,
            layout=layout,
            seed_req=seed_req,
            tools=tools
        )
        
        return {
            **guide,
            "generated_at": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate planting guide: {str(e)}"
        )


@router.get("/crops")
async def get_supported_crops():
    """Get list of crops with spacing optimization support"""
    from app.services.spacing_optimizer import OPTIMAL_SPACING_DATA
    
    crops = []
    for crop_name, data in OPTIMAL_SPACING_DATA.items():
        crops.append({
            "crop_type": crop_name,
            "optimal_spacing_cm": data['optimal_row_spacing'],
            "max_improvement_percent": data['max_improvement_percent'],
            "source": data['source']
        })
    
    return {
        "supported_crops": crops,
        "total_count": len(crops)
    }
