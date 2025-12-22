"""
Database Models and Pydantic Schemas
SQLAlchemy models for PostgreSQL and Pydantic schemas for data validation
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# SQLAlchemy Base
Base = declarative_base()


# ============= SQLAlchemy Models (PostgreSQL) =============

class Farm(Base):
    """Farm configuration and metadata"""
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    size_hectares = Column(Float)
    crop_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sensors = relationship("Sensor", back_populates="farm")
    actions = relationship("ActionLog", back_populates="farm")


class Sensor(Base):
    """Sensor device configuration"""
    __tablename__ = "sensors"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    sensor_id = Column(String, unique=True, nullable=False, index=True)
    sensor_type = Column(String)  # soil_moisture, temperature, humidity, etc.
    location_description = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    is_active = Column(Boolean, default=True)
    calibration_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="sensors")


class ActionLog(Base):
    """Audit trail of all automated actions"""
    __tablename__ = "action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    action_type = Column(String)  # irrigation, fertilization
    trigger_reason = Column(String)
    ai_justification = Column(JSON)  # Store complete decision reasoning
    blockchain_tx_hash = Column(String, index=True)
    blockchain_status = Column(String)  # pending, confirmed, failed
    executed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="actions")


# ============= Pydantic Schemas (API Validation) =============

class SensorType(str, Enum):
    """Enumeration of sensor types"""
    SOIL_MOISTURE = "soil_moisture"
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    PH = "ph"
    NITROGEN = "nitrogen"
    PHOSPHORUS = "phosphorus"
    POTASSIUM = "potassium"


class ActionType(str, Enum):
    """Enumeration of action types"""
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_CONTROL = "pest_control"


# ===== Event Schemas for Redis Pub/Sub =====

class SensorUpdate(BaseModel):
    """Event published by Ingestor when sensor data arrives"""
    sensor_id: str
    farm_id: int
    sensor_type: SensorType
    value: float
    unit: str
    timestamp: datetime
    metadata: Optional[dict] = None


class EnvironmentalContext(BaseModel):
    """Event published by Meteorologist with external data"""
    farm_id: int
    timestamp: datetime
    weather_current: dict  # Current weather from OpenWeather
    weather_forecast: dict  # 5-day forecast
    nasa_ndvi: Optional[float] = None  # Vegetation index
    nasa_soil_moisture: Optional[float] = None  # Satellite soil moisture
    nasa_evapotranspiration: Optional[float] = None
    metadata: Optional[dict] = None


class ActionInstruction(BaseModel):
    """Event published by Agronomist when action is needed"""
    farm_id: int
    action_type: ActionType
    priority: str = Field(..., description="low, medium, high, critical")
    trigger_conditions: dict
    ai_reasoning: dict
    recommended_amount: Optional[float] = None
    recommended_duration: Optional[int] = None  # seconds
    timestamp: datetime
    sensor_data: dict
    environmental_context: dict


class BlockchainAuditLog(BaseModel):
    """Event published by Auditor after blockchain logging"""
    farm_id: int
    action_id: int
    transaction_hash: str
    block_number: Optional[int] = None
    status: str  # pending, confirmed, failed
    gas_used: Optional[int] = None
    timestamp: datetime


class AgentStatus(BaseModel):
    """Real-time agent status for Gatekeeper"""
    agent_name: str
    status: str  # active, idle, error
    last_activity: datetime
    message: Optional[str] = None
    metrics: Optional[dict] = None


# ===== API Request/Response Schemas =====

class FarmCreate(BaseModel):
    """Schema for creating a new farm"""
    name: str
    location: str
    latitude: float
    longitude: float
    size_hectares: float
    crop_type: str


class FarmResponse(BaseModel):
    """Schema for farm API responses"""
    id: int
    name: str
    location: str
    latitude: float
    longitude: float
    size_hectares: float
    crop_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SensorCreate(BaseModel):
    """Schema for registering a new sensor"""
    farm_id: int
    sensor_id: str
    sensor_type: SensorType
    location_description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SensorResponse(BaseModel):
    """Schema for sensor API responses"""
    id: int
    farm_id: int
    sensor_id: str
    sensor_type: str
    location_description: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActionLogResponse(BaseModel):
    """Schema for action log API responses"""
    id: int
    farm_id: int
    action_type: str
    trigger_reason: str
    ai_justification: dict
    blockchain_tx_hash: Optional[str] = None
    blockchain_status: str
    executed_at: datetime
    
    class Config:
        from_attributes = True
