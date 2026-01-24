"""
Test Script for Hybrid Actuation Bridge
Tests the /control endpoint with various scenarios
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/iot"
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"

def test_control_endpoint(action, value, mode, reason="Test"):
    """Test the control endpoint"""
    url = f"{BASE_URL}/control"
    
    payload = {
        "farm_id": FARM_ID,
        "action": action,
        "value": value,
        "mode": mode,
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {action.upper()} - {'ON' if value else 'OFF'} ({mode} mode)")
    print(f"{'='*70}")
    print(f"Request: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ SUCCESS")
        elif response.status_code == 403:
            print("🚫 BLOCKED (Safety Lock)")
        else:
            print(f"❌ ERROR: {response.status_code}")
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
    
    print(f"{'='*70}\n")
    time.sleep(2)

def main():
    print("\n" + "="*70)
    print("🎛️  HYBRID ACTUATION BRIDGE - TEST SUITE")
    print("="*70)
    print(f"Backend URL: {BASE_URL}")
    print(f"Farm ID: {FARM_ID}")
    print("="*70)
    
    # Test 1: Manual Irrigation ON
    test_control_endpoint(
        action="irrigation",
        value=True,
        mode="manual",
        reason="Test: Manual irrigation activation"
    )
    
    # Test 2: Manual Irrigation OFF
    test_control_endpoint(
        action="irrigation",
        value=False,
        mode="manual",
        reason="Test: Manual irrigation deactivation"
    )
    
    # Test 3: Manual Fertilization ON (may be blocked by wind)
    test_control_endpoint(
        action="fertilization",
        value=True,
        mode="manual",
        reason="Test: Manual fertilization activation (wind check)"
    )
    
    # Test 4: Manual Fertilization OFF
    test_control_endpoint(
        action="fertilization",
        value=False,
        mode="manual",
        reason="Test: Manual fertilization deactivation"
    )
    
    # Test 5: Auto Mode Irrigation
    test_control_endpoint(
        action="irrigation",
        value=True,
        mode="auto",
        reason="Test: Auto mode irrigation"
    )
    
    # Test 6: Auto Mode Fertilization
    test_control_endpoint(
        action="fertilization",
        value=True,
        mode="auto",
        reason="Test: Auto mode fertilization"
    )
    
    print("\n" + "="*70)
    print("✅ TEST SUITE COMPLETE")
    print("="*70)
    print("\n📊 Expected Results:")
    print("   - Irrigation commands: Should succeed (200)")
    print("   - Fertilization commands: May be blocked if wind > 20 km/h (403)")
    print("   - Check ESP32 simulator for GPIO updates")
    print("   - Check Supabase for audit trail entries")
    print("\n")

if __name__ == "__main__":
    main()
