"""
Test a trained model downloaded from DataFixer
Usage: python test_model.py
"""

import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_squared_error, r2_score
)
import os

def test_model():
    """Load and test a trained model"""
    
    # Find the most recent model file
    models_dir = "backend/models"
    if not os.path.exists(models_dir):
        print("❌ Models directory not found. Make sure you've trained a model first.")
        return
    
    model_files = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]
    if not model_files:
        print("❌ No model files found. Train a model first.")
        return
    
    # Get the most recent model
    latest_model = max(
        [os.path.join(models_dir, f) for f in model_files],
        key=os.path.getctime
    )
    
    print(f"\n🔍 Loading model: {os.path.basename(latest_model)}")
    
    # Load the model package
    model_package = joblib.load(latest_model)
    
    # Display model info
    print("\n📊 Model Information:")
    print(f"  Task Type: {model_package.get('task_type')}")
    print(f"  Model Type: {model_package.get('model_type')}")
    print(f"  Target Column: {model_package.get('target_column')}")
    print(f"  Features: {', '.join(model_package.get('feature_columns', []))}")
    print(f"  Trained: {model_package.get('timestamp')}")
    
    # Display training metrics
    print("\n📈 Training Metrics:")
    metrics = model_package.get('metrics', {})
    for key, value in metrics.items():
        if key != 'confusion_matrix':
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
    
    # Ask for test data
    print("\n" + "="*60)
    print("To test this model on new data:")
    print("="*60)
    
    test_file = input("\n📁 Enter path to test CSV file (or press Enter to skip): ").strip()
    
    if not test_file:
        print("\n✅ Model loaded successfully. No testing performed.")
        print(f"\n💡 To test later, use:")
        print(f"   python test_model.py")
        return
    
    if not os.path.exists(test_file):
        print(f"❌ File not found: {test_file}")
        return
    
    # Load test data
    print(f"\n📂 Loading test data from: {test_file}")
    df_test = pd.read_csv(test_file)
    
    print(f"  Rows: {len(df_test)}")
    print(f"  Columns: {len(df_test.columns)}")
    
    # Extract features and target
    feature_cols = model_package.get('feature_columns')
    target_col = model_package.get('target_column')
    task_type = model_package.get('task_type')
    
    # Validate columns exist
    missing_features = [col for col in feature_cols if col not in df_test.columns]
    if missing_features:
        print(f"\n❌ Missing features in test data: {missing_features}")
        return
    
    X_test = df_test[feature_cols]
    
    # Check if target column exists
    has_target = target_col in df_test.columns
    
    if not has_target:
        print(f"\n⚠️  Target column '{target_col}' not found. Making predictions only.")
    
    # Make predictions
    print("\n🔮 Making predictions...")
    model = model_package.get('model')
    predictions = model.predict(X_test)
    
    # Save predictions
    df_test['predicted'] = predictions
    output_file = test_file.replace('.csv', '_predictions.csv')
    df_test.to_csv(output_file, index=False)
    print(f"✅ Predictions saved to: {output_file}")
    
    # If target exists, calculate metrics
    if has_target:
        y_test = df_test[target_col]
        
        print("\n📊 Test Results:")
        print("="*60)
        
        if task_type == 'classification':
            accuracy = accuracy_score(y_test, predictions)
            precision = precision_score(y_test, predictions, average='weighted', zero_division=0)
            recall = recall_score(y_test, predictions, average='weighted', zero_division=0)
            f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
            
            print(f"  Accuracy:  {accuracy:.4f}")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1 Score:  {f1:.4f}")
            
            print("\n📋 Classification Report:")
            print(classification_report(y_test, predictions))
            
            print("\n🔢 Confusion Matrix:")
            cm = confusion_matrix(y_test, predictions)
            print(cm)
            
        elif task_type == 'regression':
            r2 = r2_score(y_test, predictions)
            mse = mean_squared_error(y_test, predictions)
            rmse = np.sqrt(mse)
            
            print(f"  R² Score: {r2:.4f}")
            print(f"  MSE:      {mse:.4f}")
            print(f"  RMSE:     {rmse:.4f}")
    
    print("\n✅ Testing complete!")

if __name__ == "__main__":
    test_model()
