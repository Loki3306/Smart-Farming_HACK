---
title: Smart Farming Backend API
emoji: 🌾
colorFrom: green
colorTo: emerald
sdk: docker
pinned: false
license: mit
app_port: 8000
---

# Smart Farming Platform - Backend API

## Features
- 🤖 8 ML Models for farming recommendations
- 🌱 Crop recommendation engine
- 💧 Irrigation planning
- 🧪 Soil nutrient analysis
- 📊 Yield prediction
- 🔄 Real-time IoT integration
- 📱 RESTful API

## API Documentation
Once deployed, visit `/docs` for interactive API documentation.

## Models Included
- Crop Recommendation Model
- Disease Prediction Model
- Fertilizer Recommendation Model
- Irrigation Planning Model
- Nutrient Analysis Model
- Water Demand Prediction Model
- Yield Prediction Model

## Environment Variables Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `DATABASE_URL`: PostgreSQL connection string (optional)
- `REDIS_URL`: Redis connection string (optional)

## Usage
```python
import requests

# Get crop recommendation
response = requests.post(
    "https://YOUR-SPACE-URL/api/recommendations/predict",
    json={
        "farm_id": "farm_001",
        "crop_type": "wheat",
        "sensor_data": {
            "moisture": 45.5,
            "temperature": 25.3,
            "humidity": 65.2,
            "nitrogen": 40,
            "phosphorus": 30,
            "potassium": 35,
            "ph": 6.5
        }
    }
)
print(response.json())
```

## Health Check
```bash
curl https://YOUR-SPACE-URL/api/regime/health
```
