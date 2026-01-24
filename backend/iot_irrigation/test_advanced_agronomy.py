"""
Quick test for Advanced Agronomy Features
Publishes sensor data with EC, Wind, and pH
"""

import paho.mqtt.client as mqtt
import json
import time

# MQTT Configuration
BROKER = "127.0.0.1"
PORT = 1883
TOPIC = "farm/telemetry"

# Test data with advanced sensors
test_data = {
    "farm_id": "farm_001",
    "moisture": 45.0,
    "temp": 28.5,
    "humidity": 65.0,
    "npk": 512,
    # Advanced sensors
    "ec_salinity": 2.8,  # High salinity (will trigger leaching)
    "wind_speed": 25.0,  # High wind (will block spraying)
    "soil_ph": 5.5,      # Low pH (P locked)
    "timestamp": "2026-01-24T19:20:00Z"
}

print("🧪 Publishing Advanced Agronomy Test Data")
print("=" * 60)
print(json.dumps(test_data, indent=2))
print("=" * 60)

client = mqtt.Client()
client.connect(BROKER, PORT)
client.publish(TOPIC, json.dumps(test_data))
client.disconnect()

print("\n✅ Published! Check backend logs for agronomy analysis.")
print("Expected:")
print("  🚨 Salinity stress detected (EC: 2.8 dS/m)")
print("  💧 Leaching cycle triggered")
print("  ⚠️  Wind safety alert (25 km/h)")
print("  🌱 Agronomy analysis broadcast to frontend")
