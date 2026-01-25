-- Regime System Migration 003: Create regime_versions table
-- Version: 1.0
-- Purpose: Store version history and snapshots of regimes

CREATE TABLE IF NOT EXISTS public.regime_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_id UUID NOT NULL REFERENCES regimes(regime_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_summary TEXT NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('auto_refresh', 'manual_update', 'disease_detected', 'weather_change', 'farmer_request')),
  trigger_metadata JSONB DEFAULT '{}',
  tasks_snapshot JSONB NOT NULL,
  created_by VARCHAR(50) NOT NULL CHECK (created_by IN ('system', 'farmer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: Each regime version number is unique per regime
  CONSTRAINT unique_regime_version UNIQUE (regime_id, version_number)
) TABLESPACE pg_default;

-- Add comments for clarity
COMMENT ON TABLE public.regime_versions IS 'Immutable historical record of regime versions. Enables rollback and audit trail.';
COMMENT ON COLUMN public.regime_versions.version_id IS 'Unique identifier for this version snapshot';
COMMENT ON COLUMN public.regime_versions.regime_id IS 'Reference to the regime this version belongs to';
COMMENT ON COLUMN public.regime_versions.version_number IS 'Sequential version number (1, 2, 3, ...)';
COMMENT ON COLUMN public.regime_versions.changes_summary IS 'Human-readable summary of what changed in this version';
COMMENT ON COLUMN public.regime_versions.trigger_type IS 'What caused this version to be created';
COMMENT ON COLUMN public.regime_versions.trigger_metadata IS 'Additional context about what triggered the version (e.g., disease info, weather changes)';
COMMENT ON COLUMN public.regime_versions.tasks_snapshot IS 'Complete JSONB snapshot of all tasks at this version point';
COMMENT ON COLUMN public.regime_versions.created_by IS 'Whether this version was created by system (auto-refresh) or farmer (manual update)';
