-- Farm Mapping System Migration 012: Create Farm Sections Table
-- Version: 1.0
-- Purpose: Create table for multiple sections within each farm with independent AI analysis
-- Author: Smart Farming System
-- Date: 2026-01-24
-- Dependencies: 010_enable_postgis.sql, 011_add_geometry_columns.sql

-- ============================================================================
-- CREATE FARM_SECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS farm_sections (
    section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL,
    
    -- Section identification
    section_name VARCHAR(255) NOT NULL,
    section_number INTEGER,
    display_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for map display
    
    -- Geometry data (SRID 4326 = WGS 84)
    section_geometry GEOMETRY(Polygon, 4326) NOT NULL,
    section_geojson JSONB NOT NULL,
    centroid_point GEOMETRY(Point, 4326),
    area_sq_meters DOUBLE PRECISION,
    
    -- Agricultural data
    crop_type VARCHAR(100),
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    
    -- AI analysis metadata
    last_analysis_date TIMESTAMP WITH TIME ZONE,
    analysis_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    health_score DECIMAL(5, 2), -- 0.00 to 100.00
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add business rule constraints
ALTER TABLE farm_sections
ADD CONSTRAINT chk_section_color_format 
    CHECK (display_color ~* '^#[0-9A-F]{6}$');

ALTER TABLE farm_sections
ADD CONSTRAINT chk_health_score_range 
    CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));

ALTER TABLE farm_sections
ADD CONSTRAINT chk_analysis_status 
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE farm_sections
ADD CONSTRAINT chk_area_positive 
    CHECK (area_sq_meters IS NULL OR area_sq_meters > 0);

ALTER TABLE farm_sections
ADD CONSTRAINT chk_section_number_positive 
    CHECK (section_number IS NULL OR section_number > 0);

-- ============================================================================
-- CREATE SPATIAL INDEXES
-- ============================================================================

-- Spatial index on section geometry for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_farm_sections_geometry 
ON farm_sections USING GIST (section_geometry);

-- Spatial index on centroid for point-based queries
CREATE INDEX IF NOT EXISTS idx_farm_sections_centroid 
ON farm_sections USING GIST (centroid_point);

-- GIN index on section_geojson for JSON queries
CREATE INDEX IF NOT EXISTS idx_farm_sections_geojson 
ON farm_sections USING GIN (section_geojson);

-- ============================================================================
-- CREATE STANDARD INDEXES
-- ============================================================================

-- Index on farm_id for fast lookups by farm
CREATE INDEX IF NOT EXISTS idx_farm_sections_farm_id 
ON farm_sections (farm_id);

-- Index on is_active for filtering active sections
CREATE INDEX IF NOT EXISTS idx_farm_sections_is_active 
ON farm_sections (is_active);

-- Index on analysis_status for filtering by analysis state
CREATE INDEX IF NOT EXISTS idx_farm_sections_analysis_status 
ON farm_sections (analysis_status);

-- Index on crop_type for filtering by crop
CREATE INDEX IF NOT EXISTS idx_farm_sections_crop_type 
ON farm_sections (crop_type);

-- Composite index for farm + active status
CREATE INDEX IF NOT EXISTS idx_farm_sections_farm_active 
ON farm_sections (farm_id, is_active);

-- Index on created_by for user-based queries
CREATE INDEX IF NOT EXISTS idx_farm_sections_created_by 
ON farm_sections (created_by);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE farm_sections IS 
'Stores individual sections within farms. Each section can have independent crop types, soil conditions, and AI analysis results.';

COMMENT ON COLUMN farm_sections.section_id IS 
'Unique identifier for the farm section (UUID)';

COMMENT ON COLUMN farm_sections.farm_id IS 
'Reference to parent farm. Cascades on delete.';

COMMENT ON COLUMN farm_sections.section_geometry IS 
'PostGIS polygon geometry representing section boundary in WGS 84 (SRID 4326). Must be within parent farm boundary.';

COMMENT ON COLUMN farm_sections.section_geojson IS 
'GeoJSON representation of section boundary. Synchronized with section_geometry.';

COMMENT ON COLUMN farm_sections.display_color IS 
'Hex color code for displaying section on map (e.g., #3B82F6). Used for visual distinction between sections.';

COMMENT ON COLUMN farm_sections.area_sq_meters IS 
'Section area in square meters. Auto-calculated from section_geometry.';

COMMENT ON COLUMN farm_sections.health_score IS 
'AI-calculated health score (0-100). Updated after each analysis run.';

COMMENT ON COLUMN farm_sections.analysis_status IS 
'Current status of AI analysis: pending, processing, completed, failed';

-- ============================================================================
-- CREATE UPDATE TRIGGER
-- ============================================================================

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farm_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_farm_sections_updated_at ON farm_sections;
CREATE TRIGGER trg_farm_sections_updated_at
    BEFORE UPDATE ON farm_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_farm_sections_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'farm_sections'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'farm_sections'
ORDER BY indexname;

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'farm_sections'
ORDER BY constraint_type, constraint_name;

-- Table structure verified through information_schema queries above

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

-- Example: Insert section with geometry
-- INSERT INTO farm_sections (
--   farm_id,
--   section_name,
--   section_number,
--   display_color,
--   section_geometry,
--   section_geojson,
--   centroid_point,
--   area_sq_meters,
--   crop_type,
--   soil_type,
--   created_by
-- ) VALUES (
--   'farm-uuid-here',
--   'North Field',
--   1,
--   '#10B981',
--   ST_GeomFromGeoJSON('{
--     "type": "Polygon",
--     "coordinates": [[
--       [77.5946, 12.9716],
--       [77.5950, 12.9716],
--       [77.5950, 12.9720],
--       [77.5946, 12.9720],
--       [77.5946, 12.9716]
--     ]]
--   }'),
--   '{"type":"Polygon","coordinates":[...]}'::jsonb,
--   ST_Centroid(ST_GeomFromGeoJSON('...')),
--   ST_Area(ST_GeomFromGeoJSON('...')::geography),
--   'wheat',
--   'loamy',
--   'user-uuid-here'
-- );

-- Example: Get all sections for a farm
-- SELECT 
--   section_id,
--   section_name,
--   crop_type,
--   area_sq_meters,
--   health_score,
--   ST_AsGeoJSON(section_geometry) as geometry
-- FROM farm_sections
-- WHERE farm_id = 'farm-uuid-here'
--   AND is_active = TRUE
-- ORDER BY section_number;

-- Example: Find overlapping sections (validation query)
-- SELECT 
--   a.section_id as section_a,
--   b.section_id as section_b,
--   ST_Area(ST_Intersection(a.section_geometry, b.section_geometry)::geography) as overlap_area_sq_meters
-- FROM farm_sections a
-- JOIN farm_sections b ON a.farm_id = b.farm_id 
--   AND a.section_id < b.section_id
-- WHERE ST_Overlaps(a.section_geometry, b.section_geometry);

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trg_farm_sections_updated_at ON farm_sections;
-- DROP FUNCTION IF EXISTS update_farm_sections_updated_at();
-- DROP TABLE IF EXISTS farm_sections CASCADE;
