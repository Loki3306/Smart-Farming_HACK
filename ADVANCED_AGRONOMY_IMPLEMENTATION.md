# 🧠 Advanced Agronomic Intelligence Layer - Implementation Plan

## Executive Summary

This document outlines the complete implementation of the "Precision Agriculture 4.0" features for the Smart-Farming_HACK platform, including:
- ✅ **Phase 1**: MQTT Bridge Stabilization (COMPLETED)
- 🚧 **Phase 2**: Advanced Soil Monitoring (Salinity + Virtual Nutrient Lab)
- 🚧 **Phase 3**: Atmospheric Intelligence (ET + Wind Safety)
- 🚧 **Phase 4**: High-End UI Dashboard

---

## ✅ Phase 1: Bridge Stabilization - COMPLETED

### Changes Made

#### 1. **MQTT Client ID Uniqueness** (`mqtt_client.py`)
```python
# Before: Static client ID causing Error Code 7
client_id = "smart-farming-backend"

# After: UUID-based unique ID
self.client_id = f"smart-farming-backend-{uuid.uuid4().hex[:8]}"
```

#### 2. **Clean Session Flag**
```python
self.client = mqtt.Client(
    client_id=self.client_id,
    clean_session=True,  # Prevents session conflicts
    protocol=mqtt.MQTTv311
)
```

#### 3. **Lifespan None-Safety** (`main.py`)
```python
# Added None checks to prevent TypeError
if initialize_mqtt_func:
    await initialize_mqtt_func()
```

#### 4. **Farm ID Mapping** (`router.py`)
```python
FARM_ID_MAPPING = {
    "farm_001": "80ac1084-67f8-4d05-ba21-68e3201213a8"
}
```

**Status**: ✅ MQTT Error Code 7 should be resolved

---

## 🚧 Phase 2: Advanced Soil Monitoring

### 2.1 Enhanced Sensor Data Model

**File**: `backend/iot_irrigation/models.py`

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SensorData(BaseModel):
    """Enhanced sensor data model with salinity and wind"""
    farm_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Existing sensors
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture (%)")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Humidity (%)")
    nitrogen: int = Field(..., ge=0, le=200, description="Nitrogen (ppm)")
    phosphorus: int = Field(..., ge=0, le=200, description="Phosphorus (ppm)")
    potassium: int = Field(..., ge=0, le=200, description="Potassium (ppm)")
    
    # NEW: Advanced sensors
    ec_salinity: Optional[float] = Field(None, ge=0, le=20, description="Electrical Conductivity (dS/m)")
    wind_speed: Optional[float] = Field(None, ge=0, le=150, description="Wind speed (km/h)")
    ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH")
    
    # Metadata
    last_fertilized: Optional[datetime] = None
```

---

### 2.2 Salinity Stress Index (SSI) Agent

**File**: `backend/app/agents/soil_expert.py`

```python
"""
Soil Expert Agent - Advanced Soil Health Analysis
Implements Salinity Stress Index and Leaching Requirement calculations
"""

import logging
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class SalinityAnalysis(BaseModel):
    """Results from salinity analysis"""
    ec_measured: float  # dS/m
    ec_threshold: float  # Crop-specific threshold
    is_stressed: bool
    leaching_requirement: Optional[float] = None  # Percentage
    recommended_action: str


class SoilExpertAgent:
    """
    Advanced soil health analysis agent
    - Calculates Salinity Stress Index (SSI)
    - Determines Leaching Requirement (LR)
    - Triggers flush cycles when needed
    """
    
    # Crop-specific EC thresholds (dS/m)
    CROP_EC_THRESHOLDS = {
        "wheat": 6.0,
        "rice": 3.0,
        "tomato": 2.5,
        "cotton": 7.7,
        "barley": 8.0,
        "corn": 1.7,
        "default": 4.0
    }
    
    def __init__(self):
        logger.info("🌱 Soil Expert Agent initialized")
    
    def calculate_leaching_requirement(
        self,
        ec_irrigation_water: float,
        ec_soil_extract: float
    ) -> float:
        """
        Calculate Leaching Requirement (LR) using FAO formula
        
        LR = EC_w / (5 * EC_e - EC_w)
        
        Where:
        - EC_w = EC of irrigation water (dS/m)
        - EC_e = EC of soil saturation extract (dS/m)
        
        Returns: Leaching requirement as fraction (0-1)
        """
        try:
            denominator = (5 * ec_soil_extract) - ec_irrigation_water
            
            if denominator <= 0:
                logger.warning("Invalid EC values for LR calculation")
                return 0.0
            
            lr = ec_irrigation_water / denominator
            
            # Cap at 50% (practical maximum)
            return min(lr, 0.5)
            
        except Exception as e:
            logger.error(f"Error calculating LR: {e}")
            return 0.0
    
    def analyze_salinity(
        self,
        ec_measured: float,
        crop_type: str = "default",
        ec_irrigation_water: float = 0.5  # Typical value
    ) -> SalinityAnalysis:
        """
        Analyze soil salinity and determine if intervention is needed
        
        Args:
            ec_measured: Measured soil EC (dS/m)
            crop_type: Type of crop being grown
            ec_irrigation_water: EC of irrigation water (dS/m)
        
        Returns:
            SalinityAnalysis with recommendations
        """
        # Get crop-specific threshold
        ec_threshold = self.CROP_EC_THRESHOLDS.get(
            crop_type.lower(),
            self.CROP_EC_THRESHOLDS["default"]
        )
        
        # Check if soil is stressed
        is_stressed = ec_measured > ec_threshold
        
        # Calculate leaching requirement if stressed
        lr = None
        action = "No action needed - salinity within acceptable range"
        
        if is_stressed:
            lr = self.calculate_leaching_requirement(
                ec_irrigation_water,
                ec_measured
            )
            
            lr_percent = lr * 100
            
            if lr_percent > 20:
                action = f"CRITICAL: Apply flush irrigation cycle. Leaching requirement: {lr_percent:.1f}%"
            elif lr_percent > 10:
                action = f"WARNING: Increase irrigation volume by {lr_percent:.1f}% to leach salts"
            else:
                action = f"MONITOR: Slight salt accumulation detected. LR: {lr_percent:.1f}%"
        
        return SalinityAnalysis(
            ec_measured=ec_measured,
            ec_threshold=ec_threshold,
            is_stressed=is_stressed,
            leaching_requirement=lr,
            recommended_action=action
        )
    
    def should_trigger_flush_cycle(
        self,
        ec_measured: float,
        crop_type: str = "default"
    ) -> bool:
        """
        Determine if a flush cycle should be triggered
        
        Returns: True if flush cycle is needed
        """
        analysis = self.analyze_salinity(ec_measured, crop_type)
        
        # Trigger flush if LR > 20%
        if analysis.leaching_requirement and analysis.leaching_requirement > 0.20:
            logger.warning(
                f"🚨 Flush cycle triggered! EC: {ec_measured} dS/m, "
                f"LR: {analysis.leaching_requirement*100:.1f}%"
            )
            return True
        
        return False


# Global instance
soil_expert = SoilExpertAgent()
```

---

### 2.3 Virtual Nutrient Lab (Soft Sensor)

**File**: `backend/app/agents/nutrient_estimator.py`

```python
"""
Virtual Nutrient Lab - ML-based NPK Estimation
Uses pH, EC, Moisture, and time since fertilization to estimate nutrient availability
"""

import logging
import numpy as np
from typing import Dict, Tuple
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

logger = logging.getLogger(__name__)


class VirtualNutrientLab:
    """
    Soft sensor for estimating N, P, K availability
    Uses Random Forest Regression with soil parameters
    """
    
    def __init__(self, model_path: str = "trained_models/nutrient_estimator.pkl"):
        self.model_path = model_path
        self.model = None
        self.is_trained = False
        
        # Try to load pre-trained model
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                self.is_trained = True
                logger.info("✅ Loaded pre-trained nutrient estimation model")
            except Exception as e:
                logger.warning(f"Failed to load model: {e}")
                self._initialize_default_model()
        else:
            self._initialize_default_model()
    
    def _initialize_default_model(self):
        """Initialize a default Random Forest model"""
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        logger.info("🌱 Initialized default nutrient estimation model")
    
    def _extract_features(
        self,
        ph: float,
        ec: float,
        moisture: float,
        days_since_fertilization: int
    ) -> np.ndarray:
        """
        Extract features for ML model
        
        Features:
        1. pH
        2. EC (salinity)
        3. Moisture
        4. Days since last fertilization
        5. pH^2 (non-linear effect)
        6. EC * Moisture (interaction)
        """
        features = np.array([
            ph,
            ec,
            moisture,
            days_since_fertilization,
            ph ** 2,
            ec * moisture / 100.0
        ]).reshape(1, -6)
        
        return features
    
    def estimate_npk(
        self,
        ph: float,
        ec: float,
        moisture: float,
        last_fertilized: datetime = None
    ) -> Dict[str, float]:
        """
        Estimate N, P, K availability
        
        Args:
            ph: Soil pH (0-14)
            ec: Electrical conductivity (dS/m)
            moisture: Soil moisture (%)
            last_fertilized: Timestamp of last fertilization
        
        Returns:
            Dict with estimated N, P, K values (ppm)
        """
        # Calculate days since fertilization
        if last_fertilized:
            days_since = (datetime.utcnow() - last_fertilized).days
        else:
            days_since = 30  # Assume 30 days if unknown
        
        # Extract features
        features = self._extract_features(ph, ec, moisture, days_since)
        
        # If model is trained, use it
        if self.is_trained:
            try:
                predictions = self.model.predict(features)[0]
                n_est, p_est, k_est = predictions
            except Exception as e:
                logger.error(f"Prediction error: {e}")
                n_est, p_est, k_est = self._rule_based_estimation(
                    ph, ec, moisture, days_since
                )
        else:
            # Fall back to rule-based estimation
            n_est, p_est, k_est = self._rule_based_estimation(
                ph, ec, moisture, days_since
            )
        
        return {
            "nitrogen_available": max(0, n_est),
            "phosphorus_available": max(0, p_est),
            "potassium_available": max(0, k_est),
            "confidence": "high" if self.is_trained else "low"
        }
    
    def _rule_based_estimation(
        self,
        ph: float,
        ec: float,
        moisture: float,
        days_since: int
    ) -> Tuple[float, float, float]:
        """
        Rule-based NPK estimation (fallback)
        Based on agronomic principles
        """
        # Nitrogen estimation
        # - Decreases with time since fertilization
        # - Optimal at pH 6-7
        n_base = 100
        n_ph_factor = 1.0 - abs(ph - 6.5) * 0.1
        n_time_factor = max(0, 1.0 - (days_since / 60.0))
        n_est = n_base * n_ph_factor * n_time_factor
        
        # Phosphorus estimation
        # - Optimal at pH 6.5-7.5
        # - Decreases with high EC
        p_base = 80
        p_ph_factor = 1.0 - abs(ph - 7.0) * 0.15
        p_ec_factor = max(0.3, 1.0 - (ec / 10.0))
        p_time_factor = max(0, 1.0 - (days_since / 90.0))
        p_est = p_base * p_ph_factor * p_ec_factor * p_time_factor
        
        # Potassium estimation
        # - Less pH sensitive
        # - Affected by leaching (high moisture)
        k_base = 120
        k_moisture_factor = max(0.5, 1.0 - (moisture / 200.0))
        k_time_factor = max(0, 1.0 - (days_since / 75.0))
        k_est = k_base * k_moisture_factor * k_time_factor
        
        return n_est, p_est, k_est


# Global instance
nutrient_lab = VirtualNutrientLab()
```

---

## 🚧 Phase 3: Atmospheric Intelligence

### 3.1 FAO-56 Penman-Monteith ET₀ Engine

**File**: `backend/app/utils/agronomy.py`

```python
"""
Agronomic Calculations - FAO-56 Penman-Monteith ET₀
Reference Evapotranspiration calculation for precision irrigation
"""

import math
import logging
from typing import Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class EvapotranspirationEngine:
    """
    FAO-56 Penman-Monteith Reference Evapotranspiration (ET₀) Calculator
    
    Formula:
    ET₀ = [0.408Δ(Rn - G) + γ(900/(T+273))u₂(es - ea)] / [Δ + γ(1 + 0.34u₂)]
    
    Where:
    - ET₀ = reference evapotranspiration (mm/day)
    - Rn = net radiation (MJ/m²/day)
    - G = soil heat flux (MJ/m²/day) ≈ 0 for daily calculations
    - T = mean air temperature (°C)
    - u₂ = wind speed at 2m height (m/s)
    - es = saturation vapor pressure (kPa)
    - ea = actual vapor pressure (kPa)
    - Δ = slope of vapor pressure curve (kPa/°C)
    - γ = psychrometric constant (kPa/°C)
    """
    
    def __init__(self, elevation: float = 100.0, latitude: float = 19.0):
        """
        Args:
            elevation: Elevation above sea level (m)
            latitude: Latitude (degrees)
        """
        self.elevation = elevation
        self.latitude = latitude
        
        # Calculate psychrometric constant
        self.gamma = self._calculate_psychrometric_constant(elevation)
        
        logger.info(f"🌤️  ET Engine initialized (elevation: {elevation}m, lat: {latitude}°)")
    
    def _calculate_psychrometric_constant(self, elevation: float) -> float:
        """
        Calculate psychrometric constant (γ)
        γ = 0.665 × 10⁻³ × P
        where P = atmospheric pressure (kPa)
        """
        # Atmospheric pressure at elevation
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        gamma = 0.000665 * P
        return gamma
    
    def _saturation_vapor_pressure(self, temp: float) -> float:
        """
        Calculate saturation vapor pressure (es) at temperature T
        es = 0.6108 × exp[(17.27 × T) / (T + 237.3)]
        """
        return 0.6108 * math.exp((17.27 * temp) / (temp + 237.3))
    
    def _actual_vapor_pressure(self, temp: float, humidity: float) -> float:
        """
        Calculate actual vapor pressure (ea)
        ea = (humidity/100) × es
        """
        es = self._saturation_vapor_pressure(temp)
        return (humidity / 100.0) * es
    
    def _slope_vapor_pressure_curve(self, temp: float) -> float:
        """
        Calculate slope of saturation vapor pressure curve (Δ)
        Δ = [4098 × es] / (T + 237.3)²
        """
        es = self._saturation_vapor_pressure(temp)
        delta = (4098 * es) / ((temp + 237.3) ** 2)
        return delta
    
    def _estimate_net_radiation(
        self,
        temp: float,
        day_of_year: int,
        sunshine_hours: float = None
    ) -> float:
        """
        Estimate net radiation (Rn) - simplified method
        For full accuracy, use solar radiation sensors
        """
        # Simplified estimation based on temperature
        # Actual implementation would use solar radiation data
        # This is a rough approximation
        
        # Extraterrestrial radiation (Ra) - simplified
        ra = 15 + 10 * math.sin(2 * math.pi * day_of_year / 365)
        
        # Net shortwave radiation (Rns) - assuming albedo = 0.23
        rns = (1 - 0.23) * ra * 0.75  # Simplified
        
        # Net longwave radiation (Rnl) - Stefan-Boltzmann
        stefan_boltzmann = 4.903e-9
        temp_k = temp + 273.16
        rnl = stefan_boltzmann * (temp_k ** 4) * 0.34 * 0.5
        
        # Net radiation
        rn = rns - rnl
        
        return max(0, rn)
    
    def calculate_et0(
        self,
        temp: float,
        humidity: float,
        wind_speed_kmh: float,
        day_of_year: int = None
    ) -> Dict[str, float]:
        """
        Calculate reference evapotranspiration (ET₀)
        
        Args:
            temp: Air temperature (°C)
            humidity: Relative humidity (%)
            wind_speed_kmh: Wind speed (km/h)
            day_of_year: Day of year (1-365) for radiation estimation
        
        Returns:
            Dict with ET₀ and components
        """
        try:
            # Convert wind speed from km/h to m/s
            u2 = wind_speed_kmh / 3.6
            
            # Get day of year if not provided
            if day_of_year is None:
                day_of_year = datetime.utcnow().timetuple().tm_yday
            
            # Calculate components
            delta = self._slope_vapor_pressure_curve(temp)
            es = self._saturation_vapor_pressure(temp)
            ea = self._actual_vapor_pressure(temp, humidity)
            rn = self._estimate_net_radiation(temp, day_of_year)
            g = 0  # Soil heat flux ≈ 0 for daily calculations
            
            # FAO-56 Penman-Monteith equation
            numerator = (
                0.408 * delta * (rn - g) +
                self.gamma * (900 / (temp + 273)) * u2 * (es - ea)
            )
            
            denominator = delta + self.gamma * (1 + 0.34 * u2)
            
            et0 = numerator / denominator
            
            # Ensure non-negative
            et0 = max(0, et0)
            
            return {
                "et0_mm_day": round(et0, 2),
                "vapor_pressure_deficit_kpa": round(es - ea, 3),
                "net_radiation_mj_m2_day": round(rn, 2),
                "wind_speed_m_s": round(u2, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating ET₀: {e}")
            return {
                "et0_mm_day": 0.0,
                "vapor_pressure_deficit_kpa": 0.0,
                "net_radiation_mj_m2_day": 0.0,
                "wind_speed_m_s": 0.0
            }


# Global instance
et_engine = EvapotranspirationEngine()
```

---

### 3.2 Wind Safety Middleware

**File**: `backend/app/middleware/wind_safety.py`

```python
"""
Wind Safety Middleware - Chemical Drift Prevention
Blocks spray/fertilize operations when wind speed is too high
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class WindSafetyMiddleware(BaseHTTPMiddleware):
    """
    Safety middleware to prevent chemical application during high winds
    
    Blocks MQTT commands:
    - FERTILIZE_ON
    - SPRAY_ON
    - PESTICIDE_ON
    
    When wind speed > threshold (default 20 km/h)
    """
    
    WIND_SPEED_THRESHOLD = 20.0  # km/h
    BLOCKED_COMMANDS = ["FERTILIZE_ON", "SPRAY_ON", "PESTICIDE_ON"]
    
    def __init__(self, app, wind_speed_source: callable = None):
        super().__init__(app)
        self.wind_speed_source = wind_speed_source or self._get_default_wind_speed
        logger.info(f"🌬️  Wind Safety Middleware initialized (threshold: {self.WIND_SPEED_THRESHOLD} km/h)")
    
    def _get_default_wind_speed(self) -> float:
        """Default wind speed getter - returns 0 if no data"""
        # This would be replaced with actual sensor data
        from iot_irrigation.router import latest_sensor_data
        
        # Get latest wind speed from any farm
        for farm_id, data in latest_sensor_data.items():
            if hasattr(data, 'wind_speed') and data.wind_speed is not None:
                return data.wind_speed
        
        return 0.0
    
    async def dispatch(self, request: Request, call_next):
        """
        Intercept requests and check wind safety
        """
        # Only check POST requests to /iot/command
        if request.method == "POST" and "/iot/command" in str(request.url):
            try:
                # Get request body
                body = await request.body()
                import json
                data = json.loads(body)
                
                command = data.get("command", "")
                
                # Check if command is blocked
                if command in self.BLOCKED_COMMANDS:
                    current_wind_speed = self.wind_speed_source()
                    
                    if current_wind_speed > self.WIND_SPEED_THRESHOLD:
                        logger.warning(
                            f"🚫 BLOCKED: {command} command rejected due to high wind "
                            f"({current_wind_speed:.1f} km/h > {self.WIND_SPEED_THRESHOLD} km/h)"
                        )
                        
                        raise HTTPException(
                            status_code=403,
                            detail={
                                "error": "Wind speed too high for safe chemical application",
                                "current_wind_speed": current_wind_speed,
                                "threshold": self.WIND_SPEED_THRESHOLD,
                                "command_blocked": command,
                                "recommendation": "Wait for wind speed to decrease below threshold"
                            }
                        )
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error in wind safety check: {e}")
        
        # Continue with request
        response = await call_next(request)
        return response


def check_wind_safety(wind_speed: float, command: str) -> bool:
    """
    Standalone function to check if a command is safe given current wind speed
    
    Returns: True if safe, False if should be blocked
    """
    if command in WindSafetyMiddleware.BLOCKED_COMMANDS:
        return wind_speed <= WindSafetyMiddleware.WIND_SPEED_THRESHOLD
    return True
```

---

## 🚧 Phase 4: High-End UI Features

### 4.1 Advanced Analytics Dashboard Component

**File**: `client/components/dashboard/LiveAdvancedAnalytics.tsx`

```typescript
/**
 * Advanced Analytics Dashboard
 * - Soil Chemistry Radar Chart
 * - Atmospheric Safety Meter
 * - Predictive Water Loss (ET₀) Chart
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SoilChemistry {
  ph: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface AtmosphericData {
  windSpeed: number;
  et0: number;
  isSafeForSpraying: boolean;
}

interface ET0Forecast {
  hour: string;
  et0: number;
  temperature: number;
}

export const LiveAdvancedAnalytics: React.FC = () => {
  const [soilData, setSoilData] = useState<SoilChemistry | null>(null);
  const [atmosphericData, setAtmosphericData] = useState<AtmosphericData | null>(null);
  const [et0Forecast, setET0Forecast] = useState<ET0Forecast[]>([]);

  // Fetch data from backend
  useEffect(() => {
    const fetchAdvancedData = async () => {
      try {
        const response = await fetch('http://localhost:8000/iot/advanced-analytics');
        const data = await response.json();
        
        setSoilData(data.soil_chemistry);
        setAtmosphericData(data.atmospheric);
        setET0Forecast(data.et0_forecast);
      } catch (error) {
        console.error('Failed to fetch advanced analytics:', error);
      }
    };

    fetchAdvancedData();
    const interval = setInterval(fetchAdvancedData, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  // Prepare radar chart data
  const radarData = soilData ? [
    { subject: 'pH', value: (soilData.ph / 14) * 100, fullMark: 100 },
    { subject: 'EC', value: (soilData.ec / 10) * 100, fullMark: 100 },
    { subject: 'N', value: (soilData.nitrogen / 200) * 100, fullMark: 100 },
    { subject: 'P', value: (soilData.phosphorus / 200) * 100, fullMark: 100 },
    { subject: 'K', value: (soilData.potassium / 200) * 100, fullMark: 100 },
  ] : [];

  // Wind safety gauge color
  const getWindSafetyColor = (windSpeed: number): string => {
    if (windSpeed < 10) return '#10b981'; // Green
    if (windSpeed < 20) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Soil Chemistry Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          🧪 Soil Chemistry Profile
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Soil Parameters"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>

        {soilData && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>pH: {soilData.ph.toFixed(1)}</div>
            <div>EC: {soilData.ec.toFixed(2)} dS/m</div>
            <div>N: {soilData.nitrogen} ppm</div>
            <div>P: {soilData.phosphorus} ppm</div>
            <div>K: {soilData.potassium} ppm</div>
          </div>
        )}
      </motion.div>

      {/* Atmospheric Safety Meter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          🌬️ Atmospheric Safety Status
        </h3>

        {atmosphericData && (
          <div className="flex flex-col items-center">
            {/* Wind Speed Gauge */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                
                {/* Colored arc based on wind speed */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={getWindSafetyColor(atmosphericData.windSpeed)}
                  strokeWidth="20"
                  strokeDasharray={`${(atmosphericData.windSpeed / 50) * 502} 502`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
                
                {/* Center text */}
                <text
                  x="100"
                  y="90"
                  textAnchor="middle"
                  fontSize="32"
                  fontWeight="bold"
                  fill={getWindSafetyColor(atmosphericData.windSpeed)}
                >
                  {atmosphericData.windSpeed.toFixed(1)}
                </text>
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#6b7280"
                >
                  km/h
                </text>
              </svg>
            </div>

            {/* Safety Status */}
            <div className={`mt-4 px-4 py-2 rounded-full text-white font-semibold ${
              atmosphericData.isSafeForSpraying ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {atmosphericData.isSafeForSpraying ? '✅ Safe for Spraying' : '🚫 Too Windy - Do Not Spray'}
            </div>

            {/* ET₀ Display */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">Current ET₀</div>
              <div className="text-3xl font-bold text-blue-600">
                {atmosphericData.et0.toFixed(2)} mm/day
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ET₀ Forecast Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2"
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          💧 24-Hour Water Demand Forecast (ET₀)
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={et0Forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis label={{ value: 'ET₀ (mm/day)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="et0"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="ET₀"
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Temperature (°C)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
```

---

## 📋 Integration Checklist

### Backend Integration

- [ ] Update `SensorData` model with `ec_salinity`, `wind_speed`, `ph`
- [ ] Create `backend/app/agents/soil_expert.py`
- [ ] Create `backend/app/agents/nutrient_estimator.py`
- [ ] Create `backend/app/utils/agronomy.py`
- [ ] Create `backend/app/middleware/wind_safety.py`
- [ ] Add wind safety middleware to `main.py`
- [ ] Create `/iot/advanced-analytics` endpoint in `router.py`
- [ ] Update MQTT handler to process new sensor fields
- [ ] Add flush cycle command (`WATER_ON_FLUSH`) to MQTT commands

### Frontend Integration

- [ ] Create `client/components/dashboard/LiveAdvancedAnalytics.tsx`
- [ ] Install chart dependencies: `npm install recharts`
- [ ] Add component to `Home.tsx`
- [ ] Create TypeScript interfaces for new data types
- [ ] Add API client methods for advanced analytics

### Testing

- [ ] Update `test_iot_system.py` to include EC and wind speed
- [ ] Test salinity stress detection
- [ ] Test wind safety blocking
- [ ] Test ET₀ calculations
- [ ] Test UI components with mock data

---

## 🚀 Deployment Steps

1. **Install Python Dependencies**
   ```bash
   pip install scikit-learn joblib numpy
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install recharts
   ```

3. **Update ESP32 Code**
   - Add EC sensor reading
   - Add anemometer reading
   - Update MQTT payload structure

4. **Restart Services**
   ```bash
   # Backend
   uvicorn app.main:app --reload

   # Frontend
   npm run dev
   ```

---

## 📊 Expected Results

### Salinity Management
- Automatic detection of salt stress
- Calculated leaching requirements
- Triggered flush cycles when LR > 20%

### Wind Safety
- Real-time wind speed monitoring
- Automatic blocking of spray commands when unsafe
- Safety status displayed on dashboard

### ET₀ Forecasting
- 24-hour water demand prediction
- Optimized irrigation scheduling
- Reduced water waste

### Virtual Nutrient Lab
- ML-based NPK estimation
- Reduced need for soil testing
- Data-driven fertilization decisions

---

**Status**: Implementation plan complete. Ready for execution.  
**Estimated Time**: 4-6 hours for full implementation  
**Priority**: Phase 1 (MQTT stabilization) is complete. Phases 2-4 can be implemented incrementally.
