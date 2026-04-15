"""
Pydantic models for IoT sensor data
"""

from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional, Union


class NPK(BaseModel):
    """Nitrogen, Phosphorus, Potassium nutrient values from soil sensor"""
    n: float = Field(..., ge=0, description="Nitrogen level (ppm or raw ADC)")
    p: float = Field(..., ge=0, description="Phosphorus level (ppm or raw ADC)")
    k: float = Field(..., ge=0, description="Potassium level (ppm or raw ADC)")

    @property
    def composite(self) -> float:
        """Weighted composite NPK score for single-value DB storage (N=50%, P=25%, K=25%)"""
        return round(self.n * 0.5 + self.p * 0.25 + self.k * 0.25, 2)

    def to_dict(self) -> dict:
        return {"n": self.n, "p": self.p, "k": self.k}


class SensorData(BaseModel):
    """Real-time sensor data from ESP32 hardware"""
    # Basic sensors
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage from GPIO 34")
    temp: float = Field(..., description="Temperature in Celsius from DHT11 (GPIO 4)")
    humidity: float = Field(..., ge=0, le=100, description="Air humidity percentage from DHT11")

    # NPK: accepts EITHER a dict {"n":..., "p":..., "k":...}  OR a legacy float (potentiometer)
    npk: Union[NPK, float] = Field(
        ...,
        description=(
            "NPK sensor reading. "
            "Preferred: dict with {n, p, k} keys. "
            "Legacy: single float (0–1023 ADC range from GPIO 35)."
        )
    )

    # Advanced sensors (Precision Agriculture 4.0)
    ec_salinity: Optional[float] = Field(None, ge=0, le=20, description="Electrical Conductivity (dS/m)")
    wind_speed: Optional[float] = Field(None, ge=0, le=150, description="Wind speed (km/h)")
    soil_ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH level")

    # Metadata
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp from device")
    farm_id: Optional[str] = Field(default="default", description="Farm identifier")

    @model_validator(mode="before")
    @classmethod
    def coerce_npk(cls, values: dict) -> dict:
        """
        Auto-coerce npk field so both payload shapes are accepted:
          - {"n": 81, "p": 38, "k": 40}  → NPK model
          - 512 (or "512")               → kept as float (legacy)
        """
        raw = values.get("npk")
        if isinstance(raw, dict):
            # Already in {n, p, k} shape — Pydantic will validate as NPK
            pass
        elif isinstance(raw, str):
            try:
                values["npk"] = float(raw)
            except ValueError:
                pass  # Let Pydantic raise a proper validation error
        return values

    @property
    def npk_composite(self) -> float:
        """Return a single float representing NPK for DB storage / backward-compat code."""
        if isinstance(self.npk, NPK):
            return self.npk.composite
        # Legacy: plain float (raw GPIO potentiometer value, 0–1023)
        return float(self.npk) if self.npk is not None else 0.0

    @property
    def npk_dict(self) -> dict:
        """Return NPK as a dict regardless of internal type."""
        if isinstance(self.npk, NPK):
            return self.npk.to_dict()
        val = float(self.npk) if self.npk is not None else 0.0
        return {"n": val, "p": 0.0, "k": 0.0}

    class Config:
        json_schema_extra = {
            "example": {
                "moisture": 45.2,
                "temp": 26.5,
                "humidity": 68.0,
                "npk": {"n": 81, "p": 38, "k": 40},
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
    npk: float          # stored as composite float in DB
    timestamp: datetime
    created_at: Optional[datetime] = None
