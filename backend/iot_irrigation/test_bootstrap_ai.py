"""
Comprehensive Test Suite for Bootstrap & Live-Sync Industrial AI
Tests all 5 High-Impact Features + Incremental Learning
"""

import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

BROKER = "localhost"
PORT = 1883
TOPIC = "farm/telemetry"
FARM_ID = "farm_001"

def on_connect(client, userdata, flags, rc):
    print(f"✅ Connected to MQTT Broker (rc={rc})")

client = mqtt.Client(client_id="bootstrap_tester")
client.on_connect = on_connect
client.connect(BROKER, PORT, 60)
client.loop_start()

time.sleep(1)

def send_packet(name, data):
    payload = {
        "farm_id": FARM_ID,
        "timestamp": datetime.utcnow().isoformat(),
        **data
    }
    client.publish(TOPIC, json.dumps(payload))
    print(f"\n📨 TEST: {name}")
    print(f"   Moisture: {data.get('moisture', 'N/A')}%")
    print(f"   Temp: {data.get('temp', 'N/A')}°C")
    print(f"   pH: {data.get('soil_ph', 'N/A')}")
    print(f"   EC: {data.get('ec_salinity', 'N/A')} dS/m")
    time.sleep(3)

print("\n" + "="*60)
print("🧪 BOOTSTRAP & LIVE-SYNC AI TEST SUITE")
print("="*60)

# Test 1: Digital Twin Forecast (High ET₀ scenario)
print("\n[1/5] Testing Digital Twin Moisture Simulator...")
send_packet("High ET₀ Scenario", {
    "moisture": 55.0,
    "temp": 35.0,      # High temp
    "humidity": 25.0,  # Low humidity
    "ec_salinity": 1.5,
    "soil_ph": 6.5,
    "wind_speed": 20.0,  # High wind
    "npk": 350
})

# Test 2: Soil Stress Index (Multiple stressors)
print("\n[2/5] Testing Soil Stress Index (SSI)...")
send_packet("High Stress Scenario", {
    "moisture": 25.0,    # Low moisture
    "temp": 38.0,        # High temp
    "humidity": 40.0,
    "ec_salinity": 4.5,  # High salinity
    "soil_ph": 8.5,      # Alkaline
    "wind_speed": 15.0,
    "npk": 200
})

# Test 3: Safety Lock (Wind > 20 km/h)
print("\n[3/5] Testing Drift & Spray Safety Lock...")
send_packet("Unsafe Wind Conditions", {
    "moisture": 50.0,
    "temp": 25.0,
    "humidity": 60.0,
    "ec_salinity": 1.5,
    "soil_ph": 6.5,
    "wind_speed": 35.0,  # CRITICAL WIND
    "npk": 350
})

# Test 4: Nutrient Lockout (Extreme pH)
print("\n[4/5] Testing Nutrient Lockout...")
send_packet("Acidic Lockout", {
    "moisture": 50.0,
    "temp": 25.0,
    "humidity": 60.0,
    "ec_salinity": 1.5,
    "soil_ph": 4.5,  # ACIDIC
    "wind_speed": 10.0,
    "npk": 350
})

# Test 5: Incremental Learning Buffer (Send 5 valid packets)
print("\n[5/5] Testing Incremental Learning Buffer...")
for i in range(5):
    send_packet(f"Learning Packet {i+1}/5", {
        "moisture": 45.0 + i * 2,
        "temp": 22.0 + i,
        "humidity": 60.0 + i * 2,
        "ec_salinity": 1.5 + i * 0.1,
        "soil_ph": 6.5 + i * 0.1,
        "wind_speed": 10.0 + i,
        "npk": 350
    })

print("\n" + "="*60)
print("✅ TEST SUITE COMPLETE")
print("="*60)
print("\n📊 Expected Backend Logs:")
print("   - ✅ Bootstrap dataset generated (if first run)")
print("   - ✅ Models trained from bootstrap data")
print("   - 🔮 Digital Twin Forecast (6h/12h/24h)")
print("   - 📊 Soil Stress Index (SSI)")
print("   - 🚫 Safety Lock (Wind > 20 km/h)")
print("   - 🔒 Nutrient Lockout (pH 4.5)")
print("   - 📚 Learning buffer accumulation")
print("\n📱 Expected Frontend:")
print("   - Digital Twin Forecast card in Water Demand")
print("   - Soil Stress Index gauge")
print("   - Nutrient Lockout overlay (pH 4.5)")
print("   - Safety Lock indicator")

client.loop_stop()
client.disconnect()
