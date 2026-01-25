import requests
import json
import time

BASE_URL = "http://localhost:8000/api/spacing"

def print_result(name, response):
    if response.status_code == 200:
        print(f"✅ {name}: SUCCESS")
        # print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ {name}: FAILED ({response.status_code})")
        print(response.text)

def test_api():
    print("🚀 Starting Row Spacing API Verification...")
    
    # 1. Test Get Supported Crops
    try:
        res = requests.get(f"{BASE_URL}/crops")
        print_result("Get Supported Crops", res)
    except Exception as e:
        print(f"❌ Get Crops Connection Error: {e}")

    # 2. Test Optimization (Wheat)
    payload_optimize = {
        "crop_type": "Wheat",
        "farm_size_hectares": 2.5,
        "soil_fertility_level": "medium",
        "farm_equipment": "manual"
    }
    try:
        res = requests.post(f"{BASE_URL}/optimize", json=payload_optimize)
        print_result("Optimize Spacing (Wheat)", res)
    except Exception as e:
        print(f"❌ Optimize Connection Error: {e}")

    # 3. Test Yield Prediction
    payload_predict = {
        "crop_type": "Rice",
        "row_spacing_cm": 20,
        "soil_data": {"N": 80, "P": 40, "K": 40},
        "weather_data": {"rainfall": 1000}
    }
    try:
        res = requests.post(f"{BASE_URL}/predict-yield", json=payload_predict)
        print_result("Predict Yield (Rice 20cm)", res)
        if res.status_code == 200:
            print(f"   Yield: {res.json()['predicted_yield_kg_ha']} kg/ha")
    except Exception as e:
        print(f"❌ Predict Connection Error: {e}")

    # 4. Test Compare Spacing
    payload_compare = {
        "crop_type": "Wheat",
        "current_spacing_cm": 25,
        "farm_size_hectares": 2.5,
        "soil_data": {"N": 80, "P": 40, "K": 40},
        "weather_data": {"rainfall": 800}
    }
    try:
        res = requests.post(f"{BASE_URL}/compare", json=payload_compare)
        print_result("Compare Spacing (Wheat 25cm vs Optimal)", res)
        if res.status_code == 200:
            data = res.json()
            print(f"   Improvement: {data['improvement_percent']}%")
            print(f"   Extra Income: {data['financial_impact']['total_income_increase']}")
    except Exception as e:
        print(f"❌ Compare Connection Error: {e}")

    # 5. Test Planting Guide
    payload_guide = {
        "crop_type": "Wheat",
        "farm_size_hectares": 2.5,
        "row_spacing_cm": 20,
        "plant_spacing_cm": 5,
        "farm_equipment": "manual"
    }
    try:
        res = requests.post(f"{BASE_URL}/planting-guide", json=payload_guide)
        print_result("Generate Planting Guide", res)
    except Exception as e:
        print(f"❌ Guide Connection Error: {e}")

if __name__ == "__main__":
    test_api()
