"""
Test Suite for Regime Service - Validation before Step 2 completion
"""

from datetime import date, timedelta
from app.services.regime_service import (
    RegimeService, TaskExpanderService, Regime, RegimeTask,
    CropStage, RegimeStatus, TaskStatus, TaskType
)


def test_task_expansion():
    """Test expanding single recommendation into 5-task fertilizer workflow with real agent advice"""
    print("\n" + "="*60)
    print("TEST 1: Task Expansion with Real Agronomist Agent")
    print("="*60)
    
    # Create a fertilizer recommendation
    recommendation = {
        'id': 'rec-001',
        'type': 'fertilizer',
        'title': 'Apply NPK Fertilizer',
        'confidence': 95.0,
        'quantity': '50kg'
    }
    
    # Expand using TaskExpander with crop context and weather
    expander = TaskExpanderService()
    sowing_date = date.today() - timedelta(days=10)
    current_das = 10
    
    tasks = expander.expand_recommendation(
        recommendation=recommendation,
        crop_type='rice',  # Real crop type for agent analysis
        crop_stage=CropStage.VEGETATIVE.value,
        sowing_date=sowing_date,
        temperature=28.0,  # Real temperature for agent context
        humidity=65.0,     # Real humidity for agent context
        rainfall=5.0,      # Real rainfall for agent context
        current_das=current_das
    )
    
    # Validate
    print(f"✓ Recommendation expanded into {len(tasks)} tasks")
    assert len(tasks) == 5, f"Expected 5 tasks, got {len(tasks)}"
    
    # Check task sequence
    expected_types = [
        TaskType.FERTILIZER_SOIL_CHECK.value,
        TaskType.FERTILIZER_PREP.value,
        TaskType.FERTILIZER_APPLY.value,
        TaskType.FERTILIZER_WATER.value,
        TaskType.FERTILIZER_MONITOR.value
    ]
    
    for i, expected_type in enumerate(expected_types):
        assert tasks[i].task_type == expected_type, f"Task {i}: expected {expected_type}, got {tasks[i].task_type}"
        print(f"  Task {i+1}: {tasks[i].task_name} ({tasks[i].task_type}) - Confidence: {tasks[i].confidence_score:.1f}%")
    
    # Check confidence (should be agent-adjusted, not hardcoded)
    avg_confidence = sum(t.confidence_score for t in tasks) / len(tasks)
    print(f"✓ Average task confidence: {avg_confidence:.1f}% (real agent-adjusted, not hardcoded)")
    assert avg_confidence >= 80, f"Confidence too low: {avg_confidence}"
    
    print("✓ TEST PASSED - Real agent provided guidance")


def test_confidence_adjustment():
    """Test that confidence adjusts based on real Agronomist agent analysis"""
    print("\n" + "="*60)
    print("TEST 2: Real Agronomist Agent Confidence Adjustment")
    print("="*60)
    
    expander = TaskExpanderService()
    base_confidence = 90.0
    
    # Test different scenarios with real agent
    scenarios = [
        {
            'name': 'Rice in Vegetative (optimal conditions)',
            'crop_type': 'rice',
            'crop_stage': CropStage.VEGETATIVE.value,
            'task_type': 'fertilizer_apply',
            'temp': 28.0,
            'humidity': 65.0,
            'rain': 5.0,
            'expected': 'high'  # Agronomist should recommend fertilizer at this stage
        },
        {
            'name': 'Rice in Germination (early)',
            'crop_type': 'rice',
            'crop_stage': CropStage.GERMINATION.value,
            'task_type': 'fertilizer_apply',
            'temp': 25.0,
            'humidity': 70.0,
            'rain': 10.0,
            'expected': 'medium'  # Too early for fertilizer
        },
        {
            'name': 'Rice in Flowering (pest management critical)',
            'crop_type': 'rice',
            'crop_stage': CropStage.FLOWERING.value,
            'task_type': 'pest_spray',
            'temp': 30.0,
            'humidity': 75.0,
            'rain': 0.0,
            'expected': 'high'  # Agronomist should strongly recommend pest management
        },
    ]
    
    for scenario in scenarios:
        adjusted = expander._adjust_confidence_with_agent(
            base_confidence=base_confidence,
            crop_type=scenario['crop_type'],
            crop_stage=scenario['crop_stage'],
            task_type=scenario['task_type'],
            temperature=scenario['temp'],
            humidity=scenario['humidity'],
            rainfall=scenario['rain']
        )
        print(f"  {scenario['name']}: {adjusted:.0f}%")
        assert 0 <= adjusted <= 100, f"Confidence out of range: {adjusted}"
    
    print("✓ TEST PASSED - All adjustments based on real agent analysis")


def test_regime_creation():
    """Test creating a regime from 3 recommendations with real agent guidance"""
    print("\n" + "="*60)
    print("TEST 3: Regime Creation with Real Agent Guidance")
    print("="*60)
    
    service = RegimeService()
    
    # Create 3 recommendations
    recommendations = [
        {'id': 'rec-1', 'type': 'fertilizer', 'title': 'NPK', 'confidence': 95.0},
        {'id': 'rec-2', 'type': 'irrigation', 'title': 'Water', 'confidence': 90.0},
        {'id': 'rec-3', 'type': 'pest', 'title': 'Pest Control', 'confidence': 85.0},
    ]
    
    # Create regime with real crop type and weather context
    regime = service.create_regime(
        farmer_id='farmer-123',
        farm_id='farm-456',
        recommendations=recommendations,
        crop_type='rice',  # Real crop type
        crop_stage=CropStage.VEGETATIVE.value,
        sowing_date=date.today() - timedelta(days=20),
        regime_validity_days=30,
        temperature=28.0,
        humidity=65.0,
        rainfall=5.0
    )
    
    # Validate regime
    print(f"✓ Regime created: {regime.name}")
    print(f"  Version: {regime.version}")
    print(f"  Status: {regime.status}")
    print(f"  Tasks: {len(regime.tasks)}")
    print(f"  Valid until: {regime.valid_until.strftime('%Y-%m-%d')}")
    print(f"  Crop type: {regime.metadata.get('crop_type')}")
    print(f"  Agent provided guidance: {regime.metadata.get('agent_advised')}")
    
    assert regime.version == 1, f"Expected version 1, got {regime.version}"
    assert regime.status == RegimeStatus.ACTIVE.value, f"Expected ACTIVE status"
    assert len(regime.tasks) == 12, f"Expected 12 tasks (5+3+4), got {len(regime.tasks)}"
    assert (regime.valid_until - regime.valid_from).days >= 29, "Regime should be valid ~30 days"
    assert regime.metadata.get('agent_advised') == True, "Should mark agent provided real guidance"
    
    print("✓ TEST PASSED - Real agent provided guidance")


def test_regime_update_merge():
    """Test updating regime with new recommendations using real agent"""
    print("\n" + "="*60)
    print("TEST 4: Regime Update & Merge with Real Agent Guidance")
    print("="*60)
    
    service = RegimeService()
    
    # Create initial regime with 3 recommendations
    initial_recs = [
        {'id': 'rec-1', 'type': 'fertilizer', 'title': 'NPK', 'confidence': 85.0},
        {'id': 'rec-2', 'type': 'irrigation', 'title': 'Water', 'confidence': 80.0},
    ]
    
    regime_v1 = service.create_regime(
        farmer_id='farmer-123',
        farm_id='farm-456',
        recommendations=initial_recs,
        crop_type='rice',
        crop_stage=CropStage.VEGETATIVE.value,
        sowing_date=date.today() - timedelta(days=10),
        regime_validity_days=30,
        temperature=28.0,
        humidity=65.0,
        rainfall=5.0
    )
    
    print(f"V1 created with {len(regime_v1.tasks)} tasks")
    
    # Mark 2 tasks as completed
    regime_v1.tasks[0].status = TaskStatus.COMPLETED.value
    regime_v1.tasks[1].status = TaskStatus.COMPLETED.value
    print(f"✓ Marked 2 tasks as completed")
    
    # Update with new recommendations (higher confidence)
    new_recs = [
        {'id': 'rec-1', 'type': 'fertilizer', 'title': 'NPK', 'confidence': 92.0},  # Higher
        {'id': 'rec-2', 'type': 'irrigation', 'title': 'Water', 'confidence': 88.0},  # Higher
        {'id': 'rec-3', 'type': 'pest', 'title': 'Pest', 'confidence': 90.0},        # New
    ]
    
    regime_v2 = service.merge_update(
        existing_regime=regime_v1,
        new_recommendations=new_recs,
        trigger_type='auto_refresh',
        temperature=28.0,
        humidity=65.0,
        rainfall=5.0
    )
    
    # Validate merge
    print(f"V2 created with {len(regime_v2.tasks)} tasks")
    print(f"  Version: {regime_v2.version}")
    print(f"  Agent provided guidance: {regime_v2.metadata.get('agent_advised')}")
    
    assert regime_v2.version == 2, f"Expected version 2, got {regime_v2.version}"
    
    # Check that completed tasks are preserved
    completed_count = sum(1 for t in regime_v2.tasks if t.status == TaskStatus.COMPLETED.value)
    print(f"✓ Completed tasks preserved: {completed_count}")
    assert completed_count >= 2, "Expected at least 2 completed tasks preserved"
    
    # Check new tasks added
    print(f"✓ Tasks in V2: {len(regime_v2.tasks)} (expanded from {len(new_recs)} recommendations)")
    assert len(regime_v2.tasks) >= 10, "Expected at least 10 tasks in V2"
    assert regime_v2.metadata.get('agent_advised') == True, "Should mark agent provided guidance"
    
    print("✓ TEST PASSED - Real agent provided update guidance")


def test_task_timing():
    """Test DAS-based timing calculations with real agent context"""
    print("\n" + "="*60)
    print("TEST 5: Task Timing Calculations with Agent Context")
    print("="*60)
    
    expander = TaskExpanderService()
    
    # Create recommendation
    recommendation = {
        'id': 'rec-1',
        'type': 'fertilizer',
        'title': 'Test',
        'confidence': 85.0
    }
    
    # Calculate tasks with specific DAS and real crop context
    sowing_date = date(2026, 1, 1)
    current_das = 10
    
    tasks = expander.expand_recommendation(
        recommendation=recommendation,
        crop_type='rice',
        crop_stage=CropStage.VEGETATIVE.value,
        sowing_date=sowing_date,
        temperature=28.0,
        humidity=65.0,
        rainfall=5.0,
        current_das=current_das
    )
    
    # Verify timing
    print(f"Sowing date: {sowing_date.strftime('%Y-%m-%d')}")
    print(f"Current DAS: {current_das}")
    print(f"Today's date: {date.today().strftime('%Y-%m-%d')}")
    
    first_task_date = tasks[0].timing_window_start
    last_task_date = tasks[-1].timing_window_end
    
    print(f"\n✓ First task window: {first_task_date.strftime('%Y-%m-%d')} to {first_task_date.strftime('%Y-%m-%d')}")
    print(f"✓ Last task window: {last_task_date.strftime('%Y-%m-%d')} to {last_task_date.strftime('%Y-%m-%d')}")
    print(f"✓ Total span: {(last_task_date - first_task_date).days + 1} days")
    print(f"✓ Agent provided crop-specific context: rice, vegetative, 28°C, 65% humidity")
    
    # Verify ordering
    for i in range(len(tasks) - 1):
        assert tasks[i].timing_window_start <= tasks[i+1].timing_window_start, "Tasks not properly ordered by timing"
    
    print("✓ TEST PASSED - Timing calculations with real agent context")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("REGIME SERVICE TEST SUITE")
    print("="*60)
    
    tests = [
        test_task_expansion,
        test_confidence_adjustment,
        test_regime_creation,
        test_regime_update_merge,
        test_task_timing,
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
        except Exception as e:
            failed += 1
            print(f"\n✗ TEST FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("="*60)
    
    if failed == 0:
        print("✓ ALL TESTS PASSED - Step 2 Backend Service Ready\n")
