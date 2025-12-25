# Smart Farming AI 🌾🤖

An AI-powered farming recommendation system that provides personalized fertilizer, irrigation, and crop suggestions based on soil and environmental data.

## Features
- **ML-Powered Recommendations**: Trained on 22 crops with scientific agricultural data
- **Fertilizer Optimization**: NPK-based fertilizer recommendations (Urea, DAP, MOP, etc.)
- **Irrigation Strategy**: Drip, Sprinkler, Flood, etc. based on crop needs
- **Crop Recommendation**: Best crop suggestions based on soil conditions

## Supported Crops (22)
Rice, Maize, Chickpea, Kidneybeans, Pigeonpeas, Mothbeans, Mungbean, Blackgram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee

---

## ⚠️ IMPORTANT: Download ML Models

The trained ML model files (`.pkl`) are too large for GitHub. **You must download them separately:**

### Download Link:
📥 **[Download ML Models from Google Drive](https://drive.google.com/drive/folders/16fibP0IT4js5iK9kWUC23NNwmxfwIK-x?usp=drive_link)**

### Installation:
1. Download the zip file from the link above
2. Extract the `.pkl` files
3. Place them in: `backend/app/ml_models/saved_models/`

Required files:
- `crop_model.pkl`
- `fertilizer_model.pkl`
- `fertilizer_le_crop.pkl`
- `fertilizer_le_soil.pkl`
- `fertilizer_le_target.pkl`
- `irrigation_model.pkl`
- `irrigation_le_crop.pkl`
- `irrigation_le_target.pkl`

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
npm install
npm run dev
```

## Regenerating Models
If you need to regenerate the ML models:
```bash
python generate_data.py  # Generates training data
python backend/app/ml_models/train_real_models.py  # Trains models
```
