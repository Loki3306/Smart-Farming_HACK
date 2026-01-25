-- Farm Mapping System Migration 010: Enable PostGIS Extension
-- Version: 1.0
-- Purpose: Enable PostGIS extension for spatial/geometric operations
-- Author: Smart Farming System
-- Date: 2026-01-24

-- ============================================================================
-- ENABLE POSTGIS EXTENSION
-- ============================================================================

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS is installed
SELECT PostGIS_version();

-- Expected output: PostGIS 3.x.x
-- Example: POSTGIS="3.4.0" [EXTENSION] PGSQL="150" GEOS="3.12.0" PROJ="9.3.0"

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check available spatial reference systems
-- SRID 4326 = WGS 84 (latitude/longitude) - used for GPS coordinates
SELECT srid, auth_name, srtext 
FROM spatial_ref_sys 
WHERE srid = 4326;

-- Check PostGIS functions are available
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'st_%' 
LIMIT 10;

-- ============================================================================
-- NOTES
-- ============================================================================

-- SRID 4326 (WGS 84):
-- - Standard for GPS coordinates
-- - Latitude: -90 to 90 degrees
-- - Longitude: -180 to 180 degrees
-- - Used by Google Maps, OpenStreetMap, etc.

-- Common PostGIS functions we'll use:
-- - ST_GeomFromGeoJSON(): Convert GeoJSON to geometry
-- - ST_AsGeoJSON(): Convert geometry to GeoJSON
-- - ST_Within(): Check if geometry is inside another
-- - ST_Overlaps(): Check if geometries overlap
-- - ST_Area(): Calculate area (in sq meters with geography cast)
-- - ST_Centroid(): Find center point of polygon
-- - ST_Touches(): Check if geometries share boundary
-- - ST_DWithin(): Check if geometries within distance

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To remove PostGIS (use with caution - will break dependent objects):
-- DROP EXTENSION IF EXISTS postgis CASCADE;
