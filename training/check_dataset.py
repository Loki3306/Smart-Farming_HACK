from torchvision import datasets
from torchvision import transforms
import os

DATASET_PATH = r"C:\Users\lokes\Downloads\PlantVillage-Dataset\raw\color"

transform = transforms.Compose([
transforms.Resize((224, 224)),
transforms.ToTensor()
])

dataset = datasets.ImageFolder(root=DATASET_PATH, transform=transform)

print("Total images:", len(dataset))
print("Number of classes:", len(dataset.classes))
print("Classes:")

for i, cls in enumerate(dataset.classes):
    print(f"{i}: {cls}")
