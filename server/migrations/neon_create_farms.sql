-- Neon bootstrap migration for farms
-- Fixes: 42P01 relation "farms" does not exist

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  farm_name TEXT NOT NULL,
  location TEXT,
  crop_type TEXT,
  total_area_acres NUMERIC(12, 2),
  soil_type TEXT,
  irrigation_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON public.farms (farmer_id);
CREATE INDEX IF NOT EXISTS idx_farms_created_at ON public.farms (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_farms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farms_set_updated_at ON public.farms;
CREATE TRIGGER trg_farms_set_updated_at
BEFORE UPDATE ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.set_farms_updated_at();
