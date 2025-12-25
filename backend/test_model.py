import sys
sys.path.insert(0, 'app')
from ml_models import trained_models

print('=' * 60)
print('ML MODEL VALIDATION TEST')
print('=' * 60)

# Test with exact data from training set to verify model learned patterns
test_cases = [
    {'n': 37, 'p': 0, 'k': 0, 'ph': 6.5, 'soil': 'Sandy', 'crop': 'Maize', 'expected': 'Urea'},
    {'n': 12, 'p': 36, 'k': 0, 'ph': 6.5, 'soil': 'Loamy', 'crop': 'Sugarcane', 'expected': 'DAP'},
    {'n': 7, 'p': 30, 'k': 9, 'ph': 6.5, 'soil': 'Black', 'crop': 'Cotton', 'expected': '14-35-14'},
    {'n': 35, 'p': 0, 'k': 0, 'ph': 6.5, 'soil': 'Clayey', 'crop': 'Paddy', 'expected': 'Urea'},
]

print('\nTesting with training set patterns:')
print('-' * 60)
correct = 0
for i, test in enumerate(test_cases, 1):
    result = trained_models.get_fertilizer_prediction(
        test['n'], test['p'], test['k'], test['ph'], test['soil'], test['crop']
    )
    predicted = result['recommendations'][0]['fertilizer']
    confidence = result['model_confidence']
    match = 'MATCH' if predicted == test['expected'] else 'MISMATCH'
    if predicted == test['expected']:
        correct += 1
    print(f'{i}. {test["crop"]} ({test["soil"]}): N={test["n"]}, P={test["p"]}, K={test["k"]}')
    print(f'   Expected: {test["expected"]}, Got: {predicted} (Conf: {confidence}%) {match}')
    print()

print('-' * 60)
print(f'Accuracy: {correct}/{len(test_cases)} = {(correct/len(test_cases)*100):.1f}%')

# Test pattern recognition: High N should give Urea
print('\n' + '=' * 60)
print('PATTERN RECOGNITION TEST: High Nitrogen -> Urea')
print('=' * 60)
urea_count = 0
for n_val in [35, 36, 37, 38, 39, 40]:
    result = trained_models.get_fertilizer_prediction(n_val, 0, 0, 6.5, 'Clayey', 'Paddy')
    pred = result['recommendations'][0]['fertilizer']
    print(f'N={n_val}: {pred}')
    if pred == 'Urea':
        urea_count += 1

print(f'\nUrea predictions: {urea_count}/6')

# Test pattern recognition: High P should give DAP
print('\n' + '=' * 60)
print('PATTERN RECOGNITION TEST: High Phosphorus -> DAP')
print('=' * 60)
dap_count = 0
for p_val in [35, 36, 37, 38, 39, 40]:
    result = trained_models.get_fertilizer_prediction(10, p_val, 0, 6.5, 'Loamy', 'Sugarcane')
    pred = result['recommendations'][0]['fertilizer']
    print(f'P={p_val}: {pred}')
    if pred == 'DAP':
        dap_count += 1

print(f'\nDAP predictions: {dap_count}/6')
print('=' * 60)
