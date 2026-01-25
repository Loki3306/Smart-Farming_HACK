"""
Train Yield Prediction Model with Row Spacing Feature
Enhanced XGBoost model including spacing optimization
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import os

print("🌱 Training Yield Prediction Model with Row Spacing...")

# Load the spacing-enhanced dataset
dataset_path = '../datasets/Smart_Farming_Crop_Yield_With_Spacing.csv'
df = pd.read_csv(dataset_path)

print(f"✅ Loaded dataset: {len(df)} samples")
print(f"   Crops: {df['crop_type'].unique().tolist()}")
print(f"   Features: {df.columns.tolist()}")

# Encode crop types
le = LabelEncoder()
df['crop_type_encoded'] = le.fit_transform(df['crop_type'])

# Feature columns (including new spacing features)
feature_cols = [
    'crop_type_encoded',
    'soil_moisture_%',
    'soil_pH',
    'nitrogen_ppm',
    'phosphorus_ppm',
    'potassium_ppm',
    'temperature_C',
    'rainfall_mm',
    'humidity_%',
    'sunlight_hours',
    'row_spacing_cm',         # NEW FEATURE
    'plant_spacing_cm',        # NEW FEATURE
    'plant_density_per_sqm',   # NEW FEATURE
    'pesticide_usage_ml',
    'total_days',
    'NDVI_index'
]

X = df[feature_cols]
y = df['yield_kg_per_ha']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\n📊 Training set: {len(X_train)} samples")
print(f"   Test set: {len(X_test)} samples")

# Train XGBoost model
print("\n🚀 Training XGBoost model...")

model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=200,
    max_depth=8,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)

train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
train_r2 = r2_score(y_train, y_pred_train)
test_r2 = r2_score(y_test, y_pred_test)
test_mae = mean_absolute_error(y_test, y_pred_test)

print(f"\n📈 Model Performance:")
print(f"   Train RMSE: {train_rmse:.2f} kg/ha")
print(f"   Test RMSE:  {test_rmse:.2f} kg/ha")
print(f"   Train R²:   {train_r2:.4f}")
print(f"   Test R²:    {test_r2:.4f}")
print(f"   Test MAE:   {test_mae:.2f} kg/ha")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n🎯 Top 10 Important Features:")
print(feature_importance.head(10).to_string(index=False))

# Test spacing impact prediction
print(f"\n🧪 Testing Spacing Impact Prediction:")

# Example: Rice with different spacings
test_conditions = {
    'crop_type_encoded': le.transform(['rice'])[0],
    'soil_moisture_%': 70,
    'soil_pH': 6.5,
    'nitrogen_ppm': 80,
    'phosphorus_ppm': 50,
    'potassium_ppm': 60,
    'temperature_C': 28,
    'rainfall_mm': 800,
    'humidity_%': 75,
    'sunlight_hours': 7,
    'pesticide_usage_ml': 200,
    'total_days': 120,
    'NDVI_index': 0.75
}

spacings_to_test = [15, 20, 25, 30]  # cm

print("\n   Rice Yield Predictions at Different Spacings:")
predictions = []
for spacing in spacings_to_test:
    test_data = test_conditions.copy()
    test_data['row_spacing_cm'] = spacing
    test_data['plant_spacing_cm'] = spacing
    test_data['plant_density_per_sqm'] = (100 / spacing) ** 2
    
    X_test_single = pd.DataFrame([test_data])
    pred = model.predict(X_test_single)[0]
    predictions.append(pred)
    
    print(f"      {spacing}cm × {spacing}cm: {pred:.0f} kg/ha")

optimal_idx = np.argmax(predictions)
optimal_spacing = spacings_to_test[optimal_idx]
print(f"\n   ✅ Optimal spacing: {optimal_spacing}cm × {optimal_spacing}cm")
print(f"   📈 Yield improvement: {((predictions[optimal_idx] / predictions[0]) - 1) * 100:.1f}%")

# Save model
model_dir = 'app/ml_models/compiled_models'
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, 'yield_predictor_with_spacing.pkl')
joblib.dump(model, model_path)

# Save label encoder
encoder_path = os.path.join(model_dir, 'crop_type_encoder.pkl')
joblib.dump(le, encoder_path)

print(f"\n✅ Model saved to: {model_path}")
print(f"✅ Encoder saved to: {encoder_path}")

# Save feature list for later use
feature_list_path = os.path.join(model_dir, 'spacing_features.txt')
with open(feature_list_path, 'w') as f:
    f.write('\n'.join(feature_cols))

print(f"✅ Feature list saved to: {feature_list_path}")

print(f"\n🎉 Training complete! Model ready for spacing-based predictions.")
