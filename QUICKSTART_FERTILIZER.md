# 🎯 Quick Start Guide - Fertilizer Recommendation System

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- pandas, numpy (data processing)
- scikit-learn (machine learning)
- joblib (model persistence)
- FastAPI & other backend dependencies

### 2. Train the Models

```bash
python train_fertilizer_model.py
```

**Expected Output:**
```
📊 Loading datasets...
✅ Loaded 8002 records from core data
🔧 Preprocessing data...
⚙️ Engineering features...
🎓 Training machine learning models...

Training fertilizer type classifier...
✅ Fertilizer classifier - Train: 0.XXX, Test: 0.XXX

Training Nitrogen quantity regressor...
✅ Nitrogen regressor - Train: 0.XXX, Test: 0.XXX

Training Phosphorous quantity regressor...
✅ Phosphorous regressor - Train: 0.XXX, Test: 0.XXX

Training Potassium quantity regressor...
✅ Potassium regressor - Train: 0.XXX, Test: 0.XXX

💾 Saving models...
✅ Models saved successfully!

🧪 Testing model with sample scenarios...
[Test results will be displayed]

✅ Training and testing completed successfully!
```

### 3. Start the Backend Server

```bash
uvicorn app.main:app --reload
```

OR

```bash
python -m app.main
```

The server will start on `http://localhost:8000`

### 4. Test the API

Open your browser and visit:
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/fertilizer/health`

## Using the System

### Option 1: Via API (Recommended for Integration)

#### Test with cURL:

```bash
curl -X POST "http://localhost:8000/api/fertilizer/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 32,
    "humidity": 60,
    "moisture": 45,
    "soil_type": "Loamy",
    "crop_type": "Wheat",
    "current_nitrogen": 15,
    "current_phosphorous": 10,
    "current_potassium": 120
  }'
```

#### Test with Python:

```python
import requests

response = requests.post(
    "http://localhost:8000/api/fertilizer/recommend",
    json={
        "temperature": 32,
        "humidity": 60,
        "moisture": 45,
        "soil_type": "Loamy",
        "crop_type": "Wheat",
        "current_nitrogen": 15,
        "current_phosphorous": 10,
        "current_potassium": 120
    }
)

result = response.json()
print(f"Recommended Fertilizer: {result['data']['fertilizer_name']}")
print(f"Application Rate: {result['data']['application_rate_kg_per_hectare']} kg/ha")
```

### Option 2: Via Web Interface

1. Make sure the backend is running
2. Start the frontend:
   ```bash
   npm run dev
   ```
3. Navigate to the Fertilizer Recommendation page
4. Fill in the form with current field conditions
5. Click "Get Recommendation"

### Option 3: Direct Python Usage

```python
from app.ml_models import get_fertilizer_recommender

# Get the recommender
recommender = get_fertilizer_recommender()

# Get recommendation
rec = recommender.predict_fertilizer(
    temperature=32,
    humidity=60,
    moisture=45,
    soil_type="Loamy",
    crop_type="Wheat",
    current_n=15,
    current_p=10,
    current_k=120
)

# Access results
print(f"Fertilizer: {rec['fertilizer_name']}")
print(f"Confidence: {rec['confidence']:.1%}")
print(f"N: {rec['npk_requirements']['nitrogen']} kg/ha")
print(f"P: {rec['npk_requirements']['phosphorous']} kg/ha")
print(f"K: {rec['npk_requirements']['potassium']} kg/ha")
print(f"Rate: {rec['application_rate_kg_per_hectare']} kg/ha")
print(f"Timing: {rec['timing']['urgency']} - Apply within {rec['timing']['days_to_apply']} days")
```

## Understanding the Output

### Sample Response:

```json
{
  "fertilizer_name": "Urea",
  "confidence": 0.85,
  "npk_requirements": {
    "nitrogen": 25.5,
    "phosphorous": 12.3,
    "potassium": 30.8,
    "total": 68.6
  },
  "application_rate_kg_per_hectare": 55.4,
  "timing": {
    "urgency": "high",
    "recommended_time_of_day": "morning",
    "days_to_apply": 2,
    "note": "Optimal conditions for application"
  },
  "alternatives": [
    {"name": "Urea", "confidence": 0.85},
    {"name": "DAP", "confidence": 0.12},
    {"name": "28-28-0", "confidence": 0.03}
  ]
}
```

### Field Explanations:

- **fertilizer_name**: The recommended fertilizer type
- **confidence**: Model confidence (0-1, higher is better)
- **npk_requirements**: How much of each nutrient is needed (kg/hectare)
- **application_rate_kg_per_hectare**: Total fertilizer to apply per hectare
- **timing.urgency**: How soon to apply (critical/high/normal/low)
- **timing.days_to_apply**: Recommended application window
- **timing.recommended_time_of_day**: Best time for application
- **alternatives**: Other suitable fertilizers with their confidence scores

## Integration with Existing System

The fertilizer recommendation is already integrated into the Agronomist Agent:

1. **Automatic Recommendations**: When soil nutrient levels are detected as deficient, the agent automatically generates fertilizer recommendations

2. **Real-time Decisions**: Based on sensor data (N, P, K levels) and environmental context (temperature, humidity, moisture)

3. **Action Instructions**: Recommendations are published as action events in the system

4. **Audit Trail**: All recommendations are logged and can be tracked via the blockchain audit system

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fertilizer/recommend` | POST | Get fertilizer recommendation |
| `/api/fertilizer/batch-recommend` | POST | Multiple recommendations at once |
| `/api/fertilizer/crops/{crop}/guidelines` | GET | Crop-specific guidelines |
| `/api/fertilizer/soil-types` | GET | List supported soil types |
| `/api/fertilizer/crop-types` | GET | List supported crops |
| `/api/fertilizer/fertilizer-types` | GET | Fertilizer information |
| `/api/fertilizer/health` | GET | Service health check |

## Common Use Cases

### 1. Pre-Season Planning
```python
# Get recommendations for different crops
for crop in ["Wheat", "Cotton", "Paddy"]:
    rec = recommender.predict_fertilizer(
        temperature=25, humidity=65, moisture=50,
        soil_type="Loamy", crop_type=crop
    )
    print(f"{crop}: {rec['fertilizer_name']}")
```

### 2. Nutrient Deficiency Response
```python
# When soil test shows low N, P, K
rec = recommender.predict_fertilizer(
    temperature=30, humidity=60, moisture=45,
    soil_type="Black", crop_type="Cotton",
    current_n=8,   # Low nitrogen
    current_p=5,   # Low phosphorous
    current_k=80   # Low potassium
)
# System recommends appropriate fertilizer and quantity
```

### 3. Growth Stage Application
```python
# Different stages may need different fertilizers
# Early stage
early_rec = recommender.predict_fertilizer(
    temperature=22, humidity=70, moisture=60,
    soil_type="Loamy", crop_type="Wheat",
    current_n=20, current_p=15, current_k=150
)

# Flowering stage  
flower_rec = recommender.predict_fertilizer(
    temperature=28, humidity=55, moisture=45,
    soil_type="Loamy", crop_type="Wheat",
    current_n=10, current_p=8, current_k=100
)
```

## Troubleshooting

### Issue: Models not loading
**Solution:**
```bash
python train_fertilizer_model.py
```

### Issue: API returns 500 error
**Check:**
1. Are models trained and saved?
2. Check logs: `tail -f logs/app.log`
3. Verify data files exist in `/data` folder

### Issue: Low confidence scores
**Normal behavior:**
- Confidence < 60% means edge case conditions
- Check alternatives list for other suitable options
- May need to adjust input parameters

### Issue: Unknown soil/crop type
**Solution:**
- Use exact names from supported lists
- Get lists via API: `/api/fertilizer/soil-types` and `/api/fertilizer/crop-types`

## Performance Tips

1. **Model Loading**: Models are loaded once at startup and cached
2. **Batch Requests**: Use `/batch-recommend` for multiple predictions
3. **Caching**: Consider caching recommendations for similar conditions

## Next Steps

1. ✅ Train models with your data
2. ✅ Test API endpoints
3. ✅ Integrate with frontend
4. ✅ Connect to IoT sensors for real-time data
5. ✅ Set up monitoring and logging

## Support

For issues or questions:
1. Check [FERTILIZER_RECOMMENDATION.md](./FERTILIZER_RECOMMENDATION.md) for detailed documentation
2. Review API docs at `/docs` when server is running
3. Check training logs for model performance

## File Structure

```
Smart-Farming_HACK/
├── data/
│   ├── data_core.csv           # Main training dataset
│   ├── Fertilizer.csv          # Fertilizer NPK data
│   ├── Crop_recommendation.csv # Crop-specific data
│   └── cropdata_updated.csv    # Additional data
├── models/                     # Trained models (created after training)
│   ├── fertilizer_classifier.pkl
│   ├── nitrogen_regressor.pkl
│   ├── phosphorous_regressor.pkl
│   ├── potassium_regressor.pkl
│   └── *_encoder.pkl
├── app/
│   ├── ml_models/
│   │   ├── __init__.py
│   │   └── fertilizer_recommender.py  # Core ML logic
│   ├── api/
│   │   ├── __init__.py
│   │   └── fertilizer.py       # API endpoints
│   └── agents/
│       └── agronomist.py       # Integrated agent
├── client/
│   └── pages/
│       └── FertilizerRecommendation.tsx  # UI component
├── train_fertilizer_model.py  # Training script
└── FERTILIZER_RECOMMENDATION.md  # Full documentation
```

## Success Indicators

After successful setup, you should see:

1. ✅ Models directory created with .pkl files
2. ✅ Training logs showing high accuracy (>85%)
3. ✅ API health check returns "operational"
4. ✅ Sample predictions return reasonable recommendations
5. ✅ Frontend displays recommendations properly

---

**Ready to get started? Run the training script and test your first recommendation! 🚀**
