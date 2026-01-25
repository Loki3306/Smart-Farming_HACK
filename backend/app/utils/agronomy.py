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

    def get_ph_corrective_action(self, ph_level: float) -> Dict[str, any]:
        """
        Determine corrective action for pH-induced nutrient lockout
        """
        if ph_level > 7.5:
            return {
                "ph_status": "Alkaline",
                "lockout_risk": ["Iron", "Zinc", "Phosphate"],
                "recommended_fix": "Ammonium Sulfate / Sulfur + Chelated Iron Foliar",
                "action_priority": "Medium"
            }
        elif ph_level < 5.8:
            return {
                "ph_status": "Acidic",
                "lockout_risk": ["Phosphate", "Magnesium", "Molybdenum"],
                "recommended_fix": "Agricultural Lime (CaCO3) or Dolomite",
                "action_priority": "High"
            }
        else:
            return {
                "ph_status": "Optimal",
                "lockout_risk": [],
                "recommended_fix": "Maintain current regime (Neutral fertilizers like CAN)",
                "action_priority": "Low"
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


    def get_crop_coefficients(self, crop_type: str) -> Dict[str, float]:
        """
        Get FAO-56 Crop Coefficients (Kc)
        """
        # (Kc_ini, Kc_mid, Kc_end)
        coeffs = {
            "wheat": (0.3, 1.15, 0.4),
            "tomato": (0.6, 1.15, 0.8),
            "corn": (0.3, 1.2, 0.35),
            "rice": (1.05, 1.20, 0.90), # Flooded
            "cotton": (0.35, 1.15, 0.6),
            "potato": (0.5, 1.15, 0.75),
            "default": (0.4, 1.0, 0.5)
        }
        return coeffs.get(crop_type.lower(), coeffs["default"])

    def get_growth_stages(self, crop_type: str) -> list[int]:
        """
        Get growth stage lengths in days (Initial, Dev, Mid, Late)
        Total days should sum to season length.
        """
        # [Initial, Development, Mid-Season, Late-Season]
        stages = {
            "wheat": [20, 30, 40, 30],      # 120 days
            "corn": [20, 35, 40, 30],       # 125 days
            "tomato": [30, 40, 40, 25],     # 135 days
            "rice": [20, 30, 50, 20],       # 120 days
            "cotton": [30, 50, 60, 40],     # 180 days
            "potato": [25, 30, 45, 30],     # 130 days
            "default": [20, 30, 40, 30]
        }
        return stages.get(crop_type.lower(), stages["default"])

    def generate_complete_season_plan(
        self,
        crop_type: str,
        seeding_date_str: str,
        soil_type: str,
        target_yield_tons_ha: float,
        farm_area_acres: float,
        current_ph: float = 6.5
    ) -> Dict[str, any]:
        """
        Generate a comprehensive agronomic master plan
        """
        from datetime import datetime, timedelta
        
        try:
            seeding_date = datetime.strptime(seeding_date_str, "%Y-%m-%d")
        except:
             seeding_date = datetime.now()

        # 1. Growth Phases timeline
        stage_days = self.get_growth_stages(crop_type)
        total_days = sum(stage_days)
        
        phases = []
        current_date = seeding_date
        stage_names = ["Initial", "Development", "Mid-Season", "Late-Season"]
        
        for i, days in enumerate(stage_days):
            end_date = current_date + timedelta(days=days)
            phases.append({
                "phase_name": stage_names[i],
                "start_date": current_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "days": days
            })
            current_date = end_date
            
        # 2. Water Master Plan (Kc Curve)
        # Generate weekly Kc values
        kc_curve = []
        weeks = math.ceil(total_days / 7)
        kc_vals = self.get_crop_coefficients(crop_type)
        
        soil_freq_mult = 1.0
        if soil_type.lower() == "sandy":
            soil_freq_mult = 0.7  # More frequent (less days interval) -> handled in rec text
            # Logic: Sandy soil holds less water, needs irrigation 30% more often naturally
        
        # interpolate Kc roughly for weekly points
        # usage: Kc * ET0 (assume avg 5mm/day) * 7 days
        avg_et0 = 5.0
        
        # 3. Nutrient Master Plan
        # Estimate NPK removal based on yield
        # General rule: N ~ 20-30kg/ton, P ~ 10kg/ton, K ~ 20kg/ton (varies widely)
        n_req = target_yield_tons_ha * 25.0
        p_req = target_yield_tons_ha * 12.0
        k_req = target_yield_tons_ha * 25.0
        
        # Adjust for farm area (1 Hectare = 2.47 Acres)
        # target_yield is per Hectare. user input area is Acres.
        # Total kg needed = (Requirements per Ha) * (Acres / 2.47)
        area_ha = farm_area_acres / 2.47
        total_n = n_req * area_ha
        total_p = p_req * area_ha
        total_k = k_req * area_ha
        
        # pH Correction
        fertilizer_notes = []
        if current_ph > 7.5:
             fertilizer_notes.append("High pH detected. Use Ammonium Sulfate instead of Urea for N source to acidify soil.")
        elif current_ph < 5.5:
             fertilizer_notes.append("Low pH detected. Avoid acidifying fertilizers. Apply Lime correction.")
        
        # Weekly Plan Generation
        weekly_plan = []
        current_phase_idx = 0
        days_accumulated = 0
        
        for w in range(1, weeks + 1):
            day_in_season = w * 7
            
            # Determine Phase
            phase_name = "Unknown"
            accum = 0
            for i, p_days in enumerate(stage_days):
                accum += p_days
                if day_in_season <= accum:
                    phase_name = stage_names[i]
                    break
                elif i == len(stage_days) - 1:
                    phase_name = stage_names[-1]

            # Water
            # Simple Kc interpolation
            kc = kc_vals[1] # Default mid
            if day_in_season < stage_days[0]:
                kc = kc_vals[0]
            elif day_in_season > (total_days - stage_days[3]):
                kc = kc_vals[2]
            
            weekly_water_mm = avg_et0 * kc * 7 * soil_freq_mult
            
            # Nutrition (Split application)
            # Veg (Dev phase) gets most N
            # Bloom/Fruting (Mid) gets P & K
            fert_dose = ""
            
            if phase_name == "Development":
                # Apply 40% of N here spread over weeks
                n_dose = (total_n * 0.4) / (stage_days[1]/7)
                fert_dose += f"N: {n_dose:.1f} kg"
            elif phase_name == "Mid-Season":
                 # Apply P & K here
                 p_dose = (total_p * 0.6) / (stage_days[2]/7)
                 k_dose = (total_k * 0.6) / (stage_days[2]/7)
                 fert_dose += f"P: {p_dose:.1f} kg, K: {k_dose:.1f} kg"
            elif phase_name == "Initial":
                 # Starter
                 n_dose = (total_n * 0.2) / (stage_days[0]/7)
                 p_dose = (total_p * 0.4) / (stage_days[0]/7)
                 fert_dose += f"Starter mix (N: {n_dose:.1f}, P: {p_dose:.1f})"
            
            # Scouting
            task = f"Monitor {phase_name} progress."
            if phase_name == "Development": 
                task = "Scout for leaf eaters/aphids. Check for deficiency signs."
            elif phase_name == "Mid-Season":
                task = "Check for fungal issues if humid. Monitor fruit set."
            
            weekly_plan.append({
                "week": w,
                "phase": phase_name,
                "water_mm": round(weekly_water_mm, 1),
                "fertilizer": fert_dose,
                "task": task
            })

        return {
            "crop": crop_type,
            "total_days": total_days,
            "phases": phases,
            "weekly_plan": weekly_plan,
            "total_nutrients_kg": {
                "N": round(total_n, 1),
                "P": round(total_p, 1),
                "K": round(total_k, 1)
            },
            "advisories": fertilizer_notes
        }

    def calculate_financial_forecast(
        self,
        crop: str,
        area_acres: float,
        n: float, p: float, k: float, ph: float,
        crop_price: float
    ) -> Dict[str, any]:
        """
        Economic Agro-Engine: Calculates detailed ROI based on soil health and inputs
        """
        # 1. Base Metrics per Acre (Adjusted to keep revenue/profit below 2 Lakhs)
        base_data = {
            "Rice": {"yield": 1800, "seed_cost": 2500, "fert_cost": 6000, "labor_cost": 12000, "base_price": 22},
            "Maize": {"yield": 2000, "seed_cost": 2800, "fert_cost": 5500, "labor_cost": 11000, "base_price": 18},
            "Cotton": {"yield": 700, "seed_cost": 3200, "fert_cost": 7000, "labor_cost": 13000, "base_price": 65},
            "Sugarcane": {"yield": 25000, "seed_cost": 6000, "fert_cost": 9000, "labor_cost": 15000, "base_price": 3},
            "Coffee": {"yield": 450, "seed_cost": 4500, "fert_cost": 8000, "labor_cost": 14000, "base_price": 300},
            "Wheat": {"yield": 1600, "seed_cost": 2600, "fert_cost": 6000, "labor_cost": 11500, "base_price": 20},
             # Default
            "default": {"yield": 1500, "seed_cost": 2800, "fert_cost": 6500, "labor_cost": 12000, "base_price": 24}
        }
        
        c = base_data.get(crop, base_data["default"])
        
        # 2. Soil Health Index (0.8 to 1.1 Multiplier for realistic variance)
        # NPK targets (generic)
        target_n, target_p, target_k, target_ph = 100, 50, 50, 6.5
        
        n_score = max(0, 1 - abs(target_n - n) / 100)
        p_score = max(0, 1 - abs(target_p - p) / 100)
        k_score = max(0, 1 - abs(target_k - k) / 100)
        ph_score = max(0, 1 - abs(target_ph - ph) / 3)
        
        soil_health_index = (n_score * 0.3) + (p_score * 0.2) + (k_score * 0.2) + (ph_score * 0.3)
        # Scale to 0.8 - 1.1 range (smaller variance for realistic numbers)
        yield_multiplier = 0.8 + (soil_health_index * 0.3)
        
        # 3. Yield Calculation
        expected_yield_per_acre = c["yield"] * yield_multiplier
        total_yield = expected_yield_per_acre * area_acres
        
        # 4. Cost Calculation
        production_cost = (c["seed_cost"] + c["fert_cost"] + c["labor_cost"]) * area_acres
        
        # 5. Profit Calculation
        # Use live market price passed in, or base if 0
        price_to_use = crop_price if crop_price > 0 else c["base_price"]
        
        gross_revenue = total_yield * price_to_use
        net_profit = gross_revenue - production_cost
        
        # Calculate base ROI
        base_roi = (net_profit / production_cost) * 100 if production_cost > 0 else 0
        
        # Scale ROI to 100-150% range based on soil health (0-100 score)
        # soil_health_index ranges from 0 to 1, so multiply by 100 for percentage
        soil_health_percentage = soil_health_index * 100
        
        # Map soil health (0-100) to ROI (100-150)
        # Formula: ROI = 100 + (soil_health_percentage / 100) * 50
        # This gives: 0% health = 100% ROI, 100% health = 150% ROI
        roi_percentage = 100 + (soil_health_percentage / 100) * 50
        
        return {
            "estimated_cost": round(production_cost, 2),
            "projected_revenue": round(gross_revenue, 2),
            "net_profit": round(net_profit, 2),
            "roi_percentage": round(roi_percentage, 1),
            "yield_per_acre_kg": round(expected_yield_per_acre, 1),
            "soil_health_score": round(soil_health_index * 100, 1)
        }

    def get_sowing_protocol(self, crop: str) -> Dict[str, str]:
        """
        Sowing Intelligence: Technical protocol for planting
        """
        protocols = {
            "Rice": {"depth": "2-3 cm (Nursery)", "spacing": "20x10 cm", "rate": "25 kg/acre", "treatment": "Soak in Salt Water"},
            "Maize": {"depth": "3-5 cm", "spacing": "60x20 cm", "rate": "8 kg/acre", "treatment": "Imidacloprid coating"},
            "Cotton": {"depth": "4-5 cm", "spacing": "90x60 cm", "rate": "2.5 kg/acre (Bt)", "treatment": "Acid delinting"},
            "Wheat": {"depth": "4-5 cm", "spacing": "22.5 cm rows", "rate": "40 kg/acre", "treatment": "Carbendazim"},
            "Coffee": {"depth": "1-2 cm (Nursery)", "spacing": "2.5x2.5 m", "rate": "3000 plants/acre", "treatment": "Direct berry output"},
            "Chickpea": {"depth": "8-10 cm", "spacing": "30x10 cm", "rate": "25 kg/acre", "treatment": "Rhizobium culture"},
            # Default
            "default": {"depth": "3-4 cm", "spacing": "30x15 cm", "rate": "10 kg/acre", "treatment": "Fungicide powder"}
        }
        return protocols.get(crop, protocols["default"])

# Global instance
agronomy_engine = AgronomyEngine()
