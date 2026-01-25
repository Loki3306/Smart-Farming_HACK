import requests
import os

url = "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv"
target_path = os.path.join("datasets", "Real_Soil_Data.csv")

try:
    print(f"Downloading from {url}...")
    response = requests.get(url)
    response.raise_for_status()
    
    with open(target_path, "w", encoding='utf-8') as f:
        f.write(response.text)
    
    print(f"✅ Downloaded {len(response.text)} bytes to {target_path}")
    
except Exception as e:
    print(f"❌ Error: {e}")
