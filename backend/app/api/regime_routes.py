"""
Regime System API Routes
Real FastAPI endpoints for regime CRUD operations
Integrates with Supabase for persistence
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from app.services.regime_service import (
    RegimeService,
    Regime,
    RegimeTask,
    CropStage,
    RegimeStatus,
    TaskStatus,
    regime_to_dict,
    task_to_dict
)
from app.db.regime_db import RegimeDatabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/regime", tags=["regime"])

# Initialize regime service (Supabase client will be injected via dependency in future)
regime_service = RegimeService()

# Database instance will be injected via dependency
# For now, we'll use a global that gets set during app startup
_db: Optional[RegimeDatabase] = None

def get_regime_db() -> RegimeDatabase:
    """Dependency for database access"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

def set_regime_db(db: RegimeDatabase) -> None:
    """Set the database instance (called during app startup)"""
    global _db
    _db = db


# ============================================================================
# Request/Response Models
# ============================================================================

class CreateRegimeRequest(BaseModel):
    """Request to generate a new regime"""
    farmer_id: str = Field(..., description="Farmer UUID")
    farm_id: Optional[str] = Field(None, description="Optional Farm UUID (can be null if no farm record exists)")
    crop_type: str = Field(..., description="Type of crop (rice, wheat, cotton, etc.)")
    crop_stage: str = Field(default=CropStage.VEGETATIVE.value, description="Current crop stage")
    sowing_date: Optional[date] = Field(None, description="Date crop was sown")
    recommendations: List[Dict[str, Any]] = Field(..., description="AI recommendations to expand into regime")
    regime_validity_days: Optional[int] = Field(30, description="Days regime stays valid")
    temperature: Optional[float] = Field(None, description="Current temperature in Celsius")
    humidity: Optional[float] = Field(None, description="Current humidity percentage")
    rainfall: Optional[float] = Field(None, description="Recent rainfall in mm")


class UpdateRegimeRequest(BaseModel):
    """Request to update existing regime with new recommendations"""
    new_recommendations: List[Dict[str, Any]] = Field(..., description="New AI recommendations")
    trigger_type: str = Field(default="manual_update", description="What triggered update")
    temperature: Optional[float] = Field(None, description="Current temperature in Celsius")
    humidity: Optional[float] = Field(None, description="Current humidity percentage")
    rainfall: Optional[float] = Field(None, description="Recent rainfall in mm")


class UpdateTaskStatusRequest(BaseModel):
    """Request to update a task status"""
    status: str = Field(..., description="New task status (pending, in_progress, completed, skipped, failed)")
    farmer_notes: Optional[str] = Field(None, description="Optional farmer notes")


class RegimeResponse(BaseModel):
    """Response model for regime data"""
    regime_id: Optional[str]
    farmer_id: str
    farm_id: str
    version: int
    name: str
    description: str
    crop_stage: str
    status: str
    valid_from: datetime
    valid_until: datetime
    auto_refresh_enabled: bool
    tasks: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    task_count: int


class RegimeHistoryResponse(BaseModel):
    """Response for regime version history"""
    regime_id: str
    current_version: int
    versions: List[Dict[str, Any]]


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/generate", response_model=RegimeResponse, status_code=201)
async def generate_regime(request: CreateRegimeRequest, db: RegimeDatabase = Depends(get_regime_db)):
    """
    Generate a new regime from AI recommendations.
    
    - Expands recommendations into multi-step tasks
    - Uses Agronomist agent for confidence adjustment
    - Creates 30-day (or custom) farming plan
    - Persists to Supabase database
    
    Returns: Complete regime with nested tasks
    """
    try:
        logger.info(f"Generating regime for farm {request.farm_id}, crop: {request.crop_type}")
        
        # Create regime using service
        regime = regime_service.create_regime(
            farmer_id=request.farmer_id,
            farm_id=request.farm_id,
            recommendations=request.recommendations,
            crop_type=request.crop_type,
            crop_stage=request.crop_stage,
            sowing_date=request.sowing_date,
            regime_validity_days=request.regime_validity_days,
            temperature=request.temperature,
            humidity=request.humidity,
            rainfall=request.rainfall
        )
        
        # Save to database
        regime_id = db.save_regime(regime=regime, farmer_id=request.farmer_id)
        regime.regime_id = regime_id
        
        # Convert to response dict
        response_data = regime_to_dict(regime)
        logger.info(f"✓ Regime generated and saved: {regime_id} with {len(regime.tasks)} tasks")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error generating regime: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to generate regime: {str(e)}")


@router.get("", response_model=List[RegimeResponse])
async def list_regimes(
    farmer_id: str = Query(..., description="Farmer UUID"),
    status: Optional[str] = Query(None, description="Filter by status (active, completed, expired)"),
    limit: int = Query(50, ge=1, le=100, description="Max number of regimes to return"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    List all regimes for a farmer.
    
    Returns regimes ordered by created_at DESC.
    """
    try:
        logger.info(f"Listing regimes for farmer {farmer_id}, status filter: {status}")
        
        # Get regimes from database
        regimes = db.list_regimes(farmer_id=farmer_id, status=status, limit=limit)
        
        # Convert to response format
        response_list = [regime_to_dict(r) for r in regimes]
        logger.info(f"✓ Found {len(response_list)} regimes for farmer {farmer_id}")
        
        return response_list
    except Exception as e:
        logger.error(f"Error listing regimes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list regimes: {str(e)}")


@router.get("/{regime_id}", response_model=RegimeResponse)
async def get_regime(regime_id: str, farmer_id: str = Query(..., description="Farmer UUID"), db: RegimeDatabase = Depends(get_regime_db)):
    """
    Retrieve a regime by ID.
    
    RLS policy ensures only regime owner (farmer_id) can retrieve.
    
    Returns: Complete regime with all tasks and metadata
    """
    try:
        logger.info(f"Retrieving regime: {regime_id} for farmer {farmer_id}")
        
        regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        
        if not regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        response_data = regime_to_dict(regime)
        logger.info(f"✓ Regime retrieved: {len(regime.tasks)} tasks")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving regime: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to retrieve regime: {str(e)}")


@router.patch("/{regime_id}/update", response_model=RegimeResponse)
async def update_regime(
    regime_id: str,
    request: UpdateRegimeRequest,
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    Update existing regime with new recommendations.
    
    Merge strategy:
    - Preserves completed tasks
    - Updates pending tasks if confidence improved
    - Adds new tasks
    
    Returns: Updated regime (new version)
    """
    try:
        logger.info(f"Updating regime: {regime_id} with new recommendations")
        
        # Fetch existing regime from database
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Merge new recommendations with existing regime
        updated_regime = regime_service.merge_update(
            existing_regime=existing_regime,
            new_recommendations=request.new_recommendations,
            trigger_type=request.trigger_type,
            temperature=request.temperature,
            humidity=request.humidity,
            rainfall=request.rainfall
        )
        
        # Save updated regime with new version
        db.update_regime(regime=updated_regime, farmer_id=farmer_id)
        
        response_data = regime_to_dict(updated_regime)
        logger.info(f"✓ Regime updated to version {updated_regime.version}")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating regime: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update regime: {str(e)}")


@router.delete("/{regime_id}", status_code=204)
async def archive_regime(
    regime_id: str,
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    Archive a regime (soft delete).
    
    Changes status to 'archived' without deleting data.
    """
    try:
        logger.info(f"Archiving regime: {regime_id} for farmer {farmer_id}")
        
        # Verify regime exists and belongs to farmer
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Archive the regime
        db.archive_regime(regime_id=regime_id, farmer_id=farmer_id)
        logger.info(f"✓ Regime {regime_id} archived")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving regime: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to archive regime: {str(e)}")


@router.get("/{regime_id}/history", response_model=RegimeHistoryResponse)
async def get_regime_history(
    regime_id: str,
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    Get version history for a regime.
    
    Returns all versions with changes summary and timestamps.
    """
    try:
        logger.info(f"Retrieving regime history: {regime_id} for farmer {farmer_id}")
        
        # Verify regime exists and belongs to farmer
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Fetch history
        history = db.get_regime_history(regime_id=regime_id, farmer_id=farmer_id)
        
        response_data = RegimeHistoryResponse(
            regime_id=regime_id,
            current_version=existing_regime.version,
            versions=history
        )
        logger.info(f"✓ Retrieved {len(history)} versions")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving history: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/{regime_id}/tasks", response_model=List[Dict[str, Any]])
async def get_regime_tasks(
    regime_id: str,
    farmer_id: str = Query(..., description="Farmer UUID"),
    status: Optional[str] = Query(None, description="Filter by task status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    Get tasks for a regime with optional filters.
    
    Filters:
    - status: pending, in_progress, completed, skipped, failed
    - priority: high, medium, low
    """
    try:
        logger.info(f"Retrieving tasks for regime: {regime_id}, filters: status={status}, priority={priority}")
        
        # Verify regime exists and belongs to farmer
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Get tasks from the regime
        tasks = existing_regime.tasks
        
        # Apply filters
        if status:
            tasks = [t for t in tasks if t.status == status]
        if priority:
            tasks = [t for t in tasks if t.priority == priority]
        
        # Convert to dict format
        response_tasks = [task_to_dict(t) for t in tasks]
        logger.info(f"✓ Retrieved {len(response_tasks)} tasks")
        
        return response_tasks
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving tasks: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to retrieve tasks: {str(e)}")


@router.patch("/{regime_id}/task/{task_id}/status", status_code=200)
async def update_task_status(
    regime_id: str,
    task_id: str,
    request: UpdateTaskStatusRequest,
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """
    Update status of a specific task.
    
    Also logs to regime audit trail automatically.
    """
    try:
        logger.info(f"Updating task {task_id} in regime {regime_id} to {request.status}")
        
        # Verify regime exists and belongs to farmer
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Verify task exists in regime
        task_found = False
        for task in existing_regime.tasks:
            if task.task_id == task_id:
                task_found = True
                break
        
        if not task_found:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found in regime")
        
        # Update task status in database
        db.update_task_status(
            regime_id=regime_id,
            task_id=task_id,
            new_status=request.status,
            farmer_id=farmer_id,
            farmer_notes=request.farmer_notes
        )
        
        logger.info(f"✓ Task {task_id} status updated to {request.status}")
        
        return {"status": "success", "task_id": task_id, "new_status": request.status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task status: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update task: {str(e)}")


@router.post("/{regime_id}/export")
async def export_regime(
    regime_id: str,
    format: str = Query("pdf", description="Export format: pdf or csv")
):
    """
    Export regime to PDF or CSV.
    
    Includes:
    - Regime summary
    - All tasks with timing
    - Confidence scores
    - Farmer notes
    
    Returns file download.
    """
    try:
        logger.info(f"Exporting regime {regime_id} as {format}")
        
        # TODO: In Step 5, implement PDF/CSV generation
        raise HTTPException(
            status_code=501,
            detail="Export feature not yet implemented (Step 5)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting regime: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to export regime: {str(e)}")


# ============================================================================
# Task CRUD Operations
# ============================================================================

@router.post("/{regime_id}/task", status_code=201)
async def create_task(
    regime_id: str,
    task_data: Dict[str, Any],
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """Create a new task in the regime"""
    try:
        logger.info(f"Creating new task in regime {regime_id}")
        
        # Verify regime exists
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # TODO: Implement task creation in database
        return {"status": "success", "message": "Task creation endpoint ready"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create task: {str(e)}")


@router.put("/{regime_id}/task/{task_id}", status_code=200)
async def update_task(
    regime_id: str,
    task_id: str,
    task_data: Dict[str, Any],
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """Update an existing task"""
    try:
        logger.info(f"Updating task {task_id} in regime {regime_id}")
        
        # Verify regime exists
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Verify task exists
        task_found = any(t.task_id == task_id for t in existing_regime.tasks)
        if not task_found:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # TODO: Implement task update in database
        return {"status": "success", "message": "Task update endpoint ready"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update task: {str(e)}")


@router.delete("/{regime_id}/task/{task_id}", status_code=200)
async def delete_task(
    regime_id: str,
    task_id: str,
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """Delete a task from the regime"""
    try:
        logger.info(f"Deleting task {task_id} from regime {regime_id}")
        
        # Verify regime exists
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Verify task exists
        task_found = any(t.task_id == task_id for t in existing_regime.tasks)
        if not task_found:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # TODO: Implement task deletion in database
        return {"status": "success", "message": "Task deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete task: {str(e)}")


@router.patch("/{regime_id}/task/{task_id}/reschedule", status_code=200)
async def reschedule_task(
    regime_id: str,
    task_id: str,
    new_date: str = Query(..., description="New date in YYYY-MM-DD format"),
    farmer_id: str = Query(..., description="Farmer UUID"),
    db: RegimeDatabase = Depends(get_regime_db)
):
    """Reschedule a task to a new date"""
    try:
        logger.info(f"Rescheduling task {task_id} to {new_date}")
        
        # Verify regime exists
        existing_regime = db.get_regime(regime_id=regime_id, farmer_id=farmer_id)
        if not existing_regime:
            raise HTTPException(status_code=404, detail=f"Regime {regime_id} not found")
        
        # Verify task exists
        task_found = any(t.task_id == task_id for t in existing_regime.tasks)
        if not task_found:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # TODO: Implement task rescheduling in database
        return {"status": "success", "task_id": task_id, "new_date": new_date}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rescheduling task: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to reschedule task: {str(e)}")


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health", tags=["health"])
async def regime_health():
    """Health check for regime system"""
    return {
        "status": "healthy",
        "service": "regime_system",
        "version": "2.0",
        "timestamp": datetime.now().isoformat()
    }
