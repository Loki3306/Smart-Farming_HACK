import requests
import json

url = "http://localhost:8000/api/recommendations/predict"
payload = {
  "farm_id": "farm_123",
  "crop_type": "Rice",
  "soil_type": "Clay loam",
  "sensor_data": {
    "moisture": 45,
    "temperature": 28,
    "humidity": 62,
    "nitrogen": 42,
    "phosphorus": 18,
    "potassium": 95,
    "ph": 6.8,
    "ec": 1.2
  },
  "language": "hi"
}
headers = {
  'Content-Type': 'application/json'
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
