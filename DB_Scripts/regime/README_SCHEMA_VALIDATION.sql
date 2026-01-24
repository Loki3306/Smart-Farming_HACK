-- Regime System Database Schema Validation & Integration Guide
-- Created: January 23, 2026
-- Purpose: Document schema changes, dependencies, and deployment instructions

/*
=====================================================
SCHEMA OVERVIEW
=====================================================

New Tables:
1. regimes - Main regime metadata (30-day farming plan)
2. regime_tasks - Individual actionable tasks within regime
3. regime_versions - Version history and snapshots
4. regime_audit_log - Audit trail of all changes
5. regime_executions - Execution records from scheduler

Relationships:
```
farmers (existing)
  ├── regimes (NEW) [1:Many]
  │   ├── regime_tasks (NEW) [1:Many]
  │   ├── regime_versions (NEW) [1:Many]
  │   ├── regime_audit_log (NEW) [1:Many]
  │   └── regime_executions (NEW) [1:Many]
  └── farms (existing)
      └── regimes (NEW) [1:Many]
```

=====================================================
DEPLOYMENT ORDER
=====================================================

Execute in this order in Supabase SQL Editor:

1. 001_create_regimes_table.sql
2. 002_create_regime_tasks_table.sql
3. 003_create_regime_versions_table.sql
4. 004_create_regime_audit_log_table.sql
5. 005_create_regime_executions_table.sql
6. 006_create_regime_indexes.sql
7. 007_add_regime_rls_policies.sql

=====================================================
KEY CONSTRAINTS & VALIDATIONS
=====================================================

Regimes Table:
- UNIQUE (farm_id, status) WHERE status='active'
  → Only one active regime per farm at any time
- CHECK crop_stage IN ('germination', 'vegetative', 'flowering', 'maturity', 'unknown')
- valid_until must be >= valid_from (application-level enforced)
- CASCADE delete on farmer_id (deleting farmer deletes all regimes)
- CASCADE delete on farm_id (deleting farm deletes all regimes)

Regime Tasks Table:
- FOREIGN KEY regime_id CASCADE delete
- FOREIGN KEY regime_tasks.task_id (for dependencies array)
- CHECK priority IN ('high', 'medium', 'low')
- CHECK status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')
- CHECK timing_type IN ('das', 'fixed_date', 'relative_to_task')
- CHECK confidence_score BETWEEN 0 AND 100
- timing_window_end must be >= timing_window_start (application-level enforced)

Regime Versions Table:
- UNIQUE (regime_id, version_number)
  → Each version number appears only once per regime
- IMMUTABLE (no updates allowed after creation)
- tasks_snapshot is JSONB copy of regime_tasks at that version point

Regime Audit Log Table:
- APPEND-ONLY (no updates or deletes after creation)
- CASCADE delete regime audit logs when regime deleted
- SET NULL task_id when task deleted (preserve audit trail)

Regime Executions Table:
- CASCADE delete when task or regime deleted
- retry_count auto-incremented on retry attempts
- error_message nullable (NULL on success)

=====================================================
ROW LEVEL SECURITY (RLS)
=====================================================

All regime tables have RLS enabled with policies:

regimes:
  - SELECT: farmer_id = auth.uid()
  - INSERT: farmer_id = auth.uid()
  - UPDATE: farmer_id = auth.uid()
  - DELETE: farmer_id = auth.uid()

regime_tasks:
  - SELECT: regime_id IN (...farmer's regimes)
  - INSERT: regime_id IN (...farmer's regimes)
  - UPDATE: regime_id IN (...farmer's regimes)
  - DELETE: regime_id IN (...farmer's regimes)

regime_versions:
  - SELECT: regime_id IN (...farmer's regimes)
  - INSERT: regime_id IN (...farmer's regimes) [system only]

regime_audit_log:
  - SELECT: regime_id IN (...farmer's regimes)
  - INSERT: regime_id IN (...farmer's regimes) [system only]

regime_executions:
  - SELECT: regime_id IN (...farmer's regimes)
  - INSERT: regime_id IN (...farmer's regimes) [system only]

=====================================================
BACKWARD COMPATIBILITY
=====================================================

✓ No changes to existing tables (farmers, farms, farm_settings, sensors, sensor_readings, action_logs)
✓ All regime tables are new (no migrations on existing data)
✓ Existing API endpoints unaffected
✓ Existing recommendation engine unaffected
✓ Can deploy independently

Transition Plan:
- Deploy schema first
- Deploy backend services (regime_service.py, etc.) with feature flag
- Deploy frontend (RegimePage, RegimeContext, etc.) with feature flag
- Enable for 10% of users initially
- Monitor for issues
- Gradual rollout to 100%

=====================================================
TESTING CHECKLIST
=====================================================

Functional Tests:
[ ] Create regime with 5+ tasks
[ ] Update regime (merge new recommendations)
[ ] Complete task and verify status updates
[ ] Override task and verify audit log entry
[ ] Auto-complete regime on day 31
[ ] Cascade delete regime when farm deleted
[ ] Cascade delete tasks when regime deleted
[ ] Query regime by status filter
[ ] Query tasks by timing_window_start
[ ] Verify RLS prevents cross-farmer access

Performance Tests:
[ ] Regime creation time < 3 seconds
[ ] Regime fetch time < 1 second
[ ] Task completion update < 500ms
[ ] Bulk task insert < 5 seconds for 50 tasks

Security Tests:
[ ] Farmer A cannot view Farmer B's regimes (RLS)
[ ] Farmer cannot INSERT regime with different farmer_id
[ ] Audit log entries cannot be updated/deleted
[ ] System can insert version snapshots

=====================================================
DEPLOYMENT RISKS & MITIGATIONS
=====================================================

Risk 1: Duplicate constraint on (farm_id, status) fails during migration
Mitigation: Schema only applies to NEW regimes; test in staging first

Risk 2: RLS policies too restrictive (blocks valid queries)
Mitigation: Use same auth.uid() pattern as existing tables; test with actual users

Risk 3: Indexes conflict with existing names
Mitigation: Prefixed all index names with idx_regime_*; verified no duplicates

Risk 4: JSONB columns cause storage bloat
Mitigation: Monitor table size; may need partitioning if regime_versions grows

Risk 5: Cascade deletes have unintended side effects
Mitigation: Test deleting farmer/farm in staging; verify no orphaned records

=====================================================
MONITORING & METRICS
=====================================================

Post-Deployment Monitoring:
- Table sizes: SELECT * FROM pg_size_pretty(pg_total_relation_size('regimes'));
- Index usage: SELECT schemaname, tablename, indexname FROM pg_indexes WHERE tablename LIKE 'regime%';
- Query performance: EXPLAIN ANALYZE on common queries
- Error logs: Watch for constraint violations, RLS failures
- User adoption: Count regimes created per day

Alert Thresholds:
- Query time > 1 second: Investigate missing index
- Failed inserts > 5 per hour: Check constraint violations
- RLS errors > 10 per hour: Check authentication issues
- regimes table size > 1GB: Consider partitioning

=====================================================
ROLLBACK PLAN
=====================================================

If critical issues discovered:

1. Quick Rollback (Minutes):
   - Disable regime feature flag in backend
   - Hide Regime Page from frontend
   - Scheduler stops processing regimes
   - Database remains intact (data preserved)

2. Full Rollback (Hours):
   - Run: DROP TABLE IF EXISTS regimes CASCADE;
   - This cascades to all regime_* tables (ON DELETE CASCADE)
   - Existing data in other tables unaffected
   - Restore from backup if data corruption suspected

3. Partial Rollback (Minutes):
   - Disable RLS: ALTER TABLE regimes DISABLE ROW LEVEL SECURITY;
   - Check queries for debugging
   - Re-enable: ALTER TABLE regimes ENABLE ROW LEVEL SECURITY;

=====================================================
MIGRATION EXECUTION LOG
=====================================================

[ ] Migration 001: regimes table created
[ ] Migration 002: regime_tasks table created
[ ] Migration 003: regime_versions table created
[ ] Migration 004: regime_audit_log table created
[ ] Migration 005: regime_executions table created
[ ] Migration 006: indexes created
[ ] Migration 007: RLS policies added
[ ] Validated: All tables created
[ ] Validated: All indexes exist
[ ] Validated: RLS policies active
[ ] Tested: Can insert test regime
[ ] Tested: Can query regime by farmer_id
[ ] Tested: RLS prevents cross-farmer access
[ ] Deployed: Schema deployed to production
[ ] Monitored: 24-hour post-deployment monitoring complete

=====================================================
*/

-- Useful queries for validation and debugging:

-- Check all regime tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'regime%';

-- Check all regime indexes
SELECT tablename, indexname FROM pg_indexes WHERE tablename LIKE 'regime%' ORDER BY tablename, indexname;

-- Check RLS policies
SELECT tablename, policyname, qual FROM pg_policies WHERE tablename LIKE 'regime%' ORDER BY tablename, policyname;

-- Check table sizes (in MB)
SELECT 
  relname, 
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS indexes_size
FROM pg_class
WHERE relname LIKE 'regime%'
ORDER BY pg_total_relation_size(relid) DESC;

-- Check constraint definitions
SELECT 
  constraint_name, 
  table_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name LIKE 'regime%' 
ORDER BY table_name, constraint_name;

-- Verify unique active regime constraint works
-- Should return max 1 row per farm with status='active'
SELECT farm_id, COUNT(*) as regime_count 
FROM regimes 
WHERE status = 'active' 
GROUP BY farm_id 
HAVING COUNT(*) > 1;

-- Verify audit log is append-only (no recent updates)
SELECT COUNT(*) as suspicious_updates
FROM regime_audit_log
WHERE updated_at > created_at OR updated_at IS NOT NULL;
