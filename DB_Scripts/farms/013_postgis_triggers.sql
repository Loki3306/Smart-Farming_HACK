-- Farm Mapping System Migration 013: PostGIS Triggers and Validation Functions
-- Version: 1.0
-- Purpose: Auto-calculate geometry properties and validate spatial relationships
-- Author: Smart Farming System
-- Date: 2026-01-24
-- Dependencies: 010_enable_postgis.sql, 011_add_geometry_columns.sql, 012_create_farm_sections_table.sql

-- ============================================================================
-- FARM GEOMETRY TRIGGERS
-- ============================================================================

-- Function: Auto-calculate farm geometry properties
CREATE OR REPLACE FUNCTION calculate_farm_geometry_properties()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate centroid from boundary geometry
    IF NEW.boundary_geometry IS NOT NULL THEN
        NEW.centroid_point := ST_Centroid(NEW.boundary_geometry);
        
        -- Calculate area in square meters using geography cast
        NEW.area_sq_meters := ST_Area(NEW.boundary_geometry::geography);
        
        -- Update GeoJSON representation
        NEW.boundary_geojson := ST_AsGeoJSON(NEW.boundary_geometry)::jsonb;
        
        -- Set has_geometry flag
        NEW.has_geometry := TRUE;
        
        -- Update geometry timestamp
        NEW.geometry_updated_at := NOW();
    ELSE
        -- Clear dependent fields if geometry is null
        NEW.centroid_point := NULL;
        NEW.area_sq_meters := NULL;
        NEW.boundary_geojson := NULL;
        NEW.has_geometry := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for farms table
DROP TRIGGER IF EXISTS trg_farms_calculate_geometry ON farms;
CREATE TRIGGER trg_farms_calculate_geometry
    BEFORE INSERT OR UPDATE OF boundary_geometry ON farms
    FOR EACH ROW
    EXECUTE FUNCTION calculate_farm_geometry_properties();

COMMENT ON FUNCTION calculate_farm_geometry_properties() IS 
'Auto-calculates farm centroid, area, and GeoJSON when boundary_geometry changes';

-- ============================================================================
-- FARM SECTION GEOMETRY TRIGGERS
-- ============================================================================

-- Function: Auto-calculate section geometry properties
CREATE OR REPLACE FUNCTION calculate_section_geometry_properties()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate centroid from section geometry
    IF NEW.section_geometry IS NOT NULL THEN
        NEW.centroid_point := ST_Centroid(NEW.section_geometry);
        
        -- Calculate area in square meters using geography cast
        NEW.area_sq_meters := ST_Area(NEW.section_geometry::geography);
        
        -- Update GeoJSON representation
        NEW.section_geojson := ST_AsGeoJSON(NEW.section_geometry)::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for farm_sections table
DROP TRIGGER IF EXISTS trg_farm_sections_calculate_geometry ON farm_sections;
CREATE TRIGGER trg_farm_sections_calculate_geometry
    BEFORE INSERT OR UPDATE OF section_geometry ON farm_sections
    FOR EACH ROW
    EXECUTE FUNCTION calculate_section_geometry_properties();

COMMENT ON FUNCTION calculate_section_geometry_properties() IS 
'Auto-calculates section centroid, area, and GeoJSON when section_geometry changes';

-- ============================================================================
-- SECTION WITHIN FARM BOUNDARY VALIDATION
-- ============================================================================

-- Function: Validate section is within farm boundary
CREATE OR REPLACE FUNCTION validate_section_within_farm()
RETURNS TRIGGER AS $$
DECLARE
    farm_boundary GEOMETRY;
    is_within BOOLEAN;
BEGIN
    -- Get the farm's boundary geometry
    SELECT boundary_geometry INTO farm_boundary
    FROM farms
    WHERE farm_id = NEW.farm_id;
    
    -- If farm has no geometry, skip validation
    IF farm_boundary IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if section is completely within farm boundary
    is_within := ST_Within(NEW.section_geometry, farm_boundary);
    
    IF NOT is_within THEN
        RAISE EXCEPTION 
            'Section geometry must be completely within farm boundary. Section: %, Farm: %',
            NEW.section_id, NEW.farm_id
        USING HINT = 'Ensure all section coordinates are inside the farm polygon';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for section boundary validation
DROP TRIGGER IF EXISTS trg_farm_sections_validate_boundary ON farm_sections;
CREATE TRIGGER trg_farm_sections_validate_boundary
    BEFORE INSERT OR UPDATE OF section_geometry, farm_id ON farm_sections
    FOR EACH ROW
    EXECUTE FUNCTION validate_section_within_farm();

COMMENT ON FUNCTION validate_section_within_farm() IS 
'Validates that farm section geometry is completely within parent farm boundary';

-- ============================================================================
-- SECTION OVERLAP PREVENTION
-- ============================================================================

-- Function: Prevent overlapping sections within same farm
CREATE OR REPLACE FUNCTION prevent_section_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
    overlapping_section_id UUID;
BEGIN
    -- Check for overlapping sections in the same farm
    SELECT COUNT(*), MIN(section_id) 
    INTO overlap_count, overlapping_section_id
    FROM farm_sections
    WHERE farm_id = NEW.farm_id
      AND section_id != NEW.section_id
      AND is_active = TRUE
      AND ST_Overlaps(section_geometry, NEW.section_geometry);
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 
            'Section overlaps with existing section %. Overlapping sections are not allowed.',
            overlapping_section_id
        USING HINT = 'Adjust section boundaries to eliminate overlap';
    END IF;
    
    -- Also check for sections that contain each other (ST_Contains)
    SELECT COUNT(*), MIN(section_id)
    INTO overlap_count, overlapping_section_id
    FROM farm_sections
    WHERE farm_id = NEW.farm_id
      AND section_id != NEW.section_id
      AND is_active = TRUE
      AND (
          ST_Contains(section_geometry, NEW.section_geometry) OR
          ST_Contains(NEW.section_geometry, section_geometry)
      );
    
    IF overlap_count > 0 THEN
        RAISE EXCEPTION 
            'Section contains or is contained by existing section %. Nested sections are not allowed.',
            overlapping_section_id
        USING HINT = 'Ensure sections are adjacent but not overlapping or nested';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for overlap prevention
DROP TRIGGER IF EXISTS trg_farm_sections_prevent_overlap ON farm_sections;
CREATE TRIGGER trg_farm_sections_prevent_overlap
    BEFORE INSERT OR UPDATE OF section_geometry ON farm_sections
    FOR EACH ROW
    EXECUTE FUNCTION prevent_section_overlap();

COMMENT ON FUNCTION prevent_section_overlap() IS 
'Prevents overlapping or nested sections within the same farm';

-- ============================================================================
-- GEOMETRY VALIDATION FUNCTIONS (Utility)
-- ============================================================================

-- Function: Validate polygon is simple and valid
CREATE OR REPLACE FUNCTION validate_polygon_geometry(geom GEOMETRY)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if geometry is valid
    IF NOT ST_IsValid(geom) THEN
        RAISE EXCEPTION 'Invalid geometry: %', ST_IsValidReason(geom);
    END IF;
    
    -- Check if polygon is simple (no self-intersections)
    IF NOT ST_IsSimple(geom) THEN
        RAISE EXCEPTION 'Polygon has self-intersections and is not simple';
    END IF;
    
    -- Check minimum area (at least 1 square meter)
    IF ST_Area(geom::geography) < 1 THEN
        RAISE EXCEPTION 'Polygon area is too small (minimum 1 sq meter)';
    END IF;
    
    -- Check minimum vertices (at least 4 for a triangle)
    IF ST_NPoints(geom) < 4 THEN
        RAISE EXCEPTION 'Polygon must have at least 4 vertices (3 unique + closing point)';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_polygon_geometry(GEOMETRY) IS 
'Validates that a polygon geometry is valid, simple, and meets minimum requirements';

-- ============================================================================
-- HELPER FUNCTIONS FOR API
-- ============================================================================

-- Function: Get farm sections summary
CREATE OR REPLACE FUNCTION get_farm_sections_summary(p_farm_id UUID)
RETURNS TABLE(
    total_sections INTEGER,
    total_area_sq_meters DOUBLE PRECISION,
    active_sections INTEGER,
    sections_with_crops INTEGER,
    average_health_score DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sections,
        COALESCE(SUM(area_sq_meters), 0) as total_area_sq_meters,
        COUNT(*) FILTER (WHERE is_active = TRUE)::INTEGER as active_sections,
        COUNT(*) FILTER (WHERE crop_type IS NOT NULL)::INTEGER as sections_with_crops,
        AVG(health_score) as average_health_score
    FROM farm_sections
    WHERE farm_id = p_farm_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_farm_sections_summary(UUID) IS 
'Returns summary statistics for all sections in a farm';

-- Function: Check if point is within farm boundary
CREATE OR REPLACE FUNCTION is_point_in_farm(
    p_farm_id UUID,
    p_longitude DOUBLE PRECISION,
    p_latitude DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
DECLARE
    farm_boundary GEOMETRY;
    test_point GEOMETRY;
BEGIN
    -- Get farm boundary
    SELECT boundary_geometry INTO farm_boundary
    FROM farms
    WHERE farm_id = p_farm_id;
    
    IF farm_boundary IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Create point from coordinates (longitude, latitude)
    test_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
    
    -- Check if point is within boundary
    RETURN ST_Within(test_point, farm_boundary);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_point_in_farm(UUID, DOUBLE PRECISION, DOUBLE PRECISION) IS 
'Checks if a GPS coordinate (longitude, latitude) is within a farm boundary';

-- Function: Get neighboring sections
CREATE OR REPLACE FUNCTION get_neighboring_sections(p_section_id UUID)
RETURNS TABLE(
    section_id UUID,
    section_name VARCHAR(255),
    crop_type VARCHAR(100),
    shared_boundary_length_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.section_id,
        s.section_name,
        s.crop_type,
        ST_Length(ST_Intersection(base.section_geometry, s.section_geometry)::geography) as shared_boundary_length_meters
    FROM farm_sections base
    JOIN farm_sections s ON base.farm_id = s.farm_id 
        AND base.section_id != s.section_id
    WHERE base.section_id = p_section_id
      AND ST_Touches(base.section_geometry, s.section_geometry)
    ORDER BY shared_boundary_length_meters DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_neighboring_sections(UUID) IS 
'Returns all sections that share a boundary with the specified section';

-- All triggers and functions have been created successfully

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

-- Example: Test farm geometry auto-calculation
-- UPDATE farms 
-- SET boundary_geometry = ST_GeomFromGeoJSON('{
--   "type": "Polygon",
--   "coordinates": [[
--     [77.5946, 12.9716],
--     [77.5956, 12.9716],
--     [77.5956, 12.9726],
--     [77.5946, 12.9726],
--     [77.5946, 12.9716]
--   ]]
-- }')
-- WHERE farm_id = 'test-farm-id';
-- -- This will auto-calculate: centroid_point, area_sq_meters, boundary_geojson, has_geometry

-- Example: Get farm sections summary
-- SELECT * FROM get_farm_sections_summary('farm-uuid-here');

-- Example: Check if GPS coordinate is in farm
-- SELECT is_point_in_farm('farm-uuid-here', 77.5950, 12.9720);

-- Example: Get neighboring sections
-- SELECT * FROM get_neighboring_sections('section-uuid-here');

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP FUNCTION IF EXISTS get_neighboring_sections(UUID);
-- DROP FUNCTION IF EXISTS is_point_in_farm(UUID, DOUBLE PRECISION, DOUBLE PRECISION);
-- DROP FUNCTION IF EXISTS get_farm_sections_summary(UUID);
-- DROP FUNCTION IF EXISTS validate_polygon_geometry(GEOMETRY);
-- DROP TRIGGER IF EXISTS trg_farm_sections_prevent_overlap ON farm_sections;
-- DROP FUNCTION IF EXISTS prevent_section_overlap();
-- DROP TRIGGER IF EXISTS trg_farm_sections_validate_boundary ON farm_sections;
-- DROP FUNCTION IF EXISTS validate_section_within_farm();
-- DROP TRIGGER IF EXISTS trg_farm_sections_calculate_geometry ON farm_sections;
-- DROP FUNCTION IF EXISTS calculate_section_geometry_properties();
-- DROP TRIGGER IF EXISTS trg_farms_calculate_geometry ON farms;
-- DROP FUNCTION IF EXISTS calculate_farm_geometry_properties();
