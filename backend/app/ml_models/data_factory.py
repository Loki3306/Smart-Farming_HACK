"""
Data Factory - Synthetic Agricultural Dataset Generator
Generates realistic crop data for ML model training using agronomic rules
"""

import pandas as pd
import numpy as np
import random
import os
from typing import List, Dict

# Crop Profiles (Ideal conditions)
# Used as centroids for data generation
CROP_PROFILES = {
    "Rice": {"N": (60, 90), "P": (35, 60), "K": (35, 45), "temp": (20, 27), "humidity": (80, 85), "ph": (6.0, 7.0), "rainfall": (200, 300), "soil": 3}, # Clay
    "Maize": {"N": (60, 100), "P": (35, 60), "K": (15, 25), "temp": (18, 27), "humidity": (50, 70), "ph": (5.5, 7.0), "rainfall": (60, 110), "soil": 2}, # Loam
    "Chickpea": {"N": (20, 40), "P": (55, 80), "K": (75, 85), "temp": (17, 22), "humidity": (15, 20), "ph": (5.9, 6.5), "rainfall": (50, 80), "soil": 2},
    "Kidneybeans": {"N": (15, 30), "P": (55, 80), "K": (15, 25), "temp": (15, 25), "humidity": (20, 25), "ph": (5.5, 5.9), "rainfall": (60, 150), "soil": 2},
    "Pigeonpeas": {"N": (15, 30), "P": (55, 80), "K": (15, 25), "temp": (18, 38), "humidity": (15, 20), "ph": (5.5, 6.5), "rainfall": (90, 150), "soil": 1}, # Sandy
    "Mothbeans": {"N": (15, 30), "P": (35, 60), "K": (15, 25), "temp": (24, 32), "humidity": (45, 60), "ph": (3.5, 9.5), "rainfall": (30, 70), "soil": 1},
    "Mungbean": {"N": (15, 30), "P": (35, 60), "K": (15, 25), "temp": (27, 30), "humidity": (60, 70), "ph": (6.0, 7.0), "rainfall": (35, 60), "soil": 2},
    "Blackgram": {"N": (35, 50), "P": (55, 80), "K": (15, 25), "temp": (25, 35), "humidity": (60, 70), "ph": (6.5, 7.5), "rainfall": (60, 75), "soil": 2},
    "Lentil": {"N": (15, 30), "P": (55, 80), "K": (15, 25), "temp": (18, 29), "humidity": (60, 70), "ph": (5.9, 6.8), "rainfall": (35, 55), "soil": 2},
    "Pomegranate": {"N": (15, 30), "P": (15, 30), "K": (35, 45), "temp": (18, 25), "humidity": (85, 95), "ph": (5.5, 7.0), "rainfall": (100, 120), "soil": 2},
    "Banana": {"N": (80, 120), "P": (70, 95), "K": (45, 55), "temp": (25, 30), "humidity": (75, 85), "ph": (5.5, 6.5), "rainfall": (90, 120), "soil": 2},
    "Mango": {"N": (15, 30), "P": (15, 30), "K": (25, 35), "temp": (27, 35), "humidity": (45, 55), "ph": (4.5, 6.5), "rainfall": (85, 100), "soil": 2},
    "Grapes": {"N": (15, 30), "P": (120, 145), "K": (195, 205), "temp": (8, 42), "humidity": (80, 85), "ph": (5.5, 6.5), "rainfall": (65, 75), "soil": 2},
    "Watermelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (24, 27), "humidity": (80, 90), "ph": (6.0, 7.0), "rainfall": (40, 60), "soil": 1},
    "Muskmelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (27, 30), "humidity": (90, 95), "ph": (6.0, 6.8), "rainfall": (20, 30), "soil": 1},
    "Apple": {"N": (15, 30), "P": (120, 145), "K": (195, 205), "temp": (21, 24), "humidity": (90, 95), "ph": (5.5, 6.5), "rainfall": (100, 125), "soil": 2},
    "Orange": {"N": (15, 30), "P": (5, 30), "K": (5, 15), "temp": (10, 35), "humidity": (90, 95), "ph": (6.0, 7.5), "rainfall": (100, 120), "soil": 2},
    "Papaya": {"N": (40, 60), "P": (45, 65), "K": (45, 55), "temp": (23, 44), "humidity": (90, 95), "ph": (6.5, 7.0), "rainfall": (150, 250), "soil": 2},
    "Coconut": {"N": (15, 30), "P": (5, 30), "K": (25, 35), "temp": (25, 29), "humidity": (90, 95), "ph": (5.5, 6.5), "rainfall": (140, 230), "soil": 1},
    "Cotton": {"N": (100, 140), "P": (35, 60), "K": (15, 25), "temp": (22, 26), "humidity": (55, 65), "ph": (5.9, 7.5), "rainfall": (60, 80), "soil": 3},
    "Jute": {"N": (60, 90), "P": (35, 60), "K": (35, 45), "temp": (23, 26), "humidity": (70, 90), "ph": (6.0, 7.5), "rainfall": (150, 200), "soil": 3},
    "Coffee": {"N": (80, 120), "P": (15, 30), "K": (25, 35), "temp": (23, 27), "humidity": (50, 70), "ph": (6.0, 7.5), "rainfall": (110, 200), "soil": 2}
}

# 1=Sandy, 2=Loam, 3=Clay
SOIL_MAP = {1: 'sandy', 2: 'loam', 3: 'clay'}

print("🌱 Initializing DataFactory for Crop Model...")

class DataFactory:
    """Generates synthetic agricultural data based on expert rulesets"""
    
    @staticmethod
    def generate_dataset(num_samples: int = 10000) -> pd.DataFrame:
        data = []
        crops = list(CROP_PROFILES.keys())
        
        # Calculate samples per crop
        samples_per_crop = num_samples // len(crops)
        
        for crop in crops:
            profile = CROP_PROFILES[crop]
            
            for _ in range(samples_per_crop):
                # Add Gaussian noise to create realistic variance
                # N, P, K, pH, temp, hum, rain
                row = {
                    "N": max(0, int(np.random.normal(np.mean(profile["N"]), (profile["N"][1]-profile["N"][0])/4))),
                    "P": max(0, int(np.random.normal(np.mean(profile["P"]), (profile["P"][1]-profile["P"][0])/4))),
                    "K": max(0, int(np.random.normal(np.mean(profile["K"]), (profile["K"][1]-profile["K"][0])/4))),
                    "temperature": np.random.normal(np.mean(profile["temp"]), 2.0),
                    "humidity": min(100, max(0, np.random.normal(np.mean(profile["humidity"]), 5.0))),
                    "ph": min(9.0, max(3.0, np.random.normal(np.mean(profile["ph"]), 0.3))),
                    "rainfall": max(0, np.random.normal(np.mean(profile["rainfall"]), 15.0)),
                    "soil_type_code": profile["soil"],  # Centroid soil type
                    # Add altitude and solar rad as extras for improved model (not strictly in std datasets but good for advanced)
                    "altitude": np.random.randint(100, 800), # Meters
                    "solar_rad": np.random.normal(18, 3), # MJ/m2
                    "market_price": np.random.uniform(50, 250), # Randomized market price per unit
                    "label": crop
                }
                
                # Introduce some "wrong soil" samples to help model learn robustness (5% chance)
                if random.random() < 0.05:
                     row["soil_type_code"] = random.choice([1, 2, 3])
                     
                data.append(row)
                
        # Remainder
        while len(data) < num_samples:
             choice = random.choice(crops)
             # ... copy logic ... simplified just taking from array
             data.append(data[0].copy()) # dummy
             
        df = pd.DataFrame(data)
        
        # Final cleanup
        df['N'] = df['N'].clip(0, 140)
        df['P'] = df['P'].clip(5, 145)
        df['K'] = df['K'].clip(5, 205)
        df['temperature'] = df['temperature'].clip(8, 45)
        df['humidity'] = df['humidity'].clip(10, 100)
        df['rainfall'] = df['rainfall'].clip(20, 300)
        
        return df

    @staticmethod
    def get_market_opportunities(crop_list: List[str]) -> Dict[str, float]:
        """Provides simulated market prices for economic overlay"""
        # In prod this calls a Commodities API
        base_prices = {
            "Coffee": 280.0, "Cotton": 65.0, "Jute": 40.0, "Maize": 22.0,
            "Rice": 30.0, "Wheat": 25.0, "Apple": 80.0, "Orange": 50.0
        }
        
        opportunities = {}
        for crop in crop_list:
            base = base_prices.get(crop, 100.0) # Default 100
            # Add volatility
            price = base * random.uniform(0.9, 1.3)
            opportunities[crop] = round(price, 2)
            
        return opportunities

if __name__ == "__main__":
    df = DataFactory.generate_dataset(100)
    print(df.head())
    print("Test generation complete.")
