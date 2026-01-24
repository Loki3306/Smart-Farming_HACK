"""
Direct Verification of Bootstrap & AI Features
Tests the ML models and features without requiring MQTT
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.ml_models.advanced_models import advanced_ml
from app.agents.agronomy_expert import agronomy_expert

print("\n" + "="*60)
print("🧪 BOOTSTRAP AI VERIFICATION (Direct)")
print("="*60)

# Check 1: Bootstrap Status
print("\n[1/5] Checking Bootstrap Status...")
print(f"   Models Loaded: {advanced_ml.models_loaded}")
print(f"   Is Bootstrapped: {advanced_ml.is_bootstrapped}")
print(f"   Packets Processed: {advanced_ml.packets_processed}")
print(f"   Learning Buffer Size: {len(advanced_ml.learning_buffer)}/{advanced_ml.BUFFER_SIZE}")

# Check 2: Test Digital Twin Forecast
print("\n[2/5] Testing Digital Twin Moisture Simulator...")
analysis = agronomy_expert.get_comprehensive_analysis(
    moisture=55.0,
    temperature=35.0,
    humidity=25.0,
    wind_speed=20.0,
    ec_salinity=1.5,
    ph=6.5
)

if "digital_twin_forecast" in analysis:
    forecast = analysis["digital_twin_forecast"]
    print(f"   ✅ Digital Twin Active")
    for f in forecast["forecasts"]:
        print(f"      T+{f['horizon_hours']}h: {f['predicted_moisture']}%")
else:
    print(f"   ❌ Digital Twin NOT found")

# Check 3: Test Soil Stress Index
print("\n[3/5] Testing Soil Stress Index (SSI)...")
if "soil_stress_index" in analysis:
    ssi = analysis["soil_stress_index"]
    print(f"   ✅ SSI: {ssi['ssi']} ({ssi['level']})")
    print(f"      Moisture Stress: {ssi['components']['moisture_stress']}%")
    print(f"      Salinity Stress: {ssi['components']['salinity_stress']}%")
    print(f"      pH Stress: {ssi['components']['ph_stress']}%")
else:
    print(f"   ❌ SSI NOT found")

# Check 4: Test Safety Lock
print("\n[4/5] Testing Safety Lock (High Wind)...")
analysis_wind = agronomy_expert.get_comprehensive_analysis(
    moisture=50.0,
    temperature=25.0,
    humidity=60.0,
    wind_speed=35.0,  # CRITICAL
    ec_salinity=1.5,
    ph=6.5
)

if "safety_lock" in analysis_wind:
    lock = analysis_wind["safety_lock"]
    print(f"   ✅ Safety Lock: {lock['status']}")
    print(f"      Reason: {lock['reason']}")
    print(f"      Blocked: {lock['blocked_operations']}")
else:
    print(f"   ❌ Safety Lock NOT found")

# Check 5: Test Nutrient Lockout
print("\n[5/5] Testing Nutrient Lockout (Acidic pH)...")
analysis_lockout = agronomy_expert.get_comprehensive_analysis(
    moisture=50.0,
    temperature=25.0,
    humidity=60.0,
    wind_speed=10.0,
    ec_salinity=1.5,
    ph=4.5  # ACIDIC
)

if "soil_health" in analysis_lockout:
    soil = analysis_lockout["soil_health"]
    if "rules" in soil:
        rules = soil["rules"]
        print(f"   ✅ Nutrient Lockout Active")
        print(f"      Status: {rules.get('nutrient_status', 'UNKNOWN')}")
        print(f"      Reason: {rules.get('reason', 'N/A')}")
        print(f"      P Available: {rules.get('phosphorus_available_ppm', 0)} ppm")
    else:
        print(f"   ⚠️ Rules not found in soil_health")
else:
    print(f"   ❌ Soil Health NOT found")

# Check 6: Test Incremental Learning
print("\n[6/6] Testing Incremental Learning Buffer...")
initial_buffer_size = len(advanced_ml.learning_buffer)
print(f"   Initial Buffer: {initial_buffer_size}/{advanced_ml.BUFFER_SIZE}")

# Add 5 test packets
for i in range(5):
    packet = {
        "soil_moisture": 45.0 + i * 2,
        "temperature": 22.0 + i,
        "humidity": 60.0 + i * 2,
        "wind_speed": 10.0 + i,
        "ec_salinity": 1.5 + i * 0.1,
        "soil_ph": 6.5 + i * 0.1
    }
    advanced_ml.add_to_learning_buffer(packet)

final_buffer_size = len(advanced_ml.learning_buffer)
print(f"   Final Buffer: {final_buffer_size}/{advanced_ml.BUFFER_SIZE}")
print(f"   Packets Added: {final_buffer_size - initial_buffer_size}")

print("\n" + "="*60)
print("✅ VERIFICATION COMPLETE")
print("="*60)

# Summary
print("\n📊 SUMMARY:")
print(f"   Bootstrap Status: {'ACTIVE' if advanced_ml.is_bootstrapped else 'GRADUATED'}")
print(f"   Models Loaded: {'YES' if advanced_ml.models_loaded else 'NO'}")
print(f"   Digital Twin: {'✅' if 'digital_twin_forecast' in analysis else '❌'}")
print(f"   SSI: {'✅' if 'soil_stress_index' in analysis else '❌'}")
print(f"   Safety Lock: {'✅' if 'safety_lock' in analysis_wind else '❌'}")
print(f"   Learning Buffer: {final_buffer_size}/{advanced_ml.BUFFER_SIZE} packets")
