---
title: Smart Farming Disease Detection
emoji: 🔬
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: mit
app_port: 8001
---

# Smart Farming - Plant Disease Detection Model

## Features
- 🔬 PyTorch ResNet50-based disease detection
- 🌿 Supports multiple crop types
- 📸 Image-based diagnosis
- 🎯 High accuracy predictions
- ⚡ Fast inference

## Supported Crops
- Tomato
- Potato
- Corn
- Wheat
- Rice
- And more...

## API Documentation
Once deployed, visit `/docs` for interactive API documentation.

## Model Details
- **Architecture**: ResNet50
- **Framework**: PyTorch
- **Model Size**: ~90MB
- **Input**: Plant leaf images
- **Output**: Disease classification with confidence score

## Usage
```python
import requests

# Detect disease from image
with open('leaf_image.jpg', 'rb') as f:
    files = {'image': f}
    data = {'crop': 'tomato'}
    response = requests.post(
        "https://YOUR-SPACE-URL/predict",
        files=files,
        data=data
    )
print(response.json())
```

## Example Response
```json
{
  "disease": "Early Blight",
  "confidence": 0.95,
  "crop": "tomato",
  "recommendations": [
    "Remove affected leaves",
    "Apply fungicide",
    "Improve air circulation"
  ]
}
```

## Health Check
```bash
curl https://YOUR-SPACE-URL/health
```

## Requirements
- Image format: JPG, PNG
- Max file size: 10MB
- Recommended: Clear, well-lit leaf images
