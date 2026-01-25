import pickle
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Load the trained model
model_path = 'backend/app/ml_models/yield_model.pkl'
with open(model_path, 'rb') as f:
    data = pickle.load(f)
    model = data['model']
    
print("="*60)
print("MODEL ANALYSIS")
print("="*60)
print(f"\nModel Type: {type(model).__name__}")
print(f"\nArchitecture: {model.hidden_layer_sizes}")
print(f"Total Layers: {len(model.hidden_layer_sizes) + 2}")  # +2 for input/output
print(f"Epochs Trained: {model.n_iter_}")
print(f"Final Loss: {model.loss_:.2f}")

# Calculate total parameters
n_features = len(data['feature_columns'])
total_params = 0
layer_sizes = [n_features] + list(model.hidden_layer_sizes) + [1]
for i in range(len(layer_sizes) - 1):
    weights = layer_sizes[i] * layer_sizes[i+1]
    biases = layer_sizes[i+1]
    total_params += weights + biases
    print(f"\nLayer {i+1}: {layer_sizes[i]} → {layer_sizes[i+1]}")
    print(f"  Parameters: {weights + biases:,}")

print(f"\n{'='*60}")
print(f"TOTAL PARAMETERS: {total_params:,}")
print(f"{'='*60}")

# File size analysis
import os
file_size = os.path.getsize(model_path)
print(f"\nFile Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
print(f"Average bytes per parameter: {file_size/total_params:.2f}")
print("\nNote: Small size is because sklearn uses efficient storage.")
print("TensorFlow/PyTorch models are typically larger due to graph overhead.")
