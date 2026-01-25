import requests
import json

url = "http://localhost:8000/iot/control"
payload = {
    "farm_id": "80ac1084-67f8-4d05-ba21-68e3201213a8",
    "action": "irrigation",
    "value": True,
    "mode": "manual"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
