import sys
sys.path.insert(0, 'app')
from ml_models import trained_models

# Test with different crop types and see what happens
test_cases = [
    # Standard conditions 
    {'crop': 'rice', 'n': 90, 'p': 42, 'k': 43, 'temp': 20.9, 'humid': 82, 'ph': 6.5, 'rainfall': 203},
    {'crop': 'maize', 'n': 90, 'p': 42, 'k': 43, 'temp': 20.9, 'humid': 82, 'ph': 6.5, 'rainfall': 203},
    {'crop': 'muskmelon', 'n': 100, 'p': 20, 'k': 50, 'temp': 28.5, 'humid': 92.5, 'ph': 6.2, 'rainfall': 25},
    # Muskmelon-like conditions but user grows rice
    {'crop': 'rice', 'n': 100, 'p': 20, 'k': 50, 'temp': 28.5, 'humid': 92.5, 'ph': 6.2, 'rainfall': 25},
    # Another muskmelon-like scenario
    {'crop': 'wheat', 'n': 100, 'p': 20, 'k': 50, 'temp': 28.5, 'humid': 92.5, 'ph': 6.2, 'rainfall': 25},
]

print('='*80)
print('CROP SUITABILITY TEST - WHY IS MUSKMELON BEING SUGGESTED?')
print('='*80)

for test in test_cases:
    print(f"\n🌾 Crop: {test['crop'].upper()}")
    print(f"   Conditions: N={test['n']}, P={test['p']}, K={test['k']}, Temp={test['temp']}°C, Humidity={test['humid']}%, Rainfall={test['rainfall']}mm")
    
    result = trained_models.get_crop_suitability(
        test['crop'],
        test['n'],
        test['p'],
        test['k'],
        test['temp'],
        test['humid'],
        test['ph'],
        test['rainfall']
    )
    
    print(f"   ✓ Suitability Score: {result['suitability']}%")
    print(f"   ✓ Message: {result['message']}")
    print(f"   ✓ Best Alternative: {result.get('best_alternative', 'N/A')} ({result.get('best_alternative_score', 0)}%)")
    print(f"   ✓ Significantly Better: {result.get('is_significantly_better', False)}")
    
    if result['suitability'] < 40 and result.get('is_significantly_better', False):
        print(f"   ⚠️  ALERT: This crop has low suitability (<40%) AND alternative is significantly better - Will suggest!")
    elif result['suitability'] < 40 and not result.get('is_significantly_better', False):
        print(f"   ℹ️  INFO: Low suitability but alternative not significantly better - Will NOT suggest switching")

print('\n' + '='*80)
print('CROP RECOMMENDATION (What model recommends for conditions):')
print('='*80)

conditions = {'n': 100, 'p': 20, 'k': 50, 'temp': 28.5, 'humid': 92.5, 'ph': 6.2, 'rainfall': 25}
rec = trained_models.get_crop_recommendation(
    conditions['n'],
    conditions['p'],
    conditions['k'],
    conditions['temp'],
    conditions['humid'],
    conditions['ph'],
    conditions['rainfall']
)

print(f"\nFor conditions: N={conditions['n']}, Temp={conditions['temp']}°C, Humidity={conditions['humid']}%")
print(f"Model recommends: {rec['recommended_crop']} ({rec['confidence']}% confidence)")
print(f"Alternatives: {rec['alternatives']}")
