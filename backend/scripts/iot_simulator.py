import os
import json
import time
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../../.env")

MQTT_BROKER = os.getenv("MQTT_BROKER_URL")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")

# Assuming the demo farmer ID from your .env for demonstration
FARM_ID = os.getenv("DEMO_FARMER_ID", "demo-farm-001")
TOPIC = f"smartfarm/{FARM_ID}/sensors"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Connected to HiveMQ Cloud!")
        print(f"📡 Publishing simulated sensor data to topic: {TOPIC}...\n")
    else:
        print(f"❌ Failed to connect, return code {rc}")

def simulate_data():
    client = mqtt.Client(client_id="SimulatorNode")
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.tls_set() # Crucial for HiveMQ secure connection
    client.on_connect = on_connect

    print(f"⏳ Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()

    # Initial baseline values
    moisture = 45.0
    temp = 28.0
    humidity = 60.0
    npk = {"n": 120, "p": 45, "k": 30}

    try:
        while True:
            # Add some realistic random fluctuation
            moisture = max(0, min(100, moisture + random.uniform(-2, 2)))
            temp = max(10, min(50, temp + random.uniform(-0.5, 0.5)))
            humidity = max(20, min(100, humidity + random.uniform(-1, 1)))
            npk["n"] = max(0, npk["n"] + int(random.uniform(-5, 5)))
            npk["p"] = max(0, npk["p"] + int(random.uniform(-2, 2)))
            npk["k"] = max(0, npk["k"] + int(random.uniform(-2, 2)))

            payload = {
                "farm_id": FARM_ID,
                "moisture": round(moisture, 2),
                "temp": round(temp, 2),
                "humidity": round(humidity, 2),
                "npk": npk,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }

            print(f"📤 Sending: {json.dumps(payload)}")
            client.publish(TOPIC, json.dumps(payload))
            
            # Wait 5 seconds before sending next reading
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    simulate_data()
