import joblib
from pathlib import Path

model_path = Path('backend/models/model_classification_RandomForest_20260106_125041.pkl')
model_package = joblib.load(model_path)

print("Model package keys:", model_package.keys())
print("\nModel package structure:")
for key, value in model_package.items():
    print(f"  {key}: {type(value).__name__}")
    if key == 'feature_columns':
        print(f"    Value: {value}")
    if key == 'model':
        print(f"    Type: {type(value)}")
