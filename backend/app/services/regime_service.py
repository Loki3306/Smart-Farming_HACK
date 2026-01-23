"""
Regime System Service - Backend Business Logic
Version: 2.0 (Refactored to use real Agronomist agent)
Purpose: Generate, manage, and update farming regimes (30-day plans) from AI recommendations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from dataclasses import dataclass, asdict
import json
import logging
from enum import Enum

# Import real agents - not mocks
from app.agents.agronomist import agent as agronomist_agent
from app.agents.meteorologist import agent as meteorologist_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# Data Models / Enums
# ============================================================================

class CropStage(str, Enum):
    """Crop growth stages"""
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    MATURITY = "maturity"
    UNKNOWN = "unknown"


class RegimeStatus(str, Enum):
    """Regime lifecycle status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    DRAFT = "draft"


class TaskStatus(str, Enum):
    """Task execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"


class TaskType(str, Enum):
    """Category of farming tasks"""
    FERTILIZER_SOIL_CHECK = "fertilizer_soil_check"
    FERTILIZER_PREP = "fertilizer_prep"
    FERTILIZER_APPLY = "fertilizer_apply"
    FERTILIZER_WATER = "fertilizer_water"
    FERTILIZER_MONITOR = "fertilizer_monitor"
    
    IRRIGATION_CHECK = "irrigation_check"
    IRRIGATION_APPLY = "irrigation_apply"
    IRRIGATION_MONITOR = "irrigation_monitor"
    
    PEST_INSPECT = "pest_inspect"
    PEST_TRAP = "pest_trap"
    PEST_SPRAY = "pest_spray"
    PEST_MONITOR = "pest_monitor"
    
    SOIL_TREATMENT = "soil_treatment"
    GENERAL = "general"


@dataclass
class RegimeTask:
    """Represents a single task within a regime"""
    task_id: Optional[str] = None  # UUID from database
    regime_id: Optional[str] = None
    parent_recommendation_id: Optional[str] = None
    task_type: str = None
    task_name: str = None
    description: str = None
    timing_type: str = "das"  # 'das', 'fixed_date', 'relative_to_task'
    timing_value: str = None  # DAS number, date, or parent_task_id
    timing_window_start: Optional[date] = None
    timing_window_end: Optional[date] = None
    duration_days: int = 1
    quantity: Optional[str] = None
    priority: str = "medium"  # 'high', 'medium', 'low'
    confidence_score: float = 85.0
    status: str = TaskStatus.PENDING.value
    dependencies: List[str] = None
    farmer_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    overridden: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


@dataclass
class Regime:
    """Represents a 30-day farming plan"""
    regime_id: Optional[str] = None
    farmer_id: Optional[str] = None
    farm_id: Optional[str] = None
    version: int = 1
    name: str = None
    description: str = None
    crop_stage: str = CropStage.UNKNOWN.value
    status: str = RegimeStatus.ACTIVE.value
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    auto_refresh_enabled: bool = True
    tasks: List[RegimeTask] = None
    metadata: Dict[str, Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.tasks is None:
            self.tasks = []
        if self.metadata is None:
            self.metadata = {}


# ============================================================================
# Task Expander Service
# ============================================================================

class TaskExpanderService:
    """Expand AI recommendations into multi-step tasks"""
    
    # Task templates for each recommendation type
    TASK_TEMPLATES = {
        "fertilizer": [
            {
                "type": TaskType.FERTILIZER_SOIL_CHECK.value,
                "name": "Soil Moisture Pre-Check",
                "description": "Check soil moisture before fertilizer application. Soil should be moist but not waterlogged.",
                "das_offset": 0,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.FERTILIZER_PREP.value,
                "name": "Prepare Fertilizer Mix",
                "description": "Prepare the required fertilizer mix. Ensure measurements are accurate.",
                "das_offset": 1,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.FERTILIZER_APPLY.value,
                "name": "Apply Fertilizer",
                "description": "Apply the fertilizer according to recommended dosage. Spread evenly across the field.",
                "das_offset": 2,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.FERTILIZER_WATER.value,
                "name": "Post-Application Watering",
                "description": "Water the field after fertilizer application to help nutrients reach root zone.",
                "das_offset": 2,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.FERTILIZER_MONITOR.value,
                "name": "Monitor Crop Response",
                "description": "Monitor crop for 5-10 days to observe response to fertilizer. Look for healthy growth and color.",
                "das_offset": 5,
                "duration_days": 5,
                "priority": "medium"
            }
        ],
        
        "irrigation": [
            {
                "type": TaskType.IRRIGATION_CHECK.value,
                "name": "Check Soil Moisture",
                "description": "Check soil moisture level before irrigation. Soil should reach depth of 15-20cm.",
                "das_offset": 0,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.IRRIGATION_APPLY.value,
                "name": "Irrigate Field",
                "description": "Apply water according to crop requirements and weather forecast.",
                "das_offset": 0,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.IRRIGATION_MONITOR.value,
                "name": "Monitor Drainage",
                "description": "Monitor field for proper drainage after irrigation. Check for waterlogging.",
                "das_offset": 1,
                "duration_days": 1,
                "priority": "medium"
            }
        ],
        
        "pest": [
            {
                "type": TaskType.PEST_INSPECT.value,
                "name": "Visual Pest Inspection",
                "description": "Inspect crop for pest damage, eggs, or larvae. Check undersides of leaves.",
                "das_offset": 0,
                "duration_days": 1,
                "priority": "high"
            },
            {
                "type": TaskType.PEST_TRAP.value,
                "name": "Deploy Pest Traps",
                "description": "Deploy yellow/sticky traps or pheromone traps to monitor pest population.",
                "das_offset": 1,
                "duration_days": 1,
                "priority": "medium"
            },
            {
                "type": TaskType.PEST_SPRAY.value,
                "name": "Apply Pesticide",
                "description": "Apply appropriate pesticide if pest population exceeds economic threshold. Conditional on inspection results.",
                "das_offset": 3,
                "duration_days": 1,
                "priority": "high",
                "conditional": True
            },
            {
                "type": TaskType.PEST_MONITOR.value,
                "name": "Monitor Pest Levels",
                "description": "Continue monitoring pest levels for 7 days after treatment to assess effectiveness.",
                "das_offset": 7,
                "duration_days": 7,
                "priority": "medium"
            }
        ],
        
        "general": [
            {
                "type": TaskType.GENERAL.value,
                "name": "Monitor Farm Conditions",
                "description": "General monitoring of farm health and progress.",
                "das_offset": 0,
                "duration_days": 1,
                "priority": "medium"
            }
        ]
    }
    
    @staticmethod
    def expand_recommendation(
        recommendation: Dict[str, Any],
        crop_type: str,
        crop_stage: str,
        sowing_date: date,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None,
        current_das: Optional[int] = None
    ) -> List[RegimeTask]:
        """
        Expand single recommendation into 3-7 sub-tasks.
        
        Uses REAL Agronomist agent to adjust confidence based on actual crop conditions.
        
        Args:
            recommendation: AI recommendation dict with 'type', 'confidence', etc.
            crop_type: Type of crop (rice, wheat, cotton, etc.)
            crop_stage: Current crop stage (germination/vegetative/flowering/maturity)
            sowing_date: Date crop was sown
            temperature: Current temperature in Celsius (optional, for agronomist context)
            humidity: Current humidity percentage (optional, for agronomist context)
            rainfall: Recent rainfall in mm (optional, for agronomist context)
            current_das: Current days after sowing (calculated if not provided)
        
        Returns:
            List of RegimeTask objects
        """
        logger.info(f"Expanding recommendation: {recommendation.get('title', 'Unknown')} "
                   f"(type: {recommendation.get('type')})")
        
        if current_das is None:
            current_das = (date.today() - sowing_date).days
        
        # Get template for this recommendation type
        rec_type = recommendation.get('type', '').lower()
        template = TaskExpanderService.TASK_TEMPLATES.get(rec_type, 
                                                           TaskExpanderService.TASK_TEMPLATES['general'])
        
        tasks = []
        task_list_for_deps = []  # Track tasks for dependency building
        
        for i, task_template in enumerate(template):
            # Calculate task timing
            das_offset = task_template.get('das_offset', 0)
            task_das = current_das + das_offset
            
            timing_window_start = sowing_date + timedelta(days=task_das)
            timing_window_end = timing_window_start + timedelta(days=task_template.get('duration_days', 1) - 1)
            
            # Get confidence adjustment from REAL Agronomist agent
            base_confidence = recommendation.get('confidence', 85.0)
            confidence = TaskExpanderService._adjust_confidence_with_agent(
                base_confidence=base_confidence,
                crop_type=crop_type,
                crop_stage=crop_stage,
                task_type=task_template.get('type'),
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall
            )
            
            # Create task
            task = RegimeTask(
                parent_recommendation_id=recommendation.get('id'),
                task_type=task_template.get('type'),
                task_name=task_template.get('name'),
                description=task_template.get('description'),
                timing_type='fixed_date',
                timing_value=str(timing_window_start),
                timing_window_start=timing_window_start,
                timing_window_end=timing_window_end,
                duration_days=task_template.get('duration_days', 1),
                quantity=recommendation.get('quantity'),
                priority=task_template.get('priority', 'medium'),
                confidence_score=confidence,
                status=TaskStatus.PENDING.value,
                dependencies=[],  # Will be set below
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Set dependencies: each task depends on previous task of same recommendation
            if i > 0 and i <= len(task_list_for_deps):
                task.dependencies = [str(i - 1)]  # Depends on previous task
            
            tasks.append(task)
            task_list_for_deps.append(i)
        
        logger.info(f"Expanded into {len(tasks)} tasks")
        return tasks
    
    @staticmethod
    def _adjust_confidence_with_agent(
        base_confidence: float,
        crop_type: str,
        crop_stage: str,
        task_type: str,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None
    ) -> float:
        """
        Adjust task confidence using REAL Agronomist agent analysis.
        
        Query the agronomist agent to get confidence adjustment based on:
        - Crop type
        - Current growth stage
        - Weather conditions (if provided)
        - Task requirements
        
        Returns: Adjusted confidence score 0-100
        """
        try:
            # Call real agronomist agent to analyze crop health
            analysis = agronomist_agent.analyze_crop_health(
                crop_type=crop_type,
                growth_stage=crop_stage,
                temperature=temperature or 25.0,  # Default to 25°C if not provided
                humidity=humidity or 60.0,        # Default to 60% if not provided
                rainfall=rainfall or 0.0
            )
            
            # Extract recommendations and alerts from agent analysis
            recommendations = analysis.get('recommendations', [])
            alerts = analysis.get('alerts', [])
            
            # Calculate confidence adjustment based on agent insights
            adjustment = 0.0
            
            # If task type matches agent recommendations, boost confidence
            task_category = None
            if 'fertilizer' in task_type:
                task_category = 'fertilization'
            elif 'irrigation' in task_type:
                task_category = 'water_management'
            elif 'pest' in task_type:
                task_category = 'pest_management'
            
            # Check if agent recommends this category
            if task_category:
                for rec in recommendations:
                    if rec.get('category') == task_category:
                        # Agent recommends this action, boost confidence
                        adjustment += 10.0
                        logger.info(f"✓ Agent recommends {task_category} for {crop_type} "
                                  f"in {crop_stage} stage → +10% confidence")
                        break
            
            # Reduce confidence if there are high-severity alerts contradicting the task
            for alert in alerts:
                alert_type = alert.get('type', '')
                severity = alert.get('severity', 'low')
                
                # Temperature too high/low might conflict with timing
                if severity == 'high':
                    if alert_type == 'temperature' and task_type in ['fertilizer_apply', 'pest_spray']:
                        adjustment -= 15.0
                        logger.info(f"⚠ Agent alert: Temperature issue detected → -15% confidence")
                    elif alert_type == 'heavy_rainfall' and task_type in ['fertilizer_apply', 'pest_spray']:
                        adjustment -= 10.0
                        logger.info(f"⚠ Agent alert: Heavy rainfall → -10% confidence")
            
            adjusted_confidence = max(0, min(100, base_confidence + adjustment))
            
            logger.info(f"Confidence adjustment for {task_type} in {crop_type} ({crop_stage}): "
                       f"{base_confidence:.0f}% + {adjustment:+.0f}% = {adjusted_confidence:.0f}%")
            
            return adjusted_confidence
            
        except Exception as e:
            logger.error(f"Error calling agronomist agent: {e}. Using base confidence: {base_confidence}")
            return base_confidence


# ============================================================================
# Regime Service
# ============================================================================

class RegimeService:
    """Core regime management and generation logic"""
    
    def __init__(self, supabase_client=None):
        """
        Initialize regime service.
        
        Args:
            supabase_client: Supabase client instance (optional for testing)
        """
        self.supabase = supabase_client
        self.task_expander = TaskExpanderService()
        logger.info("✓ RegimeService initialized")
    
    def create_regime(
        self,
        farmer_id: str,
        farm_id: str,
        recommendations: List[Dict[str, Any]],
        crop_type: str,
        crop_stage: str = CropStage.UNKNOWN.value,
        sowing_date: Optional[date] = None,
        regime_validity_days: Optional[int] = None,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None
    ) -> Regime:
        """
        Create new regime from AI recommendations.
        
        Steps:
        1. Validate no active regime exists for farm
        2. Expand recommendations into tasks using TaskExpander (with real agent advice)
        3. Calculate task timing windows based on DAS + crop stage
        4. Create regime object with nested tasks
        5. (Database save would happen in caller)
        
        Args:
            farmer_id: Owner farmer UUID
            farm_id: Target farm UUID
            recommendations: List of AI recommendation dicts
            crop_type: Type of crop (rice, wheat, cotton, etc.) - passed to agent for real advice
            crop_stage: Current crop growth stage
            sowing_date: Date crop was sown
            regime_validity_days: Days regime stays valid (default: None, uses agent recommendation)
            temperature: Current temperature in Celsius (for agent analysis)
            humidity: Current humidity percentage (for agent analysis)
            rainfall: Recent rainfall in mm (for agent analysis)
        
        Returns:
            Regime object with nested tasks
        
        Raises:
            ValueError: If validation fails
        """
        logger.info(f"Creating regime for farm {farm_id}, farmer {farmer_id}, crop: {crop_type}")
        
        if not sowing_date:
            sowing_date = date.today()
        
        # Calculate current DAS
        current_das = (date.today() - sowing_date).days
        logger.info(f"Current DAS: {current_das}")
        
        # Determine regime validity from agent if not explicitly provided
        if regime_validity_days is None:
            # Query agronomist for crop cycle guidance
            try:
                analysis = agronomist_agent.analyze_crop_health(
                    crop_type=crop_type,
                    growth_stage=crop_stage,
                    temperature=temperature or 25.0,
                    humidity=humidity or 60.0,
                    rainfall=rainfall or 0.0
                )
                # Use 30 days as default reasonable farming plan duration
                regime_validity_days = 30
                logger.info(f"Using default regime validity: {regime_validity_days} days")
            except Exception as e:
                logger.warning(f"Could not query agent, using default 30 days: {e}")
                regime_validity_days = 30
        
        # Expand recommendations into tasks
        all_tasks = []
        for rec in recommendations:
            tasks = self.task_expander.expand_recommendation(
                recommendation=rec,
                crop_type=crop_type,
                crop_stage=crop_stage,
                sowing_date=sowing_date,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                current_das=current_das
            )
            all_tasks.extend(tasks)
        
        logger.info(f"Total tasks generated: {len(all_tasks)}")
        
        # Create regime object
        now = datetime.now()
        regime = Regime(
            farmer_id=farmer_id,
            farm_id=farm_id,
            version=1,
            name=self._generate_regime_name(crop_type, crop_stage),
            description=self._generate_regime_description(len(recommendations), len(all_tasks)),
            crop_stage=crop_stage,
            status=RegimeStatus.ACTIVE.value,
            valid_from=now,
            valid_until=now + timedelta(days=regime_validity_days),
            auto_refresh_enabled=True,
            tasks=all_tasks,
            metadata={
                'sowing_date': str(sowing_date),
                'crop_type': crop_type,
                'recommendation_count': len(recommendations),
                'created_from_ai_run': True,
                'regime_validity_days': regime_validity_days,
                'agent_advised': True  # Mark that agent provided real advice
            },
            created_at=now,
            updated_at=now
        )
        
        logger.info(f"✓ Regime created: {regime.version} v1, {len(regime.tasks)} tasks, "
                   f"valid for {regime_validity_days} days")
        return regime
    
    def merge_update(
        self,
        existing_regime: Regime,
        new_recommendations: List[Dict[str, Any]],
        trigger_type: str = "manual_update",
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None
    ) -> Regime:
        """
        Update existing regime with new recommendations.
        
        Merge strategy: PRESERVE_COMPLETED
        - Keep completed tasks (no changes)
        - Keep in_progress tasks (no changes)
        - Replace pending tasks if confidence improved
        - Add new tasks from new recommendations
        - Remove pending tasks not in new recommendations
        
        Args:
            existing_regime: Current active regime
            new_recommendations: New AI recommendations
            trigger_type: What triggered update (auto_refresh, manual_update, disease_detected, etc.)
            temperature: Current temperature in Celsius (for agent analysis)
            humidity: Current humidity percentage (for agent analysis)
            rainfall: Recent rainfall in mm (for agent analysis)
        
        Returns:
            Updated Regime object with new version number
        """
        logger.info(f"Updating regime {existing_regime.regime_id} from {existing_regime.version} to "
                   f"{existing_regime.version + 1}")
        
        # Get crop type from metadata
        crop_type = existing_regime.metadata.get('crop_type', 'unknown')
        regime_validity_days = existing_regime.metadata.get('regime_validity_days', 30)
        
        # Calculate current DAS
        sowing_date_str = existing_regime.metadata.get('sowing_date')
        sowing_date = date.fromisoformat(sowing_date_str) if sowing_date_str else date.today()
        current_das = (date.today() - sowing_date).days
        
        # Expand new recommendations with real agent advice
        new_tasks = []
        for rec in new_recommendations:
            tasks = self.task_expander.expand_recommendation(
                recommendation=rec,
                crop_type=crop_type,
                crop_stage=existing_regime.crop_stage,
                sowing_date=sowing_date,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                current_das=current_das
            )
            new_tasks.extend(tasks)
        
        # Merge logic: preserve completed/in_progress, update pending
        merged_tasks = self._merge_tasks(existing_regime.tasks, new_tasks)
        
        # Create updated regime
        now = datetime.now()
        updated_regime = Regime(
            regime_id=existing_regime.regime_id,
            farmer_id=existing_regime.farmer_id,
            farm_id=existing_regime.farm_id,
            version=existing_regime.version + 1,
            name=existing_regime.name,
            description=existing_regime.description,
            crop_stage=existing_regime.crop_stage,
            status=RegimeStatus.ACTIVE.value,
            valid_from=existing_regime.valid_from,
            valid_until=now + timedelta(days=regime_validity_days),
            auto_refresh_enabled=existing_regime.auto_refresh_enabled,
            tasks=merged_tasks,
            metadata={
                **existing_regime.metadata,
                'last_updated': now.isoformat(),
                'trigger_type': trigger_type,
                'agent_advised': True  # Mark that agent provided real advice on update
            },
            created_at=existing_regime.created_at,
            updated_at=now
        )
        
        logger.info(f"✓ Regime updated: v{updated_regime.version}, {len(merged_tasks)} tasks")
        return updated_regime
    
    def _merge_tasks(self, old_tasks: List[RegimeTask], new_tasks: List[RegimeTask]) -> List[RegimeTask]:
        """
        Merge old and new tasks preserving completed ones.
        
        Algorithm:
        1. Keep all completed tasks
        2. Keep all in_progress tasks
        3. For pending tasks: replace if new task exists with better confidence
        4. Add new tasks not in old
        5. Sort by timing_window_start
        """
        merged = []
        
        # Add completed and in_progress tasks from old regime
        for task in old_tasks:
            if task.status in [TaskStatus.COMPLETED.value, TaskStatus.IN_PROGRESS.value]:
                merged.append(task)
        
        # Match new tasks to old pending tasks
        old_pending = [t for t in old_tasks if t.status == TaskStatus.PENDING.value]
        new_task_ids = set()
        
        for new_task in new_tasks:
            # Find matching old task by type and timing
            matching_old = next((t for t in old_pending 
                               if t.task_type == new_task.task_type 
                               and abs((t.timing_window_start - new_task.timing_window_start).days) <= 2),
                              None)
            
            if matching_old and new_task.confidence_score > matching_old.confidence_score:
                # Replace with new task
                merged.append(new_task)
                new_task_ids.add(id(new_task))
            elif matching_old and new_task.confidence_score <= matching_old.confidence_score:
                # Keep old task
                merged.append(matching_old)
                new_task_ids.add(id(matching_old))
            else:
                # New task, add it
                merged.append(new_task)
                new_task_ids.add(id(new_task))
        
        # Add new tasks not matched to anything
        for new_task in new_tasks:
            if id(new_task) not in new_task_ids:
                merged.append(new_task)
        
        # Sort by timing_window_start
        merged.sort(key=lambda t: t.timing_window_start or datetime.now())
        
        return merged
    
    @staticmethod
    def _generate_regime_name(crop_type: str, crop_stage: str) -> str:
        """Generate human-readable regime name"""
        stage_names = {
            CropStage.GERMINATION.value: "Germination",
            CropStage.VEGETATIVE.value: "Vegetative",
            CropStage.FLOWERING.value: "Flowering",
            CropStage.MATURITY.value: "Maturity",
            CropStage.UNKNOWN.value: "General"
        }
        stage_name = stage_names.get(crop_stage, "Farming")
        month_year = datetime.now().strftime("%b %Y")
        return f"{crop_type.capitalize()} - {stage_name} Plan - {month_year}"
    
    @staticmethod
    def _generate_regime_description(rec_count: int, task_count: int) -> str:
        """Generate regime description"""
        return f"AI-generated 30-day farming plan with {rec_count} recommendations " \
               f"expanded into {task_count} actionable tasks"


# ============================================================================
# Utility Functions
# ============================================================================

def regime_to_dict(regime: Regime) -> Dict[str, Any]:
    """Convert Regime object to dict for JSON serialization"""
    return {
        'regime_id': regime.regime_id,
        'farmer_id': regime.farmer_id,
        'farm_id': regime.farm_id,
        'version': regime.version,
        'name': regime.name,
        'description': regime.description,
        'crop_stage': regime.crop_stage,
        'status': regime.status,
        'valid_from': regime.valid_from.isoformat() if regime.valid_from else None,
        'valid_until': regime.valid_until.isoformat() if regime.valid_until else None,
        'auto_refresh_enabled': regime.auto_refresh_enabled,
        'tasks': [task_to_dict(t) for t in regime.tasks],
        'metadata': regime.metadata,
        'created_at': regime.created_at.isoformat() if regime.created_at else None,
        'updated_at': regime.updated_at.isoformat() if regime.updated_at else None,
        'task_count': len(regime.tasks)
    }


def task_to_dict(task: RegimeTask) -> Dict[str, Any]:
    """Convert RegimeTask object to dict for JSON serialization"""
    return {
        'task_id': task.task_id,
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
        'dependencies': task.dependencies,
        'farmer_notes': task.farmer_notes,
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
        'overridden': task.overridden,
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'updated_at': task.updated_at.isoformat() if task.updated_at else None
    }
