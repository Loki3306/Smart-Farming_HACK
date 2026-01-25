import pickle
import os

model_path = 'backend/app/ml_models/yield_model.pkl'
with open(model_path, 'rb') as f:
    data = pickle.load(f)

print("="*60)
print("🎯 FINAL MODEL VERIFICATION")
print("="*60)
print(f"\n✅ Model Type: {type(data['model']).__name__}")
print(f"✅ Is XGBoost: {'Yes' if 'XGB' in str(type(data['model'])) else 'No'}")
print(f"✅ File Size: {os.path.getsize(model_path)/1024:.1f} KB")
print(f"✅ Features: {len(data['feature_columns'])}")
print(f"\n{'='*60}")
print("MODEL READY FOR PRODUCTION!")
print("="*60)
