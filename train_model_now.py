import sys
import os

# Add parent directory to path to import yield_predictor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.ml_models.yield_predictor import train_yield_model

if __name__ == "__main__":
    print("Starting manual model training...")
    result = train_yield_model()
    print(f"\nTraining completed: {result}")
