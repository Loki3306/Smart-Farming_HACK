-- Regime System Migration ROLLBACK Script
-- Version: 1.0
-- Purpose: Emergency rollback in case of issues
-- WARNING: This script DROPS all regime tables and data. Use only if necessary.

/*
ROLLBACK PROCEDURE:

1. BACKUP: Always backup database before running this script
   - In Supabase: Settings → Backups → Manual Backup

2. VERIFY: Confirm this is the correct action
   - Are you sure you want to delete all regime data?
   - Do you have a database backup?

3. EXECUTE: Run this script in Supabase SQL Editor

4. VALIDATE: Check that regime tables no longer exist
   - SELECT * FROM information_schema.tables WHERE table_name LIKE 'regime%';
   - Should return 0 rows

5. RESTORE: If issues arise, restore from backup:
   - Supabase Dashboard → Backups → Click backup → Restore
*/

-- STEP 1: Drop RLS policies (they will cascade delete when tables drop)
DROP POLICY IF EXISTS "Farmers can view their regimes" ON public.regimes;
DROP POLICY IF EXISTS "Farmers can create regimes" ON public.regimes;
DROP POLICY IF EXISTS "Farmers can update their own regimes" ON public.regimes;
DROP POLICY IF EXISTS "Farmers can delete their own regimes" ON public.regimes;

DROP POLICY IF EXISTS "Farmers can view their regime tasks" ON public.regime_tasks;
DROP POLICY IF EXISTS "Farmers can insert regime tasks" ON public.regime_tasks;
DROP POLICY IF EXISTS "Farmers can update their regime tasks" ON public.regime_tasks;
DROP POLICY IF EXISTS "Farmers can delete their regime tasks" ON public.regime_tasks;

DROP POLICY IF EXISTS "Farmers can view regime versions" ON public.regime_versions;
DROP POLICY IF EXISTS "System can create regime versions" ON public.regime_versions;

DROP POLICY IF EXISTS "Farmers can view regime audit logs" ON public.regime_audit_log;
DROP POLICY IF EXISTS "System can create audit logs" ON public.regime_audit_log;

DROP POLICY IF EXISTS "Farmers can view regime executions" ON public.regime_executions;
DROP POLICY IF EXISTS "System can create execution records" ON public.regime_executions;

-- STEP 2: Drop indexes (optional, will be dropped when tables drop)
DROP INDEX IF EXISTS idx_regimes_farmer_id;
DROP INDEX IF EXISTS idx_regimes_farm_id;
DROP INDEX IF EXISTS idx_regimes_status;
DROP INDEX IF EXISTS idx_regimes_valid_until;
DROP INDEX IF EXISTS idx_regimes_farm_status;

DROP INDEX IF EXISTS idx_regime_tasks_regime_id;
DROP INDEX IF EXISTS idx_regime_tasks_status;
DROP INDEX IF EXISTS idx_regime_tasks_timing_window;
DROP INDEX IF EXISTS idx_regime_tasks_parent_recommendation;
DROP INDEX IF EXISTS idx_regime_tasks_timing_status;
DROP INDEX IF EXISTS idx_regime_tasks_regime_status;

DROP INDEX IF EXISTS idx_regime_versions_regime_id;
DROP INDEX IF EXISTS idx_regime_versions_created_at;

DROP INDEX IF EXISTS idx_regime_audit_log_regime_id;
DROP INDEX IF EXISTS idx_regime_audit_log_task_id;
DROP INDEX IF EXISTS idx_regime_audit_log_timestamp;
DROP INDEX IF EXISTS idx_regime_audit_log_action_type;

DROP INDEX IF EXISTS idx_regime_executions_regime_id;
DROP INDEX IF EXISTS idx_regime_executions_task_id;
DROP INDEX IF EXISTS idx_regime_executions_executed_at;
DROP INDEX IF EXISTS idx_regime_executions_status;

-- STEP 3: Drop tables in reverse dependency order
-- (regime_executions and other children first, regimes last)
DROP TABLE IF EXISTS public.regime_executions CASCADE;
DROP TABLE IF EXISTS public.regime_audit_log CASCADE;
DROP TABLE IF EXISTS public.regime_versions CASCADE;
DROP TABLE IF EXISTS public.regime_tasks CASCADE;
DROP TABLE IF EXISTS public.regimes CASCADE;

-- STEP 4: Verify rollback completed
SELECT 'Rollback complete. No regime tables exist.' AS status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name LIKE 'regime%'
);
