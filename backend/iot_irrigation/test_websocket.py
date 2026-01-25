"""
WebSocket Test Script
Tests the IoT WebSocket endpoint directly
"""

import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/iot/ws/telemetry/farm_001"
    
    print(f"🔌 Connecting to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket!")
            
            # Send ping
            await websocket.send("ping")
            print("📤 Sent: ping")
            
            # Receive pong
            response = await websocket.recv()
            print(f"📥 Received: {response}")
            
            # Wait for sensor data
            print("\n⏳ Waiting for sensor data...")
            for i in range(5):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    if message != "pong":
                        data = json.loads(message)
                        print(f"\n📨 Sensor Data #{i+1}:")
                        print(json.dumps(data, indent=2))
                except asyncio.TimeoutError:
                    print(f"⏱️  Timeout waiting for message #{i+1}")
                    break
                    
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Connection rejected: {e}")
        print(f"   Status code: {e.status_code}")
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    print("="*60)
    print("WebSocket Connection Test")
    print("="*60)
    asyncio.run(test_websocket())
    print("\n" + "="*60)
