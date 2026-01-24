#!/usr/bin/env python3
"""
🌱 Smart Farming Plant Sensor Simulator
========================================
This script simulates real-life IoT plant sensors that send data to the
Smart-Farming application. It generates realistic sensor readings that
vary based on time of day, environmental factors, and random fluctuations.

Sensors Simulated:
- Soil Moisture (%)
- Temperature (°C)
- Humidity (%)
- NPK Levels (Nitrogen, Phosphorus, Potassium in mg/kg)
- pH Level
- Electrical Conductivity (EC in mS/cm)

Usage:
    python plant_sensor_simulator.py

Author: Smart-Farming Sensor Module
"""

import requests
import time
import random
import math
import json
from datetime import datetime
from typing import Dict, Any, Optional
import os
import sys

# ============================================================================
# CONFIGURATION
# ============================================================================

# API Configuration - Update this to match your backend
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000")
API_ENDPOINT = f"{API_BASE_URL}/api/sensors"

# Default Farm ID (you can change this or set via environment variable)
DEFAULT_FARM_ID = os.environ.get("FARM_ID", "")

# Sensor update interval in seconds
UPDATE_INTERVAL = int(os.environ.get("UPDATE_INTERVAL", "5"))

# ============================================================================
# REALISTIC SENSOR VALUE RANGES
# ============================================================================

class SensorRanges:
    """Realistic value ranges for plant sensors"""
    
    # Soil Moisture (%) - Optimal range for most crops: 40-70%
    SOIL_MOISTURE_MIN = 25.0
    SOIL_MOISTURE_MAX = 85.0
    SOIL_MOISTURE_OPTIMAL = (40.0, 70.0)
    
    # Temperature (°C) - Varies by time of day
    TEMP_MIN = 15.0
    TEMP_MAX = 38.0
    TEMP_OPTIMAL = (20.0, 30.0)
    
    # Humidity (%) - Varies with temperature and time
    HUMIDITY_MIN = 35.0
    HUMIDITY_MAX = 90.0
    HUMIDITY_OPTIMAL = (50.0, 75.0)
    
    # NPK Levels (mg/kg) - Varies by soil health
    NITROGEN_MIN = 100.0
    NITROGEN_MAX = 200.0
    NITROGEN_OPTIMAL = (120.0, 180.0)
    
    PHOSPHORUS_MIN = 20.0
    PHOSPHORUS_MAX = 60.0
    PHOSPHORUS_OPTIMAL = (30.0, 50.0)
    
    POTASSIUM_MIN = 60.0
    POTASSIUM_MAX = 120.0
    POTASSIUM_OPTIMAL = (70.0, 100.0)
    
    # pH Level - Optimal for most crops: 6.0-7.5
    PH_MIN = 5.5
    PH_MAX = 8.0
    PH_OPTIMAL = (6.0, 7.5)
    
    # Electrical Conductivity (mS/cm) - Soil salinity indicator
    EC_MIN = 0.5
    EC_MAX = 2.5
    EC_OPTIMAL = (0.8, 1.8)

# ============================================================================
# SENSOR SIMULATOR CLASS
# ============================================================================

class PlantSensorSimulator:
    """
    Simulates realistic plant sensor data with:
    - Time-of-day variations
    - Gradual changes (not jumping values)
    - Random environmental fluctuations
    - Correlated values (e.g., higher temp → lower humidity)
    """
    
    def __init__(self):
        self.ranges = SensorRanges()
        
        # Initialize sensor values to optimal mid-range
        self.current_values = {
            "soil_moisture": 55.0,
            "temperature": 25.0,
            "humidity": 65.0,
            "nitrogen": 145.0,
            "phosphorus": 38.0,
            "potassium": 85.0,
            "ph": 6.8,
            "ec": 1.2,
            "battery_level": 100.0,
            "signal_strength": -50.0
        }
        
        # Track trends for realistic value progression
        self.trends = {key: random.uniform(-0.5, 0.5) for key in self.current_values}
        
        # Simulation state
        self.readings_count = 0
        self.start_time = datetime.now()
        
    def get_time_factor(self) -> float:
        """
        Returns a factor based on time of day (0.0 to 1.0)
        - 0.0 = midnight (coolest)
        - 0.5 = 6 AM / 6 PM
        - 1.0 = noon (hottest)
        """
        hour = datetime.now().hour
        # Create a sine wave that peaks at noon
        return (math.sin(math.pi * (hour - 6) / 12) + 1) / 2
    
    def update_trend(self, key: str, min_trend: float = -0.5, max_trend: float = 0.5) -> None:
        """Gradually update value trends to simulate environmental changes"""
        change = random.uniform(-0.2, 0.2)
        self.trends[key] = max(min_trend, min(max_trend, self.trends[key] + change))
    
    def bounded_update(self, current: float, change: float, min_val: float, max_val: float) -> float:
        """Update a value while keeping it within bounds"""
        new_value = current + change
        return max(min_val, min(max_val, new_value))
    
    def simulate_soil_moisture(self) -> float:
        """
        Simulate soil moisture:
        - Decreases over time (evaporation)
        - Can increase (simulating irrigation or rain)
        - Affected by temperature (higher temp = faster evaporation)
        """
        temp_factor = (self.current_values["temperature"] - 20) / 30  # Higher temp = more evaporation
        evaporation = random.uniform(0.1, 0.5) * (1 + temp_factor)
        
        # Occasional "watering" event (5% chance)
        if random.random() < 0.05:
            watering = random.uniform(5, 15)
            change = watering - evaporation
        else:
            change = -evaporation + self.trends["soil_moisture"]
        
        self.update_trend("soil_moisture")
        self.current_values["soil_moisture"] = self.bounded_update(
            self.current_values["soil_moisture"],
            change,
            self.ranges.SOIL_MOISTURE_MIN,
            self.ranges.SOIL_MOISTURE_MAX
        )
        return round(self.current_values["soil_moisture"], 1)
    
    def simulate_temperature(self) -> float:
        """
        Simulate temperature:
        - Follows time-of-day pattern (warmer midday, cooler night)
        - Random fluctuations for cloud cover, wind, etc.
        """
        time_factor = self.get_time_factor()
        
        # Target temperature based on time of day
        target_temp = self.ranges.TEMP_MIN + (self.ranges.TEMP_MAX - self.ranges.TEMP_MIN) * time_factor
        
        # Gradually move toward target with some randomness
        diff = target_temp - self.current_values["temperature"]
        change = diff * 0.1 + random.uniform(-0.5, 0.5) + self.trends["temperature"]
        
        self.update_trend("temperature", -0.3, 0.3)
        self.current_values["temperature"] = self.bounded_update(
            self.current_values["temperature"],
            change,
            self.ranges.TEMP_MIN,
            self.ranges.TEMP_MAX
        )
        return round(self.current_values["temperature"], 1)
    
    def simulate_humidity(self) -> float:
        """
        Simulate humidity:
        - Inversely related to temperature
        - Higher at night, lower during hot midday
        """
        temp = self.current_values["temperature"]
        
        # Inverse relationship with temperature
        temp_factor = (self.ranges.TEMP_MAX - temp) / (self.ranges.TEMP_MAX - self.ranges.TEMP_MIN)
        target_humidity = self.ranges.HUMIDITY_MIN + (self.ranges.HUMIDITY_MAX - self.ranges.HUMIDITY_MIN) * temp_factor
        
        diff = target_humidity - self.current_values["humidity"]
        change = diff * 0.05 + random.uniform(-1.0, 1.0) + self.trends["humidity"]
        
        self.update_trend("humidity", -0.5, 0.5)
        self.current_values["humidity"] = self.bounded_update(
            self.current_values["humidity"],
            change,
            self.ranges.HUMIDITY_MIN,
            self.ranges.HUMIDITY_MAX
        )
        return round(self.current_values["humidity"], 1)
    
    def simulate_npk(self) -> Dict[str, float]:
        """
        Simulate NPK levels:
        - Slowly decrease over time (plant uptake)
        - Occasional increases (fertilization events)
        """
        npk = {}
        
        for nutrient, (min_val, max_val) in [
            ("nitrogen", (self.ranges.NITROGEN_MIN, self.ranges.NITROGEN_MAX)),
            ("phosphorus", (self.ranges.PHOSPHORUS_MIN, self.ranges.PHOSPHORUS_MAX)),
            ("potassium", (self.ranges.POTASSIUM_MIN, self.ranges.POTASSIUM_MAX))
        ]:
            # Slow depletion with occasional fertilization
            depletion = random.uniform(0.1, 0.5)
            
            # 3% chance of fertilization event
            if random.random() < 0.03:
                fertilization = random.uniform(5, 20)
                change = fertilization - depletion
            else:
                change = -depletion + self.trends[nutrient]
            
            self.update_trend(nutrient, -0.2, 0.2)
            self.current_values[nutrient] = self.bounded_update(
                self.current_values[nutrient],
                change,
                min_val,
                max_val
            )
            npk[nutrient] = round(self.current_values[nutrient], 1)
        
        return npk
    
    def simulate_ph(self) -> float:
        """
        Simulate pH:
        - Relatively stable but with small fluctuations
        - Can be affected by irrigation water, fertilizers
        """
        change = random.uniform(-0.05, 0.05) + self.trends["ph"] * 0.1
        
        self.update_trend("ph", -0.1, 0.1)
        self.current_values["ph"] = self.bounded_update(
            self.current_values["ph"],
            change,
            self.ranges.PH_MIN,
            self.ranges.PH_MAX
        )
        return round(self.current_values["ph"], 2)
    
    def simulate_ec(self) -> float:
        """
        Simulate Electrical Conductivity:
        - Related to soil salinity and nutrient concentration
        - Increases with fertilization, decreases with irrigation
        """
        # EC correlates with nutrient levels
        avg_npk = (self.current_values["nitrogen"] + 
                   self.current_values["phosphorus"] + 
                   self.current_values["potassium"]) / 3
        
        target_ec = 0.5 + (avg_npk / 150) * 1.5  # Scale based on nutrients
        diff = target_ec - self.current_values["ec"]
        change = diff * 0.1 + random.uniform(-0.05, 0.05)
        
        self.current_values["ec"] = self.bounded_update(
            self.current_values["ec"],
            change,
            self.ranges.EC_MIN,
            self.ranges.EC_MAX
        )
        return round(self.current_values["ec"], 2)

    def simulate_battery(self) -> float:
        """
        Simulate Battery Level:
        - Slow drain over time
        - Occasional charging event (solar)
        """
        # 1% chance of charging (solar panel kick-in)
        if random.random() < 0.01:
            charge = random.uniform(2.0, 5.0)
            change = charge
        else:
            # Normal drain
            drain = random.uniform(0.01, 0.05)
            change = -drain
            
        self.current_values["battery_level"] = max(0.0, min(100.0, self.current_values["battery_level"] + change))
        return round(self.current_values["battery_level"], 1)

    def simulate_signal(self) -> float:
        """
        Simulate Signal Strength (dBm):
        - Fluctuate around a mean
        - Occasional drops
        """
        base_signal = -55.0
        fluctuation = random.uniform(-5.0, 5.0)
        
        # Occasional deep drop (interference)
        if random.random() < 0.05:
            fluctuation -= random.uniform(10.0, 20.0)
            
        self.current_values["signal_strength"] = base_signal + fluctuation
        return round(self.current_values["signal_strength"], 0)
    
    def generate_reading(self) -> Dict[str, Any]:
        """Generate a complete sensor reading"""
        self.readings_count += 1
        
        npk = self.simulate_npk()
        
        return {
            "soil_moisture": self.simulate_soil_moisture(),
            "temperature": self.simulate_temperature(),
            "humidity": self.simulate_humidity(),
            "nitrogen": npk["nitrogen"],
            "phosphorus": npk["phosphorus"],
            "potassium": npk["potassium"],
            "ph": self.simulate_ph(),
            "ec": self.simulate_ec(),
            "battery_level": self.simulate_battery(),
            "signal_strength": self.simulate_signal(),
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# CONSOLE DISPLAY
# ============================================================================

def clear_console():
    """Clear the console screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_status_indicator(value: float, optimal_range: tuple) -> str:
    """Return a status indicator based on whether value is in optimal range"""
    if optimal_range[0] <= value <= optimal_range[1]:
        return "✅"
    elif value < optimal_range[0]:
        return "🔻"  # Too low
    else:
        return "🔺"  # Too high

def display_dashboard(reading: Dict[str, Any], farm_id: str, api_status: str, readings_count: int):
    """Display a nice console dashboard with current sensor values"""
    
    clear_console()
    
    print("=" * 60)
    print("🌱 SMART FARMING - PLANT SENSOR SIMULATOR 🌱")
    print("=" * 60)
    print()
    
    print(f"📡 Connection Status: {api_status}")
    print(f"🏠 Farm ID: {farm_id if farm_id else 'Not configured'}")
    print(f"📊 Total Readings: {readings_count}")
    print(f"⏰ Timestamp: {reading['timestamp']}")
    print()
    print("-" * 60)
    print("📈 CURRENT SENSOR READINGS")
    print("-" * 60)
    print()
    
    ranges = SensorRanges()
    
    # Soil Moisture
    status = get_status_indicator(reading["soil_moisture"], ranges.SOIL_MOISTURE_OPTIMAL)
    bar = create_progress_bar(reading["soil_moisture"], 0, 100, 20)
    print(f"  💧 Soil Moisture:    {reading['soil_moisture']:>6.1f}%   {bar} {status}")
    
    # Temperature
    status = get_status_indicator(reading["temperature"], ranges.TEMP_OPTIMAL)
    bar = create_progress_bar(reading["temperature"], 10, 45, 20)
    print(f"  🌡️  Temperature:      {reading['temperature']:>6.1f}°C  {bar} {status}")
    
    # Humidity
    status = get_status_indicator(reading["humidity"], ranges.HUMIDITY_OPTIMAL)
    bar = create_progress_bar(reading["humidity"], 0, 100, 20)
    print(f"  💨 Humidity:         {reading['humidity']:>6.1f}%   {bar} {status}")
    
    print()
    print("-" * 60)
    print("🧪 SOIL NUTRIENTS (NPK)")
    print("-" * 60)
    print()
    
    # NPK Values
    status = get_status_indicator(reading["nitrogen"], ranges.NITROGEN_OPTIMAL)
    bar = create_progress_bar(reading["nitrogen"], 80, 220, 20)
    print(f"  🔵 Nitrogen (N):     {reading['nitrogen']:>6.1f} mg/kg  {bar} {status}")
    
    status = get_status_indicator(reading["phosphorus"], ranges.PHOSPHORUS_OPTIMAL)
    bar = create_progress_bar(reading["phosphorus"], 10, 70, 20)
    print(f"  🟡 Phosphorus (P):   {reading['phosphorus']:>6.1f} mg/kg  {bar} {status}")
    
    status = get_status_indicator(reading["potassium"], ranges.POTASSIUM_OPTIMAL)
    bar = create_progress_bar(reading["potassium"], 50, 130, 20)
    print(f"  🟠 Potassium (K):    {reading['potassium']:>6.1f} mg/kg  {bar} {status}")
    
    print()
    print("-" * 60)
    print("🔬 SOIL CHEMISTRY")
    print("-" * 60)
    print()
    
    # pH
    status = get_status_indicator(reading["ph"], ranges.PH_OPTIMAL)
    bar = create_progress_bar(reading["ph"], 4, 9, 20)
    print(f"  ⚗️  pH Level:         {reading['ph']:>6.2f}      {bar} {status}")
    
    # EC
    status = get_status_indicator(reading["ec"], ranges.EC_OPTIMAL)
    bar = create_progress_bar(reading["ec"], 0, 3, 20)
    print(f"  ⚡ EC (Conductivity): {reading['ec']:>6.2f} mS/cm {bar} {status}")
    
    print()
    print("=" * 60)
    print("Legend: ✅ Optimal | 🔻 Too Low | 🔺 Too High")
    print("Press Ctrl+C to stop the sensor simulation")
    print("=" * 60)

def create_progress_bar(value: float, min_val: float, max_val: float, width: int = 20) -> str:
    """Create a visual progress bar"""
    normalized = (value - min_val) / (max_val - min_val)
    normalized = max(0, min(1, normalized))
    filled = int(normalized * width)
    empty = width - filled
    return f"[{'█' * filled}{'░' * empty}]"

# ============================================================================
# API COMMUNICATION
# ============================================================================

def send_sensor_data(reading: Dict[str, Any], farm_id: str) -> tuple[bool, str]:
    """
    Send sensor data to the Smart-Farming API
    Returns: (success: bool, message: str)
    """
    if not farm_id:
        return False, "❌ No Farm ID configured"
    
    try:
        payload = {
            "farm_id": farm_id,
            **reading
        }
        
        response = requests.post(
            API_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            return True, "✅ Connected & Sending"
        else:
            return False, f"⚠️ HTTP {response.status_code}"
            
    except requests.exceptions.ConnectionError:
        return False, "❌ Cannot connect to API"
    except requests.exceptions.Timeout:
        return False, "⏱️ Request timeout"
    except Exception as e:
        return False, f"❌ Error: {str(e)}"

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def get_farm_id() -> str:
    """Get farm ID from environment or prompt user"""
    farm_id = DEFAULT_FARM_ID
    
    if not farm_id:
        print("=" * 60)
        print("🌱 SMART FARMING - PLANT SENSOR SIMULATOR 🌱")
        print("=" * 60)
        print()
        print("To connect your sensor to a specific farm,")
        print("enter your Farm ID below (UUID format).")
        print()
        print("You can find your Farm ID in the Smart-Farming app")
        print("or leave empty to run in standalone mode.")
        print()
        farm_id = input("Enter Farm ID (or press Enter to skip): ").strip()
        print()
        
    return farm_id

def main():
    """Main entry point for the sensor simulator"""
    
    # Get farm ID
    farm_id = get_farm_id()
    
    # Initialize sensor simulator
    simulator = PlantSensorSimulator()
    
    print("🚀 Starting sensor simulation...")
    print(f"📡 API Endpoint: {API_ENDPOINT}")
    print(f"⏱️  Update Interval: {UPDATE_INTERVAL} seconds")
    print()
    time.sleep(2)
    
    api_status = "🔄 Initializing..."
    
    try:
        while True:
            # Generate sensor reading
            reading = simulator.generate_reading()
            
            # Send to API if farm_id is configured
            if farm_id:
                success, api_status = send_sensor_data(reading, farm_id)
            else:
                api_status = "⚪ Standalone Mode (no API)"
            
            # Display dashboard
            display_dashboard(
                reading, 
                farm_id, 
                api_status, 
                simulator.readings_count
            )
            
            # Wait for next reading
            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n")
        print("=" * 60)
        print("🛑 Sensor simulation stopped")
        print(f"📊 Total readings generated: {simulator.readings_count}")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    main()
