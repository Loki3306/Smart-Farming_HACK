"""
WebSocket Test Client - Verify Frontend Data Flow
This script connects to the WebSocket endpoint and displays received sensor data
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket():
    uri = "ws://localhost:8000/iot/ws/telemetry/farm_001"
    
    print("="*70)
    print("🧪 WebSocket Test Client")
    print("="*70)
    print(f"📡 Connecting to: {uri}")
    print("="*70 + "\n")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!\n")
            print("Waiting for sensor data... (Press Ctrl+C to stop)\n")
            
            # Listen for messages
            message_count = 0
            async for message in websocket:
                message_count += 1
                data = json.loads(message)
                
                print("\n" + "="*70)
                print(f"📨 MESSAGE #{message_count} - {datetime.now().strftime('%H:%M:%S')}")
                print("="*70)
                
                if data.get("type") == "sensor_update":
                    sensor_data = data.get("data", {})
                    print(f"📍 Farm ID:        {sensor_data.get('farm_id', 'N/A')}")
                    print(f"💧 Moisture:       {sensor_data.get('moisture', 0)}%")
                    print(f"🌡️  Temperature:    {sensor_data.get('temperature', 0)}°C")
                    print(f"💨 Humidity:       {sensor_data.get('humidity', 0)}%")
                    print(f"🟢 Nitrogen:       {sensor_data.get('nitrogen', 0)} ppm")
                    print(f"🟡 Phosphorus:     {sensor_data.get('phosphorus', 0)} ppm")
                    print(f"🔵 Potassium:      {sensor_data.get('potassium', 0)} ppm")
                    print(f"⏰ Timestamp:      {sensor_data.get('timestamp', 'N/A')}")
                else:
                    print(f"Message type: {data.get('type')}")
                    print(f"Data: {json.dumps(data, indent=2)}")
                
                print("="*70)
                
    except websockets.exceptions.WebSocketException as e:
        print(f"\n❌ WebSocket error: {e}")
        print("\nPossible issues:")
        print("  1. Backend not running (start: uvicorn app.main:app --reload)")
        print("  2. MQTT broker not running (start: mosquitto -v)")
        print("  3. Wrong farm_id in URL")
    except KeyboardInterrupt:
        print("\n\n👋 Test stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("\n🚀 Starting WebSocket test...\n")
    asyncio.run(test_websocket())
