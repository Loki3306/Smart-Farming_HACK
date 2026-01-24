"""
Pydantic models for IoT sensor data
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SensorData(BaseModel):
    """Real-time sensor data from ESP32 hardware"""
    # Basic sensors
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage from GPIO 34")
    temp: float = Field(..., description="Temperature in Celsius from DHT11 (GPIO 4)")
    humidity: float = Field(..., ge=0, le=100, description="Air humidity percentage from DHT11")
    npk: float = Field(..., ge=0, le=1023, description="NPK/Potentiometer reading from GPIO 35")
    
    # Advanced sensors (Precision Agriculture 4.0)
    ec_salinity: Optional[float] = Field(None, ge=0, le=20, description="Electrical Conductivity (dS/m)")
    wind_speed: Optional[float] = Field(None, ge=0, le=150, description="Wind speed (km/h)")
    soil_ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH level")
    
    # Metadata
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp from device")
    farm_id: Optional[str] = Field(default="default", description="Farm identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "moisture": 45.2,
                "temp": 26.5,
                "humidity": 68.0,
                "npk": 512,
                "ec_salinity": 1.8,
                "wind_speed": 12.5,
                "soil_ph": 6.8,
                "timestamp": "2026-01-24T00:41:31Z",
                "farm_id": "farm_001"
            }
        }


class IrrigationCommand(BaseModel):
    """Command to control irrigation system"""
    command: str = Field(..., description="Command type: WATER_ON, WATER_OFF")
    farm_id: str = Field(..., description="Target farm ID")
    duration_seconds: Optional[int] = Field(default=300, description="Duration for watering")
    reason: Optional[str] = Field(default="Manual trigger", description="Reason for command")


class ActuationCommand(BaseModel):
    """Hybrid Manual/Auto Actuation Command"""
    farm_id: str = Field(..., description="Target farm ID")
    action: str = Field(..., description="Action type: irrigation or fertilization")
    value: bool = Field(..., description="Actuation state: True=ON, False=OFF")
    mode: str = Field(..., description="Control mode: manual or auto")
    reason: Optional[str] = Field(default="Manual trigger", description="Reason for actuation")
    timestamp: Optional[str] = Field(default=None, description="Command timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "farm_id": "farm_001",
                "action": "irrigation",
                "value": True,
                "mode": "manual",
                "reason": "User initiated",
                "timestamp": "2026-01-24T22:30:00Z"
            }
        }


class SensorLogEntry(BaseModel):
    """Database entry for sensor logs"""
    id: Optional[str] = None
    farm_id: str
    moisture: float
    temp: float
    humidity: float
    npk: float
    timestamp: datetime
    created_at: Optional[datetime] = None
