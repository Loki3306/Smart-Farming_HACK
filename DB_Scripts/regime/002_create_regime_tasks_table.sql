-- Regime System Migration 002: Create regime_tasks table
-- Version: 1.0
-- Purpose: Store individual tasks within a regime

CREATE TABLE IF NOT EXISTS public.regime_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_id UUID NOT NULL REFERENCES regimes(regime_id) ON DELETE CASCADE,
  parent_recommendation_id VARCHAR(100),
  task_type VARCHAR(100) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  timing_type VARCHAR(50) NOT NULL CHECK (timing_type IN ('das', 'fixed_date', 'relative_to_task')),
  timing_value VARCHAR(100) NOT NULL,
  timing_window_start DATE NOT NULL,
  timing_window_end DATE NOT NULL,
  duration_days INTEGER DEFAULT 1,
  quantity VARCHAR(100),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  farmer_notes TEXT,
  completed_at TIMESTAMP,
  overridden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE pg_default;

-- Add comments for clarity
COMMENT ON TABLE public.regime_tasks IS 'Stores individual tasks within a regime. Each task is an actionable step for the farmer.';
COMMENT ON COLUMN public.regime_tasks.task_id IS 'Unique identifier for the task';
COMMENT ON COLUMN public.regime_tasks.regime_id IS 'Reference to parent regime';
COMMENT ON COLUMN public.regime_tasks.parent_recommendation_id IS 'Reference to original AI recommendation that generated this task';
COMMENT ON COLUMN public.regime_tasks.task_type IS 'Category of task (e.g., fertilizer_apply, irrigation_check, pest_monitoring)';
COMMENT ON COLUMN public.regime_tasks.timing_type IS 'How timing is specified: DAS (days after sowing), fixed_date, or relative_to_task';
COMMENT ON COLUMN public.regime_tasks.timing_value IS 'The actual timing value (DAS number, date, or parent task ID)';
COMMENT ON COLUMN public.regime_tasks.timing_window_start IS 'Earliest date task can be executed';
COMMENT ON COLUMN public.regime_tasks.timing_window_end IS 'Latest date task must be executed by';
COMMENT ON COLUMN public.regime_tasks.priority IS 'Task importance level';
COMMENT ON COLUMN public.regime_tasks.confidence_score IS 'AI confidence in this task recommendation (0-100)';
COMMENT ON COLUMN public.regime_tasks.status IS 'Current execution status of task';
COMMENT ON COLUMN public.regime_tasks.dependencies IS 'Array of task IDs that must complete before this task';
COMMENT ON COLUMN public.regime_tasks.farmer_notes IS 'Notes added by farmer when completing or modifying task';
COMMENT ON COLUMN public.regime_tasks.completed_at IS 'Timestamp when task was marked as completed';
COMMENT ON COLUMN public.regime_tasks.overridden IS 'Flag indicating farmer modified this task';
