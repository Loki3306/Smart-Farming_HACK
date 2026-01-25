
import sys
import os

# Add global path
sys.path.append(os.getcwd())

from app.main import RecommendationEngine, SensorData
from app.locales import LocalizationManager

# Mock data
sensor_data = SensorData(
    moisture=30,  # Low
    temperature=25,
    humidity=60,
    nitrogen=20,  # Low
    phosphorus=10, # Low
    potassium=100, # Low
    ph=6.5,
    ec=1.0,
    rainfall=0
)

print(f"--- Testing Direct Logic ---")

recs = RecommendationEngine.generate_recommendations(
    farm_id="test",
    crop_type="Wheat",
    soil_type="Clay",
    sensor_data=sensor_data,
    language="en"
)

for r in recs:
    print(f"[{r.type}] {r.action}")

# Check Hindi (Rice)
print(f"\n--- Hindi (Rice) ---")
recs_rice = RecommendationEngine.generate_recommendations(
    farm_id="test",
    crop_type="Rice",
    soil_type="Clay",
    sensor_data=sensor_data,
    language="hi"
)
for r in recs_rice:
    print(f"[{r.type}] {r.action}")
