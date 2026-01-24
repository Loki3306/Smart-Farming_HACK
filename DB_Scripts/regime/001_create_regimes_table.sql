-- Regime System Migration 001: Create regimes table
-- Version: 1.0
-- Purpose: Store regime metadata and versioning information

CREATE TABLE IF NOT EXISTS public.regimes (
  regime_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  crop_stage VARCHAR(50) NOT NULL CHECK (crop_stage IN ('germination', 'vegetative', 'flowering', 'maturity', 'unknown')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'draft')),
  valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE pg_default;

-- Partial unique index: Only one active regime per farm
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_regime_per_farm 
  ON public.regimes(farm_id) 
  WHERE status = 'active';

-- Add comments for clarity
COMMENT ON TABLE public.regimes IS 'Stores farming regime/plan metadata. Each regime is a 30-day farming plan.';
COMMENT ON COLUMN public.regimes.regime_id IS 'Unique identifier for the regime';
COMMENT ON COLUMN public.regimes.farmer_id IS 'Reference to farmer who owns this regime';
COMMENT ON COLUMN public.regimes.farm_id IS 'Reference to the farm this regime applies to';
COMMENT ON COLUMN public.regimes.version IS 'Version number incremented on each update';
COMMENT ON COLUMN public.regimes.crop_stage IS 'Current crop stage (germination/vegetative/flowering/maturity)';
COMMENT ON COLUMN public.regimes.status IS 'Lifecycle status of the regime';
COMMENT ON COLUMN public.regimes.valid_from IS 'Start date of regime validity period';
COMMENT ON COLUMN public.regimes.valid_until IS 'End date of regime validity period (typically +30 days from creation)';
COMMENT ON COLUMN public.regimes.auto_refresh_enabled IS 'Whether regime should auto-regenerate on day 31';
COMMENT ON COLUMN public.regimes.metadata IS 'JSONB field for storing flexible regime metadata';
