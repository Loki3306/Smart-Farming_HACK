"""
Quick HiveMQ Cloud Connection Test
Tests TLS connection to HiveMQ Cloud with insecure mode
"""

import paho.mqtt.client as mqtt
import ssl
import time

# HiveMQ Cloud Configuration
HIVEMQ_HOST = "e17116d0063a4e08bab15c1ff2a00fcc.s1.eu.hivemq.cloud"
HIVEMQ_PORT = 8883
HIVEMQ_USER = "farm_user"
HIVEMQ_PASS = "Yug@2809"

connected = False

def on_connect(client, userdata, flags, rc):
    global connected
    if rc == 0:
        connected = True
        print(f"✅ Connected to HiveMQ Cloud!")
        print(f"   Host: {HIVEMQ_HOST}")
        print(f"   Port: {HIVEMQ_PORT}")
        print(f"   User: {HIVEMQ_USER}")
    else:
        error_messages = {
            1: "Incorrect protocol version",
            2: "Invalid client identifier",
            3: "Server unavailable",
            4: "Bad username or password",
            5: "Not authorized",
            7: "Connection refused"
        }
        error_msg = error_messages.get(rc, f"Unknown error code: {rc}")
        print(f"❌ Connection failed: {error_msg}")

def on_disconnect(client, userdata, rc):
    global connected
    connected = False
    if rc != 0:
        print(f"⚠️ Unexpected disconnection. Code: {rc}")

print("="*70)
print("HiveMQ Cloud Connection Test")
print("="*70)
print(f"Host: {HIVEMQ_HOST}")
print(f"Port: {HIVEMQ_PORT}")
print(f"User: {HIVEMQ_USER}")
print("="*70)

# Create client
client = mqtt.Client(client_id="test-client-123", clean_session=True, protocol=mqtt.MQTTv311)

# Set callbacks
client.on_connect = on_connect
client.on_disconnect = on_disconnect

# Set credentials
client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASS)
print("🔐 Credentials set")

# Enable TLS with insecure mode (skip certificate verification)
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.tls_insecure_set(True)
print("🔒 TLS v1.2 enabled (insecure mode)")

# Connect
print(f"\n🔌 Connecting to {HIVEMQ_HOST}:{HIVEMQ_PORT}...")
try:
    client.connect(HIVEMQ_HOST, HIVEMQ_PORT, keepalive=60)
    client.loop_start()
    
    # Wait for connection
    max_wait = 10
    elapsed = 0
    while not connected and elapsed < max_wait:
        time.sleep(0.5)
        elapsed += 0.5
        print(".", end="", flush=True)
    
    print()
    
    if connected:
        print("\n✅ Connection successful!")
        print("   Keeping connection alive for 5 seconds...")
        time.sleep(5)
    else:
        print(f"\n❌ Connection timeout after {max_wait}s")
        
except Exception as e:
    print(f"\n❌ Connection error: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.loop_stop()
    client.disconnect()
    print("\n🛑 Disconnected")
    print("="*70)
