"""
Quick test script to check the fertilizer recommender model
"""

from app.ml_models import get_fertilizer_recommender

# Get the recommender instance
recommender = get_fertilizer_recommender()

print("=" * 60)
print("🧪 TESTING FERTILIZER RECOMMENDER MODEL")
print("=" * 60)

# Test scenario 1: Low nitrogen in wheat field
print("\n📋 Test 1: Low Nitrogen - Wheat Field")
print("-" * 60)
rec1 = recommender.predict_fertilizer(
    temperature=28,
    humidity=65,
    moisture=50,
    soil_type="Loamy",
    crop_type="Wheat",
    current_n=5,   # Very low nitrogen
    current_p=15,
    current_k=130
)

print(f"Fertilizer: {rec1['fertilizer_name']}")
print(f"Confidence: {rec1['confidence']:.1%}")
print(f"Nitrogen Required: {rec1['npk_requirements']['nitrogen']} kg/ha")
print(f"Phosphorous Required: {rec1['npk_requirements']['phosphorous']} kg/ha")
print(f"Potassium Required: {rec1['npk_requirements']['potassium']} kg/ha")
print(f"Application Rate: {rec1['application_rate_kg_per_hectare']} kg/ha")
print(f"Urgency: {rec1['timing']['urgency']}")
print(f"Apply within: {rec1['timing']['days_to_apply']} days")
print(f"Best time: {rec1['timing']['recommended_time_of_day']}")

# Test scenario 2: Balanced nutrition for cotton
print("\n📋 Test 2: Balanced Nutrients - Cotton Field")
print("-" * 60)
rec2 = recommender.predict_fertilizer(
    temperature=32,
    humidity=55,
    moisture=45,
    soil_type="Black",
    crop_type="Cotton",
    current_n=18,
    current_p=12,
    current_k=140
)

print(f"Fertilizer: {rec2['fertilizer_name']}")
print(f"Confidence: {rec2['confidence']:.1%}")
print(f"NPK Required: N={rec2['npk_requirements']['nitrogen']}, "
      f"P={rec2['npk_requirements']['phosphorous']}, "
      f"K={rec2['npk_requirements']['potassium']}")
print(f"Application Rate: {rec2['application_rate_kg_per_hectare']} kg/ha")
print(f"Timing: {rec2['timing']['urgency']} - Apply within {rec2['timing']['days_to_apply']} days")

# Test scenario 3: Multiple deficiencies
print("\n📋 Test 3: Multiple Deficiencies - Paddy")
print("-" * 60)
rec3 = recommender.predict_fertilizer(
    temperature=30,
    humidity=75,
    moisture=65,
    soil_type="Clayey",
    crop_type="Paddy",
    current_n=8,   # Low
    current_p=6,   # Low
    current_k=90   # Low
)

print(f"Fertilizer: {rec3['fertilizer_name']}")
print(f"Confidence: {rec3['confidence']:.1%}")
print(f"Total NPK Required: {rec3['npk_requirements']['total']} kg/ha")
print(f"Application Rate: {rec3['application_rate_kg_per_hectare']} kg/ha")
print(f"Urgency: {rec3['timing']['urgency']} (Critical if > 80 total deficit)")

# Show alternatives
print("\n🔄 Alternative Fertilizers for Test 3:")
for alt in rec3['alternatives'][:3]:
    print(f"  - {alt['name']}: {alt['confidence']:.1%}")

# Test with different conditions
print("\n📋 Test 4: Hot & Dry Conditions - Maize")
print("-" * 60)
rec4 = recommender.predict_fertilizer(
    temperature=38,  # Very hot
    humidity=35,     # Low humidity
    moisture=25,     # Dry soil
    soil_type="Sandy",
    crop_type="Maize",
    current_n=10,
    current_p=8,
    current_k=100
)

print(f"Fertilizer: {rec4['fertilizer_name']}")
print(f"NPK: N={rec4['npk_requirements']['nitrogen']}, "
      f"P={rec4['npk_requirements']['phosphorous']}, "
      f"K={rec4['npk_requirements']['potassium']}")
print(f"Application Rate: {rec4['application_rate_kg_per_hectare']} kg/ha")
print(f"Timing: {rec4['timing']['recommended_time_of_day']}")
print(f"Note: {rec4['timing']['note']}")

print("\n" + "=" * 60)
print("✅ MODEL TESTING COMPLETE")
print("=" * 60)

# Check model status
print(f"\n📊 Model Status:")
print(f"   Trained: {recommender.is_trained}")
print(f"   Fertilizer Types: {len(recommender.encoders['fertilizer'].classes_)} types")
print(f"   Soil Types: {len(recommender.encoders['soil_type'].classes_)} types")
print(f"   Crop Types: {len(recommender.encoders['crop_type'].classes_)} types")

print(f"\n🌾 Supported Crops:")
for crop in recommender.encoders['crop_type'].classes_:
    print(f"   - {crop}")

print(f"\n🌍 Supported Soils:")
for soil in recommender.encoders['soil_type'].classes_:
    print(f"   - {soil}")

print(f"\n🧪 Available Fertilizers:")
for fert in recommender.encoders['fertilizer'].classes_:
    print(f"   - {fert}")
