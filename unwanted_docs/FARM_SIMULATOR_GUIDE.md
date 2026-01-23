# 🌾 Farm Sensor Simulator - Quick Reference

## Overview
**File:** `farm_sensor_simulator.py`

Python script that simulates realistic farm sensor data by connecting to your Supabase database, fetching real weather, and generating sensor readings that reflect actual farm conditions.

## Features
✅ Connects to Supabase database  
✅ Reads farm profile (location, crop, soil type)  
✅ Fetches real weather from OpenWeatherMap  
✅ Generates realistic sensor values  
✅ Writes to `sensor_readings` table  
✅ Responds to dashboard commands (water pump, fertilizer)  
✅ Autonomous AI decision simulation

---

## Prerequisites

### 1. Install Dependencies
```bash
pip install -r requirements_farm_sensor.txt
```

**Dependencies:**
- `requests>=2.28.0`
- `python-dotenv>=1.0.0`

### 2. Environment Variables (in `.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENWEATHER_API_KEY=your_weather_api_key
UPDATE_INTERVAL=5  # seconds between readings
API_BASE_URL=http://localhost:5000/api
```

---

## Basic Commands

### Standard Run
```bash
python farm_sensor_simulator.py
```
Runs continuously, generates sensor readings every 5 seconds (default).

### Demo Mode (Accelerated)
```bash
python farm_sensor_simulator.py --demo
```
**Speed:** 2500x multiplier (~1% moisture drop every 2 seconds)  
**Use:** Hackathon presentations, quick demos

### Judge/Demo-Safe Mode
```bash
python farm_sensor_simulator.py --judge
# or
python farm_sensor_simulator.py --demo-safe
```
**Features:**
- Starts fresh (no state resume)
- Skips offline catch-up
- Ignores old queued commands
- Clamps values to realistic crop bounds

**Use:** Clean demos without confusing historical data

### Reset State
```bash
python farm_sensor_simulator.py --reset-state
# or
python farm_sensor_simulator.py --fresh
```
Starts from default values, ignoring saved state.

### No State Persistence
```bash
python farm_sensor_simulator.py --no-state
```
Disables local state file entirely.

### No Offline Catch-Up
```bash
python farm_sensor_simulator.py --no-catch-up
```
Skips retroactive simulation when restarting.

### Ignore Old Commands
```bash
python farm_sensor_simulator.py --ignore-old-commands
```
Only processes new commands from this run forward.

### Run Once (Single Iteration)
```bash
python farm_sensor_simulator.py --once
```
Generates one sensor reading and exits.

### Run N Iterations
```bash
python farm_sensor_simulator.py --iterations=10
```
Runs for 10 iterations then exits.

---

## Common Combinations

### Clean Demo for Judges
```bash
python farm_sensor_simulator.py --judge
```
Equivalent to: `--reset-state --no-catch-up --ignore-old-commands`

### Fast Paced Demo
```bash
python farm_sensor_simulator.py --demo --judge
```
Accelerated depletion + clean start.

### Testing/CI
```bash
python farm_sensor_simulator.py --once
```
Quick validation that script runs.

---

## How It Works

### 1. Farm Selection
- Reads all farms from `farms` table in Supabase
- Filters by farmer (from auth or demo farmers)
- Loads farm details: location, crop type, soil type

### 2. Weather Integration
- Uses farm's GPS coordinates (latitude/longitude)
- Fetches real-time weather from OpenWeatherMap API
- Updates temperature, humidity based on actual conditions
- Checks rain forecast to adjust irrigation decisions

### 3. Sensor Value Generation
**Parameters tracked:**
- Soil Moisture (%)
- Temperature (°C)
- Humidity (%)
- Nitrogen (mg/kg)
- Phosphorus (mg/kg)
- Potassium (mg/kg)
- pH Level
- Electrical Conductivity (EC)

**Depletion Model:**
- Moisture depletes based on crop's evapotranspiration (ET)
- NPK depletes as crops absorb nutrients
- Weather affects ET rate (hot/dry = faster depletion)

### 4. Autonomous Decisions
**When moisture < optimal threshold:**
- AI triggers irrigation automatically
- Logs action to `action_logs` table
- Applies moisture boost to sensor values

**When NPK < optimal threshold:**
- AI triggers fertilization
- Logs action to database
- Applies NPK boost

### 5. Manual Commands
Dashboard sends commands via `sensor_commands.json`:
```json
{
  "commands": [
    {
      "id": 1,
      "command": "WATER_PUMP",
      "farmId": "uuid",
      "timestamp": "2025-12-31T12:00:00"
    }
  ]
}
```

Simulator reads, processes, and marks commands as completed.

### 6. State Persistence
Saves current values to `simulator_state.json`:
```json
{
  "farm_uuid": {
    "timestamp": "2025-12-31T12:00:00",
    "values": {
      "soil_moisture": 65.2,
      "nitrogen": 120,
      "phosphorus": 55,
      "potassium": 95,
      ...
    },
    "trends": {...}
  }
}
```

Automatically resumes from last state on restart.

---

## Crop Profiles

Built-in profiles for Indian crops:
- Rice
- Wheat
- Cotton
- Sugarcane
- Maize
- Soybean
- Groundnut
- Tomato
- Onion
- Potato

Each has optimal ranges for moisture, temperature, pH, and NPK.

---

## Soil Types

Supported soil types with different properties:
- Alluvial
- Black
- Red
- Laterite
- Sandy
- Clay
- Loamy

Each affects pH base, moisture retention, and NPK factor.

---

## Output Example

```
🌾 FARM-AWARE SENSOR SIMULATOR v2.1
=====================================

📋 Farms found: 4
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 1. Sharma's Organic Farm (Wheat)     ┃
┃ 2. Kumar Rice Fields (Rice)          ┃
┃ 3. Demo Farm A (Tomato)              ┃
┃ 4. Demo Farm B (Cotton)              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Select farm [1-4]: 1

🚜 Selected: Sharma's Organic Farm
📍 Location: Mendocino, CA
🌾 Crop: Wheat (Loamy soil)

🌤️  Current Weather:
   Temperature: 22.5°C | Humidity: 65%
   Conditions: clear sky

📊 Sensor Reading #1:
   💧 Moisture: 55.2% | 🌡️ Temp: 22.5°C
   🧪 N: 110 | P: 48 | K: 78 | pH: 6.8

✅ Values optimal - No action needed

[Ctrl+C to stop]
```

---

## Troubleshooting

### "No farms found"
→ Check Supabase credentials in `.env`  
→ Ensure farms exist in database

### "Weather API error"
→ Verify `OPENWEATHER_API_KEY` is valid  
→ Check internet connection

### Values stuck at extremes
→ Use `--reset-state` to start fresh  
→ Try `--judge` mode for clamped values

### Old commands replaying
→ Use `--ignore-old-commands` flag  
→ Or `--judge` mode

---

## Files Created

- `simulator_state.json` - Persisted sensor values
- `sensor_commands.json` - Dashboard command queue (if created by dashboard)

---

## Stop the Simulator

Press **Ctrl+C** to gracefully stop and save state.

---

**Quick Start:** `python farm_sensor_simulator.py --judge`  
**For Demos:** `python farm_sensor_simulator.py --demo --judge`
