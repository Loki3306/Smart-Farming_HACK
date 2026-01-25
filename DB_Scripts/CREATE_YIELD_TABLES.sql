-- ============================================================================
-- Crop Yield Tables for Smart Farming Platform
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CROP YIELDS TABLE - Track predicted and actual yields
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crop_yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  
  -- Crop information
  crop_type VARCHAR(100) NOT NULL,
  sowing_date DATE,
  expected_harvest_date DATE,
  
  -- Yield predictions
  predicted_yield_kg DECIMAL(10,2),
  prediction_confidence DECIMAL(5,2),  -- 0-100
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Actual yield (filled when harvest is logged)
  actual_yield_kg DECIMAL(10,2),
  harvest_date DATE,
  harvest_quality VARCHAR(50),  -- A, B, C grade
  
  -- Sensor snapshot at prediction time (for later analysis)
  sensor_snapshot JSONB,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'growing',  -- growing, harvested, failed, abandoned
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_crop_yields_farmer_id 
  ON public.crop_yields USING btree (farmer_id);

CREATE INDEX IF NOT EXISTS idx_crop_yields_farm_id 
  ON public.crop_yields USING btree (farm_id);

CREATE INDEX IF NOT EXISTS idx_crop_yields_crop_type 
  ON public.crop_yields USING btree (crop_type);

CREATE INDEX IF NOT EXISTS idx_crop_yields_status 
  ON public.crop_yields USING btree (status);

CREATE INDEX IF NOT EXISTS idx_crop_yields_sowing_date 
  ON public.crop_yields USING btree (sowing_date DESC);


-- ============================================================================
-- 2. YIELD BENCHMARKS TABLE - Regional/crop yield averages for comparison
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yield_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  crop_type VARCHAR(100) NOT NULL,
  season VARCHAR(50),  -- Kharif, Rabi, Zaid
  year INTEGER,
  
  -- Yield statistics (kg per hectare)
  avg_yield_kg DECIMAL(10,2),
  min_yield_kg DECIMAL(10,2),
  max_yield_kg DECIMAL(10,2),
  sample_size INTEGER,
  
  -- Source information
  source VARCHAR(255),  -- e.g., "ICAR", "State Agriculture Dept"
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yield_benchmarks_region 
  ON public.yield_benchmarks USING btree (region);

CREATE INDEX IF NOT EXISTS idx_yield_benchmarks_crop 
  ON public.yield_benchmarks USING btree (crop_type);


-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crop_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policies for crop_yields (farmers can only see their own data)
CREATE POLICY "Farmers can view their own crop yields"
  ON public.crop_yields
  FOR SELECT
  USING (true);  -- Open for demo, use farmer_id = auth.uid() in production

CREATE POLICY "Farmers can insert their own crop yields"
  ON public.crop_yields
  FOR INSERT
  WITH CHECK (true);  -- Open for demo

CREATE POLICY "Farmers can update their own crop yields"
  ON public.crop_yields
  FOR UPDATE
  USING (true);  -- Open for demo

-- Benchmarks are read-only for everyone
CREATE POLICY "Anyone can read yield benchmarks"
  ON public.yield_benchmarks
  FOR SELECT
  USING (true);


-- ============================================================================
-- 4. SEED DATA - Indian Agricultural Benchmarks
-- ============================================================================

INSERT INTO public.yield_benchmarks (region, state, crop_type, season, year, avg_yield_kg, min_yield_kg, max_yield_kg, sample_size, source)
VALUES 
  -- Wheat
  ('North India', 'Punjab', 'Wheat', 'Rabi', 2024, 5200, 3500, 6500, 1000, 'Punjab Agriculture Dept'),
  ('North India', 'Haryana', 'Wheat', 'Rabi', 2024, 4800, 3200, 6200, 800, 'Haryana Agriculture Dept'),
  ('Central India', 'Madhya Pradesh', 'Wheat', 'Rabi', 2024, 3500, 2500, 5000, 600, 'ICAR'),
  
  -- Rice
  ('North India', 'Punjab', 'Rice', 'Kharif', 2024, 6200, 4500, 7500, 900, 'Punjab Agriculture Dept'),
  ('South India', 'Andhra Pradesh', 'Rice', 'Kharif', 2024, 5500, 3800, 7000, 750, 'AP Agriculture Dept'),
  ('East India', 'West Bengal', 'Rice', 'Kharif', 2024, 4800, 3200, 6500, 850, 'WB Agriculture Dept'),
  
  -- Maize
  ('Central India', 'Karnataka', 'Maize', 'Kharif', 2024, 4200, 2800, 5800, 500, 'ICAR'),
  ('North India', 'Bihar', 'Maize', 'Kharif', 2024, 3800, 2500, 5500, 450, 'Bihar Agriculture Dept'),
  
  -- Cotton
  ('Central India', 'Maharashtra', 'Cotton', 'Kharif', 2024, 1800, 1200, 2800, 400, 'Cotton Corp of India'),
  ('Central India', 'Gujarat', 'Cotton', 'Kharif', 2024, 2200, 1500, 3200, 450, 'Gujarat Cotton Board'),
  
  -- Soybean
  ('Central India', 'Madhya Pradesh', 'Soybean', 'Kharif', 2024, 2800, 1800, 4000, 550, 'SOPA'),
  ('Central India', 'Maharashtra', 'Soybean', 'Kharif', 2024, 2500, 1600, 3800, 480, 'ICAR')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 5. HELPER FUNCTION: Update timestamp on row update
-- ============================================================================

CREATE OR REPLACE FUNCTION update_crop_yields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crop_yields_updated_at_trigger ON public.crop_yields;

CREATE TRIGGER crop_yields_updated_at_trigger
  BEFORE UPDATE ON public.crop_yields
  FOR EACH ROW
  EXECUTE FUNCTION update_crop_yields_updated_at();


-- ============================================================================
-- Verification query - run this to check tables were created
-- ============================================================================

SELECT 
  'crop_yields' as table_name, 
  COUNT(*) as row_count 
FROM public.crop_yields
UNION ALL
SELECT 
  'yield_benchmarks' as table_name, 
  COUNT(*) as row_count 
FROM public.yield_benchmarks;
