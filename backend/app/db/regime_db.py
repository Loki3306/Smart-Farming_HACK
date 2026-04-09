"""
backend/app/db/regime_db.py

Regime System Database Layer — previously Supabase, now Neon PostgreSQL via psycopg2.
All public method signatures are UNCHANGED so the API routes need no modification.
"""

import json
import logging
import re
from contextlib import contextmanager
from datetime import datetime, date
from typing import Optional, List, Dict, Any

from app.services.regime_service import (
    Regime,
    RegimeTask,
    RegimeStatus,
    TaskStatus,
    regime_to_dict,
    task_to_dict,
)
from app.services.neon_client import get_connection

logger = logging.getLogger(__name__)

# Valid trigger types allowed by database constraint
VALID_TRIGGER_TYPES = {
    "auto_refresh", "manual_update", "disease_detected",
    "weather_change", "farmer_request",
}


# ---------------------------------------------------------------------------
# Date/time helpers (unchanged)
# ---------------------------------------------------------------------------

def parse_datetime_safe(value: Optional[str]) -> Optional[datetime]:
    """
    Parse datetime from PostgreSQL safely.
    Handles various formats including truncated microseconds and timezones.
    """
    if not value:
        return None

    value = str(value)

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        pass

    match = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.?(\d*)(\+.*)?$", value)
    if match:
        base = match.group(1)
        frac = match.group(2) or "0"
        tz = match.group(3) or ""
        frac = frac[:6].ljust(6, "0")
        try:
            return datetime.fromisoformat(f"{base}.{frac}{tz}")
        except ValueError:
            return datetime.fromisoformat(f"{base}.{frac}")

    for fmt in ["%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"]:
        try:
            return datetime.strptime(value[:26], fmt)
        except ValueError:
            continue

    raise ValueError(f"Cannot parse datetime: {value}")


def parse_date_safe(value: Optional[str]) -> Optional[date]:
    """Parse date from PostgreSQL safely."""
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        dt = parse_datetime_safe(value)
        return dt.date() if dt else None


# ---------------------------------------------------------------------------
# Row → Regime / RegimeTask reconstruction helpers
# ---------------------------------------------------------------------------

def _row_to_regime(row: dict, tasks: Optional[List[Any]] = None) -> Regime:
    regime = Regime(
        regime_id=row["regime_id"],
        farmer_id=row["farmer_id"],
        farm_id=row.get("farm_id"),
        version=row["version"],
        name=row["name"],
        description=row["description"],
        crop_stage=row["crop_stage"],
        status=row["status"],
        valid_from=parse_datetime_safe(str(row["valid_from"])) if row.get("valid_from") else None,
        valid_until=parse_datetime_safe(str(row["valid_until"])) if row.get("valid_until") else None,
        auto_refresh_enabled=row["auto_refresh_enabled"],
        metadata=row.get("metadata") or {},
        created_at=parse_datetime_safe(str(row["created_at"])) if row.get("created_at") else None,
        updated_at=parse_datetime_safe(str(row["updated_at"])) if row.get("updated_at") else None,
        tasks=tasks or [],
    )
    return regime


def _row_to_task(row: dict) -> RegimeTask:
    return RegimeTask(
        task_id=row["task_id"],
        regime_id=row["regime_id"],
        parent_recommendation_id=row.get("parent_recommendation_id"),
        task_type=row["task_type"],
        task_name=row["task_name"],
        description=row.get("description"),
        timing_type=row.get("timing_type"),
        timing_value=row.get("timing_value"),
        timing_window_start=parse_date_safe(str(row["timing_window_start"])) if row.get("timing_window_start") else None,
        timing_window_end=parse_date_safe(str(row["timing_window_end"])) if row.get("timing_window_end") else None,
        duration_days=row.get("duration_days"),
        quantity=row.get("quantity"),
        priority=row.get("priority"),
        confidence_score=row.get("confidence_score"),
        status=row.get("status"),
        dependencies=row.get("dependencies") or [],
        farmer_notes=row.get("farmer_notes"),
        completed_at=parse_datetime_safe(str(row["completed_at"])) if row.get("completed_at") else None,
        overridden=row.get("overridden", False),
        created_at=parse_datetime_safe(str(row["created_at"])) if row.get("created_at") else None,
        updated_at=parse_datetime_safe(str(row["updated_at"])) if row.get("updated_at") else None,
    )


# ---------------------------------------------------------------------------
# Main class
# ---------------------------------------------------------------------------

class RegimeDatabase:
    """Database operations for Regime System using Neon PostgreSQL (psycopg2)."""

    def __init__(self, supabase_client=None):
        """
        Accepts supabase_client for API compatibility, but ignores it.
        Connections are managed by neon_client.get_connection().
        """
        logger.info("✓ RegimeDatabase initialized with Neon PostgreSQL")

    # ========================================================================
    # Regime CRUD
    # ========================================================================

    def save_regime(self, regime: Regime, farmer_id: str) -> str:
        """Save new regime to database. Returns regime_id."""
        try:
            logger.info(f"Saving regime to database for farmer {farmer_id}")

            if regime.farmer_id != farmer_id:
                raise ValueError(f"Farmer ID mismatch: {regime.farmer_id} != {farmer_id}")

            with get_connection() as conn:
                with conn.cursor() as cur:
                    # 1. Insert regime
                    cur.execute(
                        """
                        INSERT INTO regimes
                          (farmer_id, farm_id, version, name, description, crop_stage,
                           status, valid_from, valid_until, auto_refresh_enabled,
                           metadata, created_at, updated_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING regime_id
                        """,
                        (
                            regime.farmer_id, regime.farm_id, regime.version,
                            regime.name, regime.description, regime.crop_stage,
                            regime.status,
                            regime.valid_from.isoformat() if regime.valid_from else None,
                            regime.valid_until.isoformat() if regime.valid_until else None,
                            regime.auto_refresh_enabled,
                            json.dumps(regime.metadata),
                            regime.created_at.isoformat() if regime.created_at else None,
                            regime.updated_at.isoformat() if regime.updated_at else None,
                        ),
                    )
                    regime_id = cur.fetchone()[0]
                    logger.info(f"✓ Regime saved: {regime_id}")

                    # 2. Insert tasks
                    if regime.tasks:
                        for task in regime.tasks:
                            task.regime_id = regime_id
                            cur.execute(
                                """
                                INSERT INTO regime_tasks
                                  (regime_id, parent_recommendation_id, task_type, task_name,
                                   description, timing_type, timing_value, timing_window_start,
                                   timing_window_end, duration_days, quantity, priority,
                                   confidence_score, status, dependencies, farmer_notes,
                                   completed_at, overridden, created_at, updated_at)
                                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                                """,
                                (
                                    regime_id, task.parent_recommendation_id, task.task_type,
                                    task.task_name, task.description, task.timing_type,
                                    task.timing_value,
                                    task.timing_window_start.isoformat() if task.timing_window_start else None,
                                    task.timing_window_end.isoformat() if task.timing_window_end else None,
                                    task.duration_days, task.quantity, task.priority,
                                    task.confidence_score, task.status,
                                    json.dumps(task.dependencies or []),
                                    task.farmer_notes,
                                    task.completed_at.isoformat() if task.completed_at else None,
                                    task.overridden,
                                    task.created_at.isoformat() if task.created_at else datetime.now().isoformat(),
                                    task.updated_at.isoformat() if task.updated_at else datetime.now().isoformat(),
                                ),
                            )
                        logger.info(f"✓ {len(regime.tasks)} tasks saved")

                    # 3. Version entry
                    self._create_version_entry_cur(
                        cur, regime_id, regime.version,
                        f"Initial regime created with {len(regime.tasks)} tasks",
                        "farmer_request", regime_to_dict(regime), "system",
                    )

                    # 4. Audit log
                    self._log_audit_cur(
                        cur, regime_id, "regime_created", "system",
                        {"regime_name": regime.name, "task_count": len(regime.tasks), "crop_stage": regime.crop_stage},
                    )

            logger.info(f"✓ Regime {regime_id} fully saved to database")
            return regime_id

        except Exception as e:
            logger.error(f"Error saving regime: {e}")
            raise

    def get_regime(self, regime_id: str, farmer_id: str) -> Optional[Regime]:
        """Retrieve regime with all tasks. Returns None if not found."""
        try:
            logger.info(f"Retrieving regime {regime_id} for farmer {farmer_id}")

            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT * FROM regimes WHERE regime_id=%s AND farmer_id=%s",
                        (regime_id, farmer_id),
                    )
                    desc = [d[0] for d in cur.description]
                    row = cur.fetchone()
                    if not row:
                        logger.warning(f"Regime not found: {regime_id}")
                        return None
                    regime_row = dict(zip(desc, row))

                    cur.execute(
                        "SELECT * FROM regime_tasks WHERE regime_id=%s ORDER BY timing_window_start ASC",
                        (regime_id,),
                    )
                    task_desc = [d[0] for d in cur.description]
                    tasks = [_row_to_task(dict(zip(task_desc, r))) for r in cur.fetchall()]

            regime = _row_to_regime(regime_row, tasks)
            logger.info(f"✓ Regime retrieved: {len(tasks)} tasks")
            return regime

        except Exception as e:
            logger.error(f"Error retrieving regime: {e}")
            raise

    def update_regime(self, regime: Regime, farmer_id: str) -> str:
        """Update existing regime with new version. Returns regime_id."""
        try:
            logger.info(f"Updating regime {regime.regime_id} to version {regime.version}")

            if regime.farmer_id != farmer_id:
                raise ValueError(f"Farmer ID mismatch: {regime.farmer_id} != {farmer_id}")

            with get_connection() as conn:
                with conn.cursor() as cur:
                    # 1. Update regime record
                    cur.execute(
                        """
                        UPDATE regimes
                        SET version=%s, status=%s, valid_until=%s, metadata=%s, updated_at=%s
                        WHERE regime_id=%s AND farmer_id=%s
                        """,
                        (
                            regime.version, regime.status,
                            regime.valid_until.isoformat() if regime.valid_until else None,
                            json.dumps(regime.metadata),
                            regime.updated_at.isoformat() if regime.updated_at else datetime.now().isoformat(),
                            regime.regime_id, farmer_id,
                        ),
                    )

                    # 2. Replace tasks
                    cur.execute("DELETE FROM regime_tasks WHERE regime_id=%s", (regime.regime_id,))

                    for task in regime.tasks:
                        task.regime_id = regime.regime_id
                        cur.execute(
                            """
                            INSERT INTO regime_tasks
                              (regime_id, parent_recommendation_id, task_type, task_name,
                               description, timing_type, timing_value, timing_window_start,
                               timing_window_end, duration_days, quantity, priority,
                               confidence_score, status, dependencies, farmer_notes,
                               completed_at, overridden, created_at, updated_at)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                            """,
                            (
                                regime.regime_id, task.parent_recommendation_id, task.task_type,
                                task.task_name, task.description, task.timing_type,
                                task.timing_value,
                                task.timing_window_start.isoformat() if task.timing_window_start else None,
                                task.timing_window_end.isoformat() if task.timing_window_end else None,
                                task.duration_days, task.quantity, task.priority,
                                task.confidence_score, task.status,
                                json.dumps(task.dependencies or []),
                                task.farmer_notes,
                                task.completed_at.isoformat() if task.completed_at else None,
                                task.overridden,
                                task.created_at.isoformat() if task.created_at else datetime.now().isoformat(),
                                task.updated_at.isoformat() if task.updated_at else datetime.now().isoformat(),
                            ),
                        )

                    logger.info(f"✓ {len(regime.tasks)} tasks updated")

                    # 3. Version entry
                    self._create_version_entry_cur(
                        cur, regime.regime_id, regime.version,
                        regime.metadata.get("last_updated", "Updated"),
                        regime.metadata.get("trigger_type", "manual_update"),
                        regime_to_dict(regime), "system",
                    )

                    # 4. Audit log
                    self._log_audit_cur(
                        cur, regime.regime_id, "regime_updated", "system",
                        {
                            "new_version": regime.version,
                            "task_count": len(regime.tasks),
                            "trigger": regime.metadata.get("trigger_type", "manual_update"),
                        },
                    )

            logger.info(f"✓ Regime {regime.regime_id} updated to version {regime.version}")
            return regime.regime_id

        except Exception as e:
            logger.error(f"Error updating regime: {e}")
            raise

    def archive_regime(self, regime_id: str, farmer_id: str) -> None:
        """Archive a regime (soft delete)."""
        try:
            logger.info(f"Archiving regime {regime_id}")

            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE regimes SET status=%s WHERE regime_id=%s AND farmer_id=%s",
                        (RegimeStatus.ARCHIVED.value, regime_id, farmer_id),
                    )
                    self._log_audit_cur(
                        cur, regime_id, "regime_archived", "system",
                        {"archived_at": datetime.now().isoformat()},
                    )

            logger.info(f"✓ Regime {regime_id} archived")

        except Exception as e:
            logger.error(f"Error archiving regime: {e}")
            raise

    def list_regimes(
        self,
        farmer_id: str,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Regime]:
        """List all regimes for a farmer (tasks not loaded for performance)."""
        try:
            logger.info(f"Listing regimes for farmer {farmer_id}, status={status}, limit={limit}")

            with get_connection() as conn:
                with conn.cursor() as cur:
                    if status:
                        cur.execute(
                            "SELECT * FROM regimes WHERE farmer_id=%s AND status=%s ORDER BY created_at DESC LIMIT %s",
                            (farmer_id, status, limit),
                        )
                    else:
                        cur.execute(
                            "SELECT * FROM regimes WHERE farmer_id=%s ORDER BY created_at DESC LIMIT %s",
                            (farmer_id, limit),
                        )

                    desc = [d[0] for d in cur.description]
                    regime_rows = [dict(zip(desc, r)) for r in cur.fetchall()]

                    regimes = []
                    for row in regime_rows:
                        cur.execute(
                            "SELECT COUNT(*) FROM regime_tasks WHERE regime_id=%s",
                            (row["regime_id"],),
                        )
                        task_count = cur.fetchone()[0]
                        regime = _row_to_regime(row, [])
                        regime.metadata["task_count"] = task_count
                        regimes.append(regime)

            logger.info(f"✓ Listed {len(regimes)} regimes for farmer {farmer_id}")
            return regimes

        except Exception as e:
            logger.error(f"Error listing regimes: {e}")
            raise

    # ========================================================================
    # Task Operations
    # ========================================================================

    def update_task_status(
        self,
        regime_id: str,
        task_id: str,
        new_status: str,
        farmer_id: str,
        farmer_notes: Optional[str] = None,
    ) -> None:
        """Update task status and log change."""
        try:
            logger.info(f"Updating task {task_id} status to {new_status}")
            now = datetime.now().isoformat()

            with get_connection() as conn:
                with conn.cursor() as cur:
                    if new_status == TaskStatus.COMPLETED.value:
                        cur.execute(
                            """
                            UPDATE regime_tasks
                            SET status=%s, updated_at=%s, completed_at=%s, farmer_notes=COALESCE(%s, farmer_notes)
                            WHERE task_id=%s AND regime_id=%s
                            """,
                            (new_status, now, now, farmer_notes, task_id, regime_id),
                        )
                    else:
                        cur.execute(
                            """
                            UPDATE regime_tasks
                            SET status=%s, updated_at=%s, farmer_notes=COALESCE(%s, farmer_notes)
                            WHERE task_id=%s AND regime_id=%s
                            """,
                            (new_status, now, farmer_notes, task_id, regime_id),
                        )

                    self._log_audit_cur(
                        cur, regime_id, "task_status_changed", "farmer",
                        {"task_id": task_id, "new_status": new_status, "notes": farmer_notes},
                    )

            logger.info(f"✓ Task {task_id} status updated")

        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            raise

    # ========================================================================
    # History and Audit
    # ========================================================================

    def get_regime_history(self, regime_id: str, farmer_id: str) -> List[Dict[str, Any]]:
        """Get version history for regime."""
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT * FROM regime_versions WHERE regime_id=%s ORDER BY version_number DESC",
                        (regime_id,),
                    )
                    desc = [d[0] for d in cur.description]
                    rows = [dict(zip(desc, r)) for r in cur.fetchall()]

            logger.info(f"✓ Retrieved {len(rows)} versions")
            return rows

        except Exception as e:
            logger.error(f"Error retrieving history: {e}")
            raise

    def get_regime_audit_log(self, regime_id: str, farmer_id: str) -> List[Dict[str, Any]]:
        """Get audit trail for regime."""
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT * FROM regime_audit_log WHERE regime_id=%s ORDER BY timestamp DESC",
                        (regime_id,),
                    )
                    desc = [d[0] for d in cur.description]
                    rows = [dict(zip(desc, r)) for r in cur.fetchall()]

            logger.info(f"✓ Retrieved {len(rows)} audit entries")
            return rows

        except Exception as e:
            logger.error(f"Error retrieving audit log: {e}")
            raise

    # ========================================================================
    # Private helpers (use an open cursor, no commit — caller commits)
    # ========================================================================

    def _create_version_entry_cur(
        self,
        cur,
        regime_id: str,
        version_number: int,
        changes_summary: str,
        trigger_type: str,
        tasks_snapshot: Dict[str, Any],
        created_by: str = "system",
    ) -> None:
        if trigger_type not in VALID_TRIGGER_TYPES:
            logger.warning(f"Invalid trigger_type '{trigger_type}', defaulting to 'manual_update'")
            trigger_type = "manual_update"

        cur.execute(
            """
            INSERT INTO regime_versions
              (regime_id, version_number, changes_summary, trigger_type,
               tasks_snapshot, created_by, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                regime_id, version_number, changes_summary, trigger_type,
                json.dumps(tasks_snapshot), created_by, datetime.now().isoformat(),
            ),
        )
        logger.info(f"✓ Version {version_number} entry created")

    def _log_audit_cur(
        self, cur, regime_id: str, action_type: str, actor: str, details: Dict[str, Any]
    ) -> None:
        cur.execute(
            """
            INSERT INTO regime_audit_log (regime_id, action_type, actor, details, timestamp)
            VALUES (%s,%s,%s,%s,%s)
            """,
            (regime_id, action_type, actor, json.dumps(details), datetime.now().isoformat()),
        )
        logger.info(f"✓ Audit entry: {action_type}")

    # Keep old private API for any existing callers
    def _create_version_entry(self, regime_id, version_number, changes_summary, trigger_type, tasks_snapshot, created_by="system"):
        with get_connection() as conn:
            with conn.cursor() as cur:
                self._create_version_entry_cur(cur, regime_id, version_number, changes_summary, trigger_type, tasks_snapshot, created_by)

    def _log_audit(self, regime_id, action_type, actor, details):
        with get_connection() as conn:
            with conn.cursor() as cur:
                self._log_audit_cur(cur, regime_id, action_type, actor, details)
