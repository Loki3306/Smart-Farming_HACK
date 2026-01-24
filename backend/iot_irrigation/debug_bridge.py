"""
Debug WebSocket Bridge Script
Simulates the exact WebSocket handshake that the React frontend performs
Tests the WebSocket connection without opening a browser
"""

import asyncio
import websockets
import json
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "ws://localhost:8000"
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"  # Frontend UUID
WEBSOCKET_URI = f"{BACKEND_URL}/iot/ws/telemetry/{FARM_ID}"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


async def test_websocket_connection():
    """
    Test WebSocket connection exactly as React frontend does
    """
    print(f"\n{Colors.HEADER}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}🧪 WebSocket Bridge Debug Tool{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*70}{Colors.ENDC}\n")
    
    print(f"{Colors.OKCYAN}📡 Target:{Colors.ENDC} {WEBSOCKET_URI}")
    print(f"{Colors.OKCYAN}🏷️  Farm ID:{Colors.ENDC} {FARM_ID}")
    print(f"{Colors.OKCYAN}⏰ Time:{Colors.ENDC} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        print(f"{Colors.WARNING}🔌 Attempting WebSocket connection...{Colors.ENDC}")
        
        async with websockets.connect(
            WEBSOCKET_URI,
            ping_interval=20,  # Send ping every 20 seconds
            ping_timeout=10,   # Wait 10 seconds for pong
            close_timeout=5    # Wait 5 seconds for close handshake
        ) as websocket:
            
            print(f"{Colors.OKGREEN}✅ WebSocket connected successfully!{Colors.ENDC}\n")
            print(f"{Colors.OKBLUE}Connection State:{Colors.ENDC}")
            print(f"  - Protocol: {websocket.subprotocol or 'None'}")
            print(f"  - Remote Address: {websocket.remote_address}")
            print(f"  - Local Address: {websocket.local_address}")
            print(f"  - Open: {websocket.open}\n")
            
            print(f"{Colors.WARNING}📥 Waiting for messages... (Press Ctrl+C to stop){Colors.ENDC}\n")
            
            message_count = 0
            heartbeat_count = 0
            
            # Listen for messages
            async for message in websocket:
                try:
                    # Try to parse as JSON
                    data = json.loads(message)
                    message_count += 1
                    
                    print(f"\n{Colors.HEADER}{'='*70}{Colors.ENDC}")
                    print(f"{Colors.OKGREEN}📨 MESSAGE #{message_count} - {datetime.now().strftime('%H:%M:%S')}{Colors.ENDC}")
                    print(f"{Colors.HEADER}{'='*70}{Colors.ENDC}")
                    
                    # Check message type
                    msg_type = data.get("type", "unknown")
                    print(f"{Colors.OKCYAN}Type:{Colors.ENDC} {msg_type}")
                    
                    if msg_type == "sensor_update" or msg_type == "initial_data":
                        sensor_data = data.get("data", {})
                        print(f"\n{Colors.BOLD}Sensor Data:{Colors.ENDC}")
                        print(f"  📍 Farm ID:        {sensor_data.get('farm_id', 'N/A')}")
                        print(f"  💧 Moisture:       {sensor_data.get('moisture', 0)}%")
                        print(f"  🌡️  Temperature:    {sensor_data.get('temperature', 0)}°C")
                        print(f"  💨 Humidity:       {sensor_data.get('humidity', 0)}%")
                        print(f"  🟢 Nitrogen:       {sensor_data.get('nitrogen', 0)} ppm")
                        print(f"  🟡 Phosphorus:     {sensor_data.get('phosphorus', 0)} ppm")
                        print(f"  🔵 Potassium:      {sensor_data.get('potassium', 0)} ppm")
                        print(f"  ⏰ Timestamp:      {sensor_data.get('timestamp', 'N/A')}")
                    
                    elif msg_type == "irrigation_triggered":
                        print(f"\n{Colors.WARNING}💧 IRRIGATION EVENT{Colors.ENDC}")
                        print(f"  Reason: {data.get('reason', 'N/A')}")
                        print(f"  Time: {data.get('timestamp', 'N/A')}")
                    
                    else:
                        print(f"\n{Colors.WARNING}Raw Data:{Colors.ENDC}")
                        print(json.dumps(data, indent=2))
                    
                    print(f"{Colors.HEADER}{'='*70}{Colors.ENDC}")
                    
                    # Send heartbeat ping every 5 messages
                    if message_count % 5 == 0:
                        heartbeat_count += 1
                        await websocket.send("ping")
                        print(f"\n{Colors.OKCYAN}💓 Heartbeat #{heartbeat_count} sent{Colors.ENDC}")
                
                except json.JSONDecodeError:
                    # Handle non-JSON messages (like pong)
                    if message == "pong":
                        print(f"{Colors.OKGREEN}💓 Heartbeat acknowledged (pong received){Colors.ENDC}")
                    else:
                        print(f"{Colors.WARNING}⚠️  Non-JSON message: {message}{Colors.ENDC}")
                
                except Exception as e:
                    print(f"{Colors.FAIL}❌ Error processing message: {e}{Colors.ENDC}")
    
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"\n{Colors.FAIL}❌ WebSocket connection rejected!{Colors.ENDC}")
        print(f"{Colors.FAIL}Status Code: {e.status_code}{Colors.ENDC}")
        print(f"{Colors.FAIL}Headers: {e.headers}{Colors.ENDC}\n")
        
        if e.status_code == 403:
            print(f"{Colors.WARNING}🔍 Diagnosis: 403 Forbidden{Colors.ENDC}")
            print("Possible causes:")
            print("  1. MQTT broker not running (start: mosquitto -v)")
            print("  2. Backend MQTT client not connected")
            print("  3. CORS/WebSocket middleware misconfiguration")
            print("  4. Farm ID not recognized by backend")
            print("\nRecommended actions:")
            print("  1. Check backend logs for MQTT connection status")
            print("  2. Verify mosquitto is running: netstat -ano | findstr :1883")
            print("  3. Restart backend: uvicorn app.main:app --reload")
        
        return False
    
    except websockets.exceptions.WebSocketException as e:
        print(f"\n{Colors.FAIL}❌ WebSocket error: {e}{Colors.ENDC}\n")
        print("Possible issues:")
        print("  1. Backend not running (start: uvicorn app.main:app --reload)")
        print("  2. Wrong URL or port")
        print("  3. Network/firewall blocking connection")
        return False
    
    except ConnectionRefusedError:
        print(f"\n{Colors.FAIL}❌ Connection refused!{Colors.ENDC}\n")
        print("Backend is not running. Start it with:")
        print("  cd c:\\code\\Smart-Farming_HACK\\backend")
        print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return False
    
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}👋 Test stopped by user{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✅ Connection was stable. Total messages received: {message_count}{Colors.ENDC}\n")
        return True
    
    except Exception as e:
        print(f"\n{Colors.FAIL}❌ Unexpected error: {e}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        return False


async def test_connection_only():
    """
    Quick test: Just connect and disconnect
    """
    print(f"\n{Colors.OKCYAN}🔍 Quick Connection Test{Colors.ENDC}")
    try:
        async with websockets.connect(WEBSOCKET_URI, ping_interval=None) as ws:
            print(f"{Colors.OKGREEN}✅ Connection successful!{Colors.ENDC}")
            print(f"  State: {ws.open}")
            print(f"  Remote: {ws.remote_address}")
            return True
    except Exception as e:
        print(f"{Colors.FAIL}❌ Connection failed: {e}{Colors.ENDC}")
        return False


def print_menu():
    """Print test menu"""
    print(f"\n{Colors.BOLD}Select Test Mode:{Colors.ENDC}")
    print("  1. Full WebSocket Test (listen for messages)")
    print("  2. Quick Connection Test (connect and disconnect)")
    print("  3. Exit")
    print()


if __name__ == "__main__":
    print(f"\n{Colors.HEADER}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}WebSocket-MQTT Bridge Debug Tool{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*70}{Colors.ENDC}")
    
    if len(sys.argv) > 1:
        # Command line argument mode
        if sys.argv[1] == "quick":
            asyncio.run(test_connection_only())
        elif sys.argv[1] == "full":
            asyncio.run(test_websocket_connection())
        else:
            print(f"{Colors.FAIL}Unknown argument: {sys.argv[1]}{Colors.ENDC}")
            print("Usage: python debug_bridge.py [quick|full]")
    else:
        # Interactive mode
        while True:
            print_menu()
            choice = input(f"{Colors.OKCYAN}Enter choice (1-3): {Colors.ENDC}").strip()
            
            if choice == "1":
                asyncio.run(test_websocket_connection())
            elif choice == "2":
                asyncio.run(test_connection_only())
            elif choice == "3":
                print(f"\n{Colors.OKGREEN}👋 Goodbye!{Colors.ENDC}\n")
                break
            else:
                print(f"{Colors.FAIL}Invalid choice. Please enter 1, 2, or 3.{Colors.ENDC}")
