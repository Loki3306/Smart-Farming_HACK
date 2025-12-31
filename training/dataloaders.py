import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split

DATASET_PATH = r"C:\Users\lokes\Downloads\PlantVillage-Dataset\raw\color"

BATCH_SIZE = 64
IMAGE_SIZE = 160
SEED = 42
NUM_WORKERS = 6   # based on your 12-core CPU

transform = transforms.Compose([
transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
transforms.RandomHorizontalFlip(),
transforms.ToTensor(),
transforms.Normalize(
mean=[0.485, 0.456, 0.406],
std=[0.229, 0.224, 0.225]
)
])

dataset = datasets.ImageFolder(DATASET_PATH, transform=transform)

train_size = int(0.8 * len(dataset))
val_size = len(dataset) - train_size

torch.manual_seed(SEED)
train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(
train_dataset,
batch_size=BATCH_SIZE,
shuffle=True,
num_workers=NUM_WORKERS,
pin_memory=False
)

val_loader = DataLoader(
val_dataset,
batch_size=BATCH_SIZE,
shuffle=False,
num_workers=NUM_WORKERS,
pin_memory=False
)

if __name__ == "__main__":
    print("Train size:", len(train_dataset))
    print("Val size:", len(val_dataset))

    images, labels = next(iter(train_loader))
    print("Batch image shape:", images.shape)
    print("Batch label shape:", labels.shape)
