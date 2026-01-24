"""
Farm Geometry Database Layer
Handles all database operations for farm and section geometry
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime
import json
from .base import get_db
from app.schemas.farm_geometry import (
    CreateFarmGeometry, UpdateFarmGeometry, CreateFarmSection,
    UpdateFarmSection, FarmSectionsSummary, BoundingBox, PointCoordinate
)


class FarmGeometryDB:
    """Database operations for farm geometry"""
    
    @staticmethod
    async def update_farm_boundary(
        db,
        farm_id: str,
        boundary_geojson: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update farm boundary geometry
        Triggers auto-calculation of centroid, area, and GeoJSON
        """
        try:
            # Convert GeoJSON to PostGIS ST_GeomFromGeoJSON format
            geojson_str = json.dumps(boundary_geojson)
            
            query = """
            UPDATE farms 
            SET boundary_geometry = ST_GeomFromGeoJSON(:geojson)
            WHERE id = :farm_id
            RETURNING 
                id::text as farm_id,
                ST_AsGeoJSON(boundary_geometry)::jsonb as boundary_geojson,
                ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
                area_sq_meters,
                has_geometry,
                geometry_updated_at
            """
            
            result = await db.fetch_one(query, {"geojson": geojson_str, "farm_id": farm_id})
            
            if not result:
                raise ValueError(f"Farm {farm_id} not found")
            
            return dict(result)
            
        except Exception as e:
            raise Exception(f"Error updating farm geometry: {str(e)}")
    
    @staticmethod
    async def get_farm_geometry(db, farm_id: str) -> Optional[Dict[str, Any]]:
        """Get farm geometry information"""
        query = """
        SELECT 
            id::text as farm_id,
            ST_AsGeoJSON(boundary_geometry)::jsonb as boundary_geojson,
            ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
            area_sq_meters,
            has_geometry,
            geometry_updated_at
        FROM farms
        WHERE id = :farm_id
        """
        
        result = await db.fetch_one(query, {"farm_id": farm_id})
        return dict(result) if result else None
    
    @staticmethod
    async def create_section(
        db,
        farm_id: str,
        section_name: str,
        section_geojson: Dict[str, Any],
        section_number: Optional[int] = None,
        display_color: str = "#3B82F6",
        crop_type: Optional[str] = None,
        soil_type: Optional[str] = None,
        irrigation_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new farm section
        Triggers validation: within farm boundary, no overlaps
        Auto-calculates: area, centroid, GeoJSON
        """
        try:
            geojson_str = json.dumps(section_geojson)
            
            query = """
            INSERT INTO farm_sections (
                farm_id,
                section_name,
                section_number,
                display_color,
                section_geometry,
                section_geojson,
                crop_type,
                soil_type,
                irrigation_type
            )
            VALUES (%s, %s, %s, %s, ST_GeomFromGeoJSON(%s), %s, %s, %s, %s)
            RETURNING 
                section_id,
                farm_id,
                section_name,
                section_number,
                display_color,
                ST_AsGeoJSON(section_geometry)::jsonb as section_geojson,
                ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
                area_sq_meters,
                crop_type,
                soil_type,
                irrigation_type,
                health_score,
                analysis_status,
                is_active,
                created_at,
                updated_at
            """
            
            result = await db.fetch_one(
                query,
                farm_id,
                section_name,
                section_number,
                display_color,
                geojson_str,
                geojson_str,
                crop_type,
                soil_type,
                irrigation_type
            )
            
            if not result:
                raise ValueError("Failed to create section")
            
            return dict(result)
            
        except Exception as e:
            # Check if error is due to validation (boundary or overlap)
            error_msg = str(e)
            if "within farm boundary" in error_msg:
                raise ValueError("Section must be completely within farm boundary")
            elif "overlaps" in error_msg.lower():
                raise ValueError("Section overlaps with existing sections")
            raise Exception(f"Error creating section: {error_msg}")
    
    @staticmethod
    async def update_section(
        db,
        section_id: str,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update farm section"""
        try:
            # Build dynamic UPDATE query
            set_clauses = []
            params = []
            
            field_mapping = {
                'section_name': ('section_name', '%s'),
                'section_number': ('section_number', '%s'),
                'display_color': ('display_color', '%s'),
                'section_geojson': ('section_geometry', 'ST_GeomFromGeoJSON(%s)'),
                'crop_type': ('crop_type', '%s'),
                'soil_type': ('soil_type', '%s'),
                'irrigation_type': ('irrigation_type', '%s'),
            }
            
            for key, value in update_data.items():
                if key in field_mapping and value is not None:
                    db_field, placeholder = field_mapping[key]
                    if key == 'section_geojson':
                        value = json.dumps(value)
                    set_clauses.append(f"{db_field} = {placeholder}")
                    params.append(value)
            
            if not set_clauses:
                raise ValueError("No fields to update")
            
            params.append(section_id)
            
            query = f"""
            UPDATE farm_sections
            SET {', '.join(set_clauses)}
            WHERE section_id = %s
            RETURNING 
                section_id,
                farm_id,
                section_name,
                section_number,
                display_color,
                ST_AsGeoJSON(section_geometry)::jsonb as section_geojson,
                ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
                area_sq_meters,
                crop_type,
                soil_type,
                irrigation_type,
                health_score,
                analysis_status,
                is_active,
                created_at,
                updated_at
            """
            
            result = await db.fetch_one(query, *params)
            
            if not result:
                raise ValueError(f"Section {section_id} not found")
            
            return dict(result)
            
        except Exception as e:
            error_msg = str(e)
            if "within farm boundary" in error_msg:
                raise ValueError("Section must be completely within farm boundary")
            elif "overlaps" in error_msg.lower():
                raise ValueError("Section overlaps with existing sections")
            raise Exception(f"Error updating section: {error_msg}")
    
    @staticmethod
    async def get_section(db, section_id: str) -> Optional[Dict[str, Any]]:
        """Get farm section details"""
        query = """
        SELECT 
            section_id,
            farm_id,
            section_name,
            section_number,
            display_color,
            ST_AsGeoJSON(section_geometry)::jsonb as section_geojson,
            ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
            area_sq_meters,
            crop_type,
            soil_type,
            irrigation_type,
            health_score,
            analysis_status,
            is_active,
            created_at,
            updated_at
        FROM farm_sections
        WHERE section_id = %s
        """
        
        result = await db.fetch_one(query, section_id)
        return dict(result) if result else None
    
    @staticmethod
    async def list_farm_sections(
        db,
        farm_id: str,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List all sections for a farm"""
        query = """
        SELECT 
            section_id,
            farm_id,
            section_name,
            section_number,
            display_color,
            ST_AsGeoJSON(section_geometry)::jsonb as section_geojson,
            ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
            area_sq_meters,
            crop_type,
            soil_type,
            irrigation_type,
            health_score,
            analysis_status,
            is_active,
            created_at,
            updated_at
        FROM farm_sections
        WHERE farm_id = :farm_id
        """
        
        if active_only:
            query += " AND is_active = TRUE\n"
        
        query += " ORDER BY section_number ASC, section_name ASC"
        
        results = await db.fetch_all(query, {"farm_id": farm_id})
        return [dict(r) for r in results]
    
    @staticmethod
    async def delete_section(db, section_id: str) -> bool:
        """Delete a farm section"""
        query = "DELETE FROM farm_sections WHERE section_id = %s"
        
        result = await db.execute(query, section_id)
        return result > 0
    
    @staticmethod
    async def get_farm_sections_summary(
        db,
        farm_id: str
    ) -> Optional[FarmSectionsSummary]:
        """Get summary statistics for all sections in a farm"""
        query = """
        SELECT * FROM get_farm_sections_summary(:farm_id)
        """
        
        result = await db.fetch_one(query, {"farm_id": farm_id})
        
        if not result:
            return None
        
        return FarmSectionsSummary(
            farm_id=farm_id,
            total_sections=result['total_sections'] or 0,
            total_area_sq_meters=result['total_area_sq_meters'] or 0.0,
            active_sections=result['active_sections'] or 0,
            sections_with_crops=result['sections_with_crops'] or 0,
            average_health_score=result['average_health_score']
        )
    
    @staticmethod
    async def check_point_in_farm(
        db,
        farm_id: str,
        longitude: float,
        latitude: float
    ) -> bool:
        """Check if a GPS point is within farm boundary"""
        query = "SELECT is_point_in_farm(%s, %s, %s)"
        
        result = await db.fetch_one(query, farm_id, longitude, latitude)
        return result[0] if result else False
    
    @staticmethod
    async def get_neighboring_sections(
        db,
        section_id: str
    ) -> List[Dict[str, Any]]:
        """Get all sections that share a boundary with the specified section"""
        query = """
        SELECT 
            section_id,
            section_name,
            crop_type,
            shared_boundary_length_meters
        FROM get_neighboring_sections(%s)
        """
        
        results = await db.fetch_all(query, section_id)
        return [dict(r) for r in results]
    
    @staticmethod
    async def find_farms_in_bbox(
        db,
        bbox: BoundingBox
    ) -> List[Dict[str, Any]]:
        """Find farms intersecting with bounding box"""
        query = """
        SELECT 
            farm_id,
            farm_name,
            ST_AsGeoJSON(boundary_geometry)::jsonb as boundary_geojson,
            ST_AsGeoJSON(centroid_point)::jsonb as centroid_point,
            area_sq_meters,
            has_geometry
        FROM farms
        WHERE has_geometry = TRUE
          AND ST_Intersects(
            boundary_geometry,
            ST_MakeEnvelope(%s, %s, %s, %s, 4326)
          )
        """
        
        results = await db.fetch_all(
            query,
            bbox.min_lon,
            bbox.min_lat,
            bbox.max_lon,
            bbox.max_lat
        )
        return [dict(r) for r in results]
    
    @staticmethod
    async def find_sections_in_bbox(
        db,
        bbox: BoundingBox,
        farm_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Find sections intersecting with bounding box"""
        query = """
        SELECT 
            section_id,
            farm_id,
            section_name,
            display_color,
            ST_AsGeoJSON(section_geometry)::jsonb as section_geojson,
            area_sq_meters,
            crop_type,
            health_score,
            analysis_status
        FROM farm_sections
        WHERE ST_Intersects(
            section_geometry,
            ST_MakeEnvelope(%s, %s, %s, %s, 4326)
          )
        """
        
        params = [bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat]
        
        if farm_id:
            query += "AND farm_id = %s"
            params.append(farm_id)
        
        results = await db.fetch_all(query, *params)
        return [dict(r) for r in results]
