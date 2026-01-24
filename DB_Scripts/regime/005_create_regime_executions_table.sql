-- Regime System Migration 005: Create regime_executions table
-- Version: 1.0
-- Purpose: Track execution history of tasks by the scheduler

CREATE TABLE IF NOT EXISTS public.regime_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_id UUID NOT NULL REFERENCES regimes(regime_id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES regime_tasks(task_id) ON DELETE CASCADE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_type VARCHAR(50) NOT NULL CHECK (execution_type IN ('scheduled', 'manual', 'retry')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  results JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
) TABLESPACE pg_default;

-- Add comments for clarity
COMMENT ON TABLE public.regime_executions IS 'Records of scheduled task execution by the regime scheduler. Tracks success/failure and retries.';
COMMENT ON COLUMN public.regime_executions.execution_id IS 'Unique identifier for this execution record';
COMMENT ON COLUMN public.regime_executions.regime_id IS 'Reference to regime';
COMMENT ON COLUMN public.regime_executions.task_id IS 'Reference to task being executed';
COMMENT ON COLUMN public.regime_executions.executed_at IS 'Timestamp when execution was attempted';
COMMENT ON COLUMN public.regime_executions.execution_type IS 'Whether this was scheduled, manually triggered, or a retry';
COMMENT ON COLUMN public.regime_executions.status IS 'Success, failed, or partial completion';
COMMENT ON COLUMN public.regime_executions.results IS 'JSONB with execution results (sensor readings, action output, etc.)';
COMMENT ON COLUMN public.regime_executions.error_message IS 'Error message if execution failed';
COMMENT ON COLUMN public.regime_executions.retry_count IS 'Number of retry attempts made';
