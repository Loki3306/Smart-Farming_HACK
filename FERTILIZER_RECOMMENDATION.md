# 🌱 Fertilizer Recommendation System

An intelligent ML-powered system that recommends optimal fertilizer type, quantity, and application timing based on real-time soil and environmental conditions.

## Features

- **Smart Fertilizer Selection**: Predicts the best fertilizer type (Urea, DAP, NPK blends) based on soil and crop conditions
- **Precise NPK Calculation**: Determines exact Nitrogen, Phosphorous, and Potassium requirements
- **Timing Optimization**: Recommends when and how to apply fertilizers for maximum effectiveness
- **Multi-Crop Support**: Works with various crops including Wheat, Paddy, Cotton, Maize, and more
- **Soil Type Adaptation**: Considers different soil types (Sandy, Loamy, Black, Red, Clayey)
- **Real-time Integration**: Seamlessly integrates with the autonomous farming system

## Architecture

### Data Sources

The system uses comprehensive datasets from `/data` folder:

1. **data_core.csv** (8,002 records)
   - Temperature, Humidity, Moisture
   - Soil Type, Crop Type
   - NPK requirements and Fertilizer names
   
2. **Fertilizer.csv**
   - NPK composition data
   - Fertilizer type mappings

3. **Crop_recommendation.csv** (2,202 records)
   - Crop-specific NPK requirements
   - Environmental parameters

### ML Models

The system uses ensemble of Random Forest models:

1. **Fertilizer Type Classifier**
   - Predicts optimal fertilizer type
   - 200 estimators, max depth 20
   - Provides confidence scores and alternatives

2. **NPK Quantity Regressors**
   - Three separate models for N, P, K
   - Predicts precise nutrient requirements
   - 150 estimators, max depth 15

### Feature Engineering

- Total NPK calculation
- NPK ratios (N:P:K)
- Heat index (temperature × moisture deficit)
- Moisture deficit
- Soil-crop interaction features

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- pandas
- numpy
- scikit-learn
- joblib

### 2. Train Models

```bash
python train_fertilizer_model.py
```

This will:
- Load datasets from `/data` folder
- Train ML models
- Save models to `/models` folder
- Run test scenarios

Expected output:
```
✅ Fertilizer classifier - Train: 0.XXX, Test: 0.XXX
✅ Nitrogen regressor - Train: 0.XXX, Test: 0.XXX
✅ Phosphorous regressor - Train: 0.XXX, Test: 0.XXX
✅ Potassium regressor - Train: 0.XXX, Test: 0.XXX
```

## API Usage

### Start the API Server

```bash
uvicorn app.main:app --reload
```

### API Endpoints

#### 1. Get Fertilizer Recommendation

**POST** `/api/fertilizer/recommend`

```json
{
  "temperature": 32,
  "humidity": 60,
  "moisture": 45,
  "soil_type": "Loamy",
  "crop_type": "Wheat",
  "current_nitrogen": 15,
  "current_phosphorous": 10,
  "current_potassium": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
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
      {"name": "DAP", "confidence": 0.12}
    ]
  }
}
```

#### 2. Get Crop Guidelines

**GET** `/api/fertilizer/crops/{crop_type}/guidelines`

Example: `/api/fertilizer/crops/Wheat/guidelines`

#### 3. Batch Recommendations

**POST** `/api/fertilizer/batch-recommend`

Send multiple requests in an array.

#### 4. List Supported Options

- **GET** `/api/fertilizer/soil-types` - List all soil types
- **GET** `/api/fertilizer/crop-types` - List all crops
- **GET** `/api/fertilizer/fertilizer-types` - Fertilizer information

#### 5. Health Check

**GET** `/api/fertilizer/health`

## Python API Usage

### Basic Usage

```python
from app.ml_models import get_fertilizer_recommender

# Get the recommender instance
recommender = get_fertilizer_recommender()

# Get recommendation
recommendation = recommender.predict_fertilizer(
    temperature=32,
    humidity=60,
    moisture=45,
    soil_type="Loamy",
    crop_type="Wheat",
    current_n=15,
    current_p=10,
    current_k=120
)

print(f"Recommended Fertilizer: {recommendation['fertilizer_name']}")
print(f"Application Rate: {recommendation['application_rate_kg_per_hectare']} kg/ha")
print(f"NPK Requirements: N={recommendation['npk_requirements']['nitrogen']}")
```

### Get Crop-Specific Guidelines

```python
guidelines = recommender.get_crop_specific_recommendations("Wheat")
print(f"Primary Nutrients: {guidelines['primary_nutrients']}")
print(f"Typical NPK: {guidelines['typical_npk']}")
```

## Integration with Agronomist Agent

The fertilizer recommendation system is integrated into the Agronomist Agent:

```python
# In app/agents/agronomist.py

# The agent automatically uses ML recommendations
fertilization_decision = self.calculate_fertilization_need(
    farm_id=farm_id,
    nitrogen=nitrogen,
    phosphorus=phosphorus,
    potassium=potassium,
    ndvi=ndvi,
    temperature=temperature,
    humidity=humidity,
    moisture=soil_moisture,
    soil_type=context.farm_metadata.get("soil_type", "Loamy"),
    crop_type=context.farm_metadata.get("crop_type", "Wheat")
)
```

## Recommendation Logic

### What Fertilizer? (Type)

Based on:
- Soil type and condition
- Crop type and growth stage
- Current NPK levels
- Environmental factors

Common recommendations:
- **Urea (46-0-0)**: High nitrogen needs, vegetative growth
- **DAP (18-46-0)**: High phosphorous, root development
- **17-17-17**: Balanced NPK, general use
- **28-28-0**: Balanced N-P for early growth
- **14-35-14**: High P with balanced N-K for flowering

### How Much? (Quantity)

Calculated based on:
- Current soil nutrient levels
- Target nutrient levels for crop
- Fertilizer NPK composition
- Field size (kg per hectare)

Formula:
```
Required Amount = Max(
    N_deficit / (N% in fertilizer),
    P_deficit / (P% in fertilizer),
    K_deficit / (K% in fertilizer)
)
```

### When? (Timing)

Determined by:

1. **Urgency Level**
   - Critical (total deficit > 80): Apply within 1 day
   - High (deficit > 50): Apply within 2 days
   - Normal (deficit > 20): Apply within 3 days
   - Low (deficit < 20): Apply within 7 days

2. **Time of Day**
   - Morning: Normal conditions
   - After irrigation: Dry soil (moisture < 30%)
   - Mid-morning: High humidity (> 80%)
   - Early morning/evening: High temperature (> 35°C)

## Supported Crops

- Wheat
- Paddy (Rice)
- Cotton
- Maize
- Sugarcane
- Barley
- Millets
- Pulses
- Oil seeds
- Ground Nuts
- Tobacco

## Supported Soil Types

- Sandy
- Loamy
- Black
- Red
- Clayey

## Fertilizer Types

| Fertilizer | NPK Ratio | Best For | Application |
|------------|-----------|----------|-------------|
| Urea | 46-0-0 | High N needs | Split doses |
| DAP | 18-46-0 | Root development | At planting |
| 17-17-17 | 17-17-17 | General use | Throughout season |
| 28-28-0 | 28-28-0 | Early growth | Early to mid-season |
| 14-35-14 | 14-35-14 | Flowering | Flowering/fruiting |
| 20-20-0 | 20-20-0 | Early growth | Seedling stage |

## Model Performance

After training, you should see:

- **Classification Accuracy**: ~85-95% (varies by dataset)
- **NPK Prediction R²**: ~0.85-0.95
- **Confidence Scores**: Provided for each recommendation

## Testing

Run the training script to test the model:

```bash
python train_fertilizer_model.py
```

This will:
1. Train all models
2. Run test scenarios
3. Display sample recommendations
4. Show crop-specific guidelines

## Troubleshooting

### Models not found

```bash
# Re-train the models
python train_fertilizer_model.py
```

### Unknown soil/crop type

The system will fall back to common values. Make sure to use supported types from the lists above.

### Low confidence scores

This is normal for edge cases. Check the alternatives list for other suitable fertilizers.

## Future Enhancements

- [ ] Deep learning models for better accuracy
- [ ] Seasonal recommendations
- [ ] Weather forecast integration
- [ ] Cost optimization
- [ ] Organic fertilizer alternatives
- [ ] Micronutrient recommendations
- [ ] Growth stage specific recommendations

## References

- Dataset sources from agricultural research
- NPK requirements based on Indian farming practices
- Fertilizer compositions from standard products

## Contributing

To add new crops or fertilizers:

1. Add data to relevant CSV files in `/data`
2. Re-train models: `python train_fertilizer_model.py`
3. Update supported lists in API

## License

Part of the Autonomous Smart Farming System
