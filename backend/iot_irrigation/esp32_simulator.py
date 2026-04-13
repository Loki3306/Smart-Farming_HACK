"""
ESP32 Simulator with Actuation Support
Simulates ESP32 hardware with:
- Sensor data publishing (telemetry)
- Command subscription (actuation)
- LED state management (GPIO 18, 19)
- Acknowledgement feedback loop
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
COMMAND_TOPIC = "farm/+/commands"  # Subscribe to all farm commands
FARM_ID = "farm_001"

# GPIO LED States (simulated)
gpio_states = {
    "irrigation": False,    # GPIO 18
    "fertilization": False  # GPIO 19
}

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f" ESP32 Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f" Publishing telemetry to: {TELEMETRY_TOPIC}")
        print(f" Subscribed to commands: {COMMAND_TOPIC}")
        
        # Subscribe to command topic
        client.subscribe(COMMAND_TOPIC, qos=1)
    else:
        print(f" Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback when command message is received"""
    try:
        payload = msg.payload.decode('utf-8')
        data = json.loads(payload)
        
        print(f"\n{'='*70}")
        print(f" COMMAND RECEIVED on {msg.topic}")
        print(f"{'='*70}")
        print(f"   Type: {data.get('type')}")
        print(f"   Device: {data.get('device')}")
        print(f"   State: {data.get('state')}")
        print(f"   Timestamp: {data.get('timestamp')}")
        
        # Process actuation command
        if data.get('type') == 'ACTUATE':
            device = data.get('device')
            state = data.get('state')
            
            if device in gpio_states:
                # Update GPIO state
                gpio_states[device] = (state == 1)
                
                print(f"\n GPIO UPDATE:")
                print(f"   Device: {device}")
                print(f"   GPIO: {'18' if device == 'irrigation' else '19'}")
                print(f"   State: {'ON (HIGH)' if gpio_states[device] else 'OFF (LOW)'}")
                print(f"   LED: {' GLOWING' if gpio_states[device] else ' OFF'}")
                
                # Send acknowledgement back to backend
                send_acknowledgement(client, device, gpio_states[device])
            else:
                print(f" Unknown device: {device}")
        
        print(f"{'='*70}\n")
        
    except Exception as e:
        print(f" Error processing command: {e}")

def send_acknowledgement(client, device, state):
    """Send acknowledgement to backend via telemetry"""
    ack_payload = {
        "type": "STATUS",
        device: "ON" if state else "OFF",
        "farm_id": FARM_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    client.publish(TELEMETRY_TOPIC, json.dumps(ack_payload), qos=1)
    
    print(f" Acknowledgement sent: {device}={ack_payload[device]}")

def generate_sensor_data():
    """Generate simulated sensor data"""
    moisture = random.uniform(40, 60)
    temp = random.uniform(20, 28)
    humidity = random.uniform(40, 90)
    npk = random.randint(0, 1023)
    ec_salinity = random.uniform(0.5, 3.5)
    wind_speed = random.uniform(0, 35)
    soil_ph = random.uniform(5.5, 8.5)
    
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

def publish_sensor_data(client):
    """Publish sensor data to MQTT"""
    data = generate_sensor_data()
    payload = json.dumps(data)
    
    result = client.publish(TELEMETRY_TOPIC, payload, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"\n Telemetry Published:")
        print(f"    Moisture: {data['moisture']}%")
        print(f"     Temp: {data['temp']}C")
        print(f"    Humidity: {data['humidity']}%")
        print(f"    EC: {data['ec_salinity']} dS/m")
        print(f"     Wind: {data['wind_speed']} km/h")
        print(f"    pH: {data['soil_ph']}")
        print(f"    Irrigation LED: {'' if gpio_states['irrigation'] else ''}")
        print(f"    Fertilization LED: {'' if gpio_states['fertilization'] else ''}")

def main():
    """Main ESP32 simulator"""
    print("="*70)
    print("ESP32 SIMULATOR - Hybrid Actuation Bridge")
    print("="*70)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Telemetry Topic: {TELEMETRY_TOPIC}")
    print(f"Command Topic: {COMMAND_TOPIC}")
    print(f"Farm ID: {FARM_ID}")
    print("\nGPIO Mapping:")
    print("  - GPIO 18: Irrigation LED")
    print("  - GPIO 19: Fertilization LED")
    print("="*70)
    
    # Create MQTT client
    client = mqtt.Client(client_id=f"esp32_simulator_{FARM_ID}")
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Connect to broker
    try:
        print(f"\n Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1)
        
        print("\n ESP32 Simulator Running")
        print("   - Publishing sensor data every 3 seconds")
        print("   - Listening for actuation commands")
        print("   - Press Ctrl+C to stop\n")
        
        # Main loop
        count = 0
        while True:
            count += 1
            print(f"\n--- Cycle #{count} ---")
            publish_sensor_data(client)
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\n\n ESP32 Simulator stopped by user")
    except Exception as e:
        print(f" Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print(" Disconnected from MQTT broker")

if __name__ == "__main__":
    main()
