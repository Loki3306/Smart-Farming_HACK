"""
Simple Automated Actuation - Every 30 Seconds
Toggles irrigation and fertilization ON/OFF automatically
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/iot"
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"
INTERVAL = 10  # seconds

def send_command(action, state):
    """Send actuation command"""
    url = f"{BASE_URL}/control"
    
    # Create proper payload
    payload = {
        "farm_id": FARM_ID,
        "action": action,
        "value": state,
        "mode": "manual"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            icon = "✅"
            msg = response.json().get('message', 'Success')
        elif response.status_code == 403:
            icon = "🚫"
            msg = f"BLOCKED: {response.json().get('detail', 'Safety lock')}"
        else:
            icon = "❌"
            msg = f"Error {response.status_code}: {response.text[:100]}"
        
        state_icon = "🟢" if state else "⚫"
        print(f"{icon} {action.upper()}: {state_icon} {'ON' if state else 'OFF'}")
        print(f"   {msg}")
        
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR: Cannot connect to {BASE_URL}")
        print(f"   Make sure backend is running!")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "="*70)
    print("🎛️  AUTOMATED ACTUATION TEST - EVERY 30 SECONDS")
    print("="*70)
    print(f"Backend: {BASE_URL}")
    print(f"Farm ID: {FARM_ID}")
    print(f"Interval: {INTERVAL} seconds")
    print("\nPattern:")
    print("  1. Turn ON both systems")
    print("  2. Wait 30 seconds")
    print("  3. Turn OFF both systems")
    print("  4. Wait 30 seconds")
    print("  5. Repeat...")
    print("\nPress Ctrl+C to stop")
    print("="*70 + "\n")
    
    state = False  # Start with OFF
    cycle = 0
    
    try:
        while True:
            cycle += 1
            state = not state  # Toggle: OFF → ON → OFF → ON ...
            
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            print(f"\n{'='*70}")
            print(f"🔄 CYCLE #{cycle} - {timestamp}")
            print(f"{'='*70}")
            print(f"Action: Turn {'🟢 ON' if state else '⚫ OFF'} both systems\n")
            
            # Send irrigation command
            success1 = send_command("irrigation", state)
            
            # Small delay between commands
            time.sleep(0.5)
            
            # Send fertilization command
            success2 = send_command("fertilization", state)
            
            # Display status
            print(f"\n📊 Status:")
            print(f"   Irrigation:     {'✅ Success' if success1 else '❌ Failed'}")
            print(f"   Fertilization:  {'✅ Success' if success2 else '❌ Failed'}")
            
            # Wait for next cycle
            next_time = datetime.fromtimestamp(time.time() + INTERVAL).strftime('%H:%M:%S')
            print(f"\n⏳ Waiting {INTERVAL} seconds...")
            print(f"   Next cycle at: {next_time}")
            
            time.sleep(INTERVAL)
            
    except KeyboardInterrupt:
        print(f"\n\n{'='*70}")
        print("🛑 SCRIPT STOPPED BY USER")
        print(f"{'='*70}")
        print(f"Total cycles completed: {cycle}")
        print(f"Final state: {'🟢 ON' if state else '⚫ OFF'}")
        print("\n✅ Exiting...\n")

if __name__ == "__main__":
    main()
