import torch
import torch.nn as nn
import torch.optim as optim
from dataloaders import train_loader, val_loader
from model import get_model

def main():
    # CONFIG
    EPOCHS = 5
    LR = 1e-3

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # MODEL
    model = get_model().to(device)

    criterion = nn.CrossEntropyLoss()

    optimizer = optim.AdamW(
        model.fc.parameters(),   # ONLY train classifier head
        lr=LR,
        weight_decay=1e-4
    )

    # TRAIN LOOP
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        train_loss /= len(train_loader)

        # VALIDATION
        model.eval()
        val_loss = 0.0

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()

        val_loss /= len(val_loader)

        print(
            f"Epoch {epoch+1}/{EPOCHS} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f}"
        )

    # SA VE
    torch.save(model.state_dict(), "plant_disease_resnet50_fast.pth")
    print("Model saved: plant_disease_resnet50_fast.pth")


if __name__ == "__main__":
    main()
