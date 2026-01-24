"""
Agronomic Calculations - FAO-56 Penman-Monteith ET₀ & Soil Salinity
Professional agricultural equations for precision farming
"""

import math
from typing import Dict, Tuple


class AgronomyEngine:
    """
    Core agronomic calculation engine
    - FAO-56 Reference Evapotranspiration (ET₀)
    - Leaching Requirement for salinity management
    - Nutrient availability estimation
    """
    
    def __init__(self, elevation: float = 100.0, latitude: float = 19.0):
        self.elevation = elevation
        self.latitude = latitude
        self.gamma = self._psychrometric_constant(elevation)
    
    def _psychrometric_constant(self, elevation: float) -> float:
        """γ = 0.665 × 10⁻³ × P"""
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        return 0.000665 * P
    
    def _saturation_vapor_pressure(self, temp: float) -> float:
        """es = 0.6108 × exp[(17.27 × T) / (T + 237.3)]"""
        return 0.6108 * math.exp((17.27 * temp) / (temp + 237.3))
    
    def _slope_vapor_pressure_curve(self, temp: float) -> float:
        """Δ = [4098 × es] / (T + 237.3)²"""
        es = self._saturation_vapor_pressure(temp)
        return (4098 * es) / ((temp + 237.3) ** 2)
    
    def calculate_et0(
        self,
        temp: float,
        humidity: float,
        wind_speed_kmh: float = 7.2  # Default to 2.0 m/s (7.2 km/h) if missing
    ) -> float:
        """
        FAO-56 Penman-Monteith Reference Evapotranspiration
        
        ET₀ = [0.408Δ(Rn - G) + γ(900/(T+273))u₂(es - ea)] / [Δ + γ(1 + 0.34u₂)]
        
        Returns: ET₀ in mm/day
        """
        u2 = wind_speed_kmh / 3.6  # Convert to m/s
        
        delta = self._slope_vapor_pressure_curve(temp)
        es = self._saturation_vapor_pressure(temp)
        ea = (humidity / 100.0) * es
        
        # Simplified net radiation (would use solar radiation sensor in production)
        rn = 15.0  # MJ/m²/day (simplified)
        g = 0  # Soil heat flux ≈ 0 for daily
        
        numerator = (
            0.408 * delta * (rn - g) +
            self.gamma * (900 / (temp + 273)) * u2 * (es - ea)
        )
        
        denominator = delta + self.gamma * (1 + 0.34 * u2)
        
        et0 = numerator / denominator
        return max(0, et0)
    
    def calculate_leaching_requirement(
        self,
        ec_irrigation_water: float,
        ec_soil: float
    ) -> float:
        """
        Leaching Requirement for salinity management
        
        LR = EC_w / (5 × EC_e - EC_w)
        
        Returns: Leaching requirement as fraction (0-1)
        """
        denominator = (5 * ec_soil) - ec_irrigation_water
        
        if denominator <= 0:
            return 0.5  # Maximum leaching needed
        
        lr = ec_irrigation_water / denominator
        return min(lr, 0.5)  # Cap at 50%
    
    def assess_salinity_stress(
        self,
        ec_soil: float,
        crop_type: str = "wheat"
    ) -> Dict[str, any]:
        """
        Assess soil salinity stress and recommend actions
        
        Crop EC thresholds (dS/m):
        - Wheat: 6.0
        - Rice: 3.0
        - Tomato: 2.5
        - Cotton: 7.7
        """
        thresholds = {
            "wheat": 6.0,
            "rice": 3.0,
            "tomato": 2.5,
            "cotton": 7.7,
            "default": 4.0
        }
        
        threshold = thresholds.get(crop_type.lower(), thresholds["default"])
        is_stressed = ec_soil > threshold
        
        # Calculate leaching requirement if stressed
        lr = 0.0
        action = "normal"
        
        if is_stressed:
            lr = self.calculate_leaching_requirement(0.5, ec_soil)  # Assume EC_w = 0.5
            
            if lr > 0.20:
                action = "flush_cycle"  # Trigger WATER_ON_LEACH
            elif lr > 0.10:
                action = "increase_irrigation"
            else:
                action = "monitor"
        
        return {
            "ec_measured": ec_soil,
            "ec_threshold": threshold,
            "is_stressed": is_stressed,
            "leaching_requirement": lr,
            "lr_percent": lr * 100,
            "action": action
        }
    
    def estimate_nutrient_availability(
        self,
        ph: float,
        ec: float,
        moisture: float
    ) -> Dict[str, any]:
        """
        Virtual Nutrient Lab - Soft sensor for NPK availability
        Implements strict agronomic lockout rules
        
        Condition	            Effect
        pH < 5.5	            P & K uptake restricted (LOCKED)
        pH > 7.5	            P & K chemically unavailable (LOCKED)
        High EC + Low Moisture	Root burn risk
        """
        status = "OPTIMAL"
        reason = "Optimal conditions"
        is_locked = False
        
        # 1. Check pH Lockouts
        if ph < 5.5:
            n_val = 20.0 # Restricted
            p_val = 10.0 # Locked
            k_val = 15.0 # Restricted
            status = "LOCKED"
            reason = "pH induced phosphorus fixation (Acidic)"
            is_locked = True
        elif ph > 7.5:
            n_val = 80.0
            p_val = 15.0 # Chemically unavailable
            k_val = 20.0 # Unavailable
            status = "LOCKED"
            reason = "pH induced phosphorus fixation (Alkaline)"
            is_locked = True
        else:
            # Normal calculation (6.0 - 7.5)
            # Nitrogen (optimal 6-7)
            n_ph_factor = 1.0 - abs(ph - 6.5) * 0.15
            n_val = 100 * max(0.2, n_ph_factor)
            
            # Phosphorus
            p_ph_factor = 1.0 - abs(ph - 7.0) * 0.20
            p_val = 80 * max(0.2, p_ph_factor)
            
            # Potassium
            k_val = 120.0
        
        # 2. Check Root Burn Risk (High EC + Low Moisture)
        # Thresholds: EC > 2.5 dS/m AND Moisture < 40%
        if ec > 2.5 and moisture < 40.0:
            status = "CRITICAL"
            reason = "Root burn risk (High Salinity + Dry Soil)"
            # Reduce uptake efficiency due to osmotic stress
            n_val *= 0.5
            p_val *= 0.5
            k_val *= 0.5
            
        return {
            "nitrogen_available_ppm": round(n_val, 1),
            "phosphorus_available_ppm": round(p_val, 1),
            "potassium_available_ppm": round(k_val, 1),
            "nutrient_status": status,
            "reason": reason,
            "is_locked": is_locked
        }

    def calculate_leaf_wetness_duration(self, humidity_history: list) -> int:
        """
        Derive Leaf Wetness Duration (LWD)
        Rule: humidity > 90% continuously for >= 6 hours
        
        Args:
            humidity_history: List of humidity values (1 per hour)
        Returns:
            Hours of continuous wetness
        """
        wet_hours = 0
        for h in reversed(humidity_history):
            if h > 90.0:
                wet_hours += 1
            else:
                break
        return wet_hours
    
    def check_wind_safety(self, wind_speed_kmh: float) -> Dict[str, any]:
        """
        Wind safety check for chemical application
        
        Returns: Safety status and recommendations
        """
        threshold = 20.0  # km/h
        is_safe = wind_speed_kmh <= threshold
        
        if wind_speed_kmh > 30:
            risk_level = "extreme"
        elif wind_speed_kmh > 20:
            risk_level = "high"
        elif wind_speed_kmh > 15:
            risk_level = "moderate"
        else:
            risk_level = "low"
        
        return {
            "wind_speed": wind_speed_kmh,
            "threshold": threshold,
            "is_safe_for_spraying": is_safe,
            "risk_level": risk_level,
            "blocked_operations": ["SPRAY_ON", "FERTILIZE_ON"] if not is_safe else []
        }


# Global instance
agronomy_engine = AgronomyEngine()
