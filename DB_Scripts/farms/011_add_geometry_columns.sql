-- Farm Mapping System Migration 011: Add Geometry Columns to Farms Table
-- Version: 1.0
-- Purpose: Extend farms table with PostGIS geometry columns for spatial operations
-- Author: Smart Farming System
-- Date: 2026-01-24
-- Dependencies: 010_enable_postgis.sql

-- ============================================================================
-- ADD GEOMETRY COLUMNS TO FARMS TABLE
-- ============================================================================

-- Add polygon boundary geometry (SRID 4326 = WGS 84 GPS coordinates)
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS boundary_geometry GEOMETRY(Polygon, 4326);

-- Add GeoJSON representation for easy frontend integration
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS boundary_geojson JSONB;

-- Add centroid point (center of farm polygon)
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS centroid_point GEOMETRY(Point, 4326);

-- Add calculated area in square meters
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS area_sq_meters DOUBLE PRECISION;

-- Add flag to indicate if farm has geometry data
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS has_geometry BOOLEAN DEFAULT FALSE;

-- Add timestamp for when geometry was last updated
ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS geometry_updated_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CREATE SPATIAL INDEXES
-- ============================================================================

-- Create spatial index on boundary geometry for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_farms_boundary_geometry 
ON farms USING GIST (boundary_geometry);

-- Create spatial index on centroid for point-based queries
CREATE INDEX IF NOT EXISTS idx_farms_centroid_point 
ON farms USING GIST (centroid_point);

-- Create index on has_geometry flag for filtering
CREATE INDEX IF NOT EXISTS idx_farms_has_geometry 
ON farms (has_geometry);

-- Create GIN index on boundary_geojson for JSON queries
CREATE INDEX IF NOT EXISTS idx_farms_boundary_geojson 
ON farms USING GIN (boundary_geojson);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN farms.boundary_geometry IS 
'PostGIS polygon geometry representing farm boundary in WGS 84 (SRID 4326). Used for spatial queries and validation.';

COMMENT ON COLUMN farms.boundary_geojson IS 
'GeoJSON representation of farm boundary. Synchronized with boundary_geometry for frontend consumption.';

COMMENT ON COLUMN farms.centroid_point IS 
'Center point of farm polygon. Auto-calculated from boundary_geometry.';

COMMENT ON COLUMN farms.area_sq_meters IS 
'Farm area in square meters. Auto-calculated from boundary_geometry using ST_Area with geography cast.';

COMMENT ON COLUMN farms.has_geometry IS 
'Flag indicating whether farm has spatial data. TRUE when boundary_geometry is not null.';

COMMENT ON COLUMN farms.geometry_updated_at IS 
'Timestamp of last geometry update. Used for tracking changes and cache invalidation.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'farms' 
  AND column_name IN (
    'boundary_geometry', 
    'boundary_geojson', 
    'centroid_point', 
    'area_sq_meters', 
    'has_geometry',
    'geometry_updated_at'
  )
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'farms'
  AND indexname LIKE 'idx_farms_%geometry%'
     OR indexname LIKE 'idx_farms_%geojson%'
     OR indexname LIKE 'idx_farms_has_geometry';

-- Table structure verified through information_schema queries above

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

-- Example: Insert farm with geometry from GeoJSON
-- UPDATE farms 
-- SET 
--   boundary_geometry = ST_GeomFromGeoJSON('{
--     "type": "Polygon",
--     "coordinates": [[
--       [77.5946, 12.9716],
--       [77.5956, 12.9716],
--       [77.5956, 12.9726],
--       [77.5946, 12.9726],
--       [77.5946, 12.9716]
--     ]]
--   }'),
--   centroid_point = ST_Centroid(ST_GeomFromGeoJSON('...')),
--   area_sq_meters = ST_Area(ST_GeomFromGeoJSON('...')::geography),
--   boundary_geojson = '{...}'::jsonb,
--   has_geometry = TRUE,
--   geometry_updated_at = NOW()
-- WHERE farm_id = 'some-farm-id';

-- Example: Find farms within bounding box
-- SELECT farm_id, farm_name, area_sq_meters
-- FROM farms
-- WHERE has_geometry = TRUE
--   AND ST_Intersects(
--     boundary_geometry,
--     ST_MakeEnvelope(77.59, 12.97, 77.60, 12.98, 4326)
--   );

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP INDEX IF EXISTS idx_farms_boundary_geojson;
-- DROP INDEX IF EXISTS idx_farms_has_geometry;
-- DROP INDEX IF EXISTS idx_farms_centroid_point;
-- DROP INDEX IF EXISTS idx_farms_boundary_geometry;
-- ALTER TABLE farms DROP COLUMN IF EXISTS geometry_updated_at;
-- ALTER TABLE farms DROP COLUMN IF EXISTS has_geometry;
-- ALTER TABLE farms DROP COLUMN IF EXISTS area_sq_meters;
-- ALTER TABLE farms DROP COLUMN IF EXISTS centroid_point;
-- ALTER TABLE farms DROP COLUMN IF EXISTS boundary_geojson;
-- ALTER TABLE farms DROP COLUMN IF EXISTS boundary_geometry;
