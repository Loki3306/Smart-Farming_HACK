"""
Automated Actuation Test Script
Sends irrigation and fertilization commands every 30 seconds
Alternates between ON and OFF states for testing
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/iot"
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"
INTERVAL_SECONDS = 10

# State tracking
irrigation_state = False
fertilization_state = False

def send_actuation_command(action, value, mode="manual"):
    """Send actuation command to backend"""
    url = f"{BASE_URL}/control"
    
    payload = {
        "farm_id": FARM_ID,
        "action": action,
        "value": value,
        "mode": mode,
        "reason": f"Automated test - {action} {'ON' if value else 'OFF'}",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        
        status_icon = "✅" if response.status_code == 200 else "❌"
        state_icon = "🟢" if value else "⚫"
        
        print(f"\n{status_icon} {action.upper()}: {state_icon} {'ON' if value else 'OFF'}")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Message: {data.get('message', 'Success')}")
        elif response.status_code == 403:
            data = response.json()
            print(f"   🚫 BLOCKED: {data.get('detail', 'Safety lock active')}")
        else:
            print(f"   Error: {response.text}")
            
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR: Cannot connect to backend at {BASE_URL}")
        print(f"   Make sure the backend is running: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def print_header():
    """Print script header"""
    print("\n" + "="*70)
    print("🎛️  AUTOMATED ACTUATION TEST SCRIPT")
    print("="*70)
    print(f"Backend URL: {BASE_URL}")
    print(f"Farm ID: {FARM_ID}")
    print(f"Interval: {INTERVAL_SECONDS} seconds")
    print(f"Mode: Alternating ON/OFF")
    print("="*70)
    print("\nCommands will be sent in this pattern:")
    print("  1. Irrigation ON")
    print("  2. Wait 30s")
    print("  3. Irrigation OFF")
    print("  4. Wait 30s")
    print("  5. Fertilization ON")
    print("  6. Wait 30s")
    print("  7. Fertilization OFF")
    print("  8. Wait 30s")
    print("  9. Repeat...")
    print("\nPress Ctrl+C to stop\n")
    print("="*70)

def main():
    """Main loop"""
    global irrigation_state, fertilization_state
    
    print_header()
    
    cycle = 0
    
    try:
        while True:
            cycle += 1
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            print(f"\n{'='*70}")
            print(f"🔄 CYCLE #{cycle} - {timestamp}")
            print(f"{'='*70}")
            
            # Determine what to toggle this cycle
            if cycle % 4 == 1:
                # Cycle 1, 5, 9, ... : Turn ON Irrigation
                action = "irrigation"
                value = True
                irrigation_state = True
            elif cycle % 4 == 2:
                # Cycle 2, 6, 10, ... : Turn OFF Irrigation
                action = "irrigation"
                value = False
                irrigation_state = False
            elif cycle % 4 == 3:
                # Cycle 3, 7, 11, ... : Turn ON Fertilization
                action = "fertilization"
                value = True
                fertilization_state = True
            else:
                # Cycle 4, 8, 12, ... : Turn OFF Fertilization
                action = "fertilization"
                value = False
                fertilization_state = False
            
            # Send command
            success = send_actuation_command(action, value)
            
            # Display current states
            print(f"\n📊 Current States:")
            print(f"   Irrigation:     {'🟢 ON' if irrigation_state else '⚫ OFF'}")
            print(f"   Fertilization:  {'🟢 ON' if fertilization_state else '⚫ OFF'}")
            
            # Wait for next cycle
            print(f"\n⏳ Waiting {INTERVAL_SECONDS} seconds until next command...")
            print(f"   Next cycle at: {datetime.fromtimestamp(time.time() + INTERVAL_SECONDS).strftime('%H:%M:%S')}")
            
            time.sleep(INTERVAL_SECONDS)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*70)
        print("🛑 SCRIPT STOPPED BY USER")
        print("="*70)
        print(f"\nTotal Cycles Completed: {cycle}")
        print(f"Final States:")
        print(f"   Irrigation:     {'🟢 ON' if irrigation_state else '⚫ OFF'}")
        print(f"   Fertilization:  {'🟢 ON' if fertilization_state else '⚫ OFF'}")
        print("\n✅ Cleanup complete. Exiting...\n")

if __name__ == "__main__":
    main()
