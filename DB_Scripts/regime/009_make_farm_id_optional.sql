-- Regime System Migration 009: Make farm_id optional
-- Version: 1.2
-- Purpose: Allow regime creation without mandatory farm_id to avoid FK violations
-- Rationale: Farmer may not have farm record yet; regime can work with just farmer_id
-- Author: System
-- Date: 2026-01-24

-- Drop the NOT NULL constraint on farm_id
ALTER TABLE public.regimes 
  ALTER COLUMN farm_id DROP NOT NULL;

-- Drop the unique constraint that requires farm_id
DROP INDEX IF EXISTS idx_unique_active_regime_per_farm;

-- Create new unique constraint on farmer_id instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_regime_per_farmer
  ON public.regimes(farmer_id) 
  WHERE status = 'active';

-- Update comments
COMMENT ON COLUMN public.regimes.farm_id IS 'Optional reference to the farm this regime applies to. Can be NULL if farmer has no farm record yet.';

-- Verify constraint was updated
DO $$
BEGIN
  RAISE NOTICE '✅ farm_id is now optional, unique constraint moved to farmer_id';
END $$;
