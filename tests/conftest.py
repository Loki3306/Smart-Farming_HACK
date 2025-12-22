"""
Test configuration and fixtures
"""

import pytest
import asyncio


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_sensor_data():
    """Sample sensor data for testing"""
    return {
        "sensor_id": "test_sensor_01",
        "farm_id": 1,
        "sensor_type": "soil_moisture",
        "value": 28.5,
        "unit": "%",
        "timestamp": "2025-12-22T10:00:00Z"
    }


@pytest.fixture
def sample_weather_data():
    """Sample weather data for testing"""
    return {
        "temperature": 32.0,
        "humidity": 45.0,
        "forecast_rain_24h": 0.5,
        "wind_speed": 5.0
    }
