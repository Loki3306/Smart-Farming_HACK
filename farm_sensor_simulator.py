#!/usr/bin/env python3
"""
🌾 FARM-AWARE SENSOR SIMULATOR
==============================
This enhanced script reads your actual farm data from Supabase,
fetches real weather for your farm's location, and generates
realistic sensor readings that make sense for YOUR specific farm.

Features:
- Connects to your Supabase database
- Reads your farm profile (location, crop type, soil type)
- Fetches REAL weather data from OpenWeatherMap
- Generates sensor values based on actual conditions
- Writes readings to sensor_readings table
- Reacts to Water Pump / Fertilizer commands from dashboard
- Your dashboard updates automatically!

Usage:
    python farm_sensor_simulator.py

Author: Smart-Farming Sensor Module v2.1
"""

import os
import sys
import time
import random
import math
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from dotenv import load_dotenv

# Local simulator state file (created next to this script)
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simulator_state.json")

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# CONFIGURATION (from .env file)
# ============================================================================

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")

# Use service role key for full access (bypasses RLS)
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY

# Update interval in seconds
UPDATE_INTERVAL = int(os.environ.get("UPDATE_INTERVAL", "5"))

# DEMO MODE - Accelerates depletion for hackathon presentations
# Use: python farm_sensor_simulator.py --demo
DEMO_MODE = "--demo" in sys.argv
DEMO_SPEED_MULTIPLIER = 30000  # Blazing fast! (~6% moisture drop every 2 seconds)

# JUDGE/DEMO-SAFE MODE
# Use: python farm_sensor_simulator.py --judge
# This mode avoids confusing demos by:
# - starting fresh (no resume)
# - skipping offline catch-up (retroactive boosts)
# - ignoring old queued commands
# - clamping values to realistic crop-optimal max bounds
JUDGE_MODE = ("--judge" in sys.argv) or ("--demo-safe" in sys.argv) or ("--judges" in sys.argv)

# State behavior flags
# - By default the simulator resumes from local persisted state in simulator_state.json.
# - Use --reset-state (or --fresh) to start from defaults for the selected farm.
# - Use --no-state to disable local persistence entirely.
RESET_STATE = ("--reset-state" in sys.argv) or ("--fresh" in sys.argv) or JUDGE_MODE
NO_STATE = "--no-state" in sys.argv

# Disable offline catch-up simulation (retroactive decisions). Useful for clean demos.
NO_CATCH_UP = ("--no-catch-up" in sys.argv) or JUDGE_MODE

# Ignore any existing queued commands in sensor_commands.json at startup.
# New commands issued during the demo will still be processed.
IGNORE_OLD_COMMANDS = ("--ignore-old-commands" in sys.argv) or JUDGE_MODE

# Run a finite number of iterations (useful for CI/debugging)
# Use:
#   python farm_sensor_simulator.py --once
#   python farm_sensor_simulator.py --iterations=5
RUN_ONCE = "--once" in sys.argv

def _parse_iterations(argv: List[str]) -> Optional[int]:
    for arg in argv:
        if isinstance(arg, str) and arg.startswith("--iterations="):
            value = arg.split("=", 1)[1].strip()
            if not value:
                return None
            try:
                parsed = int(value)
                return parsed if parsed > 0 else None
            except ValueError:
                return None
    return None

MAX_ITERATIONS = _parse_iterations(sys.argv)

# API Base URL for checking autonomous mode from dashboard
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")

# Command file location - this is where the dashboard sends commands
COMMAND_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sensor_commands.json")

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class FarmInfo:
    """Farm information from database"""
    id: str
    farmer_id: str
    farm_name: str
    state: Optional[str]
    city: Optional[str]
    district: Optional[str]
    village: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    area_acres: Optional[float]
    soil_type: Optional[str]

@dataclass  
class FarmerInfo:
    """Farmer information from database"""
    id: str
    name: str
    phone: str

@dataclass
class WeatherData:
    """Real weather data from OpenWeatherMap"""
    temperature: float  # Celsius
    humidity: float     # Percentage
    pressure: float     # hPa
    wind_speed: float   # m/s
    description: str
    icon: str

@dataclass
class CropProfile:
    """Optimal conditions for different crops"""
    name: str
    moisture_optimal: tuple  # (min, max) %
    temp_optimal: tuple      # (min, max) °C
    ph_optimal: tuple        # (min, max)
    npk_optimal: tuple       # ((Nmin,Nmax),(Pmin,Pmax),(Kmin,Kmax)) in mg/kg

# ============================================================================
# CROP PROFILES - Optimal conditions for Indian crops
# ============================================================================

CROP_PROFILES = {
    # Note: N/P/K are modeled as soil test style values (mg/kg) and used for both
    # initialization and display bands.
    "rice": CropProfile("Rice", (70, 90), (25, 35), (5.5, 7.0), ((90, 140), (30, 55), (70, 110))),
    "wheat": CropProfile("Wheat", (40, 60), (15, 25), (6.0, 7.5), ((80, 130), (35, 60), (60, 95))),
    "cotton": CropProfile("Cotton", (50, 70), (25, 35), (6.0, 8.0), ((70, 120), (25, 45), (70, 115))),
    "sugarcane": CropProfile("Sugarcane", (60, 80), (25, 38), (6.0, 7.5), ((120, 180), (45, 80), (120, 180))),
    "maize": CropProfile("Maize", (50, 75), (20, 30), (5.5, 7.0), ((90, 150), (35, 70), (90, 140))),
    "soybean": CropProfile("Soybean", (50, 65), (20, 30), (6.0, 7.0), ((30, 70), (45, 85), (55, 95))),
    "groundnut": CropProfile("Groundnut", (40, 60), (25, 32), (6.0, 6.8), ((25, 60), (25, 50), (45, 80))),
    "tomato": CropProfile("Tomato", (60, 80), (20, 30), (6.0, 7.0), ((90, 150), (55, 95), (90, 150))),
    "onion": CropProfile("Onion", (60, 70), (15, 25), (6.0, 7.0), ((70, 120), (40, 75), (90, 150))),
    "potato": CropProfile("Potato", (60, 80), (15, 20), (5.0, 6.5), ((100, 160), (70, 120), (120, 190))),
    "default": CropProfile("General", (50, 70), (20, 30), (6.0, 7.0), ((70, 130), (35, 65), (70, 120))),
}

# Optional data-driven profiles generated from datasets/verified_agronomy_data.csv
CROP_PROFILE_DATA_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "shared",
    "crop_profiles.json",
)


def _canonical_key(value: str) -> str:
    value = (value or "").strip().lower()
    out = []
    prev_us = False
    for ch in value:
        if ch.isalnum():
            out.append(ch)
            prev_us = False
        else:
            if not prev_us:
                out.append("_")
                prev_us = True
    key = "".join(out).strip("_")
    while "__" in key:
        key = key.replace("__", "_")
    return key


_DATASET_CROP_INDEX: Optional[Dict[str, Any]] = None


def _load_dataset_crop_index() -> Dict[str, Any]:
    global _DATASET_CROP_INDEX
    if _DATASET_CROP_INDEX is not None:
        return _DATASET_CROP_INDEX
    if not os.path.exists(CROP_PROFILE_DATA_FILE):
        _DATASET_CROP_INDEX = {}
        return _DATASET_CROP_INDEX
    try:
        with open(CROP_PROFILE_DATA_FILE, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        crops = data.get("crops") if isinstance(data, dict) else None
        _DATASET_CROP_INDEX = crops if isinstance(crops, dict) else {}
    except Exception:
        _DATASET_CROP_INDEX = {}
    return _DATASET_CROP_INDEX


def _crop_profile_from_dataset(entry: Dict[str, Any], soil_type: Optional[str]) -> Optional[CropProfile]:
    if not isinstance(entry, dict):
        return None

    display = entry.get("displayName") or "General"
    soil_key = _canonical_key(soil_type or "")
    chosen = None

    soils = entry.get("soils")
    if soil_key and isinstance(soils, dict):
        chosen = soils.get(soil_key)

    if chosen is None:
        chosen = entry.get("overall")

    if not isinstance(chosen, dict):
        return None

    try:
        moisture = chosen.get("moistureOptimal") or [50, 70]
        temp = chosen.get("tempOptimal") or [20, 30]
        ph = chosen.get("phOptimal") or [6.0, 7.0]

        npk = chosen.get("npkOptimal") or {}
        n = (npk.get("nitrogen") or [70, 130])
        p = (npk.get("phosphorus") or [35, 65])
        k = (npk.get("potassium") or [70, 120])

        return CropProfile(
            str(display),
            (float(moisture[0]), float(moisture[1])),
            (float(temp[0]), float(temp[1])),
            (float(ph[0]), float(ph[1])),
            ((float(n[0]), float(n[1])), (float(p[0]), float(p[1])), (float(k[0]), float(k[1]))),
        )
    except Exception:
        return None


def get_crop_profile(crop_name: str, soil_type: Optional[str]) -> CropProfile:
    # 1) Exact hardcoded match
    key = (crop_name or "").strip().lower()
    if key in CROP_PROFILES:
        return CROP_PROFILES[key]

    # 2) Data-driven match (canonicalized)
    dataset = _load_dataset_crop_index()
    ckey = _canonical_key(crop_name or "")
    entry = dataset.get(ckey) if isinstance(dataset, dict) else None
    prof = _crop_profile_from_dataset(entry, soil_type)
    if prof is not None:
        return prof

    # 3) Fallback
    return CROP_PROFILES["default"]

# ============================================================================
# STATE MANAGEMENT (local persistence)
# ============================================================================


class StateManager:
    """Loads/saves simulator state so values persist across restarts."""

    def __init__(self, file_path: str):
        self.file_path = file_path

    def _read_all(self) -> Dict[str, Any]:
        if not os.path.exists(self.file_path):
            return {}
        try:
            # utf-8-sig tolerates BOM, which can appear on Windows after manual edits
            with open(self.file_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def load_farm_state(self, farm_id: str) -> Optional[Dict[str, Any]]:
        data = self._read_all()
        state = data.get(farm_id)
        return state if isinstance(state, dict) else None

    def save_farm_state(self, farm_id: str, state: Dict[str, Any]) -> None:
        data = self._read_all()
        data[farm_id] = state

        # Atomic-ish write (temp file then replace)
        tmp_path = f"{self.file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.file_path)

    def load_meta(self, key: str, default: Any = None) -> Any:
        data = self._read_all()
        return data.get(key, default)

    def save_meta(self, key: str, value: Any) -> None:
        data = self._read_all()
        data[key] = value

        tmp_path = f"{self.file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.file_path)

    def delete_farm_state(self, farm_id: str) -> None:
        data = self._read_all()
        if farm_id in data:
            del data[farm_id]

        tmp_path = f"{self.file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.file_path)

    def delete_meta(self, key: str) -> None:
        data = self._read_all()
        if key in data:
            del data[key]

        tmp_path = f"{self.file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.file_path)

# ============================================================================
# SOIL TYPE PROFILES
# ============================================================================

SOIL_PROFILES = {
    "alluvial": {"ph_base": 7.0, "moisture_retention": 0.7, "npk_factor": 1.2},
    "black": {"ph_base": 7.5, "moisture_retention": 0.9, "npk_factor": 1.1},
    "red": {"ph_base": 6.5, "moisture_retention": 0.5, "npk_factor": 0.8},
    "laterite": {"ph_base": 6.0, "moisture_retention": 0.4, "npk_factor": 0.7},
    "sandy": {"ph_base": 6.5, "moisture_retention": 0.3, "npk_factor": 0.6},
    "clay": {"ph_base": 7.2, "moisture_retention": 0.85, "npk_factor": 1.0},
    "loamy": {"ph_base": 6.8, "moisture_retention": 0.7, "npk_factor": 1.0},
    "default": {"ph_base": 6.8, "moisture_retention": 0.6, "npk_factor": 1.0},
}

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

class SupabaseClient:
    """Simple Supabase REST API client"""
    
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    def get(self, table: str, query: str = "") -> List[Dict]:
        """GET request to Supabase REST API"""
        url = f"{self.url}/rest/v1/{table}{query}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def post(self, table: str, data: Dict) -> Dict:
        """POST request to insert data"""
        url = f"{self.url}/rest/v1/{table}"
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result[0] if isinstance(result, list) else result

# ============================================================================
# AUTONOMOUS MODE CHECK - Query dashboard setting
# ============================================================================

def check_autonomous_mode_enabled(farm_id: str) -> bool:
    """
    Check if autonomous mode is enabled for this farm by querying the dashboard API.
    Returns True if autonomous, False if manual mode.
    Defaults to True (autonomous) if API is unreachable to maintain backward compatibility.
    """
    try:
        url = f"{API_BASE_URL}/system/autonomous"
        params = {"farmId": farm_id}
        response = requests.get(url, params=params, timeout=2)
        
        if response.ok:
            data = response.json()
            enabled = data.get("enabled", True)
            return enabled
        else:
            # API error - default to autonomous for backward compatibility
            return True
            
    except Exception as e:
        # Connection error - default to autonomous for backward compatibility
        # Don't spam console with errors
        return True

# ============================================================================
# WEATHER SERVICE
# ============================================================================

class WeatherService:
    """Fetches real weather from OpenWeatherMap"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.cached_weather: Optional[WeatherData] = None
        self.cache_time: float = 0
        self.cache_duration = 300  # Cache for 5 minutes
        self.cached_rain_forecast: Optional[Dict] = None
        self.forecast_cache_time: float = 0
    
    def get_weather(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Get current weather for coordinates"""
        # Return cached if fresh
        if self.cached_weather and (time.time() - self.cache_time) < self.cache_duration:
            return self.cached_weather
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            self.cached_weather = WeatherData(
                temperature=data["main"]["temp"],
                humidity=data["main"]["humidity"],
                pressure=data["main"]["pressure"],
                wind_speed=data.get("wind", {}).get("speed", 0),
                description=data["weather"][0]["description"],
                icon=data["weather"][0]["icon"]
            )
            self.cache_time = time.time()
            return self.cached_weather
            
        except Exception as e:
            print(f"⚠️  Weather API error: {e}")
            return None
    
    def check_rain_forecast(self, lat: float, lon: float, hours_ahead: int = 6) -> Dict[str, Any]:
        """
        Check if rain is expected in the next N hours.
        Returns: {
            'rain_expected': bool,
            'rain_in_hours': float or None,
            'rain_probability': float (0-100),
            'description': str
        }
        """
        # Return cached if fresh (cache for 15 minutes)
        if self.cached_rain_forecast and (time.time() - self.forecast_cache_time) < 900:
            return self.cached_rain_forecast
        
        try:
            url = f"{self.base_url}/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric",
                "cnt": min(8, (hours_ahead // 3) + 1)  # 3-hour intervals
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            forecasts = data.get("list", [])
            rain_expected = False
            rain_in_hours = None
            max_rain_prob = 0
            rain_description = ""
            
            for i, fc in enumerate(forecasts):
                # Check for rain in weather conditions
                weather_main = fc.get("weather", [{}])[0].get("main", "").lower()
                pop = fc.get("pop", 0) * 100  # Probability of precipitation
                rain_amount = fc.get("rain", {}).get("3h", 0)
                
                if pop > max_rain_prob:
                    max_rain_prob = pop
                
                if "rain" in weather_main or rain_amount > 0 or pop > 60:
                    rain_expected = True
                    if rain_in_hours is None:
                        rain_in_hours = i * 3  # Hours until rain
                        rain_description = fc.get("weather", [{}])[0].get("description", "rain")
            
            result = {
                "rain_expected": rain_expected,
                "rain_in_hours": rain_in_hours,
                "rain_probability": max_rain_prob,
                "description": rain_description if rain_expected else "clear"
            }
            
            self.cached_rain_forecast = result
            self.forecast_cache_time = time.time()
            return result
            
        except Exception as e:
            print(f"⚠️  Forecast API error: {e}")
            return {
                "rain_expected": False,
                "rain_in_hours": None,
                "rain_probability": 0,
                "description": "unknown"
            }

# ============================================================================
# COMMAND HANDLER
# ============================================================================

class CommandHandler:
    """Handles commands from the dashboard (water pump, fertilizer, etc.)"""
    
    def __init__(self, command_file: str, state_manager: Optional[StateManager] = None, farm_id: Optional[str] = None):
        self.command_file = command_file
        self.state_manager = state_manager
        # Track per-farm to avoid one farm's commands advancing another's pointer.
        # Backward compatible with the previous global key.
        self._meta_key_last_processed_id = (
            f"_command_last_processed_id:{farm_id}" if farm_id else "_command_last_processed_id"
        )
        self._legacy_meta_key_last_processed_id = "_command_last_processed_id"
        self.last_processed_id = self._load_last_processed_id()

    def _load_last_processed_id(self) -> int:
        if not self.state_manager:
            return 0
        try:
            # Prefer per-farm key; fall back to legacy global key if needed.
            value = self.state_manager.load_meta(self._meta_key_last_processed_id, None)
            if value is None:
                value = self.state_manager.load_meta(self._legacy_meta_key_last_processed_id, 0)
            return int(value) if isinstance(value, (int, float, str)) else 0
        except Exception:
            return 0

    def _save_last_processed_id(self, value: int) -> None:
        if not self.state_manager:
            return
        try:
            self.state_manager.save_meta(self._meta_key_last_processed_id, int(value))
        except Exception:
            return
    
    def read_commands(self) -> List[Dict]:
        """Read pending commands from the command file"""
        try:
            if not os.path.exists(self.command_file):
                return []
            
            with open(self.command_file, 'r') as f:
                data = json.load(f)
            
            commands = data.get('commands', [])
            
            # Filter only new commands (not yet processed)
            new_commands = [
                cmd for cmd in commands 
                if cmd.get('id', 0) > self.last_processed_id
            ]
            
            # Update last processed ID
            if new_commands:
                self.last_processed_id = max(cmd.get('id', 0) for cmd in new_commands)
                self._save_last_processed_id(self.last_processed_id)
            
            return new_commands
            
        except (json.JSONDecodeError, IOError):
            return []
    
    def clear_commands(self):
        """Clear processed commands"""
        try:
            with open(self.command_file, 'w') as f:
                json.dump({'commands': []}, f)
        except IOError:
            pass

    def mark_existing_commands_processed(self, farm_id: Optional[str] = None) -> None:
        """Advance the processed pointer to the latest command currently on disk.

        This is useful for demos (judge mode) so old commands from previous runs
        don't suddenly spike moisture/NPK on startup.
        """
        try:
            if not os.path.exists(self.command_file):
                return
            with open(self.command_file, "r", encoding="utf-8-sig") as f:
                data = json.load(f)

            commands = data.get("commands", [])
            if not isinstance(commands, list) or not commands:
                return

            if farm_id:
                commands = [c for c in commands if (c or {}).get("farmId") in ("", None, farm_id)]

            max_id = 0
            for cmd in commands:
                try:
                    max_id = max(max_id, int((cmd or {}).get("id", 0)))
                except Exception:
                    continue

            if max_id > self.last_processed_id:
                self.last_processed_id = max_id
                self._save_last_processed_id(self.last_processed_id)
        except Exception:
            return

# ============================================================================
# FARM-AWARE SENSOR SIMULATOR
# ============================================================================

class FarmAwareSensorSimulator:
    """
    Generates realistic sensor data based on:
    - Actual farm location and characteristics
    - Real weather conditions
    - Crop-specific optimal ranges
    - Soil type properties
    - Time of day variations
    - Dashboard commands (water pump, fertilizer)
    """
    
    def __init__(self, farm: FarmInfo, crop_name: str = "default", state_manager: Optional[StateManager] = None):
        self.farm = farm
        self.crop = get_crop_profile(crop_name, farm.soil_type)
        self.soil = SOIL_PROFILES.get(
            (farm.soil_type or "").lower().split()[0], 
            SOIL_PROFILES["default"]
        )
        
        self.state_manager = state_manager

        # Initialize sensor values to optimal mid-range (will be replaced by persisted state if present)
        n_range, p_range, k_range = self.crop.npk_optimal
        self.current_values = {
            "soil_moisture": (self.crop.moisture_optimal[0] + self.crop.moisture_optimal[1]) / 2,
            "temperature": 25.0,  # Will be updated from weather
            "humidity": 60.0,     # Will be updated from weather
            "nitrogen": (n_range[0] + n_range[1]) / 2,
            "phosphorus": (p_range[0] + p_range[1]) / 2,
            "potassium": (k_range[0] + k_range[1]) / 2,
            "ph": self.soil["ph_base"],
            "ec": 1.2
        }
        
        # Track trends for smooth value progression
        self.trends = {key: random.uniform(-0.3, 0.3) for key in self.current_values}
        self.readings_count = 0
        
        # Warmup period - skip autonomous actions for first N readings
        # This allows values to stabilize and be visible before AI takes over
        self.warmup_readings = 5
        
        # Pending boosts from commands
        self.pending_moisture_boost = 0
        self.pending_npk_boost = {"nitrogen": 0, "phosphorus": 0, "potassium": 0}
        
        # Command handler (persists last processed command id across restarts)
        self.command_handler = CommandHandler(
            COMMAND_FILE,
            state_manager=self.state_manager,
            farm_id=self.farm.id,
        )

        if IGNORE_OLD_COMMANDS:
            # Don't replay old commands when demoing.
            self.command_handler.mark_existing_commands_processed(farm_id=self.farm.id)

        # Restore persisted state (if any) and apply offline catch-up once.
        self._restore_state_and_catch_up()

        # In judge mode, keep startup values within realistic bounds.
        if JUDGE_MODE:
            self._clamp_values_to_crop_bounds(strict=True)

    def _clamp_values_to_crop_bounds(self, strict: bool) -> None:
        """Clamp moisture/NPK to realistic bounds.

        strict=True clamps to crop-optimal MAX values.
        strict=False allows up to 1.5x optimal max (legacy behavior for more dramatic swings).
        """
        try:
            n_range, p_range, k_range = self.crop.npk_optimal
            if strict:
                moisture_max = float(self.crop.moisture_optimal[1])
                n_max = float(n_range[1])
                p_max = float(p_range[1])
                k_max = float(k_range[1])
            else:
                moisture_max = 100.0
                n_max = float(n_range[1]) * 1.5
                p_max = float(p_range[1]) * 1.5
                k_max = float(k_range[1]) * 1.5

            self.current_values["soil_moisture"] = max(0.0, min(moisture_max, float(self.current_values["soil_moisture"])))
            self.current_values["nitrogen"] = max(0.0, min(n_max, float(self.current_values["nitrogen"])))
            self.current_values["phosphorus"] = max(0.0, min(p_max, float(self.current_values["phosphorus"])))
            self.current_values["potassium"] = max(0.0, min(k_max, float(self.current_values["potassium"])))
        except Exception:
            return

    def _restore_state_and_catch_up(self) -> None:
        if not self.state_manager:
            return
        if not self.farm or not self.farm.id:
            return

        state = self.state_manager.load_farm_state(self.farm.id)
        if not state:
            print(f"\n📭 No persisted state found - starting fresh")
            return

        try:
            saved_ts = state.get("timestamp")
            saved_values = state.get("values")
            saved_trends = state.get("trends")

            if isinstance(saved_values, dict):
                for k in self.current_values.keys():
                    if k in saved_values and isinstance(saved_values[k], (int, float)):
                        self.current_values[k] = float(saved_values[k])
            if isinstance(saved_trends, dict):
                for k in self.trends.keys():
                    if k in saved_trends and isinstance(saved_trends[k], (int, float)):
                        self.trends[k] = float(saved_trends[k])

            print(f"\n💾 Restored state for farm {self.farm.farm_name}")
            print(f"   📊 Loaded values:")
            print(f"      Moisture: {self.current_values['soil_moisture']:.1f}%")
            print(f"      N: {self.current_values['nitrogen']:.0f}, P: {self.current_values['phosphorus']:.0f}, K: {self.current_values['potassium']:.0f}")
            
            # Show thresholds for comparison
            print(f"   🎯 Decision thresholds:")
            print(f"      Moisture >= {self.crop.moisture_optimal[0]}%")
            print(f"      N >= {self.crop.npk_optimal[0][0]}, P >= {self.crop.npk_optimal[1][0]}, K >= {self.crop.npk_optimal[2][0]}")

            if isinstance(saved_ts, str) and saved_ts:
                try:
                    last = datetime.fromisoformat(saved_ts)
                    now = datetime.now(last.tzinfo) if getattr(last, "tzinfo", None) else datetime.now()
                    delta_seconds = max(0.0, (now - last).total_seconds())
                    if not NO_CATCH_UP:
                        self._apply_offline_catch_up(delta_seconds)
                except ValueError:
                    # Bad timestamp format; ignore catch-up
                    pass

            # Always keep restored values sane (particularly helpful for demos)
            self._clamp_values_to_crop_bounds(strict=JUDGE_MODE)

        except Exception:
            # Never fail startup due to state load
            return

    def _apply_offline_catch_up(self, delta_seconds: float, supabase: Optional['SupabaseClient'] = None) -> None:
        """
        Apply realistic changes for offline period and simulate retroactive decisions.
        
        This method:
        1. Simulates hour-by-hour depletion based on ET model
        2. Detects when thresholds were crossed
        3. Logs retroactive actions with correct timestamps
        4. Shows detailed startup catch-up report
        """
        if delta_seconds <= 0:
            return

        hours = delta_seconds / 3600.0
        
        # Only apply catch-up for significant offline periods (> 1 hour)
        # For short gaps (< 1 hour), just skip - values haven't changed much
        if hours < 1.0:
            print(f"\n✅ System was offline for only {hours:.2f} hours - no catch-up needed")
            return
        
        print("\n" + "=" * 70)
        print("⏳ OFFLINE CATCH-UP SIMULATION")
        print("=" * 70)
        print(f"   System was offline for {hours:.2f} hours")
        print(f"   Simulating what happened during downtime...")
        print()
        
        # Store initial values for reporting
        initial_moisture = self.current_values["soil_moisture"]
        initial_n = self.current_values["nitrogen"]
        initial_p = self.current_values["phosphorus"]
        initial_k = self.current_values["potassium"]
        
        print(f"   📊 Starting values: Moisture={initial_moisture:.1f}%, N={initial_n:.0f}, P={initial_p:.0f}, K={initial_k:.0f}")
        
        # Get thresholds from crop profile
        moisture_threshold = self.crop.moisture_optimal[0]
        n_range, p_range, k_range = self.crop.npk_optimal
        
        print(f"   🎯 Thresholds: Moisture>={moisture_threshold}%, N>={n_range[0]}, P>={p_range[0]}, K>={k_range[0]}")
        print()
        
        # Track retroactive actions
        retroactive_actions = []
        
        # Simulate hour-by-hour for more accurate catch-up
        # Cap at 48 hours to avoid excessive simulation
        simulation_hours = min(hours, 48)
        start_time = datetime.now() - timedelta(seconds=delta_seconds)
        
        # Track if we already triggered actions (only once per catch-up)
        irrigation_triggered = False
        fertilization_triggered = False
        
        for hour_offset in range(int(simulation_hours)):
            # Calculate ET-based moisture loss per hour (using average conditions)
            # Simplified: use base ET rate with time-of-day adjustment
            sim_hour = (start_time + timedelta(hours=hour_offset)).hour
            time_factor = (math.sin(math.pi * (sim_hour - 6) / 12) + 1) / 2
            
            # Estimate weather conditions based on time of day
            estimated_temp = 22 + time_factor * 12  # 22-34°C
            
            # ET rate based on estimated conditions
            retention = float(self.soil.get("moisture_retention", 0.6))
            base_et = 0.2 * (1.0 + time_factor * 0.7)  # Higher during day
            soil_factor = 1.3 - retention * 0.6
            et_per_hour = base_et * soil_factor
            
            # Apply moisture depletion
            old_moisture = self.current_values["soil_moisture"]
            self.current_values["soil_moisture"] = max(0, old_moisture - et_per_hour)
            
            # Apply NPK depletion
            npk_factor = float(self.soil.get("npk_factor", 1.0))
            growth_factor = 1.0 if 25 <= estimated_temp <= 30 else 0.7
            
            n_loss = 0.25 * growth_factor / max(0.5, npk_factor)
            p_loss = 0.06 * growth_factor / max(0.5, npk_factor)
            k_loss = 0.12 * growth_factor / max(0.5, npk_factor)
            
            self.current_values["nitrogen"] = max(0, self.current_values["nitrogen"] - n_loss)
            self.current_values["phosphorus"] = max(0, self.current_values["phosphorus"] - p_loss)
            self.current_values["potassium"] = max(0, self.current_values["potassium"] - k_loss)
            
            # Check if irrigation threshold was crossed (only trigger ONCE)
            if not irrigation_triggered and old_moisture >= moisture_threshold and self.current_values["soil_moisture"] < moisture_threshold:
                action_time = start_time + timedelta(hours=hour_offset)
                # Simulate irrigation decision
                boost = random.uniform(15, 25)
                # Cap at 90% after boost
                self.current_values["soil_moisture"] = min(90, self.current_values["soil_moisture"] + boost)
                irrigation_triggered = True
                
                retroactive_actions.append({
                    "type": "irrigation",
                    "time": action_time,
                    "reason": f"Moisture dropped to {self.current_values['soil_moisture'] - boost:.1f}%",
                    "boost": boost
                })
            
            # Check if NPK thresholds were crossed (only trigger ONCE)
            if not fertilization_triggered and self.current_values["nitrogen"] < n_range[0]:
                action_time = start_time + timedelta(hours=hour_offset)
                n_boost = random.uniform(20, 35)
                p_boost = random.uniform(15, 25)
                k_boost = random.uniform(18, 28)
                
                # Cap at 1.5x optimal max
                self.current_values["nitrogen"] = min(n_range[1] * 1.5, self.current_values["nitrogen"] + n_boost)
                self.current_values["phosphorus"] = min(p_range[1] * 1.5, self.current_values["phosphorus"] + p_boost)
                self.current_values["potassium"] = min(k_range[1] * 1.5, self.current_values["potassium"] + k_boost)
                fertilization_triggered = True
                
                retroactive_actions.append({
                    "type": "fertilization",
                    "time": action_time,
                    "reason": f"Nutrient deficiency detected",
                    "boosts": {"N": n_boost, "P": p_boost, "K": k_boost}
                })
        
        # Recompute EC based on final NPK
        self.simulate_ec()
        
        # Print catch-up report
        print("-" * 70)
        print("📊 OFFLINE DEPLETION SUMMARY")
        print("-" * 70)
        print(f"   Moisture: {initial_moisture:.1f}% → {self.current_values['soil_moisture']:.1f}%")
        print(f"   Nitrogen: {initial_n:.0f} → {self.current_values['nitrogen']:.0f} mg/kg")
        print(f"   Phosphorus: {initial_p:.0f} → {self.current_values['phosphorus']:.0f} mg/kg")
        print(f"   Potassium: {initial_k:.0f} → {self.current_values['potassium']:.0f} mg/kg")
        
        if retroactive_actions:
            print()
            print("-" * 70)
            print("🤖 RETROACTIVE AI DECISIONS (would have occurred)")
            print("-" * 70)
            
            for action in retroactive_actions:
                time_str = action["time"].strftime("%I:%M %p")
                if action["type"] == "irrigation":
                    print(f"   💧 {time_str} - Auto-Irrigation (+{action['boost']:.1f}%)")
                    print(f"      Reason: {action['reason']}")
                elif action["type"] == "fertilization":
                    boosts = action["boosts"]
                    print(f"   🧪 {time_str} - Auto-Fertilization (N+{boosts['N']:.0f}, P+{boosts['P']:.0f}, K+{boosts['K']:.0f})")
                    print(f"      Reason: {action['reason']}")
                
                # Log retroactive action to Supabase if available
                if supabase:
                    if action["type"] == "irrigation":
                        details = f"🤖 Retroactive irrigation | {action['reason']} | +{action['boost']:.1f}% moisture"
                        self.log_action_to_supabase(supabase, "🌾 Auto-Irrigation (Retroactive)", details, action["time"])
                    elif action["type"] == "fertilization":
                        boosts = action["boosts"]
                        details = f"🤖 Retroactive fertilization | {action['reason']} | N+{boosts['N']:.0f}, P+{boosts['P']:.0f}, K+{boosts['K']:.0f}"
                        self.log_action_to_supabase(supabase, "🧪 Auto-Fertilization (Retroactive)", details, action["time"])
        else:
            print()
            print("   ✅ No autonomous actions were needed during offline period")
        
        print()
        print("=" * 70)
        print()

    def persist_state(self) -> None:
        if not self.state_manager:
            return
        try:
            self.state_manager.save_farm_state(
                self.farm.id,
                {
                    "timestamp": datetime.now().isoformat(),
                    "values": {k: float(v) for k, v in self.current_values.items()},
                    "trends": {k: float(v) for k, v in self.trends.items()},
                },
            )
        except Exception:
            return
    
    def process_commands(self):
        """Process any pending commands from the dashboard"""
        commands = self.command_handler.read_commands()
        
        for cmd in commands:
            cmd_type = cmd.get('type', '')
            farm_id = cmd.get('farmId', '')
            
            # Only process commands for this farm
            if farm_id and farm_id != self.farm.id:
                continue
            
            if cmd_type == 'water_pump':
                # Boost moisture by 15-20%
                boost = random.uniform(15, 20)
                self.pending_moisture_boost += boost
                print(f"💧 WATER PUMP ACTIVATED! Adding {boost:.1f}% moisture")
            
            elif cmd_type == 'fertilizer':
                # Boost NPK values
                n_boost = random.uniform(15, 25)
                p_boost = random.uniform(10, 18)
                k_boost = random.uniform(12, 20)
                self.pending_npk_boost["nitrogen"] += n_boost
                self.pending_npk_boost["phosphorus"] += p_boost
                self.pending_npk_boost["potassium"] += k_boost
                print(f"🌿 FERTILIZER APPLIED! Adding N:{n_boost:.1f}, P:{p_boost:.1f}, K:{k_boost:.1f}")
    
    def get_time_factor(self) -> float:
        """Returns 0.0-1.0 based on time of day (1.0 = noon, hottest)"""
        hour = datetime.now().hour
        return (math.sin(math.pi * (hour - 6) / 12) + 1) / 2
    
    def bounded_update(self, current: float, change: float, min_val: float, max_val: float) -> float:
        """Update value within bounds"""
        return max(min_val, min(max_val, current + change))
    
    def calculate_evapotranspiration(self, weather: Optional[WeatherData]) -> float:
        """
        Calculate evapotranspiration rate (% moisture loss per hour) using
        simplified Penman-Monteith approach.
        
        Factors:
        - Temperature: Higher temp = exponentially more evaporation
        - Humidity: Lower humidity = more evaporation
        - Wind speed: Higher wind = more evaporation
        - Time of day: Peak evaporation at solar noon
        - Soil type: Sandy loses faster, clay retains more
        - Crop type: Different Kc (crop coefficients)
        
        Returns: Hourly moisture loss rate (percentage points)
        """
        # Base ET rate (% per hour at 25°C, 60% humidity, no wind)
        base_et = 0.15  # ~3.6% per day baseline
        
        if weather:
            temp = weather.temperature
            humidity = weather.humidity
            wind = weather.wind_speed
        else:
            # Estimate from time of day (Indian conditions)
            time_factor = self.get_time_factor()
            temp = 22 + time_factor * 12  # 22-34°C range
            humidity = 70 - time_factor * 25  # 70-45% range
            wind = 1.5 + time_factor * 2  # 1.5-3.5 m/s
        
        # Temperature factor: Exponential increase above 20°C
        # At 35°C = 2.5x, at 40°C = 4x, at 20°C = 1x
        temp_factor = math.exp((temp - 25) / 15)
        temp_factor = max(0.4, min(4.0, temp_factor))
        
        # Humidity factor: Lower humidity = more evaporation
        # At 30% humidity = 1.6x, at 80% = 0.5x, at 60% = 1x
        humidity_factor = max(0.3, min(2.0, (100 - humidity) / 40))
        
        # Wind factor: Increases evaporation
        # At 5 m/s = 1.5x, at 0 = 0.8x
        wind_factor = 0.8 + (wind * 0.14)
        wind_factor = max(0.8, min(2.0, wind_factor))
        
        # Time of day factor: Peak at solar noon
        time_factor = self.get_time_factor()
        solar_factor = 0.3 + time_factor * 1.4  # 0.3-1.7x range
        
        # Soil retention factor: Clay retains more, sandy less
        retention = self.soil.get("moisture_retention", 0.6)
        soil_factor = 1.3 - retention * 0.6  # 0.7-1.3x range
        
        # Crop coefficient (Kc) - simplified
        # Rice = high, wheat/cotton = medium, default = 1.0
        crop_name = self.crop.name.lower()
        if "rice" in crop_name:
            kc = 1.3
        elif any(c in crop_name for c in ["sugarcane", "maize"]):
            kc = 1.15
        elif any(c in crop_name for c in ["cotton", "soybean"]):
            kc = 0.95
        else:
            kc = 1.0
        
        # Calculate final ET rate
        et_rate = base_et * temp_factor * humidity_factor * wind_factor * solar_factor * soil_factor * kc
        
        # Apply demo mode multiplier for faster depletion during presentations
        if DEMO_MODE:
            et_rate *= DEMO_SPEED_MULTIPLIER
        
        return et_rate
    
    def calculate_npk_depletion(self, weather: Optional[WeatherData]) -> Dict[str, float]:
        """
        Calculate NPK depletion rates (mg/kg per hour) based on:
        - Temperature (affects plant growth rate)
        - Crop nutrient demands
        - Soil type (nutrient retention)
        
        Nitrogen: Most mobile (leaching + uptake + volatilization)
        Phosphorus: Least mobile (binds to soil)
        Potassium: Moderate mobility
        
        Returns: Dict with hourly depletion rates for N, P, K
        """
        # Get temperature
        if weather:
            temp = weather.temperature
        else:
            time_factor = self.get_time_factor()
            temp = 22 + time_factor * 12
        
        # Growth factor based on temperature
        # Optimal growth at 25-30°C, reduced at extremes
        if 25 <= temp <= 30:
            growth_factor = 1.0
        elif temp < 25:
            growth_factor = max(0.2, 0.4 + (temp - 15) * 0.06)  # 0.2-1.0
        else:
            growth_factor = max(0.3, 1.0 - (temp - 30) * 0.07)  # 1.0-0.3
        
        # Soil NPK retention factor
        npk_factor = self.soil.get("npk_factor", 1.0)
        # Higher npk_factor means soil retains nutrients better (slower depletion)
        retention_modifier = 1.0 / max(0.5, npk_factor)
        
        # Crop-specific nutrient demands
        crop_name = self.crop.name.lower()
        if "rice" in crop_name or "sugarcane" in crop_name:
            n_demand, p_demand, k_demand = 1.3, 1.1, 1.2
        elif "potato" in crop_name or "maize" in crop_name:
            n_demand, p_demand, k_demand = 1.2, 1.2, 1.3
        elif "soybean" in crop_name or "groundnut" in crop_name:
            n_demand, p_demand, k_demand = 0.7, 1.1, 0.9  # Legumes fix N
        else:
            n_demand, p_demand, k_demand = 1.0, 1.0, 1.0
        
        # Base depletion rates (mg/kg per hour)
        # These give ~5-8% N loss, ~1-2% P loss, ~2-4% K loss per day
        base_n = 0.25  # ~6 mg/kg/day
        base_p = 0.06  # ~1.5 mg/kg/day
        base_k = 0.12  # ~3 mg/kg/day
        
        # Calculate final rates
        n_rate = base_n * growth_factor * retention_modifier * n_demand
        p_rate = base_p * growth_factor * retention_modifier * p_demand
        k_rate = base_k * growth_factor * retention_modifier * k_demand
        
        # Apply demo mode multiplier for faster depletion during presentations
        if DEMO_MODE:
            n_rate *= DEMO_SPEED_MULTIPLIER
            p_rate *= DEMO_SPEED_MULTIPLIER
            k_rate *= DEMO_SPEED_MULTIPLIER
        
        return {
            "nitrogen": n_rate,
            "phosphorus": p_rate,
            "potassium": k_rate
        }
    
    def simulate_soil_moisture(self, weather: Optional[WeatherData]) -> float:
        """
        Simulate soil moisture using evapotranspiration model.
        No artificial floor - values can drop to critical levels.
        System will make autonomous decisions to irrigate when needed.
        """
        # Calculate ET-based depletion (per hour)
        et_rate_per_hour = self.calculate_evapotranspiration(weather)
        
        # Convert to per-cycle rate (UPDATE_INTERVAL is in seconds)
        hours_per_cycle = UPDATE_INTERVAL / 3600.0
        et_per_cycle = et_rate_per_hour * hours_per_cycle
        
        # Apply depletion FIRST - NO FLOOR, values can go very low
        # This will trigger autonomous irrigation decisions
        self.current_values["soil_moisture"] = max(
            0,  # Absolute minimum is 0%
            min(100, self.current_values["soil_moisture"] - et_per_cycle)
        )
        
        # Apply pending moisture boost from water pump AFTER depletion
        # This ensures the boost doesn't get immediately wiped out
        if self.pending_moisture_boost > 0:
            # SAFETY CHECK: Only apply if moisture is actually low (below optimal threshold)
            # This prevents boosts from applying when moisture is already adequate
            current_moisture = self.current_values["soil_moisture"]
            threshold = self.crop.moisture_optimal[0]
            
            if current_moisture < threshold:
                boost_to_apply = self.pending_moisture_boost
                # Cap at reasonable max to prevent overflow
                boost_to_apply = min(40, boost_to_apply)  # Cap at 40% max boost
                self.current_values["soil_moisture"] = min(100, self.current_values["soil_moisture"] + boost_to_apply)
                self.pending_moisture_boost = 0
                print(f"   → Moisture boosted to {self.current_values['soil_moisture']:.1f}%")
            else:
                # Moisture is already adequate - discard the pending boost
                print(f"   ⏭️  Skipping moisture boost ({current_moisture:.1f}% already above threshold {threshold:.1f}%)")
                self.pending_moisture_boost = 0

        # Prevent surprise spikes during judge demos.
        if JUDGE_MODE:
            self._clamp_values_to_crop_bounds(strict=True)
        
        return round(self.current_values["soil_moisture"], 1)
    
    def simulate_temperature(self, weather: Optional[WeatherData]) -> float:
        """Temperature based on real weather + time variation"""
        if weather:
            # Base from real weather
            base_temp = weather.temperature
        else:
            # Fallback: estimate from crop optimal range
            base_temp = (self.crop.temp_optimal[0] + self.crop.temp_optimal[1]) / 2
        
        # Time of day variation (±3°C)
        time_factor = self.get_time_factor()
        time_adjustment = (time_factor - 0.5) * 6  # -3 to +3
        
        # Random micro-fluctuations
        fluctuation = random.uniform(-0.3, 0.3)
        
        self.current_values["temperature"] = base_temp + time_adjustment + fluctuation
        return round(self.current_values["temperature"], 1)
    
    def simulate_humidity(self, weather: Optional[WeatherData]) -> float:
        """Humidity based on real weather (inverse to temperature)"""
        if weather:
            base_humidity = weather.humidity
        else:
            base_humidity = 65
        
        # Inverse relationship with temperature
        temp = self.current_values["temperature"]
        temp_effect = (30 - temp) / 30 * 5  # ±5% based on temp
        
        fluctuation = random.uniform(-2, 2)
        
        self.current_values["humidity"] = max(30, min(95, base_humidity + temp_effect + fluctuation))
        return round(self.current_values["humidity"], 1)
    
    def simulate_npk(self, weather: Optional[WeatherData] = None) -> Dict[str, float]:
        """
        Simulate NPK depletion using growth-based model.
        No artificial floor - values can drop to critical levels.
        System will make autonomous decisions to fertilize when needed.
        """
        result = {}
        
        # Get growth-based depletion rates (per hour)
        depletion_rates = self.calculate_npk_depletion(weather)
        
        # Convert to per-cycle rate
        hours_per_cycle = UPDATE_INTERVAL / 3600.0
        
        for key in ["nitrogen", "phosphorus", "potassium"]:
            # Apply pending NPK boost IMMEDIATELY
            if self.pending_npk_boost[key] > 0:
                boost_to_apply = self.pending_npk_boost[key]
                self.current_values[key] += boost_to_apply
                self.pending_npk_boost[key] = 0
                print(f"   → {key.capitalize()} boosted to {self.current_values[key]:.1f}")
            
            # Calculate depletion per cycle
            depletion_per_cycle = depletion_rates[key] * hours_per_cycle
            
            # Apply depletion - NO FLOOR, values can go very low
            # This will trigger autonomous fertilization decisions
            self.current_values[key] = max(
                0,  # Absolute minimum is 0
                self.current_values[key] - depletion_per_cycle
            )
            
            result[key] = round(self.current_values[key], 1)

        # Prevent surprise spikes during judge demos.
        if JUDGE_MODE:
            self._clamp_values_to_crop_bounds(strict=True)
        
        return result
    
    def simulate_ph(self) -> float:
        """pH based on soil type with small variations"""
        base_ph = self.soil["ph_base"]
        optimal_min, optimal_max = self.crop.ph_optimal
        
        change = random.uniform(-0.02, 0.02) + self.trends["ph"] * 0.1
        self.trends["ph"] = max(-0.1, min(0.1, self.trends["ph"] + random.uniform(-0.02, 0.02)))
        
        self.current_values["ph"] = self.bounded_update(
            self.current_values["ph"],
            change,
            min(base_ph - 0.5, optimal_min),
            max(base_ph + 0.5, optimal_max)
        )
        return round(self.current_values["ph"], 2)
    
    def simulate_ec(self) -> float:
        """Electrical conductivity based on nutrient levels"""
        avg_npk = (self.current_values["nitrogen"] + 
                   self.current_values["phosphorus"] + 
                   self.current_values["potassium"]) / 3
        
        target_ec = 0.5 + (avg_npk / 100) * 1.2
        diff = target_ec - self.current_values["ec"]
        change = diff * 0.1 + random.uniform(-0.03, 0.03)
        
        self.current_values["ec"] = max(0.4, min(2.5, self.current_values["ec"] + change))
        return round(self.current_values["ec"], 2)
    
    # ========================================================================
    # AI DECISION ENGINE - Autonomous irrigation and fertilization
    # ========================================================================
    
    def should_irrigate(self, weather_service: Optional['WeatherService'] = None) -> Dict[str, Any]:
        """
        Decide if irrigation is needed based on:
        - Current soil moisture vs crop optimal threshold
        - Weather forecast (skip if rain expected)
        
        Returns: {
            'should_irrigate': bool,
            'reason': str,
            'moisture_current': float,
            'moisture_threshold': float,
            'rain_check': dict or None
        }
        """
        moisture = self.current_values["soil_moisture"]
        threshold = self.crop.moisture_optimal[0]  # Use minimum optimal as threshold
        
        # Check if moisture is below threshold
        if moisture >= threshold:
            return {
                "should_irrigate": False,
                "reason": f"Moisture {moisture:.1f}% is above threshold {threshold:.1f}%",
                "moisture_current": moisture,
                "moisture_threshold": threshold,
                "rain_check": None
            }
        
        # Moisture is low - check weather forecast
        rain_check = None
        if weather_service and self.farm.latitude and self.farm.longitude:
            rain_check = weather_service.check_rain_forecast(
                self.farm.latitude, 
                self.farm.longitude, 
                hours_ahead=6
            )
            
            if rain_check.get("rain_expected") and rain_check.get("rain_in_hours", 99) <= 6:
                return {
                    "should_irrigate": False,
                    "reason": f"Rain expected in {rain_check['rain_in_hours']}h ({rain_check['rain_probability']:.0f}% prob) - waiting",
                    "moisture_current": moisture,
                    "moisture_threshold": threshold,
                    "rain_check": rain_check
                }
        
        # Safety check: if moisture is already high, don't irrigate again
        if moisture >= 80:
            return {
                "should_irrigate": False,
                "reason": f"Moisture {moisture:.1f}% is already high (recently irrigated)",
                "moisture_current": moisture,
                "moisture_threshold": threshold,
                "rain_check": None
            }
        
        # Moisture is low and no rain expected - irrigate!
        return {
            "should_irrigate": True,
            "reason": f"Moisture {moisture:.1f}% dropped below {threshold:.1f}%, no rain expected",
            "moisture_current": moisture,
            "moisture_threshold": threshold,
            "rain_check": rain_check
        }
    
    def should_fertilize(self) -> Dict[str, Any]:
        """
        Decide if fertilization is needed based on:
        - Current NPK levels vs crop optimal thresholds
        
        Returns: {
            'should_fertilize': bool,
            'reason': str,
            'deficiencies': list of nutrients below threshold
        }
        """
        n_range, p_range, k_range = self.crop.npk_optimal
        
        deficiencies = []
        details = []
        
        # Check Nitrogen
        n_threshold = n_range[0]
        if self.current_values["nitrogen"] < n_threshold:
            deficiencies.append("nitrogen")
            details.append(f"N: {self.current_values['nitrogen']:.0f} < {n_threshold:.0f}")
        
        # Check Phosphorus
        p_threshold = p_range[0]
        if self.current_values["phosphorus"] < p_threshold:
            deficiencies.append("phosphorus")
            details.append(f"P: {self.current_values['phosphorus']:.0f} < {p_threshold:.0f}")
        
        # Check Potassium
        k_threshold = k_range[0]
        if self.current_values["potassium"] < k_threshold:
            deficiencies.append("potassium")
            details.append(f"K: {self.current_values['potassium']:.0f} < {k_threshold:.0f}")
        
        if not deficiencies:
            return {
                "should_fertilize": False,
                "reason": "All NPK levels are within optimal range",
                "deficiencies": []
            }
        
        return {
            "should_fertilize": True,
            "reason": f"Nutrient deficiency detected: {', '.join(details)}",
            "deficiencies": deficiencies
        }
    
    def log_action_to_supabase(self, supabase: 'SupabaseClient', action: str, details: str, 
                               timestamp: Optional[datetime] = None) -> bool:
        """
        Log an action to the action_logs table in Supabase.
        This appears on the dashboard's action log.
        
        Args:
            supabase: SupabaseClient instance
            action: Action name (e.g., "🌾 Auto-Irrigation", "🧪 Auto-Fertilization")
            details: Detailed description of the action
            timestamp: Optional timestamp (for retroactive logging)
        
        Returns: True if logged successfully
        """
        try:
            log_data = {
                "farmer_id": self.farm.farmer_id,
                "action": action,
                "details": details,
            }
            
            if timestamp:
                log_data["timestamp"] = timestamp.isoformat()
            
            supabase.post("action_logs", log_data)
            return True
            
        except Exception as e:
            print(f"⚠️  Failed to log action: {e}")
            return False
    
    def execute_autonomous_actions(self, supabase: 'SupabaseClient', 
                                   weather_service: Optional['WeatherService'] = None) -> List[Dict]:
        """
        Execute autonomous decision loop:
        1. Check if irrigation is needed
        2. Check if fertilization is needed
        3. Apply actions and log to Supabase
        
        Returns: List of actions taken
        """
        actions_taken = []
        
        # Warmup period - skip autonomous actions for first N readings
        if self.warmup_readings > 0:
            self.warmup_readings -= 1
            print(f"   ⏳ Warmup period: {self.warmup_readings} readings until AI decisions activate")
            return actions_taken
        
        # Check if autonomous mode is enabled in dashboard
        # If MANUAL mode is selected, skip all autonomous actions (only deplete, don't refill)
        is_autonomous = check_autonomous_mode_enabled(self.farm.id)
        if not is_autonomous:
            moisture = self.current_values["soil_moisture"]
            moisture_threshold = self.crop.moisture_optimal[0]
            print(f"   🔒 MANUAL MODE - Autonomous actions disabled in dashboard")
            print(f"   💧 Moisture: {moisture:.1f}% (threshold: {moisture_threshold:.1f}%)")
            print(f"   💡 Switch to Autonomous in dashboard to enable auto-irrigation")
            return actions_taken
        
        # Always log current status for visibility
        moisture = self.current_values["soil_moisture"]
        n_val = self.current_values["nitrogen"]
        moisture_threshold = self.crop.moisture_optimal[0]
        n_threshold = self.crop.npk_optimal[0][0]
        
        
        # Check irrigation
        irrigation_decision = self.should_irrigate(weather_service)
        if irrigation_decision["should_irrigate"]:
            # Apply irrigation boost
            boost = random.uniform(15, 25)
            self.pending_moisture_boost += boost
            
            # Log to Supabase
            rain_info = ""
            if irrigation_decision.get("rain_check"):
                rain_info = f" | Weather: {irrigation_decision['rain_check']['description']}"
            
            details = (
                f"🤖 AI triggered irrigation | "
                f"Moisture: {irrigation_decision['moisture_current']:.1f}% → +{boost:.1f}% | "
                f"Threshold: {irrigation_decision['moisture_threshold']:.1f}%{rain_info}"
            )
            
            self.log_action_to_supabase(supabase, "🌾 Auto-Irrigation", details)
            
            print(f"\n🤖 AI DECISION: IRRIGATION TRIGGERED!")
            print(f"   Reason: {irrigation_decision['reason']}")
            print(f"   Adding +{boost:.1f}% moisture\n")
            
            actions_taken.append({
                "type": "irrigation",
                "boost": boost,
                "decision": irrigation_decision
            })
        else:
            # Log why we're NOT irrigating (for debugging)
            print(f"   💧 Irrigation check: {irrigation_decision['reason']}")
        
        # Check fertilization
        fertilize_decision = self.should_fertilize()
        if fertilize_decision["should_fertilize"]:
            # Apply fertilization boost for deficient nutrients
            n_boost = random.uniform(20, 35) if "nitrogen" in fertilize_decision["deficiencies"] else 0
            p_boost = random.uniform(15, 25) if "phosphorus" in fertilize_decision["deficiencies"] else 0
            k_boost = random.uniform(18, 28) if "potassium" in fertilize_decision["deficiencies"] else 0
            
            self.pending_npk_boost["nitrogen"] += n_boost
            self.pending_npk_boost["phosphorus"] += p_boost
            self.pending_npk_boost["potassium"] += k_boost
            
            # Log to Supabase
            boost_parts = []
            if n_boost > 0:
                boost_parts.append(f"N+{n_boost:.0f}")
            if p_boost > 0:
                boost_parts.append(f"P+{p_boost:.0f}")
            if k_boost > 0:
                boost_parts.append(f"K+{k_boost:.0f}")
            
            details = (
                f"🤖 AI triggered fertilization | "
                f"Deficiency: {fertilize_decision['reason']} | "
                f"Applied: {', '.join(boost_parts)}"
            )
            
            self.log_action_to_supabase(supabase, "🧪 Auto-Fertilization", details)
            
            print(f"\n🤖 AI DECISION: FERTILIZATION TRIGGERED!")
            print(f"   Reason: {fertilize_decision['reason']}")
            print(f"   Adding: {', '.join(boost_parts)}\n")
            
            actions_taken.append({
                "type": "fertilization",
                "boosts": {"nitrogen": n_boost, "phosphorus": p_boost, "potassium": k_boost},
                "decision": fertilize_decision
            })
        else:
            # Log why we're NOT fertilizing (for debugging)
            print(f"   🧪 Fertilization check: {fertilize_decision['reason']}")
        
        return actions_taken
    
    def generate_reading(self, weather: Optional[WeatherData]) -> Dict[str, Any]:
        """Generate a complete sensor reading"""
        self.readings_count += 1
        
        # Process any pending commands first
        self.process_commands()
        
        npk = self.simulate_npk(weather)
        
        # Also simulate these for display, but don't send to DB
        self.simulate_humidity(weather)
        self.simulate_ec()
        
        # Database schema only has these columns:
        # farmer_id (required), farm_id, soil_moisture, temperature, ph, nitrogen, phosphorus, potassium, timestamp
        return {
            "farmer_id": self.farm.farmer_id,  # Required by DB schema
            "farm_id": self.farm.id,
            "soil_moisture": self.simulate_soil_moisture(weather),
            "temperature": self.simulate_temperature(weather),
            "nitrogen": int(npk["nitrogen"]),
            "phosphorus": int(npk["phosphorus"]),
            "potassium": int(npk["potassium"]),
            "ph": self.simulate_ph(),
            "timestamp": datetime.now().isoformat()
        }
    
    def get_display_reading(self, weather: Optional[WeatherData]) -> Dict[str, Any]:
        """Generate reading for display (includes humidity and ec)"""
        db_reading = self.generate_reading(weather)
        # Add display-only fields
        return {
            **db_reading,
            "humidity": round(self.current_values["humidity"], 1),
            "ec": round(self.current_values["ec"], 2)
        }

# ============================================================================
# CONSOLE DISPLAY
# ============================================================================

def clear_console():
    """Clear the console screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_status_emoji(value: float, optimal: tuple) -> str:
    """Status emoji based on optimal range"""
    if optimal[0] <= value <= optimal[1]:
        return "✅"
    elif value < optimal[0]:
        return "🔻"
    else:
        return "🔺"

def create_bar(value: float, min_val: float, max_val: float, width: int = 20) -> str:
    """Create a visual progress bar"""
    normalized = max(0, min(1, (value - min_val) / (max_val - min_val)))
    filled = int(normalized * width)
    return f"[{'█' * filled}{'░' * (width - filled)}]"

def display_dashboard(reading: Dict, farm: FarmInfo, farmer: FarmerInfo, 
                      weather: Optional[WeatherData], crop: CropProfile, 
                      db_status: str, readings_count: int, pending_moisture: float, pending_npk: Dict):
    """Display beautiful console dashboard"""
    clear_console()
    
    print("=" * 70)
    print("🌾 FARM-AWARE SENSOR SIMULATOR v2.1 🌾")
    print("=" * 70)
    print()
    
    print(f"👨‍🌾 Farmer: {farmer.name}")
    print(f"🏡 Farm: {farm.farm_name}")
    print(f"📍 Location: {farm.village or farm.district or farm.city or 'N/A'}, {farm.state or 'India'}")
    print(f"🌱 Crop Profile: {crop.name}")
    print(f"🪨 Soil Type: {farm.soil_type or 'Unknown'}")
    if farm.latitude and farm.longitude:
        print(f"🗺️  GPS: {farm.latitude:.4f}, {farm.longitude:.4f}")
    print()
    
    print("-" * 70)
    if weather:
        print(f"🌤️  REAL WEATHER: {weather.temperature:.1f}°C | {weather.humidity}% humidity | {weather.description.title()}")
    else:
        print("🌤️  WEATHER: Using estimated values (GPS not available)")
    print("-" * 70)
    print()
    
    print(f"📡 Database: {db_status}")
    print(f"📊 Total Readings: {readings_count}")
    print(f"⏰ Timestamp: {reading['timestamp']}")
    
    # Show pending boosts
    if pending_moisture > 0 or any(v > 0 for v in pending_npk.values()):
        print()
        print("-" * 70)
        print("⚡ ACTIVE BOOSTS (from dashboard commands)")
        print("-" * 70)
        if pending_moisture > 0:
            print(f"   💧 Moisture boost remaining: +{pending_moisture:.1f}%")
        if pending_npk["nitrogen"] > 0:
            print(f"   🔵 Nitrogen boost remaining: +{pending_npk['nitrogen']:.1f}")
        if pending_npk["phosphorus"] > 0:
            print(f"   🟡 Phosphorus boost remaining: +{pending_npk['phosphorus']:.1f}")
        if pending_npk["potassium"] > 0:
            print(f"   🟠 Potassium boost remaining: +{pending_npk['potassium']:.1f}")
    
    print()
    print("-" * 70)
    print("📈 SENSOR READINGS")
    print("-" * 70)
    print()
    
    # Soil Moisture
    status = get_status_emoji(reading["soil_moisture"], crop.moisture_optimal)
    bar = create_bar(reading["soil_moisture"], 20, 95)
    print(f"  💧 Soil Moisture:    {reading['soil_moisture']:>6.1f}%      {bar} {status}")
    
    # Temperature
    status = get_status_emoji(reading["temperature"], crop.temp_optimal)
    bar = create_bar(reading["temperature"], 10, 45)
    print(f"  🌡️  Temperature:      {reading['temperature']:>6.1f}°C     {bar} {status}")
    
    # Humidity
    status = get_status_emoji(reading["humidity"], (50, 80))
    bar = create_bar(reading["humidity"], 20, 100)
    print(f"  💨 Humidity:         {reading['humidity']:>6.1f}%      {bar} {status}")
    
    print()
    print("-" * 70)
    print("🧪 NPK NUTRIENTS")
    print("-" * 70)
    print()
    
    # NPK
    (n_opt, p_opt, k_opt) = crop.npk_optimal
    
    status = get_status_emoji(reading["nitrogen"], n_opt)
    bar = create_bar(reading["nitrogen"], 50, 200)
    print(f"  🔵 Nitrogen (N):     {reading['nitrogen']:>6} mg/kg  {bar} {status}")
    
    status = get_status_emoji(reading["phosphorus"], p_opt)
    bar = create_bar(reading["phosphorus"], 20, 100)
    print(f"  🟡 Phosphorus (P):   {reading['phosphorus']:>6} mg/kg  {bar} {status}")
    
    status = get_status_emoji(reading["potassium"], k_opt)
    bar = create_bar(reading["potassium"], 30, 150)
    print(f"  🟠 Potassium (K):    {reading['potassium']:>6} mg/kg  {bar} {status}")
    
    print()
    print("-" * 70)
    print("🔬 SOIL CHEMISTRY")
    print("-" * 70)
    print()
    
    status = get_status_emoji(reading["ph"], crop.ph_optimal)
    bar = create_bar(reading["ph"], 4, 9)
    print(f"  ⚗️  pH Level:         {reading['ph']:>6.2f}        {bar} {status}")
    
    bar = create_bar(reading["ec"], 0, 3)
    print(f"  ⚡ EC:               {reading['ec']:>6.2f} mS/cm  {bar}")
    
    print()
    print("=" * 70)
    print("Legend: ✅ Optimal | 🔻 Too Low | 🔺 Too High")
    print("💡 TIP: Use dashboard Water Pump / Fertilizer buttons to control!")
    print("Press Ctrl+C to stop the simulator")
    print("=" * 70)

# ============================================================================
# FARM PICKER
# ============================================================================

def pick_farm(supabase: SupabaseClient) -> tuple:
    """Interactive farm picker"""
    print()
    print("=" * 60)
    print("🌾 FARM-AWARE SENSOR SIMULATOR")
    print("=" * 60)
    print()
    print("Fetching farmers from database...")
    print()
    
    # Get all farmers
    farmers = supabase.get("farmers", "?select=id,name,phone&order=name")
    
    if not farmers:
        print("❌ No farmers found in database!")
        sys.exit(1)
    
    print("Available Farmers:")
    print("-" * 40)
    for i, farmer in enumerate(farmers, 1):
        print(f"  {i}. {farmer['name']} ({farmer['phone']})")
    print()
    
    # Select farmer
    while True:
        try:
            choice = input("Select farmer number (or press Enter for first): ").strip()
            if not choice:
                idx = 0
            else:
                idx = int(choice) - 1
            if 0 <= idx < len(farmers):
                break
            print("Invalid choice, try again.")
        except ValueError:
            print("Please enter a number.")
    
    selected_farmer = farmers[idx]
    farmer_info = FarmerInfo(
        id=selected_farmer['id'],
        name=selected_farmer['name'],
        phone=selected_farmer['phone']
    )
    
    print()
    print(f"✅ Selected: {farmer_info.name}")
    print()
    
    # Get farms for this farmer
    farms = supabase.get("farms", f"?farmer_id=eq.{farmer_info.id}&order=created_at.desc")
    
    if not farms:
        print(f"❌ No farms found for {farmer_info.name}!")
        sys.exit(1)
    
    if len(farms) == 1:
        selected_farm = farms[0]
        print(f"📍 Farm: {selected_farm['farm_name']}")
    else:
        print("Available Farms:")
        print("-" * 40)
        for i, farm in enumerate(farms, 1):
            location = farm.get('district') or farm.get('city') or farm.get('state') or 'Unknown'
            print(f"  {i}. {farm['farm_name']} ({location})")
        print()
        
        while True:
            try:
                choice = input("Select farm number (or press Enter for first): ").strip()
                if not choice:
                    idx = 0
                else:
                    idx = int(choice) - 1
                if 0 <= idx < len(farms):
                    break
                print("Invalid choice, try again.")
            except ValueError:
                print("Please enter a number.")
        
        selected_farm = farms[idx]
    
    farm_info = FarmInfo(
        id=selected_farm['id'],
        farmer_id=selected_farm['farmer_id'],
        farm_name=selected_farm['farm_name'],
        state=selected_farm.get('state'),
        city=selected_farm.get('city'),
        district=selected_farm.get('district'),
        village=selected_farm.get('village'),
        latitude=float(selected_farm['latitude']) if selected_farm.get('latitude') else None,
        longitude=float(selected_farm['longitude']) if selected_farm.get('longitude') else None,
        area_acres=float(selected_farm['area_acres']) if selected_farm.get('area_acres') else None,
        soil_type=selected_farm.get('soil_type')
    )
    
    print()
    print(f"✅ Selected Farm: {farm_info.farm_name}")
    
    # Get crop type from farm_settings if available
    crop_name = "default"
    try:
        settings = supabase.get("farm_settings", f"?farmer_id=eq.{farmer_info.id}&limit=1")
        if settings and settings[0].get('crop'):
            crop_name = settings[0]['crop']
            print(f"🌱 Crop Type: {crop_name}")
    except:
        pass
    
    print()
    
    return farmer_info, farm_info, crop_name

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    
    # Validate configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing Supabase configuration!")
        print("   Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env")
        sys.exit(1)
    
    if not OPENWEATHER_API_KEY:
        print("⚠️  OpenWeatherMap API key not found. Weather data will be estimated.")
    
    # Initialize clients
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    weather_service = WeatherService(OPENWEATHER_API_KEY) if OPENWEATHER_API_KEY else None
    
    # Pick farm interactively
    farmer_info, farm_info, crop_name = pick_farm(supabase)
    
    # Initialize simulator
    state_manager = None if NO_STATE else StateManager(STATE_FILE)

    if state_manager and RESET_STATE:
        # Reset only this farm's persisted state so restarts begin from defaults.
        try:
            state_manager.delete_farm_state(farm_info.id)
        except Exception:
            pass
        # Reset command processing pointer for this farm.
        try:
            state_manager.delete_meta(f"_command_last_processed_id:{farm_info.id}")
        except Exception:
            pass
        # Also clear legacy global pointer (safe; optional)
        try:
            state_manager.delete_meta("_command_last_processed_id")
        except Exception:
            pass

        print("\n🧹 RESET STATE: Starting fresh for this farm (no resume from simulator_state.json)")

    simulator = FarmAwareSensorSimulator(farm_info, crop_name, state_manager=state_manager)
    crop = simulator.crop
    
    print("🚀 Starting farm-aware sensor simulation...")
    print(f"⏱️  Update Interval: {UPDATE_INTERVAL} seconds")
    print(f"📁 Command file: {COMMAND_FILE}")
    
    if DEMO_MODE:
        print()
        print("=" * 60)
        print("🎬 DEMO MODE ACTIVE - Depletion accelerated 50x!")
        print("   Values will drop rapidly for hackathon demonstration")
        print("   AI decisions will trigger within 30-60 seconds")
        print("=" * 60)
        # Skip warmup in demo mode for instant action
        simulator.warmup_readings = 0

    if JUDGE_MODE:
        print()
        print("=" * 60)
        print("🏁 JUDGE MODE ACTIVE")
        print("   - Starts fresh (no resume)")
        print("   - Skips offline catch-up (no retroactive spikes)")
        print("   - Ignores old queued commands")
        print("   - Clamps values to crop-optimal max")
        print("=" * 60)
        # Keep it snappy for judges
        simulator.warmup_readings = 0
    
    print()
    time.sleep(2)
    
    db_status = "🔄 Initializing..."
    
    try:
        iteration = 0
        while True:
            # Get real weather if GPS available
            weather = None
            if weather_service and farm_info.latitude and farm_info.longitude:
                weather = weather_service.get_weather(farm_info.latitude, farm_info.longitude)
            
            # Generate sensor reading for database (without humidity/ec)
            db_reading = simulator.generate_reading(weather)
            
            # Save to database
            try:
                supabase.post("sensor_readings", db_reading)
                db_status = "✅ Connected & Syncing"
            except Exception as e:
                db_status = f"❌ DB Error: {str(e)[:30]}"
            
            # Get display reading (with humidity/ec for UI)
            display_reading = {
                **db_reading,
                "humidity": round(simulator.current_values["humidity"], 1),
                "ec": round(simulator.current_values["ec"], 2)
            }
            
            # Display dashboard
            display_dashboard(
                display_reading, farm_info, farmer_info,
                weather, crop, db_status,
                simulator.readings_count,
                simulator.pending_moisture_boost,
                simulator.pending_npk_boost
            )
            
            # Execute autonomous decisions (AI irrigation/fertilization)
            actions = simulator.execute_autonomous_actions(supabase, weather_service)
            if actions:
                print(f"   📋 {len(actions)} autonomous action(s) logged to dashboard")

            # Persist local simulator state each loop (independent of DB writes)
            simulator.persist_state()
            
            # Wait for next reading
            iteration += 1
            if RUN_ONCE or (MAX_ITERATIONS is not None and iteration >= MAX_ITERATIONS):
                try:
                    simulator.persist_state()
                except Exception:
                    pass
                print("\n")
                print("=" * 60)
                print("✅ Sensor simulation completed")
                print(f"📊 Total readings generated: {simulator.readings_count}")
                print("=" * 60)
                sys.exit(0)

            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        # Best-effort persist on shutdown
        try:
            simulator.persist_state()
        except Exception:
            pass
        print("\n")
        print("=" * 60)
        print("🛑 Sensor simulation stopped")
        print(f"📊 Total readings generated: {simulator.readings_count}")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    main()
