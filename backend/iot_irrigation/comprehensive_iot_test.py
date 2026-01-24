"""
Comprehensive IoT System Test - Rapid Scenario Testing
Tests all sensor ranges and edge cases with rapid value changes
"""

import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
TELEMETRY_TOPIC = "farm/telemetry"
FARM_ID = "farm_001"

# Test scenarios with specific sensor values
TEST_SCENARIOS = [
    {
        "name": "CRITICAL_DRY",
        "description": "Critical low moisture - should trigger irrigation",
        "moisture": 25.0,
        "temp": 32.0,
        "humidity": 35.0,
        "npk": 150,
        "ec_salinity": 3.2,
        "wind_speed": 5.0,
        "soil_ph": 6.5
    },
    {
        "name": "OPTIMAL",
        "description": "Perfect growing conditions",
        "moisture": 55.0,
        "temp": 24.0,
        "humidity": 65.0,
        "npk": 500,
        "ec_salinity": 1.2,
        "wind_speed": 8.0,
        "soil_ph": 6.8
    },
    {
        "name": "HIGH_WIND",
        "description": "High wind - should block fertilization",
        "moisture": 50.0,
        "temp": 26.0,
        "humidity": 60.0,
        "npk": 400,
        "ec_salinity": 1.5,
        "wind_speed": 25.0,  # > 20 km/h
        "soil_ph": 7.0
    },
    {
        "name": "ACIDIC_SOIL",
        "description": "Low pH - nutrient lockout",
        "moisture": 45.0,
        "temp": 23.0,
        "humidity": 70.0,
        "npk": 600,
        "ec_salinity": 1.0,
        "wind_speed": 10.0,
        "soil_ph": 5.2  # < 5.5
    },
    {
        "name": "ALKALINE_SOIL",
        "description": "High pH - nutrient lockout",
        "moisture": 48.0,
        "temp": 25.0,
        "humidity": 68.0,
        "npk": 550,
        "ec_salinity": 1.3,
        "wind_speed": 12.0,
        "soil_ph": 8.2  # > 7.5
    },
    {
        "name": "HIGH_SALINITY",
        "description": "High EC - salt stress",
        "moisture": 40.0,
        "temp": 28.0,
        "humidity": 55.0,
        "npk": 300,
        "ec_salinity": 3.8,  # High salinity
        "wind_speed": 7.0,
        "soil_ph": 7.2
    },
    {
        "name": "WET_SOIL",
        "description": "Saturated soil - no irrigation needed",
        "moisture": 85.0,
        "temp": 22.0,
        "humidity": 80.0,
        "npk": 450,
        "ec_salinity": 0.8,
        "wind_speed": 6.0,
        "soil_ph": 6.7
    },
    {
        "name": "HOT_DRY",
        "description": "Hot and dry - high ET0",
        "moisture": 30.0,
        "temp": 35.0,
        "humidity": 30.0,
        "npk": 200,
        "ec_salinity": 2.5,
        "wind_speed": 15.0,
        "soil_ph": 6.9
    },
    {
        "name": "COLD_WET",
        "description": "Cold and wet - low ET0",
        "moisture": 75.0,
        "temp": 15.0,
        "humidity": 90.0,
        "npk": 700,
        "ec_salinity": 0.6,
        "wind_speed": 3.0,
        "soil_ph": 6.6
    },
    {
        "name": "LOW_NPK",
        "description": "Nutrient deficiency",
        "moisture": 50.0,
        "temp": 24.0,
        "humidity": 65.0,
        "npk": 50,  # Very low
        "ec_salinity": 1.1,
        "wind_speed": 9.0,
        "soil_ph": 6.8
    },
    {
        "name": "EXTREME_WIND",
        "description": "Extreme wind - all operations blocked",
        "moisture": 45.0,
        "temp": 27.0,
        "humidity": 50.0,
        "npk": 400,
        "ec_salinity": 1.4,
        "wind_speed": 35.0,  # Maximum
        "soil_ph": 7.1
    },
    {
        "name": "DISEASE_RISK",
        "description": "High humidity - disease risk",
        "moisture": 60.0,
        "temp": 26.0,
        "humidity": 95.0,  # Very high
        "npk": 500,
        "ec_salinity": 1.2,
        "wind_speed": 4.0,
        "soil_ph": 6.7
    }
]

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f"📡 Publishing to topic: {TELEMETRY_TOPIC}\n")
    else:
        print(f"❌ Connection failed with code {rc}")

def publish_scenario(client, scenario):
    """Publish a specific test scenario"""
    data = {
        "moisture": scenario["moisture"],
        "temp": scenario["temp"],
        "humidity": scenario["humidity"],
        "npk": scenario["npk"],
        "ec_salinity": scenario["ec_salinity"],
        "wind_speed": scenario["wind_speed"],
        "soil_ph": scenario["soil_ph"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "farm_id": FARM_ID
    }
    
    payload = json.dumps(data)
    result = client.publish(TELEMETRY_TOPIC, payload, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"\n{'='*70}")
        print(f"📨 SCENARIO: {scenario['name']}")
        print(f"{'='*70}")
        print(f"📝 Description: {scenario['description']}")
        print(f"💧 Moisture:    {data['moisture']}%")
        print(f"🌡️  Temp:        {data['temp']}°C")
        print(f"💨 Humidity:    {data['humidity']}%")
        print(f"🟢 NPK:         {data['npk']}")
        print(f"🧂 EC:          {data['ec_salinity']} dS/m")
        print(f"🌬️  Wind:        {data['wind_speed']} km/h")
        print(f"🧪 pH:          {data['soil_ph']}")
        
        # Expected behaviors
        print(f"\n🔍 Expected Behaviors:")
        if data['moisture'] < 35:
            print(f"   ⚠️  LOW MOISTURE → Auto-irrigation trigger")
        if data['wind_speed'] > 20:
            print(f"   🚫 HIGH WIND → Fertilization blocked")
        if data['soil_ph'] < 5.5 or data['soil_ph'] > 7.5:
            print(f"   🔒 pH LOCKOUT → Nutrient availability reduced")
        if data['ec_salinity'] > 2.5:
            print(f"   ⚠️  HIGH SALINITY → Salt stress")
        if data['humidity'] > 90:
            print(f"   🦠 DISEASE RISK → High humidity warning")
        if data['npk'] < 100:
            print(f"   📉 LOW NPK → Fertilization needed")
        
        print(f"{'='*70}")
    else:
        print(f"❌ Failed to publish (error code: {result.rc})")

def run_rapid_test(client, interval=2):
    """Run through all scenarios rapidly"""
    print("\n" + "="*70)
    print("🚀 RAPID SCENARIO TEST - COMPREHENSIVE IOT TESTING")
    print("="*70)
    print(f"Total Scenarios: {len(TEST_SCENARIOS)}")
    print(f"Interval: {interval} seconds between scenarios")
    print(f"Total Duration: ~{len(TEST_SCENARIOS) * interval} seconds")
    print("="*70)
    
    for i, scenario in enumerate(TEST_SCENARIOS, 1):
        print(f"\n\n🔄 Test {i}/{len(TEST_SCENARIOS)}")
        publish_scenario(client, scenario)
        
        if i < len(TEST_SCENARIOS):
            print(f"\n⏳ Waiting {interval} seconds before next scenario...")
            time.sleep(interval)
    
    print("\n\n" + "="*70)
    print("✅ ALL SCENARIOS COMPLETED!")
    print("="*70)
    print("\n📊 Summary:")
    print(f"   Total scenarios tested: {len(TEST_SCENARIOS)}")
    print(f"   Coverage:")
    print(f"   ✅ Moisture ranges: Critical (25%) to Saturated (85%)")
    print(f"   ✅ Temperature: Cold (15°C) to Hot (35°C)")
    print(f"   ✅ Wind: Calm (3 km/h) to Extreme (35 km/h)")
    print(f"   ✅ pH: Acidic (5.2) to Alkaline (8.2)")
    print(f"   ✅ Salinity: Low (0.6) to High (3.8 dS/m)")
    print(f"   ✅ NPK: Deficient (50) to Abundant (700)")
    print("\n🎯 Check frontend dashboard for:")
    print(f"   - Water circle updates (moisture values)")
    print(f"   - Safety lock indicators (wind > 20 km/h)")
    print(f"   - Nutrient lockout warnings (pH < 5.5 or > 7.5)")
    print(f"   - Disease risk alerts (humidity > 90%)")
    print(f"   - Soil stress index changes")
    print(f"   - Digital twin moisture forecasts")
    print("\n")

def main():
    """Main test function"""
    print("="*70)
    print("IoT Irrigation System - Comprehensive Rapid Test")
    print("="*70)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {TELEMETRY_TOPIC}")
    print(f"Farm ID: {FARM_ID}")
    print("="*70)
    
    # Create MQTT client
    client = mqtt.Client(client_id="comprehensive_test_simulator")
    client.on_connect = on_connect
    
    # Connect to broker
    try:
        print(f"\n🔌 Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1)  # Wait for connection
        
        # Run rapid test
        run_rapid_test(client, interval=2)
        
        # Keep publishing normal data for a bit
        print("\n📡 Publishing normal data for 10 seconds...")
        for i in range(5):
            normal_scenario = TEST_SCENARIOS[1]  # OPTIMAL scenario
            publish_scenario(client, normal_scenario)
            time.sleep(2)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Test stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("\n✅ Disconnected from MQTT broker")
        print("🎉 Test complete!\n")

if __name__ == "__main__":
    main()
