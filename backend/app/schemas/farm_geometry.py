"""
Farm Geometry Schemas
Pydantic models for farm mapping and geometry operations
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal


# ============================================================================
# GEOJSON SCHEMAS
# ============================================================================

class GeoJSONPoint(BaseModel):
    """GeoJSON Point geometry"""
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., min_items=2, max_items=2)
    
    @validator('coordinates')
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError('Point must have exactly [longitude, latitude]')
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        if not (-90 <= lat <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v


class GeoJSONPolygon(BaseModel):
    """GeoJSON Polygon geometry"""
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]]
    
    @validator('coordinates')
    def validate_polygon_coordinates(cls, v):
        if not v or not v[0]:
            raise ValueError('Polygon must have at least one ring')
        if len(v[0]) < 4:
            raise ValueError('Polygon ring must have at least 4 points (minimum triangle)')
        # Check that first and last points are the same (closed ring)
        if v[0][0] != v[0][-1]:
            raise ValueError('Polygon ring must be closed (first and last point must be identical)')
        return v


# ============================================================================
# FARM GEOMETRY SCHEMAS
# ============================================================================

class FarmGeometryBase(BaseModel):
    """Base schema for farm geometry"""
    boundary_geojson: GeoJSONPolygon = Field(..., description="Farm boundary as GeoJSON polygon")


class CreateFarmGeometry(FarmGeometryBase):
    """Create farm geometry"""
    farm_id: str = Field(..., description="Farm UUID")


class UpdateFarmGeometry(FarmGeometryBase):
    """Update farm geometry"""
    pass


class FarmGeometryResponse(BaseModel):
    """Farm geometry response"""
    farm_id: str
    boundary_geojson: Optional[Dict[str, Any]]
    centroid_point: Optional[Dict[str, Any]]
    area_sq_meters: Optional[float]
    has_geometry: bool
    geometry_updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# FARM SECTION SCHEMAS
# ============================================================================

class FarmSectionBase(BaseModel):
    """Base schema for farm section"""
    section_name: str = Field(..., min_length=1, max_length=255, description="Section name")
    section_number: Optional[int] = Field(None, gt=0, description="Section number/order")
    display_color: str = Field("#3B82F6", pattern=r'^#[0-9A-F]{6}$', description="Hex color code")
    section_geojson: GeoJSONPolygon = Field(..., description="Section boundary as GeoJSON polygon")
    crop_type: Optional[str] = Field(None, max_length=100, description="Crop type planted in section")
    soil_type: Optional[str] = Field(None, max_length=100, description="Soil type")
    irrigation_type: Optional[str] = Field(None, max_length=100, description="Irrigation method")


class CreateFarmSection(FarmSectionBase):
    """Create farm section"""
    farm_id: str = Field(..., description="Parent farm UUID")


class UpdateFarmSection(BaseModel):
    """Update farm section"""
    section_name: Optional[str] = Field(None, min_length=1, max_length=255)
    section_number: Optional[int] = Field(None, gt=0)
    display_color: Optional[str] = Field(None, pattern=r'^#[0-9A-F]{6}$')
    section_geojson: Optional[GeoJSONPolygon] = None
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None


class FarmSectionResponse(BaseModel):
    """Farm section response"""
    section_id: str
    farm_id: str
    section_name: str
    section_number: Optional[int]
    display_color: str
    section_geojson: Optional[Dict[str, Any]]
    centroid_point: Optional[Dict[str, Any]]
    area_sq_meters: Optional[float]
    crop_type: Optional[str]
    soil_type: Optional[str]
    irrigation_type: Optional[str]
    health_score: Optional[Decimal]
    analysis_status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# FARM SECTIONS SUMMARY
# ============================================================================

class FarmSectionsSummary(BaseModel):
    """Summary statistics for all sections in a farm"""
    farm_id: str
    total_sections: int
    total_area_sq_meters: float
    active_sections: int
    sections_with_crops: int
    average_health_score: Optional[Decimal]


# ============================================================================
# SPATIAL QUERY SCHEMAS
# ============================================================================

class BoundingBox(BaseModel):
    """Bounding box for spatial queries"""
    min_lon: float = Field(..., ge=-180, le=180, description="Minimum longitude")
    min_lat: float = Field(..., ge=-90, le=90, description="Minimum latitude")
    max_lon: float = Field(..., ge=-180, le=180, description="Maximum longitude")
    max_lat: float = Field(..., ge=-90, le=90, description="Maximum latitude")
    
    @validator('max_lon')
    def validate_lon_range(cls, v, values):
        if 'min_lon' in values and v <= values['min_lon']:
            raise ValueError('max_lon must be greater than min_lon')
        return v
    
    @validator('max_lat')
    def validate_lat_range(cls, v, values):
        if 'min_lat' in values and v <= values['min_lat']:
            raise ValueError('max_lat must be greater than min_lat')
        return v


class PointCoordinate(BaseModel):
    """GPS coordinate point"""
    longitude: float = Field(..., ge=-180, le=180, description="Longitude")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude")


# ============================================================================
# BULK OPERATIONS
# ============================================================================

class BulkCreateSections(BaseModel):
    """Bulk create multiple farm sections"""
    farm_id: str = Field(..., description="Parent farm UUID")
    sections: List[FarmSectionBase] = Field(..., min_items=1, description="Sections to create")


class BulkSectionsResponse(BaseModel):
    """Response for bulk operations"""
    created_count: int
    failed_count: int
    errors: List[Dict[str, Any]] = []


# ============================================================================
# ERROR RESPONSE
# ============================================================================

class GeometryError(BaseModel):
    """Geometry validation error"""
    field: str
    message: str
    detail: Optional[str] = None
