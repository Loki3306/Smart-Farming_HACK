import json
import torch
from PIL import Image
from torchvision import transforms

from .model import get_model

# ---------------- CONFIG ----------------

import os
# Get the path relative to the disease_model directory
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(base_dir, "models", "plant_disease_resnet50_fast.pth")
CLASS_NAMES_PATH = os.path.join(base_dir, "app", "class_names.json")

CONFIDENCE_THRESHOLDS = {
    "Tomato": 30.0,
    "Strawberry": 75.0
}

device = torch.device("cpu")

# ---------------- LOAD MODEL ----------------

model = get_model()
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

# ---------------- LOAD CLASS NAMES ----------------

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

idx_to_class = {i: name for i, name in enumerate(class_names)}

# ---------------- TRANSFORMS ----------------

transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ---------------- INFERENCE FUNCTION ----------------

def predict(image_path: str, crop: str) -> dict:
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)

    # Crop-based filtering
    valid_indices = [
        i for i, name in idx_to_class.items()
        if name.startswith(crop + "___")
    ]

    if not valid_indices:
        return {
            "crop": crop,
            "disease": None,
            "confidence": 0.0,
            "status": "unsupported_crop"
        }

    mask = torch.zeros_like(probs)
    mask[:, valid_indices] = 1
    filtered_probs = probs * mask

    conf, pred = torch.max(filtered_probs, dim=1)

    class_name = idx_to_class[pred.item()]
    _, disease = class_name.split("___")
    confidence = conf.item() * 100

    threshold = CONFIDENCE_THRESHOLDS.get(crop, 30.0)

    status = "confident" if confidence >= threshold else "uncertain"

    return {
        "crop": crop,
        "disease": disease,
        "confidence": round(confidence, 2),
        "status": status
    }
