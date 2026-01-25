
import requests
import json

url = "http://localhost:8000/api/recommendations/predict"

def test_language(lang):
    print(f"\n--- Testing Language: {lang} ---")
    data = {
        "farm_id": "test", 
        "crop_type": "Wheat", 
        "soil_type": "Clay", 
        "sensor_data": {
            "moisture": 30,  # Should trigger irrigation
            "temperature": 25, 
            "humidity": 60, 
            "nitrogen": 20, # Should trigger Nitrogen Low
            "phosphorus": 10, # Should trigger Phosphorus Low
            "potassium": 100, # Should trigger Potassium Low
            "ph": 6.5, 
            "ec": 1.0
        }, 
        "language": lang
    }
    
    try:
        res = requests.post(url, json=data)
        if res.status_code == 200:
            recs = res.json().get('recommendations', [])
            for r in recs:
                if r['type'] in ['fertilizer', 'irrigation']:
                    print(f"[{r['type']}] {r['action']}")
        else:
            print(f"Error: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Exception: {e}")

test_language("en")
test_language("hi")
test_language("mr")
