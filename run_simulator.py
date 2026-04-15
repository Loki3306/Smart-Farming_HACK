#!/usr/bin/env python
"""
Simple simulator runner that auto-fills the farm ID
"""
import os
import sys

# Set environment to handle Unicode properly
os.environ['PYTHONIOENCODING'] = 'utf-8'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import random
import time
from datetime import datetime
import aiohttp
import ssl

# Configuration
BACKEND_URL = "http://localhost:5000"
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"
MQTT_BROKER = "e17116d0063a4e08bab15c1ff2a00fcc.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "farm_user"
MQTT_PASSWORD = "Yug@2809"

async def send_sensor_data():
    """Send simulated sensor data"""
    print(f"\n[SIMULATOR] Starting for farm: {FARM_ID}")
    print("=" * 60)
    
    # Try MQTT first
    try:
        import paho.mqtt.client as mqtt
        
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        client.tls_set_context(ssl.create_default_context())
        client.tls_insecure_set(True)
        
        print(f"[MQTT] Connecting to {MQTT_BROKER}:{MQTT_PORT}")
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_start()
        
        print("[OK] MQTT connected")
        
        # Send 5 sensor readings
        for i in range(5):
            data = {
                "farm_id": FARM_ID,
                "moisture": 45.5 + random.uniform(-5, 5),
                "temp": 28.0 + random.uniform(-2, 2),
                "humidity": 65.0 + random.uniform(-10, 10),
                "npk": 500 + random.randint(-100, 100),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            import json
            payload = json.dumps(data)
            
            topic = "farm/telemetry"
            publish_result = client.publish(topic, payload, qos=1)
            publish_result.wait_for_publish(timeout=5)
            if publish_result.rc != mqtt.MQTT_ERR_SUCCESS:
                print(f"[ERROR] Publish failed with rc={publish_result.rc}")
                continue
            
            print(f"[{i+1}] Published sensor data: moisture={data['moisture']:.1f}%, temp={data['temp']:.1f}C")
            
            if i < 4:
                time.sleep(2)
        
        client.loop_stop()
        client.disconnect()
        print("\n[OK] Simulator completed successfully!")
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(send_sensor_data())
