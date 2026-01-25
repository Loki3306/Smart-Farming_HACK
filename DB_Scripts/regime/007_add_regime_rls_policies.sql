-- Regime System Migration 007: Add Row Level Security (RLS) policies
-- Version: 1.0
-- Purpose: Ensure farmers can only access their own regimes

-- Enable RLS on all regime tables
ALTER TABLE public.regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regime_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regime_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regime_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regime_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REGIMES TABLE POLICIES
-- ============================================================

-- Policy: Farmers can view their own regimes
DROP POLICY IF EXISTS "Farmers can view their own regimes" ON public.regimes;
CREATE POLICY "Farmers can view their own regimes"
  ON public.regimes
  FOR SELECT
  USING (farmer_id = auth.uid());

-- Policy: Farmers can insert regimes for their farms
DROP POLICY IF EXISTS "Farmers can create regimes" ON public.regimes;
CREATE POLICY "Farmers can create regimes"
  ON public.regimes
  FOR INSERT
  WITH CHECK (farmer_id = auth.uid());

-- Policy: Farmers can update their own regimes
DROP POLICY IF EXISTS "Farmers can update their own regimes" ON public.regimes;
CREATE POLICY "Farmers can update their own regimes"
  ON public.regimes
  FOR UPDATE
  USING (farmer_id = auth.uid());

-- Policy: Farmers can delete their own regimes
DROP POLICY IF EXISTS "Farmers can delete their own regimes" ON public.regimes;
CREATE POLICY "Farmers can delete their own regimes"
  ON public.regimes
  FOR DELETE
  USING (farmer_id = auth.uid());

-- ============================================================
-- REGIME_TASKS TABLE POLICIES
-- ============================================================

-- Policy: Farmers can view tasks in their regimes
DROP POLICY IF EXISTS "Farmers can view their regime tasks" ON public.regime_tasks;
CREATE POLICY "Farmers can view their regime tasks"
  ON public.regime_tasks
  FOR SELECT
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: Farmers can insert tasks in their regimes
DROP POLICY IF EXISTS "Farmers can insert regime tasks" ON public.regime_tasks;
CREATE POLICY "Farmers can insert regime tasks"
  ON public.regime_tasks
  FOR INSERT
  WITH CHECK (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: Farmers can update tasks in their regimes
DROP POLICY IF EXISTS "Farmers can update their regime tasks" ON public.regime_tasks;
CREATE POLICY "Farmers can update their regime tasks"
  ON public.regime_tasks
  FOR UPDATE
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: Farmers can delete tasks in their regimes
DROP POLICY IF EXISTS "Farmers can delete their regime tasks" ON public.regime_tasks;
CREATE POLICY "Farmers can delete their regime tasks"
  ON public.regime_tasks
  FOR DELETE
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- ============================================================
-- REGIME_VERSIONS TABLE POLICIES
-- ============================================================

-- Policy: Farmers can view version history of their regimes
DROP POLICY IF EXISTS "Farmers can view regime versions" ON public.regime_versions;
CREATE POLICY "Farmers can view regime versions"
  ON public.regime_versions
  FOR SELECT
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: Only system can insert versions (not direct farmer access)
DROP POLICY IF EXISTS "System can create regime versions" ON public.regime_versions;
CREATE POLICY "System can create regime versions"
  ON public.regime_versions
  FOR INSERT
  WITH CHECK (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- ============================================================
-- REGIME_AUDIT_LOG TABLE POLICIES
-- ============================================================

-- Policy: Farmers can view audit logs for their regimes
DROP POLICY IF EXISTS "Farmers can view regime audit logs" ON public.regime_audit_log;
CREATE POLICY "Farmers can view regime audit logs"
  ON public.regime_audit_log
  FOR SELECT
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: System can insert audit log entries
DROP POLICY IF EXISTS "System can create audit logs" ON public.regime_audit_log;
CREATE POLICY "System can create audit logs"
  ON public.regime_audit_log
  FOR INSERT
  WITH CHECK (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- ============================================================
-- REGIME_EXECUTIONS TABLE POLICIES
-- ============================================================

-- Policy: Farmers can view execution history
DROP POLICY IF EXISTS "Farmers can view regime executions" ON public.regime_executions;
CREATE POLICY "Farmers can view regime executions"
  ON public.regime_executions
  FOR SELECT
  USING (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );

-- Policy: System can insert execution records
DROP POLICY IF EXISTS "System can create execution records" ON public.regime_executions;
CREATE POLICY "System can create execution records"
  ON public.regime_executions
  FOR INSERT
  WITH CHECK (
    regime_id IN (
      SELECT regime_id FROM regimes WHERE farmer_id = auth.uid()
    )
  );
