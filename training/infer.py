import torch
from torchvision import transforms, datasets
from PIL import Image, ImageEnhance
from model import get_model

IMAGE_PATH = r"C:\Users\lokes\Downloads\tomato_new.jpg"
MODEL_PATH = "plant_disease_resnet50_fast.pth"
DATASET_PATH = r"C:\Users\lokes\Downloads\PlantVillage-Dataset\raw\color"

SELECTED_CROP = "Tomato"   # <<< CHANGE THIS

device = torch.device("cpu")

# ---------------- SAFE PREPROCESS ----------------
def safe_preprocess(pil_img):
    w, h = pil_img.size

    crop_ratio = 0.95
    new_w, new_h = int(w * crop_ratio), int(h * crop_ratio)
    left = (w - new_w) // 2
    top = (h - new_h) // 2
    right = left + new_w
    bottom = top + new_h

    pil_img = pil_img.crop((left, top, right, bottom))
    pil_img = ImageEnhance.Brightness(pil_img).enhance(1.02)
    pil_img = ImageEnhance.Contrast(pil_img).enhance(1.02)

    return pil_img

# ---------------- LOAD MODEL ----------------
model = get_model()
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

# ---------------- LOAD CLASSES ----------------
dataset = datasets.ImageFolder(DATASET_PATH)
idx_to_class = {v: k for k, v in dataset.class_to_idx.items()}

valid_indices = []
for idx, class_name in idx_to_class.items():
    crop, _ = class_name.split("___")
    if crop == SELECTED_CROP:
        valid_indices.append(idx)

# ---------------- TRANSFORMS ----------------
transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ---------------- LOAD IMAGE ----------------
image = Image.open(IMAGE_PATH).convert("RGB")

# Apply preprocessing
image = safe_preprocess(image)

image = transform(image).unsqueeze(0)

# ---------------- INFERENCE ----------------
with torch.no_grad():
    outputs = model(image)
    probs = torch.softmax(outputs, dim=1)

mask = torch.zeros_like(probs)
mask[:, valid_indices] = 1
filtered_probs = probs * mask

conf, pred = torch.max(filtered_probs, dim=1)

class_name = idx_to_class[pred.item()]
crop, disease = class_name.split("___")

print("Crop:", crop)
print("Disease:", disease)
print("Confidence:", round(conf.item() * 100, 2), "%")
