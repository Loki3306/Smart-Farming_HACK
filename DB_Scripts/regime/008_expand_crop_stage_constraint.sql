-- Regime System Migration 008: Expand crop_stage constraint
-- Version: 1.1
-- Purpose: Add missing crop stages (seedling, fruiting, harvest) to support comprehensive agricultural planning
-- Author: System
-- Date: 2026-01-24

-- Drop existing constraint
ALTER TABLE public.regimes 
  DROP CONSTRAINT IF EXISTS regimes_crop_stage_check;

-- Add expanded constraint with all agricultural growth stages
ALTER TABLE public.regimes 
  ADD CONSTRAINT regimes_crop_stage_check 
  CHECK (crop_stage IN (
    'germination',
    'seedling', 
    'vegetative', 
    'flowering', 
    'fruiting', 
    'maturity', 
    'harvest', 
    'unknown'
  ));

-- Verify constraint was applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'regimes_crop_stage_check'
  ) THEN
    RAISE EXCEPTION 'Failed to create crop_stage constraint';
  END IF;
  RAISE NOTICE '✅ crop_stage constraint updated successfully';
END $$;

COMMENT ON CONSTRAINT regimes_crop_stage_check ON public.regimes 
  IS 'Validates crop growth stages: germination → seedling → vegetative → flowering → fruiting → maturity → harvest';
