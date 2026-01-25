-- Regime System Migration 004: Create regime_audit_log table
-- Version: 1.0
-- Purpose: Track all changes to regimes and tasks for audit trail

CREATE TABLE IF NOT EXISTS public.regime_audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_id UUID NOT NULL REFERENCES regimes(regime_id) ON DELETE CASCADE,
  task_id UUID REFERENCES regime_tasks(task_id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  actor VARCHAR(50) NOT NULL CHECK (actor IN ('system', 'farmer')),
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE pg_default;

-- Add comments for clarity
COMMENT ON TABLE public.regime_audit_log IS 'Append-only audit trail of all regime and task modifications. Enables compliance and debugging.';
COMMENT ON COLUMN public.regime_audit_log.log_id IS 'Unique identifier for this audit log entry';
COMMENT ON COLUMN public.regime_audit_log.regime_id IS 'Reference to regime being modified';
COMMENT ON COLUMN public.regime_audit_log.task_id IS 'Reference to specific task (if applicable)';
COMMENT ON COLUMN public.regime_audit_log.action_type IS 'Type of action (regime_created, regime_updated, task_completed, task_overridden, task_skipped, auto_refresh_triggered, farmer_note_added, etc.)';
COMMENT ON COLUMN public.regime_audit_log.actor IS 'Who performed the action (system = automatic scheduler, farmer = farmer)';
COMMENT ON COLUMN public.regime_audit_log.details IS 'JSONB with structured data about the change (old values, new values, reasons, etc.)';
