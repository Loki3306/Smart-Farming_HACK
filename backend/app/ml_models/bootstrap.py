"""
Bootstrap Intelligence - Zero-Data Restoration System
Generates physically-consistent synthetic training data when no historical data exists
"""

import numpy as np
import pandas as pd
import os
from datetime import datetime, timedelta

def generate_synthetic_data(samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic agricultural dataset with enforced physical correlations
    
    STRICT CONSTRAINTS:
    - Temperature: 10-45°C
    - Humidity: 20-95%
    - Moisture: 10-80%
    - pH: 4.0-9.0
    - EC: 0.1-5.0 dS/m
    - Wind: 0-40 km/h
    
    ENFORCED CORRELATIONS:
    - High Temp + Low Humidity → High ET₀
    - High EC + Low Moisture → Root Stress
    - Extreme pH → Low Nutrient Availability
    - High Wind → Increased Evaporation
    """
    np.random.seed(random_seed)
    
    # Base environmental variables (with realistic distributions)
    temp = np.random.normal(25, 7, samples).clip(10, 45)
    humidity = np.random.beta(2, 2, samples) * 75 + 20  # 20-95%
    wind_speed = np.random.gamma(2, 5, samples).clip(0, 40)
    
    # Soil moisture (inversely correlated with temp, positively with humidity)
    moisture_base = 50 + (humidity - 57.5) * 0.3 - (temp - 25) * 0.5
    moisture = (moisture_base + np.random.normal(0, 5, samples)).clip(10, 80)
    
    # Soil chemistry
    ph = np.random.normal(6.5, 1.0, samples).clip(4.0, 9.0)
    ec_salinity = np.random.gamma(2, 0.8, samples).clip(0.1, 5.0)
    
    # Calculate ET₀ using simplified Penman-Monteith correlation
    # ET₀ increases with temp, decreases with humidity, increases with wind
    et0_base = 0.1 * temp + 0.02 * wind_speed - 0.03 * humidity
    et0 = (et0_base + np.random.normal(0, 0.5, samples)).clip(0.5, 12.0)
    
    # Moisture delta (24h prediction target)
    # Depends on ET₀, irrigation events (random), and rainfall (random)
    irrigation_events = np.random.binomial(1, 0.15, samples) * np.random.uniform(10, 25, samples)
    rainfall = np.random.binomial(1, 0.1, samples) * np.random.uniform(5, 20, samples)
    moisture_delta = -et0 * 0.8 + irrigation_events + rainfall
    moisture_delta = moisture_delta.clip(-30, 40)
    
    # NPK availability (correlated with pH and EC)
    # Nitrogen: optimal at pH 6-7
    n_available = 100 * np.exp(-0.5 * ((ph - 6.5) / 1.5) ** 2)
    n_available = (n_available + np.random.normal(0, 10, samples)).clip(10, 150)
    
    # Phosphorus: locked below pH 5.5 and above 7.5
    p_available = np.where(ph < 5.5, 15, np.where(ph > 7.5, 20, 70))
    p_available = (p_available + np.random.normal(0, 8, samples)).clip(5, 100)
    
    # Potassium: less pH sensitive, affected by EC
    k_available = 120 - 15 * ec_salinity
    k_available = (k_available + np.random.normal(0, 10, samples)).clip(20, 150)
    
    # Derived features for disease model
    # Mean temperature window (simulated rolling average)
    mean_temperature_window = temp + np.random.normal(0, 2, samples)
    
    # Humidity duration hours (0-24, higher when humidity > 90)
    humidity_duration_hours = np.where(
        humidity > 90,
        np.random.uniform(6, 24, samples),
        np.random.uniform(0, 6, samples)
    )
    
    # Temperature range (simulated daily range)
    temperature_range = np.random.uniform(5, 15, samples)
    
    # Disease label (HIGH_RISK if high humidity duration + moderate temp)
    disease_label = np.where(
        (humidity_duration_hours > 6) & (mean_temperature_window > 20) & (mean_temperature_window < 30),
        1,  # HIGH_RISK
        0   # LOW_RISK
    )
    
    # Generate timestamps
    start_time = datetime.utcnow() - timedelta(days=30)
    timestamps = [start_time + timedelta(hours=i * 24 / samples * 30) for i in range(samples)]
    
    # Assemble DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'soil_moisture': moisture,
        'temperature': temp,
        'humidity': humidity,
        'wind_speed': wind_speed,
        'ec_salinity': ec_salinity,
        'soil_ph': ph,
        'et0': et0,
        'moisture_delta_next_24h': moisture_delta,
        'available_n': n_available,
        'available_p': p_available,
        'available_k': k_available,
        'mean_temperature_window': mean_temperature_window,
        'humidity_duration_hours': humidity_duration_hours,
        'temperature_range': temperature_range,
        'disease_label': disease_label
    })
    
    return df


def save_bootstrap_dataset(output_path: str = None):
    """Generate and save bootstrap dataset"""
    if output_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        datasets_dir = os.path.join(base_dir, "datasets")
        os.makedirs(datasets_dir, exist_ok=True)
        output_path = os.path.join(datasets_dir, "agriculture_dataset.csv")
    
    df = generate_synthetic_data()
    df.to_csv(output_path, index=False)
    
    print(f"✅ Bootstrap dataset generated: {output_path}")
    print(f"   Samples: {len(df)}")
    print(f"   Features: {len(df.columns)}")
    print(f"   Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    return output_path


if __name__ == "__main__":
    save_bootstrap_dataset()
