"""
Row Spacing Dataset Creator
Generates synthetic training data with row spacing feature for yield prediction
Based on ICAR research data
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime

# ICAR Research Data - Optimal Spacing Impact
SPACING_DATA = {
    'rice': {
        'optimal_spacing': 20,
        'baseline_spacing': 15,
        'optimal_yield': 4190,
        'baseline_yield': 3040,
        'improvement': 37.8
    },
    'wheat': {
        'optimal_spacing': 15,
        'baseline_spacing': 25,
        'optimal_yield': 4554,
        'baseline_yield': 3820,
        'improvement': 19.2
    },
    'maize': {
        'optimal_spacing': 60,
        'baseline_spacing': 75,
        'optimal_yield': 7500,
        'baseline_yield': 6200,
        'improvement': 21.0
    },
    'cotton': {
        'optimal_spacing': 60,
        'baseline_spacing': 90,
        'optimal_yield': 2800,
        'baseline_yield': 2200,
        'improvement': 27.3
    },
    'soybean': {
        'optimal_spacing': 30,
        'baseline_spacing': 45,
        'optimal_yield': 2200,
        'baseline_yield': 1800,
        'improvement': 22.2
    }
}

def calculate_spacing_impact(crop, row_spacing_cm, base_yield):
    """
    Calculate yield impact based on row spacing
    Uses sigmoid curve to model spacing effect
    """
    if crop not in SPACING_DATA:
        return base_yield
    
    crop_data = SPACING_DATA[crop]
    optimal = crop_data['optimal_spacing']
    
    # Distance from optimal spacing
    spacing_diff = abs(row_spacing_cm - optimal)
    
    # Yield decreases as spacing deviates from optimal
    # Using exponential decay model
    impact_factor = np.exp(-0.02 * spacing_diff)
    
    # Apply impact to yield
    adjusted_yield = base_yield * (0.7 + 0.3 * impact_factor)
    
    return adjusted_yield

def generate_spacing_dataset(n_samples=5000):
    """Generate synthetic dataset with row spacing feature"""
    
    data = []
    
    for _ in range(n_samples):
        # Random crop
        crop = random.choice(list(SPACING_DATA.keys()))
        crop_data = SPACING_DATA[crop]
        
        # Soil parameters
        soil_moisture = np.random.uniform(40, 90)
        soil_ph = np.random.uniform(5.5, 7.5)
        nitrogen = np.random.uniform(40, 120)
        phosphorus = np.random.uniform(20, 80)
        potassium = np.random.uniform(30, 100)
        
        # Weather parameters
        temperature = np.random.uniform(18, 35)
        rainfall = np.random.uniform(400, 1200)
        humidity = np.random.uniform(50, 85)
        sunlight_hours = np.random.uniform(5, 10)
        
        # Row spacing (varies around optimal)
        optimal_spacing = crop_data['optimal_spacing']
        row_spacing = optimal_spacing + np.random.normal(0, 5)  # ±5cm variation
        row_spacing = max(10, min(100, row_spacing))  # Clamp between 10-100cm
        
        # Plant spacing (typically 1/3 to 1/2 of row spacing)
        plant_spacing = row_spacing * np.random.uniform(0.3, 0.5)
        
        # Calculate plant density
        plants_per_sqm = (100 / row_spacing) * (100 / plant_spacing)
        
        # Other factors
        pesticide_usage = np.random.uniform(0, 500)
        growth_days = np.random.uniform(90, 150)
        ndvi = np.random.uniform(0.5, 0.9)
        
        # Base yield (from crop type)
        base_yield = crop_data['optimal_yield'] * np.random.uniform(0.8, 1.1)
        
        # Apply spacing impact
        yield_kg = calculate_spacing_impact(crop, row_spacing, base_yield)
        
        # Add some noise
        yield_kg *= np.random.uniform(0.95, 1.05)
        
        data.append({
            'crop_type': crop,
            'soil_moisture_%': round(soil_moisture, 2),
            'soil_pH': round(soil_ph, 2),
            'nitrogen_ppm': round(nitrogen, 2),
            'phosphorus_ppm': round(phosphorus, 2),
            'potassium_ppm': round(potassium, 2),
            'temperature_C': round(temperature, 2),
            'rainfall_mm': round(rainfall, 2),
            'humidity_%': round(humidity, 2),
            'sunlight_hours': round(sunlight_hours, 2),
            'row_spacing_cm': round(row_spacing, 2),
            'plant_spacing_cm': round(plant_spacing, 2),
            'plant_density_per_sqm': round(plants_per_sqm, 2),
            'pesticide_usage_ml': round(pesticide_usage, 2),
            'total_days': int(growth_days),
            'NDVI_index': round(ndvi, 3),
            'yield_kg_per_ha': round(yield_kg, 2)
        })
    
    return pd.DataFrame(data)

if __name__ == '__main__':
    print("🌱 Generating Row Spacing Dataset...")
    
    # Generate dataset
    df = generate_spacing_dataset(5000)
    
    # Save to CSV
    output_file = '../datasets/Smart_Farming_Crop_Yield_With_Spacing.csv'
    df.to_csv(output_file, index=False)
    
    print(f"✅ Dataset created: {output_file}")
    print(f"   Total samples: {len(df)}")
    print(f"   Crops: {df['crop_type'].unique().tolist()}")
    print(f"\n📊 Spacing Statistics:")
    print(df.groupby('crop_type')['row_spacing_cm'].agg(['mean', 'min', 'max']))
    print(f"\n📈 Yield Statistics:")
    print(df.groupby('crop_type')['yield_kg_per_ha'].agg(['mean', 'min', 'max']))
    
    # Show correlation between spacing and yield
    print(f"\n🔗 Correlation: Row Spacing vs Yield")
    for crop in df['crop_type'].unique():
        crop_data = df[df['crop_type'] == crop]
        corr = crop_data['row_spacing_cm'].corr(crop_data['yield_kg_per_ha'])
        print(f"   {crop}: {corr:.3f}")
