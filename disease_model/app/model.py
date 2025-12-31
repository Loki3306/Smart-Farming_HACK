import torch
import torch.nn as nn
from torchvision import models

NUM_CLASSES = 38

def get_model():
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

    for param in model.parameters():
        param.requires_grad = False

    model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)

    return model


if __name__ == "__main__":
    model = get_model()
    model.eval()

    dummy_input = torch.randn(1, 3, 160, 160)
    output = model(dummy_input)

    print("Output shape:", output.shape)

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())

    print("Trainable params:", trainable_params)
    print("Total params:", total_params)
