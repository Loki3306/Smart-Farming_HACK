import pandas as pd
import os
import sys

try:
    print('='*80)
    print('CROP TYPES ANALYSIS ACROSS ALL DATASETS')
    print('='*80)
    
    # Check Crop Recommendation Dataset
    print('\n1. CROP_RECOMMENDATION.CSV')
    print('-'*80)
    try:
        df_crop = pd.read_csv('../datasets/Crop_recommendation.csv')
        crop_types = df_crop['label'].unique()
        print(f'✓ Total unique crops: {len(crop_types)}')
        print(f'  Crops: {", ".join(sorted(crop_types))}')
        print(f'  Total samples: {len(df_crop)}')
    except Exception as e:
        print(f'✗ Error: {e}')
    
    # Check Fertilizer Dataset
    print('\n2. FERTILIZER_PREDICTION.CSV')
    print('-'*80)
    try:
        df_fert = pd.read_csv('../datasets/Fertilizer Prediction.csv')
        df_fert.columns = [c.strip() for c in df_fert.columns]
        if 'Crop Type' in df_fert.columns:
            fert_crops = df_fert['Crop Type'].unique()
            print(f'✓ Total unique crops: {len(fert_crops)}')
            print(f'  Crops: {", ".join(sorted(fert_crops))}')
            print(f'  Total samples: {len(df_fert)}')
        else:
            print('✗ No crop type column found')
    except Exception as e:
        print(f'✗ Error: {e}')
    
    # Check Smart Farming Crop Yield Dataset
    print('\n3. SMART_FARMING_CROP_YIELD_2024.CSV')
    print('-'*80)
    try:
        df_yield = pd.read_csv('../datasets/Smart_Farming_Crop_Yield_2024.csv')
        if 'crop_type' in df_yield.columns:
            yield_crops = df_yield['crop_type'].unique()
            print(f'✓ Total unique crops: {len(yield_crops)}')
            print(f'  Crops: {", ".join(sorted(yield_crops))}')
            print(f'  Total samples: {len(df_yield)}')
        else:
            print(f'✗ No crop_type column. Available: {df_yield.columns.tolist()}')
    except Exception as e:
        print(f'✗ Error: {e}')
    
    # Summary
    print('\n' + '='*80)
    print('SUMMARY')
    print('='*80)
    print(f'✓ Analysis complete!')
    
except Exception as e:
    print(f'FATAL ERROR: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
try:
    print(f'✓ Yield/Irrigation Model: {len(yield_crops)} crops')
except:
    pass
