"""
ESP32 Simulator for HiveMQ Cloud
Simulates ESP32 sending sensor data and receiving actuation commands
"""

import paho.mqtt.client as mqtt
import ssl
import json
import time
import random
from datetime import datetime

# HiveMQ Cloud Configuration
HIVEMQ_HOST = "e17116d0063a4e08bab15c1ff2a00fcc.s1.eu.hivemq.cloud"
HIVEMQ_PORT = 8883
HIVEMQ_USER = "farm_user"
HIVEMQ_PASS = "Yug@2809"

# MQTT Topics
TELEMETRY_TOPIC = "farm/telemetry"
COMMAND_TOPIC = "farm/+/commands"
SYSTEM_STATUS_TOPIC = "farm/system/status"

# Simulated hardware state
irrigation_state = False
fertilization_state = False

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"\n{'='*70}")
        print("✅ ESP32 SIMULATOR CONNECTED TO HIVEMQ CLOUD")
        print(f"{'='*70}")
        print(f"Host: {HIVEMQ_HOST}")
        print(f"Port: {HIVEMQ_PORT}")
        print(f"{'='*70}\n")
        
        # Subscribe to command topics
        client.subscribe(COMMAND_TOPIC, qos=1)
        print(f"📡 Subscribed to: {COMMAND_TOPIC}")
        
        # Subscribe to system status
        client.subscribe(SYSTEM_STATUS_TOPIC, qos=1)
        print(f"📡 Subscribed to: {SYSTEM_STATUS_TOPIC}")
        
        # Send initial status
        send_status_message(client, "ESP32 Simulator Online")
    else:
        error_messages = {
            1: "Incorrect protocol version",
            2: "Invalid client identifier",
            3: "Server unavailable",
            4: "Bad username or password",
            5: "Not authorized"
        }
        error_msg = error_messages.get(rc, f"Unknown error code: {rc}")
        print(f"❌ Connection failed: {error_msg}")

def on_disconnect(client, userdata, rc):
    """Callback when disconnected"""
    if rc != 0:
        print(f"⚠️ Unexpected disconnection. Code: {rc}")

def on_message(client, userdata, msg):
    """Callback when a message is received"""
    global irrigation_state, fertilization_state
    
    try:
        payload = json.loads(msg.payload.decode())
        
        print(f"\n📨 Message received on: {msg.topic}")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        
        # Handle system status messages
        if msg.topic == SYSTEM_STATUS_TOPIC:
            if payload.get("type") == "BACKEND_ONLINE":
                print(f"   🎉 Backend is online: {payload.get('message')}")
            return
        
        # Handle actuation commands
        if payload.get("type") == "ACTUATE":
            device = payload.get("device")
            state = payload.get("state")
            
            if device == "irrigation":
                irrigation_state = (state == 1)
                print(f"   💧 Irrigation: {'ON' if irrigation_state else 'OFF'}")
                
                # Send acknowledgement
                send_status_ack(client, "irrigation", irrigation_state)
                
            elif device == "fertilization":
                fertilization_state = (state == 1)
                print(f"   🌿 Fertilization: {'ON' if fertilization_state else 'OFF'}")
                
                # Send acknowledgement
                send_status_ack(client, "fertilization", fertilization_state)
                
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON: {msg.payload.decode()}")
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def send_status_message(client, message):
    """Send status message"""
    status_msg = json.dumps({
        "type": "ESP32_STATUS",
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    client.publish(SYSTEM_STATUS_TOPIC, status_msg, qos=1)
    print(f"📤 Status sent: {message}")

def send_status_ack(client, device, state):
    """Send status acknowledgement"""
    ack_msg = json.dumps({
        "type": "STATUS",
        "device": device,
        "state": 1 if state else 0,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    client.publish(TELEMETRY_TOPIC, ack_msg, qos=1)
    print(f"   ✅ ACK sent: {device} = {'ON' if state else 'OFF'}")

def generate_sensor_data():
    """Generate simulated sensor data"""
    return {
        "moisture": round(random.uniform(20, 80), 1),
        "temp": round(random.uniform(18, 35), 1),
        "humidity": round(random.uniform(30, 90), 1),
        "npk": random.randint(50, 800),
        "wind_speed": round(random.uniform(0, 30), 1),
        "ec_salinity": round(random.uniform(0.5, 3.5), 2),
        "soil_ph": round(random.uniform(5.5, 8.0), 1),
        "farm_id": "farm_001",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def send_telemetry(client):
    """Send sensor telemetry data"""
    data = generate_sensor_data()
    payload = json.dumps(data)
    
    result = client.publish(TELEMETRY_TOPIC, payload, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"\n📡 Telemetry sent:")
        print(f"   💧 Moisture: {data['moisture']}%")
        print(f"   🌡️  Temp: {data['temp']}°C")
        print(f"   💨 Humidity: {data['humidity']}%")
        print(f"   🟢 NPK: {data['npk']}")
        print(f"   🌬️  Wind: {data['wind_speed']} km/h")
        print(f"   🧂 EC: {data['ec_salinity']} dS/m")
        print(f"   🧪 pH: {data['soil_ph']}")
    else:
        print(f"❌ Failed to send telemetry")

def main():
    """Main ESP32 simulator loop"""
    print("\n" + "="*70)
    print("ESP32 SIMULATOR - HiveMQ Cloud Edition")
    print("="*70)
    print("Simulates ESP32 hardware for testing")
    print("- Sends sensor data every 5 seconds")
    print("- Receives and executes actuation commands")
    print("- Sends status acknowledgements")
    print("="*70 + "\n")
    
    # Create MQTT client
    client = mqtt.Client(
        client_id="esp32-simulator-" + str(random.randint(1000, 9999)),
        clean_session=True,
        protocol=mqtt.MQTTv311
    )
    
    # Set callbacks
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    # Set credentials
    client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASS)
    
    # Enable TLS
    client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
    client.tls_insecure_set(True)
    
    # Connect
    print(f"🔌 Connecting to HiveMQ Cloud...")
    try:
        client.connect(HIVEMQ_HOST, HIVEMQ_PORT, keepalive=60)
        client.loop_start()
        
        # Wait for connection
        time.sleep(2)
        
        # Main loop - send telemetry every 5 seconds
        print("\n🚀 Starting telemetry loop (Ctrl+C to stop)...\n")
        
        cycle = 0
        while True:
            # maintain connection
            if not client.is_connected():
                print("⚠️ Disconnected, attempting reconnect...")
                try:
                    client.reconnect()
                    time.sleep(1)
                except:
                    time.sleep(5)
                    continue

            cycle += 1
            print(f"\n{'─'*70}")
            print(f"Cycle #{cycle}")
            print(f"{'─'*70}")
            
            # Send telemetry
            send_telemetry(client)
            
            # Show current actuator states
            print(f"\n🎛️  Current States:")
            print(f"   💧 Irrigation: {'🟢 ON' if irrigation_state else '⚫ OFF'}")
            print(f"   🌿 Fertilization: {'🟢 ON' if fertilization_state else '⚫ OFF'}")
            
            # Wait 5 seconds
            time.sleep(5)
            
    except KeyboardInterrupt:
        print(f"\n\n🛑 Stopping ESP32 simulator...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.loop_stop()
        client.disconnect()
        print("✅ Disconnected from HiveMQ Cloud")
        print("="*70 + "\n")

if __name__ == "__main__":
    main()
