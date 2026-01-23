"""
Regime System Database Layer
Real Supabase integration for persistence
Handles all CRUD operations for regimes, tasks, and audit logs
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import json

from app.services.regime_service import (
    Regime,
    RegimeTask,
    RegimeStatus,
    TaskStatus,
    regime_to_dict,
    task_to_dict
)

logger = logging.getLogger(__name__)


class RegimeDatabase:
    """Database operations for Regime System using Supabase"""
    
    def __init__(self, supabase_client):
        """
        Initialize with Supabase client
        
        Args:
            supabase_client: Supabase Python client instance
        """
        self.supabase = supabase_client
        logger.info("✓ RegimeDatabase initialized with Supabase client")
    
    # ========================================================================
    # Regime CRUD Operations
    # ========================================================================
    
    def save_regime(self, regime: Regime, farmer_id: str) -> str:
        """
        Save new regime to database.
        
        Steps:
        1. Insert regime record into 'regimes' table
        2. Insert task records into 'regime_tasks' table
        3. Create initial version entry in 'regime_versions' table
        4. Log creation in 'regime_audit_log' table
        
        Args:
            regime: Regime object to save
            farmer_id: Farmer UUID (for RLS and verification)
        
        Returns:
            regime_id from database
        
        Raises:
            Exception: If database operation fails
        """
        try:
            logger.info(f"Saving regime to database for farmer {farmer_id}")
            
            # Verify farmer_id matches
            if regime.farmer_id != farmer_id:
                raise ValueError(f"Farmer ID mismatch: {regime.farmer_id} != {farmer_id}")
            
            # 1. Save regime record
            regime_data = {
                'farmer_id': regime.farmer_id,
                'farm_id': regime.farm_id,
                'version': regime.version,
                'name': regime.name,
                'description': regime.description,
                'crop_stage': regime.crop_stage,
                'status': regime.status,
                'valid_from': regime.valid_from.isoformat(),
                'valid_until': regime.valid_until.isoformat(),
                'auto_refresh_enabled': regime.auto_refresh_enabled,
                'metadata': regime.metadata,
                'created_at': regime.created_at.isoformat(),
                'updated_at': regime.updated_at.isoformat()
            }
            
            response = self.supabase.table('regimes').insert(regime_data).execute()
            regime_id = response.data[0]['regime_id']
            logger.info(f"✓ Regime saved: {regime_id}")
            
            # 2. Save tasks
            task_records = []
            for i, task in enumerate(regime.tasks):
                task.regime_id = regime_id
                task_record = {
                    'regime_id': regime_id,
                    'parent_recommendation_id': task.parent_recommendation_id,
                    'task_type': task.task_type,
                    'task_name': task.task_name,
                    'description': task.description,
                    'timing_type': task.timing_type,
                    'timing_value': task.timing_value,
                    'timing_window_start': task.timing_window_start.isoformat() if task.timing_window_start else None,
                    'timing_window_end': task.timing_window_end.isoformat() if task.timing_window_end else None,
                    'duration_days': task.duration_days,
                    'quantity': task.quantity,
                    'priority': task.priority,
                    'confidence_score': task.confidence_score,
                    'status': task.status,
                    'dependencies': json.dumps(task.dependencies) if task.dependencies else None,
                    'farmer_notes': task.farmer_notes,
                    'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                    'overridden': task.overridden,
                    'created_at': task.created_at.isoformat(),
                    'updated_at': task.updated_at.isoformat()
                }
                task_records.append(task_record)
            
            if task_records:
                self.supabase.table('regime_tasks').insert(task_records).execute()
                logger.info(f"✓ {len(task_records)} tasks saved")
            
            # 3. Create version entry
            self._create_version_entry(
                regime_id=regime_id,
                version_number=regime.version,
                changes_summary=f"Initial regime created with {len(regime.tasks)} tasks",
                trigger_type='creation',
                tasks_snapshot=regime_to_dict(regime)
            )
            
            # 4. Log to audit trail
            self._log_audit(
                regime_id=regime_id,
                action_type='regime_created',
                actor='system',
                details={
                    'regime_name': regime.name,
                    'task_count': len(regime.tasks),
                    'crop_stage': regime.crop_stage
                }
            )
            
            logger.info(f"✓ Regime {regime_id} fully saved to database")
            return regime_id
            
        except Exception as e:
            logger.error(f"Error saving regime: {str(e)}")
            raise
    
    def get_regime(self, regime_id: str, farmer_id: str) -> Optional[Regime]:
        """
        Retrieve regime with all nested data.
        
        Fetches from:
        - 'regimes' table (main record)
        - 'regime_tasks' table (all tasks)
        
        RLS policy ensures farmer_id matches.
        
        Args:
            regime_id: Regime UUID
            farmer_id: Farmer UUID (verified by RLS)
        
        Returns:
            Regime object or None if not found
        """
        try:
            logger.info(f"Retrieving regime {regime_id} for farmer {farmer_id}")
            
            # Fetch regime (RLS will enforce farmer_id)
            regime_response = self.supabase.table('regimes') \
                .select('*') \
                .eq('regime_id', regime_id) \
                .eq('farmer_id', farmer_id) \
                .execute()
            
            if not regime_response.data:
                logger.warning(f"Regime not found: {regime_id}")
                return None
            
            regime_data = regime_response.data[0]
            
            # Fetch tasks
            tasks_response = self.supabase.table('regime_tasks') \
                .select('*') \
                .eq('regime_id', regime_id) \
                .order('timing_window_start', desc=False) \
                .execute()
            
            # Reconstruct Regime object
            regime = Regime(
                regime_id=regime_data['regime_id'],
                farmer_id=regime_data['farmer_id'],
                farm_id=regime_data['farm_id'],
                version=regime_data['version'],
                name=regime_data['name'],
                description=regime_data['description'],
                crop_stage=regime_data['crop_stage'],
                status=regime_data['status'],
                valid_from=datetime.fromisoformat(regime_data['valid_from']),
                valid_until=datetime.fromisoformat(regime_data['valid_until']),
                auto_refresh_enabled=regime_data['auto_refresh_enabled'],
                metadata=regime_data.get('metadata', {}),
                created_at=datetime.fromisoformat(regime_data['created_at']),
                updated_at=datetime.fromisoformat(regime_data['updated_at'])
            )
            
            # Reconstruct tasks
            tasks = []
            for task_data in tasks_response.data:
                task = RegimeTask(
                    task_id=task_data['task_id'],
                    regime_id=task_data['regime_id'],
                    parent_recommendation_id=task_data['parent_recommendation_id'],
                    task_type=task_data['task_type'],
                    task_name=task_data['task_name'],
                    description=task_data['description'],
                    timing_type=task_data['timing_type'],
                    timing_value=task_data['timing_value'],
                    timing_window_start=datetime.fromisoformat(task_data['timing_window_start']).date() 
                        if task_data['timing_window_start'] else None,
                    timing_window_end=datetime.fromisoformat(task_data['timing_window_end']).date() 
                        if task_data['timing_window_end'] else None,
                    duration_days=task_data['duration_days'],
                    quantity=task_data['quantity'],
                    priority=task_data['priority'],
                    confidence_score=task_data['confidence_score'],
                    status=task_data['status'],
                    dependencies=json.loads(task_data['dependencies']) if task_data['dependencies'] else [],
                    farmer_notes=task_data['farmer_notes'],
                    completed_at=datetime.fromisoformat(task_data['completed_at']) 
                        if task_data['completed_at'] else None,
                    overridden=task_data['overridden'],
                    created_at=datetime.fromisoformat(task_data['created_at']),
                    updated_at=datetime.fromisoformat(task_data['updated_at'])
                )
                tasks.append(task)
            
            regime.tasks = tasks
            logger.info(f"✓ Regime retrieved: {len(tasks)} tasks")
            return regime
            
        except Exception as e:
            logger.error(f"Error retrieving regime: {str(e)}")
            raise
    
    def update_regime(self, regime: Regime, farmer_id: str) -> str:
        """
        Update existing regime with new version.
        
        Steps:
        1. Update regime record with new version number
        2. Replace tasks with new task set
        3. Create version entry in regime_versions table
        4. Log update in audit trail
        
        Args:
            regime: Updated Regime object (must have version incremented)
            farmer_id: Farmer UUID
        
        Returns:
            regime_id
        """
        try:
            logger.info(f"Updating regime {regime.regime_id} to version {regime.version}")
            
            # Verify farmer_id
            if regime.farmer_id != farmer_id:
                raise ValueError(f"Farmer ID mismatch: {regime.farmer_id} != {farmer_id}")
            
            # 1. Update regime record
            regime_data = {
                'version': regime.version,
                'status': regime.status,
                'valid_until': regime.valid_until.isoformat(),
                'metadata': regime.metadata,
                'updated_at': regime.updated_at.isoformat()
            }
            
            self.supabase.table('regimes') \
                .update(regime_data) \
                .eq('regime_id', regime.regime_id) \
                .eq('farmer_id', farmer_id) \
                .execute()
            
            # 2. Delete old tasks and insert new ones
            self.supabase.table('regime_tasks') \
                .delete() \
                .eq('regime_id', regime.regime_id) \
                .execute()
            
            task_records = []
            for task in regime.tasks:
                task.regime_id = regime.regime_id
                task_record = {
                    'regime_id': regime.regime_id,
                    'parent_recommendation_id': task.parent_recommendation_id,
                    'task_type': task.task_type,
                    'task_name': task.task_name,
                    'description': task.description,
                    'timing_type': task.timing_type,
                    'timing_value': task.timing_value,
                    'timing_window_start': task.timing_window_start.isoformat() if task.timing_window_start else None,
                    'timing_window_end': task.timing_window_end.isoformat() if task.timing_window_end else None,
                    'duration_days': task.duration_days,
                    'quantity': task.quantity,
                    'priority': task.priority,
                    'confidence_score': task.confidence_score,
                    'status': task.status,
                    'dependencies': json.dumps(task.dependencies) if task.dependencies else None,
                    'farmer_notes': task.farmer_notes,
                    'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                    'overridden': task.overridden,
                    'created_at': task.created_at.isoformat(),
                    'updated_at': task.updated_at.isoformat()
                }
                task_records.append(task_record)
            
            if task_records:
                self.supabase.table('regime_tasks').insert(task_records).execute()
                logger.info(f"✓ {len(task_records)} tasks updated")
            
            # 3. Create version entry
            self._create_version_entry(
                regime_id=regime.regime_id,
                version_number=regime.version,
                changes_summary=regime.metadata.get('last_updated', 'Updated'),
                trigger_type=regime.metadata.get('trigger_type', 'manual_update'),
                tasks_snapshot=regime_to_dict(regime)
            )
            
            # 4. Log update
            self._log_audit(
                regime_id=regime.regime_id,
                action_type='regime_updated',
                actor='system',
                details={
                    'new_version': regime.version,
                    'task_count': len(regime.tasks),
                    'trigger': regime.metadata.get('trigger_type', 'manual_update')
                }
            )
            
            logger.info(f"✓ Regime {regime.regime_id} updated to version {regime.version}")
            return regime.regime_id
            
        except Exception as e:
            logger.error(f"Error updating regime: {str(e)}")
            raise
    
    def archive_regime(self, regime_id: str, farmer_id: str) -> None:
        """
        Archive a regime (soft delete).
        
        Args:
            regime_id: Regime UUID
            farmer_id: Farmer UUID
        """
        try:
            logger.info(f"Archiving regime {regime_id}")
            
            self.supabase.table('regimes') \
                .update({'status': RegimeStatus.ARCHIVED.value}) \
                .eq('regime_id', regime_id) \
                .eq('farmer_id', farmer_id) \
                .execute()
            
            self._log_audit(
                regime_id=regime_id,
                action_type='regime_archived',
                actor='system',
                details={'archived_at': datetime.now().isoformat()}
            )
            
            logger.info(f"✓ Regime {regime_id} archived")
            
        except Exception as e:
            logger.error(f"Error archiving regime: {str(e)}")
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
        farmer_notes: Optional[str] = None
    ) -> None:
        """
        Update task status and log change.
        
        Args:
            regime_id: Regime UUID
            task_id: Task UUID
            new_status: New task status
            farmer_id: Farmer UUID
            farmer_notes: Optional farmer notes
        """
        try:
            logger.info(f"Updating task {task_id} status to {new_status}")
            
            update_data = {
                'status': new_status,
                'updated_at': datetime.now().isoformat()
            }
            
            if new_status == TaskStatus.COMPLETED.value:
                update_data['completed_at'] = datetime.now().isoformat()
            
            if farmer_notes:
                update_data['farmer_notes'] = farmer_notes
            
            self.supabase.table('regime_tasks') \
                .update(update_data) \
                .eq('task_id', task_id) \
                .eq('regime_id', regime_id) \
                .execute()
            
            self._log_audit(
                regime_id=regime_id,
                action_type='task_status_changed',
                actor='farmer',
                details={
                    'task_id': task_id,
                    'new_status': new_status,
                    'notes': farmer_notes
                }
            )
            
            logger.info(f"✓ Task {task_id} status updated")
            
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            raise
    
    # ========================================================================
    # History and Audit
    # ========================================================================
    
    def get_regime_history(self, regime_id: str, farmer_id: str) -> List[Dict[str, Any]]:
        """
        Get version history for regime.
        
        Args:
            regime_id: Regime UUID
            farmer_id: Farmer UUID
        
        Returns:
            List of version records
        """
        try:
            response = self.supabase.table('regime_versions') \
                .select('*') \
                .eq('regime_id', regime_id) \
                .order('version_number', desc=True) \
                .execute()
            
            logger.info(f"✓ Retrieved {len(response.data)} versions")
            return response.data
            
        except Exception as e:
            logger.error(f"Error retrieving history: {str(e)}")
            raise
    
    def get_regime_audit_log(self, regime_id: str, farmer_id: str) -> List[Dict[str, Any]]:
        """
        Get audit trail for regime.
        
        Args:
            regime_id: Regime UUID
            farmer_id: Farmer UUID
        
        Returns:
            List of audit log entries
        """
        try:
            response = self.supabase.table('regime_audit_log') \
                .select('*') \
                .eq('regime_id', regime_id) \
                .order('timestamp', desc=True) \
                .execute()
            
            logger.info(f"✓ Retrieved {len(response.data)} audit entries")
            return response.data
            
        except Exception as e:
            logger.error(f"Error retrieving audit log: {str(e)}")
            raise
    
    # ========================================================================
    # Private Helper Methods
    # ========================================================================
    
    def _create_version_entry(
        self,
        regime_id: str,
        version_number: int,
        changes_summary: str,
        trigger_type: str,
        tasks_snapshot: Dict[str, Any]
    ) -> None:
        """Create immutable version entry in regime_versions table"""
        version_data = {
            'regime_id': regime_id,
            'version_number': version_number,
            'changes_summary': changes_summary,
            'trigger_type': trigger_type,
            'tasks_snapshot': tasks_snapshot,
            'created_at': datetime.now().isoformat()
        }
        
        self.supabase.table('regime_versions').insert(version_data).execute()
        logger.info(f"✓ Version {version_number} entry created")
    
    def _log_audit(
        self,
        regime_id: str,
        action_type: str,
        actor: str,
        details: Dict[str, Any]
    ) -> None:
        """Append to immutable audit log"""
        audit_data = {
            'regime_id': regime_id,
            'action_type': action_type,
            'actor': actor,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        
        self.supabase.table('regime_audit_log').insert(audit_data).execute()
        logger.info(f"✓ Audit entry: {action_type}")
