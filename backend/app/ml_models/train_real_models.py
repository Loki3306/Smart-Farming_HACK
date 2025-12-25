import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../../../datasets")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

os.makedirs(MODELS_DIR, exist_ok=True)

def train_fertilizer_model():
    print("\n🌾 Training Fertilizer Model...")
    df = pd.read_csv(os.path.join(DATA_DIR, "Fertilizer Prediction.csv"))
    
    # Rename columns to standard format
    df.columns = [c.strip() for c in df.columns]
    
    # Encoders
    le_soil = LabelEncoder()
    le_crop = LabelEncoder()
    le_fert = LabelEncoder()
    
    df['Soil Type'] = le_soil.fit_transform(df['Soil Type'])
    df['Crop Type'] = le_crop.fit_transform(df['Crop Type'])
    df['Fertilizer Name'] = le_fert.fit_transform(df['Fertilizer Name'])
    
    X = df[['Nitrogen', 'Phosphorous', 'Potassium', 'Temparature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type']]
    y = df['Fertilizer Name']
    
    # Train
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save artifacts
    pickle.dump(model, open(os.path.join(MODELS_DIR, "fertilizer_model.pkl"), "wb"))
    pickle.dump(le_soil, open(os.path.join(MODELS_DIR, "fertilizer_le_soil.pkl"), "wb"))
    pickle.dump(le_crop, open(os.path.join(MODELS_DIR, "fertilizer_le_crop.pkl"), "wb"))
    pickle.dump(le_fert, open(os.path.join(MODELS_DIR, "fertilizer_le_target.pkl"), "wb"))
    
    print(f"✅ Fertilizer Model Saved. Accuracy: {model.score(X, y):.2f}")

def train_crop_recommendation_model():
    print("\n🌱 Training Crop Recommendation Model...")
    df = pd.read_csv(os.path.join(DATA_DIR, "Crop_recommendation.csv"))
    
    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    pickle.dump(model, open(os.path.join(MODELS_DIR, "crop_model.pkl"), "wb"))
    
    print(f"✅ Crop Model Saved. Accuracy: {model.score(X, y):.2f}")

def train_irrigation_model():
    print("\n💧 Training Irrigation Strategy Model...")
    # Use the rich Yield dataset which has 'irrigation_type'
    df = pd.read_csv(os.path.join(DATA_DIR, "Smart_Farming_Crop_Yield_2024.csv"))
    
    # Clean data: Remove rows where 'irrigation_type' is None/NaN if we want to predict active irrigation
    # But predicting 'None' (Rainfed) is also valid!
    
    # Encoders
    le_crop = LabelEncoder()
    le_region = LabelEncoder()
    le_irrig = LabelEncoder()
    
    df['crop_type'] = le_crop.fit_transform(df['crop_type'])
    df['region'] = le_region.fit_transform(df['region'])
    
    # Handle missing/None
    df['irrigation_type'] = df['irrigation_type'].fillna('None')
    df['irrigation_type'] = le_irrig.fit_transform(df['irrigation_type'])
    
    # Features: moisture, temp, humidity, rainfall, crop, region
    # We map 'soil_moisture_%' -> 'moisture'
    features = ['soil_moisture_%', 'temperature_C', 'humidity_%', 'rainfall_mm', 'crop_type', 'region']
    X = df[features]
    y = df['irrigation_type']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    pickle.dump(model, open(os.path.join(MODELS_DIR, "irrigation_model.pkl"), "wb"))
    pickle.dump(le_crop, open(os.path.join(MODELS_DIR, "irrigation_le_crop.pkl"), "wb"))
    pickle.dump(le_region, open(os.path.join(MODELS_DIR, "irrigation_le_region.pkl"), "wb"))
    pickle.dump(le_irrig, open(os.path.join(MODELS_DIR, "irrigation_le_target.pkl"), "wb"))
    
    print(f"✅ Irrigation Model Saved. Accuracy: {model.score(X, y):.2f}")

if __name__ == "__main__":
    try:
        train_fertilizer_model()
        train_crop_recommendation_model()
        train_irrigation_model()
        print("\n🚀 All Real Models Trained & Saved Successfully!")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
