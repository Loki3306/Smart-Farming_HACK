"""
Test Express to Python AI Backend Connection
Tests the full proxy flow: Frontend → Express → Python → Back to Frontend
"""

import requests
import json

print("🧪 Testing Express → Python AI Integration")
print("="*60)
print()

# Test 1: Check Express health endpoint
print("Test 1: Express Backend Health Check")
try:
    response = requests.get("http://localhost:5000/api/recommendations/health")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Express: {data.get('express_status')}")
        print(f"✅ Python AI: {data.get('python_ai_status')}")
        print()
    else:
        print(f"❌ Health check failed: {response.status_code}")
        print()
except Exception as e:
    print(f"❌ Cannot connect to Express: {e}")
    print("   Make sure Express is running: npm run dev")
    print()

# Test 2: Get recommendations through Express proxy
print("Test 2: Get AI Recommendations via Express Proxy")
print("-"*60)

test_request = {
    "farm_id": "farm_express_test",
    "crop_type": "Cotton",
    "soil_type": "Sandy loam",
    "sensor_data": {
        "moisture": 25,  # Low moisture
        "temperature": 38,  # High temperature
        "humidity": 45,
        "nitrogen": 30,  # Very low nitrogen
        "phosphorus": 12,  # Low phosphorus
        "potassium": 80,
        "ph": 8.8,  # High pH (alkaline)
        "ec": 1.5,
        "rainfall": 0
    },
    "weather_condition": "Hot and dry"
}

try:
    response = requests.post(
        "http://localhost:5000/api/recommendations/predict",
        json=test_request,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print()
        print(f"✅ SUCCESS! Received response from Express → Python")
        print()
        print(f"🌾 Farm ID: {data['farm_id']}")
        print(f"📊 Recommendations: {len(data['recommendations'])}")
        print()
        print("="*60)
        print("RECOMMENDATIONS:")
        print("="*60)
        
        for i, rec in enumerate(data['recommendations'], 1):
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            print(f"\n{i}. [{priority_emoji.get(rec['priority'], '⚪')} {rec['priority'].upper()}] {rec['title']}")
            print(f"   Type: {rec['type']}")
            print(f"   Confidence: {rec['confidence']}%")
            print(f"   Action: {rec['action']}")
        
        print("\n" + "="*60)
        print("✅ Phase 2 Complete: Express → Python Integration Working!")
        print("="*60)
    
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(response.text)

except requests.exceptions.Timeout:
    print("❌ Request timeout. Is Python backend running?")
    print("   Run: cd backend/app && python main.py")
except Exception as e:
    print(f"❌ Error: {e}")

print()
print("🎯 Next: Test frontend Recommendations page!")
