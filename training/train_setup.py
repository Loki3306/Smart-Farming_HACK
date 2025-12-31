import torch
import torch.nn as nn
import torch.optim as optim
from model import get_model

NUM_CLASSES = 38
LEARNING_RATE = 1e-3   # higher LR is safe since only FC is training

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = get_model().to(device)

criterion = nn.CrossEntropyLoss()

optimizer = optim.AdamW(
    model.fc.parameters(),   # ONLY train the classifier head
    lr=LEARNING_RATE,
    weight_decay=1e-4
)

# fake batch to test backward pass (updated size)
inputs = torch.randn(8, 3, 160, 160).to(device)
labels = torch.randint(0, NUM_CLASSES, (8,)).to(device)

outputs = model(inputs)
loss = criterion(outputs, labels)

optimizer.zero_grad()
loss.backward()
optimizer.step()

print("Loss:", loss.item())
print("Backward pass successful")
