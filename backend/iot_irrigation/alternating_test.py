"""
Alternating IoT Test - Normal/Critical Values
Sends normal data for 4-5 cycles, then critical (red) values for 1-2 cycles
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

# Normal healthy values
NORMAL_VALUES = {
    "moisture": lambda: random.uniform(50, 70),
    "temp": lambda: random.uniform(22, 28),
    "humidity": lambda: random.uniform(60, 75),
    "npk": lambda: random.randint(400, 600),
    "ec_salinity": lambda: random.uniform(1.0, 1.8),
    "wind_speed": lambda: random.uniform(5, 15),
    "soil_ph": lambda: random.uniform(6.5, 7.2)
}

# Critical RED values (triggers alerts)
CRITICAL_VALUES = {
    "moisture": lambda: random.uniform(15, 30),  # Very low - RED
    "temp": lambda: random.uniform(33, 38),      # Very hot - RED
    "humidity": lambda: random.uniform(25, 40),  # Very dry - RED
    "npk": lambda: random.randint(30, 80),       # Very low - RED
    "ec_salinity": lambda: random.uniform(3.0, 4.5),  # High salinity - RED
    "wind_speed": lambda: random.uniform(22, 35),     # High wind - RED (blocks fertilization)
    "soil_ph": lambda: random.uniform(4.8, 5.3)       # Acidic - RED (nutrient lockout)
}

cycle_count = 0
is_critical_mode = False

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f"📡 Publishing to topic: {TELEMETRY_TOPIC}\n")
    else:
        print(f"❌ Connection failed with code {rc}")

def publish_data(client, mode="normal"):
    """Publish sensor data"""
    global cycle_count, is_critical_mode
    
    # Choose value set based on mode
    values = CRITICAL_VALUES if mode == "critical" else NORMAL_VALUES
    
    data = {
        "moisture": round(values["moisture"](), 1),
        "temp": round(values["temp"](), 1),
        "humidity": round(values["humidity"](), 1),
        "npk": values["npk"](),
        "ec_salinity": round(values["ec_salinity"](), 2),
        "wind_speed": round(values["wind_speed"](), 1),
        "soil_ph": round(values["soil_ph"](), 1),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "farm_id": FARM_ID
    }
    
    payload = json.dumps(data)
    result = client.publish(TELEMETRY_TOPIC, payload, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        cycle_count += 1
        
        # Determine display color
        if mode == "critical":
            mode_icon = "🔴"
            mode_text = "CRITICAL"
        else:
            mode_icon = "🟢"
            mode_text = "NORMAL"
        
        print(f"\n{'='*70}")
        print(f"{mode_icon} CYCLE #{cycle_count} - {mode_text} MODE")
        print(f"{'='*70}")
        print(f"💧 Moisture:    {data['moisture']}% {'🔴 LOW!' if data['moisture'] < 35 else '🟢'}")
        print(f"🌡️  Temp:        {data['temp']}°C {'🔴 HOT!' if data['temp'] > 32 else '🟢'}")
        print(f"💨 Humidity:    {data['humidity']}% {'🔴 DRY!' if data['humidity'] < 45 else '🟢'}")
        print(f"🟢 NPK:         {data['npk']} {'🔴 LOW!' if data['npk'] < 100 else '🟢'}")
        print(f"🧂 EC:          {data['ec_salinity']} dS/m {'🔴 HIGH!' if data['ec_salinity'] > 2.5 else '🟢'}")
        print(f"🌬️  Wind:        {data['wind_speed']} km/h {'🔴 BLOCKED!' if data['wind_speed'] > 20 else '🟢'}")
        print(f"🧪 pH:          {data['soil_ph']} {'🔴 LOCKOUT!' if data['soil_ph'] < 5.5 else '🟢'}")
        
        # Show expected frontend behavior
        if mode == "critical":
            print(f"\n🎨 Expected Frontend:")
            print(f"   🔴 Water circle: RED (moisture {data['moisture']}%)")
            print(f"   🔴 Temperature: RED warning")
            print(f"   🔴 NPK bars: RED/low")
            if data['wind_speed'] > 20:
                print(f"   🚫 Fertilization: BLOCKED")
            if data['soil_ph'] < 5.5:
                print(f"   🔒 Nutrient lockout: ACTIVE")
        
        print(f"{'='*70}")
    else:
        print(f"❌ Failed to publish (error code: {result.rc})")

def main():
    """Main loop with alternating normal/critical cycles"""
    global cycle_count, is_critical_mode
    
    print("="*70)
    print("🔄 ALTERNATING IOT TEST - NORMAL/CRITICAL CYCLES")
    print("="*70)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Pattern: 4-5 Normal → 1-2 Critical → Repeat")
    print(f"Interval: 3 seconds")
    print("="*70)
    
    # Create MQTT client
    client = mqtt.Client(client_id="alternating_test_simulator")
    client.on_connect = on_connect
    
    # Connect to broker
    try:
        print(f"\n🔌 Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1)
        
        print("\n🚀 Starting alternating test...")
        print("   Press Ctrl+C to stop\n")
        
        normal_cycles = 0
        critical_cycles = 0
        
        while True:
            # Determine mode
            if not is_critical_mode:
                # Normal mode: 4-5 cycles
                mode = "normal"
                publish_data(client, mode)
                normal_cycles += 1
                
                # Switch to critical after 4-5 normal cycles
                if normal_cycles >= random.randint(4, 5):
                    is_critical_mode = True
                    normal_cycles = 0
                    print(f"\n{'⚠️ '*20}")
                    print(f"⚠️  SWITCHING TO CRITICAL MODE (RED VALUES)")
                    print(f"{'⚠️ '*20}\n")
            else:
                # Critical mode: 1-2 cycles
                mode = "critical"
                publish_data(client, mode)
                critical_cycles += 1
                
                # Switch back to normal after 1-2 critical cycles
                if critical_cycles >= random.randint(1, 2):
                    is_critical_mode = False
                    critical_cycles = 0
                    print(f"\n{'✅ '*20}")
                    print(f"✅ SWITCHING TO NORMAL MODE (GREEN VALUES)")
                    print(f"{'✅ '*20}\n")
            
            time.sleep(3)
            
    except KeyboardInterrupt:
        print(f"\n\n🛑 Test stopped by user")
        print(f"Total cycles: {cycle_count}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("\n✅ Disconnected from MQTT broker\n")

if __name__ == "__main__":
    main()
