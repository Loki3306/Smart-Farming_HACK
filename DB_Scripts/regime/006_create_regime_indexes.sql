-- Regime System Migration 006: Create indexes for regime tables
-- Version: 1.0
-- Purpose: Optimize query performance for regime system

-- Indexes on regimes table
CREATE INDEX IF NOT EXISTS idx_regimes_farmer_id ON public.regimes(farmer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regimes_farm_id ON public.regimes(farm_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regimes_status ON public.regimes(status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regimes_valid_until ON public.regimes(valid_until) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regimes_farm_status ON public.regimes(farm_id, status) WHERE status = 'active' TABLESPACE pg_default;

-- Indexes on regime_tasks table
CREATE INDEX IF NOT EXISTS idx_regime_tasks_regime_id ON public.regime_tasks(regime_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_tasks_status ON public.regime_tasks(status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_tasks_timing_window ON public.regime_tasks(timing_window_start, timing_window_end) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_tasks_parent_recommendation ON public.regime_tasks(parent_recommendation_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_tasks_timing_status ON public.regime_tasks(timing_window_start, status) WHERE status = 'pending' TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_tasks_regime_status ON public.regime_tasks(regime_id, status) TABLESPACE pg_default;

-- Indexes on regime_versions table
CREATE INDEX IF NOT EXISTS idx_regime_versions_regime_id ON public.regime_versions(regime_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_versions_created_at ON public.regime_versions(created_at DESC) TABLESPACE pg_default;

-- Indexes on regime_audit_log table
CREATE INDEX IF NOT EXISTS idx_regime_audit_log_regime_id ON public.regime_audit_log(regime_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_audit_log_task_id ON public.regime_audit_log(task_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_audit_log_timestamp ON public.regime_audit_log(timestamp DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_audit_log_action_type ON public.regime_audit_log(action_type) TABLESPACE pg_default;

-- Indexes on regime_executions table
CREATE INDEX IF NOT EXISTS idx_regime_executions_regime_id ON public.regime_executions(regime_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_executions_task_id ON public.regime_executions(task_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_executions_executed_at ON public.regime_executions(executed_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_regime_executions_status ON public.regime_executions(status) TABLESPACE pg_default;
