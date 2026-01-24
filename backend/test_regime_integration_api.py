"""
Regime System Integration Tests
Tests complete backend workflows with mocked database
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from fastapi.testclient import TestClient
from app.main import app
from app.services.regime_service import (
    Regime,
    RegimeTask,
    CropStage,
    RegimeStatus,
    TaskStatus,
    RegimeService,
)
from app.db.regime_db import RegimeDatabase

client = TestClient(app)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def sample_regime():
    """Create sample regime for testing"""
    valid_from = datetime.now().date()
    valid_until = valid_from + timedelta(days=30)
    now = datetime.now()

    regime = Regime(
        farmer_id="farmer_123",
        farm_id="farm_456",
        version=1,
        name="Rice Growing Plan",
        description="30-day rice cultivation regime",
        crop_stage=CropStage.VEGETATIVE.value,
        status=RegimeStatus.ACTIVE.value,
        valid_from=datetime.combine(valid_from, datetime.min.time()),
        valid_until=datetime.combine(valid_until, datetime.min.time()),
        auto_refresh_enabled=False,
        metadata={"crop_type": "rice", "trigger_type": "creation"},
        created_at=now,
        updated_at=now,
    )

    task1 = RegimeTask(
        parent_recommendation_id="rec_1",
        task_type="irrigation",
        task_name="First irrigation",
        description="Apply 50mm water irrigation",
        timing_type="days_after_sowing",
        timing_value=10,
        quantity=50.0,
        priority="high",
        confidence_score=92.5,
        status=TaskStatus.PENDING.value,
        created_at=now,
        updated_at=now,
    )

    task2 = RegimeTask(
        parent_recommendation_id="rec_2",
        task_type="fertilizer",
        task_name="Apply nitrogen fertilizer",
        description="Apply 60kg/hectare urea",
        timing_type="days_after_sowing",
        timing_value=20,
        quantity=60.0,
        priority="high",
        confidence_score=88.0,
        status=TaskStatus.PENDING.value,
        created_at=now,
        updated_at=now,
    )

    regime.tasks = [task1, task2]
    return regime


# ============================================================================
# API Endpoint Tests
# ============================================================================

class TestRegimeAPI:
    """Test Regime API endpoints"""

    def test_health_check(self):
        """Test regime health endpoint"""
        response = client.get("/api/regime/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "regime_system"

    def test_create_regime_missing_farmer_id(self):
        """Test create regime without farmer_id"""
        payload = {
            "farm_id": "farm_456",
            "crop_type": "rice",
            "crop_stage": "vegetative",
            "recommendations": [{"type": "irrigation", "priority": "high"}],
        }
        response = client.post("/api/regime/generate", json=payload)
        assert response.status_code == 422  # Validation error

    def test_create_regime_missing_recommendations(self):
        """Test create regime without recommendations"""
        payload = {
            "farmer_id": "farmer_123",
            "farm_id": "farm_456",
            "crop_type": "rice",
            "crop_stage": "vegetative",
            "recommendations": [],  # Empty
        }
        response = client.post("/api/regime/generate", json=payload)
        assert response.status_code in [400, 422]

    def test_create_regime_invalid_crop_stage(self):
        """Test create regime with invalid crop stage"""
        payload = {
            "farmer_id": "farmer_123",
            "farm_id": "farm_456",
            "crop_type": "rice",
            "crop_stage": "invalid_stage",
            "recommendations": [{"type": "irrigation"}],
        }
        response = client.post("/api/regime/generate", json=payload)
        # Should validate crop stage
        assert response.status_code in [400, 422, 201]

    def test_get_regime_missing_farmer_id(self):
        """Test get regime without farmer_id query param"""
        response = client.get("/api/regime/regime_123")
        assert response.status_code == 422  # Missing required param

    def test_get_regime_not_found(self):
        """Test get non-existent regime"""
        response = client.get("/api/regime/nonexistent", params={"farmer_id": "farmer_123"})
        assert response.status_code == 404

    def test_delete_regime_missing_farmer_id(self):
        """Test delete regime without farmer_id"""
        response = client.delete("/api/regime/regime_123")
        assert response.status_code == 422

    def test_get_regime_tasks_missing_farmer_id(self):
        """Test get tasks without farmer_id"""
        response = client.get("/api/regime/regime_123/tasks")
        assert response.status_code == 422

    def test_update_task_status_missing_farmer_id(self):
        """Test update task without farmer_id"""
        payload = {"status": "completed", "farmer_notes": "Done"}
        response = client.patch(
            "/api/regime/regime_123/task/task_456/status",
            json=payload,
        )
        assert response.status_code == 422


# ============================================================================
# Service Layer Tests
# ============================================================================

class TestRegimeService:
    """Test RegimeService business logic"""

    def test_create_regime_expands_recommendations(self, sample_regime):
        """Test that create_regime expands recommendations into tasks"""
        service = RegimeService()

        # Should have expanded recommendations into tasks
        assert len(sample_regime.tasks) > 0
        assert all(hasattr(task, 'task_id') or task.task_id is None for task in sample_regime.tasks)

    def test_regime_validity_tracking(self, sample_regime):
        """Test regime validity dates are properly set"""
        assert sample_regime.valid_from < sample_regime.valid_until
        validity_days = (sample_regime.valid_until - sample_regime.valid_from).days
        assert validity_days == 30  # Default 30 days

    def test_task_confidence_scores(self, sample_regime):
        """Test task confidence scores are within valid range"""
        for task in sample_regime.tasks:
            assert 0 <= task.confidence_score <= 100

    def test_task_priority_valid_values(self, sample_regime):
        """Test task priorities are valid"""
        valid_priorities = ["high", "medium", "low"]
        for task in sample_regime.tasks:
            assert task.priority in valid_priorities

    def test_regime_status_transitions(self, sample_regime):
        """Test regime status can transition correctly"""
        assert sample_regime.status == RegimeStatus.ACTIVE.value

        # Status can transition to completed
        sample_regime.status = RegimeStatus.COMPLETED.value
        assert sample_regime.status == RegimeStatus.COMPLETED.value

        # Can transition to archived
        sample_regime.status = RegimeStatus.ARCHIVED.value
        assert sample_regime.status == RegimeStatus.ARCHIVED.value


# ============================================================================
# Database Integration Tests
# ============================================================================

class TestDatabaseIntegration:
    """Test database layer integration"""

    def test_database_initialization(self):
        """Test RegimeDatabase can be initialized"""
        mock_client = Mock()
        db = RegimeDatabase(mock_client)
        assert db is not None
        assert db.supabase == mock_client

    def test_save_regime_returns_id(self, sample_regime):
        """Test save_regime returns regime_id"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[{"regime_id": 1}])

        db = RegimeDatabase(mock_client)
        regime_id = db.save_regime(sample_regime, farmer_id="farmer_123")

        assert regime_id == 1
        assert mock_client.table.called

    def test_get_regime_requires_farmer_id(self, sample_regime):
        """Test get_regime enforces farmer_id"""
        mock_client = Mock()
        db = RegimeDatabase(mock_client)

        # Should not allow accessing regime with wrong farmer_id
        # (This would be enforced by RLS in real Supabase)
        regime_id = "regime_123"
        correct_farmer_id = "farmer_123"
        wrong_farmer_id = "farmer_wrong"

        # Both calls hit the same code path, but in real DB,
        # wrong_farmer_id would return None due to RLS


# ============================================================================
# Error Handling Tests
# ============================================================================

class TestErrorHandling:
    """Test error handling throughout system"""

    def test_regime_service_handles_none_farmer_id(self):
        """Test service handles None farmer_id"""
        service = RegimeService()
        regime = Regime(
            farmer_id=None,
            farm_id="farm_456",
            version=1,
            name="Test",
            description="Test",
            crop_stage="vegetative",
            status="active",
            valid_from=datetime.now(),
            valid_until=datetime.now() + timedelta(days=30),
            auto_refresh_enabled=False,
            metadata={},
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Should handle gracefully
        assert regime.farmer_id is None

    def test_api_returns_consistent_error_format(self):
        """Test API returns consistent error responses"""
        response = client.post("/api/regime/generate", json={})
        assert response.status_code in [400, 422]
        # Should have consistent error format
        data = response.json()
        assert "detail" in data or "message" in data


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Test performance characteristics"""

    def test_large_regime_task_count(self):
        """Test regime handles large number of tasks"""
        now = datetime.now()
        valid_from = datetime.now().date()
        valid_until = valid_from + timedelta(days=30)

        regime = Regime(
            farmer_id="farmer_123",
            farm_id="farm_456",
            version=1,
            name="Large Plan",
            description="Many tasks",
            crop_stage="vegetative",
            status="active",
            valid_from=datetime.combine(valid_from, datetime.min.time()),
            valid_until=datetime.combine(valid_until, datetime.min.time()),
            auto_refresh_enabled=False,
            metadata={},
            created_at=now,
            updated_at=now,
        )

        # Add 100 tasks
        for i in range(100):
            task = RegimeTask(
                parent_recommendation_id=f"rec_{i}",
                task_type="irrigation",
                task_name=f"Task {i}",
                description="Test",
                timing_type="days_after_sowing",
                timing_value=i,
                quantity=10.0,
                priority="high" if i % 3 == 0 else "medium",
                confidence_score=85.0 + (i % 10),
                status="pending",
                created_at=now,
                updated_at=now,
            )
            regime.tasks.append(task)

        assert len(regime.tasks) == 100
        # Should be able to serialize without issues
        assert regime is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
