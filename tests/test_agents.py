"""
Sample test file for the Smart Farming System
Run with: pytest tests/ -v
"""

import pytest
from app.models import SensorUpdate, SensorType, ActionInstruction, ActionType
from datetime import datetime


def test_sensor_update_creation():
    """Test SensorUpdate model creation"""
    sensor_update = SensorUpdate(
        sensor_id="test_sensor_01",
        farm_id=1,
        sensor_type=SensorType.SOIL_MOISTURE,
        value=35.5,
        unit="%",
        timestamp=datetime.utcnow()
    )
    
    assert sensor_update.sensor_id == "test_sensor_01"
    assert sensor_update.value == 35.5
    assert sensor_update.sensor_type == SensorType.SOIL_MOISTURE


def test_action_instruction_creation():
    """Test ActionInstruction model creation"""
    action = ActionInstruction(
        farm_id=1,
        action_type=ActionType.IRRIGATION,
        priority="high",
        trigger_conditions={"soil_moisture": 25.0},
        ai_reasoning={"reason": "Low soil moisture"},
        recommended_amount=500.0,
        recommended_duration=300,
        timestamp=datetime.utcnow(),
        sensor_data={},
        environmental_context={}
    )
    
    assert action.action_type == ActionType.IRRIGATION
    assert action.priority == "high"
    assert action.recommended_amount == 500.0


@pytest.mark.asyncio
async def test_redis_connection():
    """Test Redis connection (requires Redis running)"""
    # This is a placeholder - implement actual Redis test
    pass


@pytest.mark.asyncio
async def test_influxdb_write():
    """Test InfluxDB write operation (requires InfluxDB running)"""
    # This is a placeholder - implement actual InfluxDB test
    pass


def test_irrigation_decision_threshold():
    """Test irrigation decision logic"""
    from app.agents.agronomist import AgronomistAgent
    import redis.asyncio as redis
    
    # Mock Redis client
    agent = AgronomistAgent(None)
    
    # Test case: Low soil moisture, no rain forecasted, high temperature
    decision = agent.calculate_irrigation_need(
        farm_id=1,
        soil_moisture=25.0,  # Below threshold (30%)
        forecast_rain=0.5,    # Below threshold (2mm)
        temperature=35.0,     # Above threshold (35°C)
        evapotranspiration=5.0,
        humidity=30.0
    )
    
    assert decision is not None
    assert decision["should_act"] is True
    assert decision["action_type"] == ActionType.IRRIGATION
    assert decision["priority"] in ["medium", "high", "critical"]


def test_no_irrigation_when_rain_expected():
    """Test that irrigation is not triggered when rain is forecasted"""
    from app.agents.agronomist import AgronomistAgent
    
    agent = AgronomistAgent(None)
    
    # Test case: Low soil moisture BUT high rain forecasted
    decision = agent.calculate_irrigation_need(
        farm_id=1,
        soil_moisture=25.0,
        forecast_rain=10.0,  # Above threshold - rain expected
        temperature=30.0,
        evapotranspiration=4.0,
        humidity=50.0
    )
    
    # Should NOT irrigate because rain is expected
    assert decision is None
