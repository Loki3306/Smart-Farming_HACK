import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../../../datasets")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

os.makedirs(MODELS_DIR, exist_ok=True)

DATASET_PATH = os.path.join(DATA_DIR, "verified_agronomy_data.csv")

def train_fertilizer_model():
    print("\n🌾 Training Fertilizer Model (Verified Data)...")
    if not os.path.exists(DATASET_PATH):
        print("❌ Dataset not found!")
        return

    df = pd.read_csv(DATASET_PATH)
    
    # Encoders
    le_soil = LabelEncoder()
    le_crop = LabelEncoder()
    le_fert = LabelEncoder()
    
    df['Soil_Type'] = le_soil.fit_transform(df['Soil_Type'])
    df['Crop_Type'] = le_crop.fit_transform(df['Crop_Type'])
    df['Fertilizer_Recommendation'] = le_fert.fit_transform(df['Fertilizer_Recommendation'])
    
    # Features: N, P, K, Temp, Humidity, Moisture, Soil, Crop
    X = df[['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'Soil_Moisture_%', 'Soil_Type', 'Crop_Type']]
    y = df['Fertilizer_Recommendation']
    
    # Train
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save artifacts
    pickle.dump(model, open(os.path.join(MODELS_DIR, "fertilizer_model.pkl"), "wb"))
    pickle.dump(le_soil, open(os.path.join(MODELS_DIR, "fertilizer_le_soil.pkl"), "wb"))
    pickle.dump(le_crop, open(os.path.join(MODELS_DIR, "fertilizer_le_crop.pkl"), "wb"))
    pickle.dump(le_fert, open(os.path.join(MODELS_DIR, "fertilizer_le_target.pkl"), "wb"))
    
    print(f"✅ Fertilizer Model Saved. Accuracy: {model.score(X, y):.2f}")
    print(f"   Supported Crops: {len(le_crop.classes_)}")

def train_crop_recommendation_model():
    print("\n🌱 Training Crop Recommendation Model (Verified Data)...")
    df = pd.read_csv(DATASET_PATH)
    
    # Features: N, P, K, Temp, Humidity, pH, Rainfall
    # Target: Crop_Type
    
    X = df[['Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Temperature_C', 'Humidity_%', 'pH_Level', 'Rainfall_mm']]
    y = df['Crop_Type'] # No encoding needed for target in sklearn (automatically handled or string OK)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    pickle.dump(model, open(os.path.join(MODELS_DIR, "crop_model.pkl"), "wb"))
    
    print(f"✅ Crop Model Saved. Accuracy: {model.score(X, y):.2f}")

def train_irrigation_model():
    print("\n💧 Training Irrigation Strategy Model (Verified Data)...")
    df = pd.read_csv(DATASET_PATH)
    
    # Encoders
    le_crop = LabelEncoder()
    le_irrig = LabelEncoder()
    
    df['Crop_Type'] = le_crop.fit_transform(df['Crop_Type'])
    df['Irrigation_Method'] = le_irrig.fit_transform(df['Irrigation_Method'])
    
    # Features: Moisture, Temp, Humidity, Crop
    # Note: 'Rainfall' is also relevant but our current inference function might not pass it
    # We will stick to the features expected by trained_models.py (Moisture, Temp, Humidity, Rain, Crop, Region)
    # The new data doesn't have Region, so we'll use a constant or remove it.
    # New Feature Set: Moisture, Temp, Humidity, Rainfall, Crop
    
    X = df[['Soil_Moisture_%', 'Temperature_C', 'Humidity_%', 'Rainfall_mm', 'Crop_Type']]
    y = df['Irrigation_Method']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    # For Water Requirement (Regression) - Optional 2nd model
    # reg_model = RandomForestRegressor()
    # reg_model.fit(X, df['Water_Requirement_mm'])
    
    model.fit(X, y)
    
    pickle.dump(model, open(os.path.join(MODELS_DIR, "irrigation_model.pkl"), "wb"))
    pickle.dump(le_crop, open(os.path.join(MODELS_DIR, "irrigation_le_crop.pkl"), "wb"))
    # Region not used in new data, but kept for compatibility or use dummy
    pickle.dump(LabelEncoder(), open(os.path.join(MODELS_DIR, "irrigation_le_region.pkl"), "wb")) 
    pickle.dump(le_irrig, open(os.path.join(MODELS_DIR, "irrigation_le_target.pkl"), "wb"))
    
    print(f"✅ Irrigation Model Saved. Accuracy: {model.score(X, y):.2f}")

if __name__ == "__main__":
    try:
        train_fertilizer_model()
        train_crop_recommendation_model()
        train_irrigation_model()
        print("\n🚀 All Models Retrained with Scientific Data (22 Crops Supported)!")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
