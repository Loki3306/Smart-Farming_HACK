"""
Test script to verify FastAPI recommendations endpoint
"""

import requests
import json

# API endpoint
url = "http://localhost:8000/api/recommendations/predict"

# Test data - simulating low nitrogen and moisture
test_request = {
    "farm_id": "farm_test_001",
    "crop_type": "Rice",
    "soil_type": "Clay loam",
    "sensor_data": {
        "moisture": 35,
        "temperature": 28,
        "humidity": 62,
        "nitrogen": 38,
        "phosphorus": 15,
        "potassium": 120,
        "ph": 6.5,
        "ec": 1.2,
        "rainfall": 0
    },
    "weather_condition": "Sunny"
}

print("🧪 Testing Smart Farming AI API...")
print("📤 Sending request to:", url)
print()

try:
    response = requests.post(url, json=test_request)
    
    if response.status_code == 200:
        print("✅ API Response: SUCCESS")
        print()
        
        data = response.json()
        
        print(f"🌾 Farm ID: {data['farm_id']}")
        print(f"📊 Recommendations Generated: {len(data['recommendations'])}")
        print(f"⏰ Generated At: {data['generated_at']}")
        print()
        print("="* 60)
        print("RECOMMENDATIONS:")
        print("="* 60)
        
        for i, rec in enumerate(data['recommendations'], 1):
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            print(f"\n{i}. [{priority_emoji.get(rec['priority'], '⚪')} {rec['priority'].upper()}] {rec['title']}")
            print(f"   Type: {rec['type']}")
            print(f"   Confidence: {rec['confidence']}%")
            print(f"   Description: {rec['description']}")
            print(f"   Action: {rec['action']}")
        
        print("\n" + "="* 60)
        print("✅ Phase 1 Complete: FastAPI Server Working!")
        print("="* 60)
    
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("\nMake sure the FastAPI server is running:")
    print("  cd backend/app")
    print("  python main.py")
