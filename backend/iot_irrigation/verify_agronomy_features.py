
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

BROKER = "localhost"
PORT = 1883
TOPIC = "farm/telemetry"
FARM_ID = "farm_001"

def on_connect(client, userdata, flags, rc):
    print(f"🔌 Connected to MQTT Broker with result code {rc}")

client = mqtt.Client(client_id="verifier_bot")
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
    print(f"\n📨 SENT TEST PACKET: [{name}]")
    print(json.dumps(data, indent=2))
    time.sleep(5) # Wait for backend to process

# 1. Baseline (Normal)
send_packet("BASELINE - Normal Conditions", {
    "moisture": 55.0,
    "temp": 25.0,
    "humidity": 60.0,
    "ec_salinity": 1.5,
    "soil_ph": 6.8,
    "wind_speed": 10.0,
    "npk": 350
})

# 2. Phase 2 Verify: Acidic Lockout (pH < 5.5)
# Expect: Nutrient Status LOCKED, Reason: pH induced fixation
send_packet("PHASE 2 - ACIDIC LOCKOUT TRIGGER", {
    "moisture": 55.0,
    "temp": 25.0,
    "humidity": 60.0,
    "ec_salinity": 1.5,
    "soil_ph": 4.8, # < 5.5
    "wind_speed": 10.0,
    "npk": 350
})

# 3. Phase 2 Verify: Alkaline Lockout (pH > 7.5)
send_packet("PHASE 2 - ALKALINE LOCKOUT TRIGGER", {
    "moisture": 55.0,
    "temp": 25.0,
    "humidity": 60.0,
    "ec_salinity": 1.5,
    "soil_ph": 8.2, # > 7.5
    "wind_speed": 10.0,
    "npk": 350
})

# 4. Phase 1 Verify: High ET0 (High Temp, High Wind)
# Expect: High ET0 calc in FAO-56
send_packet("PHASE 1 - HIGH WATER DEMAND", {
    "moisture": 45.0,
    "temp": 38.0,   # High Temp
    "humidity": 20.0, # Low Humidity
    "ec_salinity": 1.5,
    "soil_ph": 6.8,
    "wind_speed": 25.0, # High Wind
    "npk": 350
})

print("\n✅ Verification Sequence Complete. Check Backend Logs for 'AI Decision Broadcast'.")
client.loop_stop()
client.disconnect()
