"""
Agronomy Expert Agent - Intelligent Decision Making
Monitors soil salinity, wind conditions, and nutrient availability
"""

import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class AgronomyExpert:
    """
    Expert system for agronomic decision making
    - Salinity stress monitoring
    - Wind safety enforcement
    - Nutrient availability assessment
    """
    
    def __init__(self):
        from app.utils.agronomy import agronomy_engine
        from app.ml_models.advanced_models import advanced_ml
        
        self.engine = agronomy_engine
        self.ml = advanced_ml
        
        self.last_salinity_check = None
        self.last_wind_check = None
        
        # In-memory history for time-series features (Phase 3)
        # Structure: list of dicts {timestamp, temp, humidity}
        self.history = []
        self.MAX_HISTORY_HOURS = 24
        
        # Feature 2: Irrigation Efficiency Tracking
        self.irrigation_cycles = []  # Last 10 cycles
        self.MAX_CYCLES = 10
        self.last_moisture = None
        self.pump_start_time = None
        
        logger.info("🌱 Agronomy Expert Agent initialized with Industrial AI")

    def record_irrigation_event(self, event_type: str, current_moisture: float):
        """
        Feature 2: Irrigation Efficiency Index
        Records pump events and calculates efficiency
        """
        from datetime import datetime
        
        if event_type == "PUMP_ON":
            self.pump_start_time = datetime.utcnow()
            self.last_moisture = current_moisture
        
        elif event_type == "PUMP_OFF" and self.pump_start_time and self.last_moisture:
            # Calculate efficiency
            runtime_minutes = (datetime.utcnow() - self.pump_start_time).total_seconds() / 60.0
            moisture_gain = current_moisture - self.last_moisture
            
            if runtime_minutes > 0:
                efficiency = moisture_gain / runtime_minutes
                
                self.irrigation_cycles.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "runtime_minutes": round(runtime_minutes, 1),
                    "moisture_gain": round(moisture_gain, 1),
                    "efficiency": round(efficiency, 3)
                })
                
                # Keep last 10 cycles
                if len(self.irrigation_cycles) > self.MAX_CYCLES:
                    self.irrigation_cycles = self.irrigation_cycles[-self.MAX_CYCLES:]
                
                # Calculate rolling average
                avg_efficiency = sum(c["efficiency"] for c in self.irrigation_cycles) / len(self.irrigation_cycles)
                
                logger.info(f"💧 Irrigation Efficiency: {efficiency:.3f} %/min (Avg: {avg_efficiency:.3f})")
            
            # Reset
            self.pump_start_time = None
            self.last_moisture = None

    def _update_history(self, temp: float, humidity: float):
        """Update sensor history and trim old data"""
        now = datetime.utcnow()
        self.history.append({
            "timestamp": now,
            "temp": temp,
            "humidity": humidity
        })
        
        # Trim entries older than MAX_HISTORY_HOURS
        # Simplified: Just keep last N points? 
        # Assuming 5 sec interval, 24h is HUGE. 
        # We need efficient storage. We'll simplify to Last 100 points for this Hackathon scale
        # Real impl would use TimeSeries DB.
        if len(self.history) > 720: # 1 hour at 5s interval
            self.history = self.history[-720:]

    def _get_derived_features(self):
        """Calculate Phase 3 Derived Features from history"""
        if not self.history:
            return 25.0, 0, 0.0 # Defaults
        
        temps = [x["temp"] for x in self.history]
        hums = [x["humidity"] for x in self.history]
        
        mean_temp_window = sum(temps) / len(temps)
        temp_range = max(temps) - min(temps)
        
        # Calculate LWD using engine logic
        # Engine expects list of humidity values (reversed order usually implied by iteration)
        lwd_hours = self.engine.calculate_leaf_wetness_duration(hums)
        
        return mean_temp_window, lwd_hours, temp_range

    def analyze_soil_health(
        self,
        ec_salinity: float,
        ph: float,
        moisture: float,
        crop_type: str = "wheat"
    ) -> Dict[str, any]:
        """
        Comprehensive soil health analysis
        """
        # Salinity stress assessment
        salinity_analysis = self.engine.assess_salinity_stress(ec_salinity, crop_type)
        
        # Nutrient availability estimation (Rules)
        nutrient_analysis = self.engine.estimate_nutrient_availability(ph, ec_salinity, moisture)
        
        # Combine analyses
        analysis = {
            "timestamp": datetime.utcnow().isoformat(),
            "salinity": salinity_analysis,
            "nutrients": nutrient_analysis,
            "recommendations": []
        }
        
        # Generate recommendations
        if salinity_analysis["action"] == "flush_cycle":
            analysis["recommendations"].append({
                "priority": "high",
                "action": "WATER_ON_LEACH",
                "reason": f"Salinity stress detected. EC: {ec_salinity} dS/m exceeds threshold. LR: {salinity_analysis['lr_percent']:.1f}%",
                "duration_seconds": 600
            })
        
        if nutrient_analysis["is_locked"] or nutrient_analysis.get("p_locked"):
            analysis["recommendations"].append({
                "priority": "medium",
                "action": "pH_ADJUSTMENT",
                "reason": nutrient_analysis["reason"],
                "target_ph": 6.5
            })
        
        self.last_salinity_check = datetime.utcnow()
        return analysis

    def check_atmospheric_safety(
        self,
        wind_speed: float,
        temperature: float,
        humidity: float
    ) -> Dict[str, any]:
        """
        Atmospheric conditions safety check
        """
        # Wind safety check
        wind_safety = self.engine.check_wind_safety(wind_speed)
        
        # Calculate ET₀
        et0 = self.engine.calculate_et0(temperature, humidity, wind_speed)
        
        analysis = {
            "timestamp": datetime.utcnow().isoformat(),
            "wind_safety": wind_safety,
            "evapotranspiration": {
                "et0_mm_day": round(et0, 2),
                "water_demand_level": "high" if et0 > 6 else "moderate" if et0 > 4 else "low"
            },
            "safe_for_operations": wind_safety["is_safe_for_spraying"]
        }
        self.last_wind_check = datetime.utcnow()
        return analysis

    def should_block_operation(
        self,
        operation: str,
        wind_speed: float
    ) -> tuple[bool, Optional[str]]:
        """
        Determine if an operation should be blocked due to wind
        """
        wind_safety = self.engine.check_wind_safety(wind_speed)
        
        if operation in wind_safety["blocked_operations"]:
            reason = (
                f"Operation '{operation}' blocked: Wind speed ({wind_speed:.1f} km/h) "
                f"exceeds safety threshold ({wind_safety['threshold']} km/h). "
                f"Risk level: {wind_safety['risk_level']}. "
                "Chemical drift prevention."
            )
            logger.warning(f"🚫 {reason}")
            return True, reason
        
        return False, None

    def should_trigger_leaching(
        self,
        ec_salinity: float,
        crop_type: str = "wheat"
    ) -> tuple[bool, Optional[Dict]]:
        """
        Determine if leaching cycle should be triggered
        """
        salinity_analysis = self.engine.assess_salinity_stress(ec_salinity, crop_type)
        
        if salinity_analysis["action"] == "flush_cycle":
            leaching_params = {
                "command": "WATER_ON_LEACH",
                "duration_seconds": 600,  # 10 minutes flush
                "reason": f"Salinity stress: EC {ec_salinity} dS/m, LR {salinity_analysis['lr_percent']:.1f}%",
                "ec_measured": ec_salinity,
                "ec_threshold": salinity_analysis["ec_threshold"],
                "leaching_requirement": salinity_analysis["leaching_requirement"]
            }
            
            logger.warning(
                f"🚨 Leaching cycle triggered! EC: {ec_salinity} dS/m, "
                f"LR: {salinity_analysis['lr_percent']:.1f}%"
            )
            
            return True, leaching_params
        
        return False, None

    def get_comprehensive_analysis(
        self,
        ec_salinity: Optional[float],
        wind_speed: Optional[float],
        ph: Optional[float],
        temperature: float,
        humidity: float,
        moisture: float,
        crop_type: str = "wheat"
    ) -> Dict[str, any]:
        """
        Get complete agronomic analysis with Industrial AI Inference
        """
        # Update History
        self._update_history(temperature, humidity)
        
        analysis = {
            "timestamp": datetime.utcnow().isoformat(),
            "crop_type": crop_type,
            "ai_decisions": []
        }
        
        # ---------------------------------------------------------
        # PHASE 1: PREDICTIVIE EVAPOTRANSPIRATION & WATER BUDGETIN
        # ---------------------------------------------------------
        et0 = self.engine.calculate_et0(temperature, humidity, wind_speed or 0)
        
        if self.ml.models_loaded:
            water_pred = self.ml.predict_water_demand(
                moisture, temperature, humidity, wind_speed or 0, et0
            )
            analysis["water_budget"] = water_pred
            
            if water_pred.get("event") == "PREEMPTIVE_IRRIGATION":
                analysis["ai_decisions"].append({
                    "type": "AI_DECISION",
                    "subsystem": "WATER",
                    "payload": {
                        "event": "PREEMPTIVE_IRRIGATION",
                        "reason": f"Predicted moisture loss {water_pred['predicted_loss_24h']:.1f}% exceeds critical threshold",
                        "time_to_critical_hours": water_pred['time_to_critical_hours']
                    }
                })

        # ---------------------------------------------------------
        # PHASE 2: VIRTUAL NUTRIENT LAB
        # ---------------------------------------------------------
        if ec_salinity is not None and ph is not None:
            # 1. Rule-based Soft Sensor (Lockout Rules)
            rule_analysis = self.engine.estimate_nutrient_availability(ph, ec_salinity, moisture)
            
            # 2. ML Prediction (Soft Sensing)
            ml_nutrients = {}
            if self.ml.models_loaded:
                ml_nutrients = self.ml.predict_nutrients(ph, ec_salinity, moisture)
            
            # 3. Decision Logic: Lockout Overrides ML
            final_nutrients = {
                "n": rule_analysis["nitrogen_available_ppm"],
                "p": rule_analysis["phosphorus_available_ppm"],
                "k": rule_analysis["potassium_available_ppm"]
            }
            
            # If Model is available AND NOT locked, use ML values weighted?
            # Prompt: "Lockout state visually overrides values"
            # We'll use ML values as "Predicted Potential" but clamp if Locked?
            # Actually, we'll store both.
            
            analysis["soil_health"] = {
                "rules": rule_analysis,
                "ml_prediction": ml_nutrients,
                "final_status": rule_analysis["nutrient_status"]
            }
            
            # Add Decision
            ph_correction = self.engine.get_ph_corrective_action(ph)
            
            analysis["ai_decisions"].append({
                "type": "AI_DECISION",
                "subsystem": "NUTRIENT",
                "payload": {
                    "status": rule_analysis["nutrient_status"],
                    "reason": rule_analysis["reason"],
                    "nutrients": final_nutrients,
                    "is_locked": rule_analysis["is_locked"],
                    "nutrient_logic": ph_correction
                }
            })
            
            # Salinity Check
            salinity_stress = self.engine.assess_salinity_stress(ec_salinity, crop_type)
            analysis["soil_health"]["salinity"] = salinity_stress

        # ---------------------------------------------------------
        # PHASE 3: DISEASE INFECTION WINDOW ENGINE
        # ---------------------------------------------------------
        mean_temp, lwd, temp_range = self._get_derived_features()
        
        disease_risk = {"risk_level": "UNKNOWN", "probability": 0}
        if self.ml.models_loaded:
            disease_risk = self.ml.predict_disease_risk(mean_temp, lwd, temp_range)
        
        # Safety Interlock
        is_blocked = False
        block_reason = ""
        if disease_risk["risk_level"] == "HIGH_RISK" and (wind_speed or 0) > 20:
            is_blocked = True
            block_reason = "High wind speed (%s km/h) unsafe for fungicide application during HIGH RISK disease window" % wind_speed
        
        analysis["disease"] = {
            "risk_level": disease_risk["risk_level"],
            "probability": disease_risk.get("probability", 0),
            "lwd_hours": lwd,
            "application_blocked": is_blocked,
            "block_reason": block_reason
        }
        
        analysis["ai_decisions"].append({
            "type": "AI_DECISION",
            "subsystem": "DISEASE",
            "payload": {
                "risk_level": disease_risk["risk_level"],
                "lwd_hours": lwd,
                "action": "SPRAY_BLOCKED" if is_blocked else "MONITOR",
                "reason": block_reason if is_blocked else "Conditions monitored"
            }
        })

        # ---------------------------------------------------------
        # ATMOSPHERIC
        # ---------------------------------------------------------
        if wind_speed is not None:
             analysis["atmospheric"] = self.check_atmospheric_safety(wind_speed, temperature, humidity)
             analysis["atmospheric"]["evapotranspiration"]["et0_mm_day"] = round(et0, 2)
        
        # ---------------------------------------------------------
        # TOP 5 HIGH-IMPACT FEATURES (HARD REAL-TIME SAFE)
        # ---------------------------------------------------------
        
        # Feature 1: Digital Twin Moisture Simulator
        if moisture is not None and et0 is not None:
            forecast_horizons = [6, 12, 24]  # hours
            forecasts = []
            for hours in forecast_horizons:
                predicted_moisture = max(0, moisture - (et0 * hours / 24.0))
                forecasts.append({
                    "horizon_hours": hours,
                    "predicted_moisture": round(predicted_moisture, 1)
                })
            
            analysis["digital_twin_forecast"] = {
                "event": "DIGITAL_TWIN_FORECAST",
                "forecasts": forecasts,
                "note": "Simulation ≠ measurement. Physics-based projection only."
            }
        
        # Feature 3: Soil Stress Index (SSI)
        if moisture is not None and ec_salinity is not None and ph is not None:
            # Moisture deviation from optimal (50%)
            moisture_stress = abs(moisture - 50) / 50.0 * 0.4
            
            # Salinity stress (EC > 2.5 is high stress)
            salinity_stress = min(ec_salinity / 5.0, 1.0) * 0.3
            
            # pH deviation from optimal (6.5)
            ph_stress = abs(ph - 6.5) / 2.5 * 0.2
            
            # Temperature stress (optimal 20-25°C)
            temp_stress = 0
            if temperature < 15 or temperature > 30:
                temp_stress = min(abs(temperature - 22.5) / 22.5, 1.0) * 0.1
            
            ssi = (moisture_stress + salinity_stress + ph_stress + temp_stress) * 100
            ssi = min(100, max(0, ssi))
            
            analysis["soil_stress_index"] = {
                "ssi": round(ssi, 1),
                "level": "CRITICAL" if ssi > 70 else "HIGH" if ssi > 50 else "MODERATE" if ssi > 30 else "LOW",
                "components": {
                    "moisture_stress": round(moisture_stress * 100, 1),
                    "salinity_stress": round(salinity_stress * 100, 1),
                    "ph_stress": round(ph_stress * 100, 1),
                    "temp_stress": round(temp_stress * 100, 1)
                }
            }
        
        # Feature 4: Drift & Spray Safety Lock (HARD OVERRIDE)
        if wind_speed is not None and wind_speed > 20:
            analysis["safety_lock"] = {
                "status": "LOCKED",
                "reason": "Wind speed exceeds 20 km/h safety threshold",
                "blocked_operations": ["SPRAY_ON", "FERTILIZE_ON"],
                "override": "PHYSICS_OVERRIDE"
            }
        
        # ---------------------------------------------------------
        # INCREMENTAL LEARNING INTEGRATION
        # ---------------------------------------------------------
        # Add validated packet to learning buffer (non-blocking)
        if self.ml.models_loaded and self.ml.is_bootstrapped:
            try:
                sensor_packet = {
                    "soil_moisture": moisture,
                    "temperature": temperature,
                    "humidity": humidity,
                    "wind_speed": wind_speed or 0,
                    "ec_salinity": ec_salinity or 1.0,
                    "soil_ph": ph or 6.5
                }
                self.ml.add_to_learning_buffer(sensor_packet)
            except Exception as e:
                logger.error(f"Learning buffer error: {e}")

        return analysis

    def recommend_optimal_crop(
        self,
        n: float, p: float, k: float, ph: float,
        moisture: float,
        temp: float, humidity: float,
        rainfall_prediction: float = 100.0
    ) -> Dict[str, any]:
        """
        AI Crop Recommendation Bridge
        Combines Sensor Data + ML Model + Market Economics
        """
        from app.ml_models.crop_recommender import crop_recommender
        from app.ml_models.data_factory import DataFactory
        
        # 1. Prepare ML Inputs
        # Approximate Soil Texture from Moisture retention? Hard.
        # We'll use a default or simulated lookups.
        soil_code = 2 # Default Loam
        if moisture < 30: soil_code = 1 # Sandy-ish behavior
        if moisture > 70: soil_code = 3 # Clay-ish behavior
        
        features = {
            "N": n, "P": p, "K": k, "ph": ph,
            "temperature": temp, "humidity": humidity,
            "rainfall": rainfall_prediction, # From weather API
            "soil_type_code": soil_code,
            "altitude": 350, # Example fixed farm altitude
            "solar_rad": 21.0 # Sunny day assumption
        }
        
        # 2. Get Top 3 Recommendations
        recommendations = crop_recommender.predict(features)
        
        # 3. Market Overlay
        crop_names = [r["crop"] for r in recommendations]
        prices = DataFactory.get_market_opportunities(crop_names)
        
        # Determine "Best Economic Pick"
        # Score = Probability * Price
        best_economic = None
        max_score = -1
        
        for rec in recommendations:
            crop = rec["crop"]
            price = prices.get(crop, 0)
            score = (rec["probability"] / 100.0) * price
            rec["market_price"] = price
            
            if score > max_score:
                max_score = score
                best_economic = crop
        
        # 4. Generate Strategy
        primary_rec = recommendations[0]
        secondary_rec = recommendations[1] if len(recommendations) > 1 else None
        
        is_economic_switch = False
        selected_crop = primary_rec["crop"]
        
        # Smart Rationale Engine
        rationale = ""
        
        if ph < 5.8:
            ph_desc = "acidic"
        elif ph > 7.5:
            ph_desc = "alkaline"
        else:
            ph_desc = "neutral"
            
        base_reason = f"Your soil profile (pH {ph} / {ph_desc}) and current NPK levels heavily favor {primary_rec['crop']} ({primary_rec['probability']} match)."
        
        if best_economic != primary_rec["crop"]:
            is_economic_switch = True
            selected_crop = best_economic
            rationale = (f"Market Opportunity Detected: While {primary_rec['crop']} is agronomically ideal ({primary_rec['probability']}%), "
                         f"our AI recommends {best_economic} due to significantly higher projected ROI "
                         f"(Market Price: ₹{prices[best_economic]}/kg vs ₹{prices[primary_rec['crop']]}/kg). "
                         f"Soil conditions are still compatible.")
        else:
            rationale = (f"Recommended: {selected_crop}. {base_reason} "
                         f"Market conditions are also favorable (₹{prices[selected_crop]}/kg). "
                         f"This offers the best balance of agronomic success and profitability.")

        # 5. Financial Forecast (New Phase 7)
        # Crop-specific water needs map (Moved up for reuse)
        water_needs_map = {
            "Rice": "High - 1200-1400mm (Flooding required)",
            "Wheat": "Moderate - 450-650mm",
            "Cotton": "Moderate - 700-1300mm",
            "Maize": "Moderate - 500-800mm",
            "Sugarcane": "Very High - 1500-2500mm",
            "Tomato": "Moderate - 400-600mm",
            "Potato": "Low - 500-700mm",
            "Onion": "Low - 350-550mm",
            "Coffee": "High - 1500-2000mm",
            "Apple": "High - 800-1200mm"
        }

        # 5. Generate Detailed Strategy for ALL Top Candidates
        # This allows the frontend to toggle and compare data for all 3 options
        for rec in recommendations:
            c_name = rec["crop"]
            
            # Financials
            rec["financials"] = self.engine.calculate_financial_forecast(
                crop=c_name,
                area_acres=5.0, # Default for hackathon
                n=n, p=p, k=k, ph=ph,
                crop_price=prices.get(c_name, 0)
            )
            
            # Sowing Protocol
            rec["sowing_protocol"] = self.engine.get_sowing_protocol(c_name)
            
            # Season Roadmap
            water_info = water_needs_map.get(c_name, "Moderate - 500mm total water budget")
            rec["season_roadmap"] = {
                "Phase 1": "Soil Prep & Basal Fertilizer (DAP + Potash)",
                "Phase 2": "Vegetative Growth (Urea split dose)",
                "Phase 3": "Flowering/Fruiting (0-52-34 Foliar)",
                "Irrigation": water_info
            }

        # Legacy Support: Still return top-level keys for the "Selected" crop
        # but now the 'top_candidates' array is fully enriched.
        primary_details = next((r for r in recommendations if r["crop"] == selected_crop), recommendations[0])

        return {
            "selected_crop": selected_crop,
            "confidence": primary_rec["probability"],
            "rationale": rationale,
            "top_candidates": recommendations,
            "market_winner": best_economic,
            "economic_switch": is_economic_switch,
            "financials": primary_details["financials"],
            "sowing_protocol": primary_details["sowing_protocol"],
            "season_roadmap": primary_details["season_roadmap"]
        }

# Global instance
agronomy_expert = AgronomyExpert()
