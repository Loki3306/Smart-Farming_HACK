"""
Test Script for IoT Irrigation System
Simulates ESP32 sensor data publishing to MQTT
"""

import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "localhost"  # Change to your broker
MQTT_PORT = 1883
MQTT_TOPIC = "farm/telemetry"
FARM_ID = "farm_001"

# Sensor simulation parameters
MOISTURE_MIN = 20
MOISTURE_MAX = 80
TEMP_MIN = 15
TEMP_MAX = 35
HUMIDITY_MIN = 40
HUMIDITY_MAX = 90
NPK_MIN = 0
NPK_MAX = 1023

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f"📡 Publishing to topic: {MQTT_TOPIC}")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_publish(client, userdata, mid):
    """Callback when message is published"""
    print(f"✓ Message published (ID: {mid})")

def generate_sensor_data(scenario="normal"):
    """
    Generate simulated sensor data with Advanced Precision Ag fields
    """
    
    if scenario == "dry":
        moisture = random.uniform(20, 34)
    elif scenario == "wet":
        moisture = random.uniform(70, 90)
    elif scenario == "normal":
        moisture = random.uniform(40, 60)
    else:
        moisture = random.uniform(MOISTURE_MIN, MOISTURE_MAX)
    
    if scenario == "hot":
        temp = random.uniform(30, 35)
    elif scenario == "cold":
        temp = random.uniform(15, 20)
    else:
        temp = random.uniform(20, 28)
    
    humidity = random.uniform(HUMIDITY_MIN, HUMIDITY_MAX)
    npk = random.randint(NPK_MIN, NPK_MAX)
    
    # ALWAYS generate advanced fields for this demo
    ec_salinity = random.uniform(0.5, 3.5)  # dS/m
    wind_speed = random.uniform(0, 35)      # km/h
    soil_ph = random.uniform(5.5, 8.5)      # pH
    
    return {
        "moisture": round(moisture, 1),
        "temp": round(temp, 1),
        "humidity": round(humidity, 1),
        "npk": npk,
        "ec_salinity": round(ec_salinity, 2),
        "wind_speed": round(wind_speed, 1),
        "soil_ph": round(soil_ph, 1),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "farm_id": FARM_ID
    }

def publish_sensor_data(client, scenario="normal"):
    """Publish sensor data to MQTT"""
    data = generate_sensor_data(scenario)
    payload = json.dumps(data)
    
    result = client.publish(MQTT_TOPIC, payload, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"\n📨 Published sensor data (Scenario: {scenario}):")
        print(f"   💧 Moisture:    {data['moisture']}%")
        print(f"   🌡️  Temp:        {data['temp']}°C")
        print(f"   💨 Humidity:    {data['humidity']}%")
        print(f"   🧂 Salinity:    {data['ec_salinity']} dS/m")
        print(f"   🌬️  Wind:        {data['wind_speed']} km/h")
        print(f"   🧪 pH:          {data['soil_ph']}")
        print(f"   Timestamp:      {data['timestamp']}")
        
        if data['moisture'] < 35:
            print(f"   ⚠️  LOW MOISTURE ALERT")
    else:
        print(f"❌ Failed to publish (error code: {result.rc})")

def run_continuous_test(client, interval=3, scenario="normal"):
    """
    Run continuous sensor data publishing
    """
    print(f"\n🔄 Starting continuous test (interval: {interval}s)")
    print("Sending COMPLETE Precision Agriculture dataset...")
    print("Press Ctrl+C to stop\n")
    
    try:
        count = 0
        while True:
            count += 1
            print(f"--- Publish #{count} ---")
            publish_sensor_data(client, scenario)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n🛑 Test stopped by user")

def run_scenario_test(client):
    """Run through different scenarios"""
    scenarios = [
        ("normal", "Normal conditions"),
        ("dry", "Dry soil (triggers irrigation)"),
        ("wet", "Wet soil"),
        ("hot", "Hot weather"),
        ("cold", "Cold weather"),
    ]
    
    print("\n🎬 Running scenario tests...\n")
    
    for scenario, description in scenarios:
        print(f"\n{'='*60}")
        print(f"Scenario: {description}")
        print(f"{'='*60}")
        publish_sensor_data(client, scenario)
        time.sleep(2)
    
    print(f"\n{'='*60}")
    print("✅ All scenarios completed!")
    print(f"{'='*60}\n")

def main():
    """Main test function"""
    print("="*60)
    print("IoT Irrigation System - Test Script")
    print("="*60)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {MQTT_TOPIC}")
    print(f"Farm ID: {FARM_ID}")
    print("="*60)
    
    # Create MQTT client
    client = mqtt.Client(client_id="test_sensor_simulator")
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    # Connect to broker
    try:
        print(f"\n🔌 Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1)  # Wait for connection
        
    except Exception as e:
        print(f"❌ Failed to connect to MQTT broker: {e}")
        return
    
    # Run continuous test immediately (bypass menu for automation)
    print("\n🚀 Starting Continuous Stream (Precision Agriculture Mode)")
    print("Sending: Moisture, Temp, Humidity, NPK + EC, Wind, pH")
    print("Press Ctrl+C to stop")
    
    try:
        run_continuous_test(client, interval=3, scenario="normal")
    except KeyboardInterrupt:
        print("\n👋 Exiting...")
    
    # Cleanup
    client.loop_stop()
    client.disconnect()
    print("✅ Disconnected from MQTT broker")

if __name__ == "__main__":
    main()
