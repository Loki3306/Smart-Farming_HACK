-- Product Recommendation System Database Schema
-- Phase 1: Product Catalog Tables

-- ============================================================================
-- FERTILIZER PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fertilizer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  npk_ratio VARCHAR(20) NOT NULL,
  nitrogen_percent DECIMAL(5,2) DEFAULT 0,
  phosphorus_percent DECIMAL(5,2) DEFAULT 0,
  potassium_percent DECIMAL(5,2) DEFAULT 0,
  bag_size_kg DECIMAL(6,2),
  bottle_size_ml INTEGER,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('bag', 'bottle', 'kg', 'liter')),
  product_type VARCHAR(50) DEFAULT 'chemical' CHECK (product_type IN ('chemical', 'organic', 'nano', 'bio')),
  special_features JSONB DEFAULT '{}',
  n_equivalent_kg DECIMAL(6,2), -- For nano products
  p_equivalent_kg DECIMAL(6,2), -- For nano products
  k_equivalent_kg DECIMAL(6,2), -- For nano products
  is_available BOOLEAN DEFAULT true,
  last_price_update TIMESTAMP DEFAULT NOW(),
  government_approved BOOLEAN DEFAULT true,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast product queries
CREATE INDEX IF NOT EXISTS idx_fertilizer_npk ON fertilizer_products(nitrogen_percent, phosphorus_percent, potassium_percent);
CREATE INDEX IF NOT EXISTS idx_fertilizer_type ON fertilizer_products(product_type);
CREATE INDEX IF NOT EXISTS idx_fertilizer_available ON fertilizer_products(is_available) WHERE is_available = true;

-- ============================================================================
-- RECOMMENDATION REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  farm_id UUID,
  generated_at TIMESTAMP DEFAULT NOW(),
  soil_analysis JSONB NOT NULL, -- {N: 60, P: 45, K: 40, pH: 6.8}
  nutrient_gaps JSONB NOT NULL, -- {N: 40, P: 5, K: 20}
  crop_type VARCHAR(100),
  farm_size_hectares DECIMAL(8,2),
  recommended_products JSONB NOT NULL, -- Array of product recommendations with quantities
  total_estimated_cost DECIMAL(12,2),
  estimated_yield_improvement_percent DECIMAL(5,2),
  report_pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'viewed', 'purchased', 'applied')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for farmer queries
CREATE INDEX IF NOT EXISTS idx_recommendations_farmer ON recommendation_reports(farmer_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendation_reports(status);

-- ============================================================================
-- AGRICULTURAL DEALERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agricultural_dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_name VARCHAR(200) NOT NULL,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  products_available UUID[] DEFAULT '{}', -- Array of fertilizer_products.id
  verified BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable PostGIS for geospatial queries (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column for efficient distance queries
ALTER TABLE agricultural_dealers 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Update geography column from lat/lng
UPDATE agricultural_dealers 
SET location = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography
WHERE location_lng IS NOT NULL AND location_lat IS NOT NULL;

-- Spatial index for fast nearby queries
CREATE INDEX IF NOT EXISTS idx_dealers_location ON agricultural_dealers USING GIST(location);

-- ============================================================================
-- SEED DATA: IFFCO Products (January 2025 Prices)
-- ============================================================================

INSERT INTO fertilizer_products (product_name, manufacturer, npk_ratio, nitrogen_percent, phosphorus_percent, potassium_percent, bag_size_kg, price_per_unit, unit_type, product_type, government_approved, source) VALUES
-- IFFCO Urea
('IFFCO Urea', 'IFFCO', '46-0-0', 46.00, 0.00, 0.00, 45, 266.50, 'bag', 'chemical', true, 'IFFCO Official Jan 2025'),

-- IFFCO DAP
('IFFCO DAP', 'IFFCO', '18-46-0', 18.00, 46.00, 0.00, 50, 1350.00, 'bag', 'chemical', true, 'IFFCO Official Jan 2025'),

-- IFFCO NPK Variants
('IFFCO NPK 10-26-26', 'IFFCO', '10-26-26', 10.00, 26.00, 26.00, 50, 1720.00, 'bag', 'chemical', true, 'IFFCO Official Jan 2025'),
('IFFCO NPK 12-32-16', 'IFFCO', '12-32-16', 12.00, 32.00, 16.00, 50, 1720.00, 'bag', 'chemical', true, 'IFFCO Official Jan 2025'),
('IFFCO NPK 20-20-0-13', 'IFFCO', '20-20-0-13', 20.00, 20.00, 0.00, 50, 1300.00, 'bag', 'chemical', true, 'IFFCO Official Jan 2025'),

-- IFFCO Nano Technology
('IFFCO Nano Urea', 'IFFCO', 'Nano N', 0.00, 0.00, 0.00, NULL, 225.00, 'bottle', 'nano', true, 'IFFCO Official Jan 2025'),
('IFFCO Nano DAP', 'IFFCO', 'Nano NP', 0.00, 0.00, 0.00, NULL, 600.00, 'bottle', 'nano', true, 'IFFCO Official Jan 2025');

-- Update nano product equivalents
UPDATE fertilizer_products SET n_equivalent_kg = 10, bottle_size_ml = 500 WHERE product_name = 'IFFCO Nano Urea';
UPDATE fertilizer_products SET n_equivalent_kg = 15, p_equivalent_kg = 30, bottle_size_ml = 500 WHERE product_name = 'IFFCO Nano DAP';

-- ============================================================================
-- SEED DATA: Coromandel Products
-- ============================================================================

INSERT INTO fertilizer_products (product_name, manufacturer, npk_ratio, nitrogen_percent, phosphorus_percent, potassium_percent, bag_size_kg, price_per_unit, unit_type, product_type, government_approved, source, special_features) VALUES
-- Coromandel GroShakti
('Coromandel GroShakti 14-35-14', 'Coromandel', '14-35-14', 14.00, 35.00, 14.00, 50, 1400.00, 'bag', 'chemical', true, 'Coromandel Catalog 2025', '{"total_nutrients": "63%", "has_micronutrients": true}'::jsonb),

-- Coromandel Gromor
('Coromandel Gromor 12-32-16', 'Coromandel', '12-32-16', 12.00, 32.00, 16.00, 50, 1500.00, 'bag', 'chemical', true, 'Coromandel Catalog 2025', '{}'::jsonb),
('Coromandel Gromor Ultra DAP', 'Coromandel', '18-46-0', 18.00, 46.00, 0.00, 50, 2000.00, 'bag', 'chemical', true, 'Coromandel Catalog 2025', '{"zinc_fortified": true}'::jsonb),
('Coromandel Gromor NPK 13-0-45', 'Coromandel', '13-0-45', 13.00, 0.00, 45.00, 50, 2200.00, 'bag', 'chemical', true, 'Coromandel Catalog 2025', '{}'::jsonb),

-- Coromandel Organic
('Coromandel Organic Compost', 'Coromandel', '2-1-2', 2.00, 1.00, 2.00, 50, 450.00, 'bag', 'organic', true, 'Coromandel Catalog 2025', '{"organic_certified": true}'::jsonb);

-- ============================================================================
-- SEED DATA: Sample Dealers (Mumbai Region)
-- ============================================================================

INSERT INTO agricultural_dealers (dealer_name, location_lat, location_lng, address, city, state, pincode, phone, verified, rating) VALUES
('Kisan Seva Kendra - Thane', 19.2183, 72.9781, 'Shop No. 12, Thane West', 'Thane', 'Maharashtra', '400601', '+91-9876543210', true, 4.5),
('Agro Center - Navi Mumbai', 19.0330, 73.0297, 'Plot No. 45, Vashi', 'Navi Mumbai', 'Maharashtra', '400703', '+91-9876543211', true, 4.2),
('Fertilizer World - Kalyan', 19.2403, 73.1305, 'Main Road, Kalyan East', 'Kalyan', 'Maharashtra', '421306', '+91-9876543212', true, 4.7),
('Krishna Agro Dealers', 19.0760, 72.8777, 'Andheri West, Mumbai', 'Mumbai', 'Maharashtra', '400053', '+91-9876543213', true, 4.3),
('Sunrise Agricultural Store', 19.1136, 72.8697, 'Goregaon East, Mumbai', 'Mumbai', 'Maharashtra', '400063', '+91-9876543214', false, 3.9);

-- Update dealer locations (geography column)
UPDATE agricultural_dealers 
SET location = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography
WHERE location_lng IS NOT NULL AND location_lat IS NOT NULL;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to find nearby dealers
CREATE OR REPLACE FUNCTION find_nearby_dealers(
  farmer_lat DECIMAL,
  farmer_lng DECIMAL,
  radius_km INTEGER DEFAULT 10,
  product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  dealer_id UUID,
  dealer_name VARCHAR,
  distance_km DECIMAL,
  address TEXT,
  phone VARCHAR,
  rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.dealer_name,
    ROUND((ST_Distance(
      d.location,
      ST_SetSRID(ST_MakePoint(farmer_lng, farmer_lat), 4326)::geography
    ) / 1000)::numeric, 2) AS distance_km,
    d.address,
    d.phone,
    d.rating
  FROM agricultural_dealers d
  WHERE d.verified = true
    AND ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(farmer_lng, farmer_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (product_id IS NULL OR product_id = ANY(d.products_available))
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fertilizer_products IS 'Catalog of all available fertilizer products with NPK ratios and prices';
COMMENT ON TABLE recommendation_reports IS 'AI-generated product recommendations based on soil analysis';
COMMENT ON TABLE agricultural_dealers IS 'Verified agricultural product dealers with location data';
COMMENT ON FUNCTION find_nearby_dealers IS 'Find dealers near farmer location, optionally filtered by product availability';
