"""
Farm Geometry API Routes
Endpoints for farm boundary drawing and section management
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
import logging

from app.db.farm_geometry_db import FarmGeometryDB
from app.schemas.farm_geometry import (
    CreateFarmGeometry, UpdateFarmGeometry, FarmGeometryResponse,
    CreateFarmSection, UpdateFarmSection, FarmSectionResponse,
    FarmSectionsSummary, BoundingBox, PointCoordinate,
    BulkCreateSections, BulkSectionsResponse, GeoJSONPolygon
)
from app.db.base import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/farms", tags=["farm-geometry"])


# ============================================================================
# FARM GEOMETRY ENDPOINTS
# ============================================================================

@router.put("/{farm_id}/geometry", response_model=FarmGeometryResponse)
async def update_farm_boundary(
    farm_id: str,
    geometry: UpdateFarmGeometry,
    db = Depends(get_db)
):
    """
    Update farm boundary geometry
    
    Triggers:
    - Auto-calculation of farm area and centroid
    - GeoJSON synchronization
    
    Example polygon (rectangular farm):
    ```json
    {
      "boundary_geojson": {
        "type": "Polygon",
        "coordinates": [[
          [77.5946, 12.9716],
          [77.5956, 12.9716],
          [77.5956, 12.9726],
          [77.5946, 12.9726],
          [77.5946, 12.9716]
        ]]
      }
    }
    ```
    """
    try:
        result = await FarmGeometryDB.update_farm_boundary(
            db,
            farm_id,
            geometry.boundary_geojson.dict()
        )
        return FarmGeometryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating farm geometry: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating farm geometry")


@router.get("/{farm_id}/geometry", response_model=FarmGeometryResponse)
async def get_farm_geometry(
    farm_id: str,
    db = Depends(get_db)
):
    """Get farm geometry information"""
    try:
        result = await FarmGeometryDB.get_farm_geometry(db, farm_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Farm {farm_id} not found or has no geometry")
        
        # Ensure geometry fields are not None - provide empty defaults
        if result.get('boundary_geojson') is None:
            result['boundary_geojson'] = None
        if result.get('centroid_point') is None:
            result['centroid_point'] = None
        if result.get('area_sq_meters') is None:
            result['area_sq_meters'] = 0.0
        if result.get('has_geometry') is None:
            result['has_geometry'] = False
            
        return FarmGeometryResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching farm geometry: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching farm geometry")


# ============================================================================
# FARM SECTION ENDPOINTS
# ============================================================================

@router.post("/{farm_id}/sections", response_model=FarmSectionResponse, status_code=201)
async def create_farm_section(
    farm_id: str,
    section: CreateFarmSection,
    db = Depends(get_db)
):
    """
    Create a new farm section
    
    Validates:
    - Section geometry is within farm boundary
    - No overlapping sections
    - Valid polygon structure
    
    Auto-calculates:
    - Section area and centroid
    - GeoJSON representation
    """
    try:
        # Override farm_id from URL path
        result = await FarmGeometryDB.create_section(
            db,
            farm_id,
            section.section_name,
            section.section_geojson.dict(),
            section_number=section.section_number,
            display_color=section.display_color,
            crop_type=section.crop_type,
            soil_type=section.soil_type,
            irrigation_type=section.irrigation_type
        )
        return FarmSectionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating section: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating section")


@router.get("/{farm_id}/sections/{section_id}", response_model=FarmSectionResponse)
async def get_farm_section(
    farm_id: str,
    section_id: str,
    db = Depends(get_db)
):
    """Get farm section details"""
    try:
        result = await FarmGeometryDB.get_section(db, section_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
        
        # Verify section belongs to farm
        if result['farm_id'] != farm_id:
            raise HTTPException(status_code=403, detail="Section does not belong to this farm")
        
        return FarmSectionResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching section: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching section")


@router.get("/{farm_id}/sections", response_model=List[FarmSectionResponse])
async def list_farm_sections(
    farm_id: str,
    active_only: bool = Query(False, description="Only return active sections"),
    db = Depends(get_db)
):
    """List all sections for a farm"""
    try:
        results = await FarmGeometryDB.list_farm_sections(db, farm_id, active_only)
        return [FarmSectionResponse(**r) for r in results]
    except Exception as e:
        logger.error(f"Error listing sections: {str(e)}")
        raise HTTPException(status_code=500, detail="Error listing sections")


@router.patch("/{farm_id}/sections/{section_id}", response_model=FarmSectionResponse)
async def update_farm_section(
    farm_id: str,
    section_id: str,
    update: UpdateFarmSection,
    db = Depends(get_db)
):
    """
    Update farm section
    
    Only provided fields are updated. Geometry changes trigger validation.
    """
    try:
        # Verify section exists and belongs to farm
        section = await FarmGeometryDB.get_section(db, section_id)
        if not section:
            raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
        
        if section['farm_id'] != farm_id:
            raise HTTPException(status_code=403, detail="Section does not belong to this farm")
        
        # Prepare update data
        update_data = update.dict(exclude_unset=True)
        if 'section_geojson' in update_data and update_data['section_geojson']:
            update_data['section_geojson'] = update_data['section_geojson'].dict()
        
        result = await FarmGeometryDB.update_section(db, section_id, update_data)
        return FarmSectionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating section: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating section")


@router.delete("/{farm_id}/sections/{section_id}", status_code=204)
async def delete_farm_section(
    farm_id: str,
    section_id: str,
    db = Depends(get_db)
):
    """Delete a farm section"""
    try:
        # Verify section exists and belongs to farm
        section = await FarmGeometryDB.get_section(db, section_id)
        if not section:
            raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
        
        if section['farm_id'] != farm_id:
            raise HTTPException(status_code=403, detail="Section does not belong to this farm")
        
        success = await FarmGeometryDB.delete_section(db, section_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error deleting section")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting section: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting section")


# ============================================================================
# BULK OPERATIONS
# ============================================================================

@router.post("/{farm_id}/sections/bulk", response_model=BulkSectionsResponse)
async def bulk_create_sections(
    farm_id: str,
    bulk_data: BulkCreateSections,
    db = Depends(get_db)
):
    """
    Create multiple farm sections in bulk
    
    Useful for drawing multiple sections on map
    """
    created_count = 0
    errors = []
    
    try:
        for idx, section_data in enumerate(bulk_data.sections):
            try:
                await FarmGeometryDB.create_section(
                    db,
                    farm_id,
                    section_data.section_name,
                    section_data.section_geojson.dict(),
                    section_number=section_data.section_number,
                    display_color=section_data.display_color,
                    crop_type=section_data.crop_type,
                    soil_type=section_data.soil_type,
                    irrigation_type=section_data.irrigation_type
                )
                created_count += 1
            except Exception as e:
                errors.append({
                    "index": idx,
                    "section_name": section_data.section_name,
                    "error": str(e)
                })
        
        return BulkSectionsResponse(
            created_count=created_count,
            failed_count=len(errors),
            errors=errors
        )
    except Exception as e:
        logger.error(f"Error in bulk create: {str(e)}")
        raise HTTPException(status_code=500, detail="Error in bulk create sections")


# ============================================================================
# STATISTICS & SUMMARY
# ============================================================================

@router.get("/{farm_id}/sections-summary", response_model=FarmSectionsSummary)
async def get_farm_sections_summary(
    farm_id: str,
    db = Depends(get_db)
):
    """Get summary statistics for all sections in a farm"""
    try:
        result = await FarmGeometryDB.get_farm_sections_summary(db, farm_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Farm {farm_id} not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sections summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching sections summary")


# ============================================================================
# SPATIAL QUERIES
# ============================================================================

@router.post("/{farm_id}/point-in-farm", response_model=dict)
async def check_point_in_farm(
    farm_id: str,
    point: PointCoordinate,
    db = Depends(get_db)
):
    """Check if a GPS coordinate is within farm boundary"""
    try:
        is_inside = await FarmGeometryDB.check_point_in_farm(
            db,
            farm_id,
            point.longitude,
            point.latitude
        )
        return {
            "farm_id": farm_id,
            "longitude": point.longitude,
            "latitude": point.latitude,
            "is_inside": is_inside
        }
    except Exception as e:
        logger.error(f"Error checking point in farm: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking point in farm")


@router.get("/{farm_id}/sections/{section_id}/neighbors", response_model=List[dict])
async def get_neighboring_sections(
    farm_id: str,
    section_id: str,
    db = Depends(get_db)
):
    """Get all sections that share a boundary with the specified section"""
    try:
        # Verify section belongs to farm
        section = await FarmGeometryDB.get_section(db, section_id)
        if not section:
            raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
        
        if section['farm_id'] != farm_id:
            raise HTTPException(status_code=403, detail="Section does not belong to this farm")
        
        results = await FarmGeometryDB.get_neighboring_sections(db, section_id)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching neighboring sections: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching neighboring sections")


@router.post("/spatial-query/farms-in-bbox", response_model=List[FarmGeometryResponse])
async def find_farms_in_bbox(
    bbox: BoundingBox,
    db = Depends(get_db)
):
    """Find farms intersecting with bounding box (map viewport)"""
    try:
        results = await FarmGeometryDB.find_farms_in_bbox(db, bbox)
        return [FarmGeometryResponse(**r) for r in results]
    except Exception as e:
        logger.error(f"Error finding farms in bbox: {str(e)}")
        raise HTTPException(status_code=500, detail="Error finding farms in bbox")


@router.post("/spatial-query/sections-in-bbox", response_model=List[FarmSectionResponse])
async def find_sections_in_bbox(
    bbox: BoundingBox,
    farm_id: Optional[str] = Query(None, description="Optional: filter by farm"),
    db = Depends(get_db)
):
    """Find sections intersecting with bounding box (map viewport)"""
    try:
        results = await FarmGeometryDB.find_sections_in_bbox(db, bbox, farm_id)
        return [FarmSectionResponse(**r) for r in results]
    except Exception as e:
        logger.error(f"Error finding sections in bbox: {str(e)}")
        raise HTTPException(status_code=500, detail="Error finding sections in bbox")
