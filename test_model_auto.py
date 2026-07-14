"""
Automated Model Testing Script
Tests the most recently trained model with sample data and verifies predictions
"""

import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import r2_score, mean_squared_error, classification_report, confusion_matrix

def find_latest_model():
    """Find the most recent model file"""
    models_dir = Path(__file__).parent / 'backend' / 'models'
    model_files = list(models_dir.glob('*.pkl'))
    
    if not model_files:
        print("❌ No model files found in backend/models/")
        return None
    
    # Get the most recent model by filename timestamp
    latest_model = max(model_files, key=lambda x: x.stat().st_mtime)
    return latest_model

def find_matching_sample_data(model_info):
    """Find appropriate sample data based on model type"""
    samples_dir = Path(__file__).parent / 'data' / 'samples'
    
    # Map common feature patterns to sample files
    feature_cols = model_info.get('feature_columns', [])
    target_col = model_info.get('target_column', '')
    
    # Check for loan approval patterns
    loan_features = ['income', 'credit_score', 'loan_amount', 'employment']
    if any(any(lf in fc.lower() for lf in loan_features) for fc in feature_cols):
        return samples_dir / 'loan_approval_test.csv'
    
    # Check for house price patterns
    house_features = ['bedrooms', 'bathrooms', 'sqft', 'price', 'area']
    if any(any(hf in fc.lower() for hf in house_features) for fc in feature_cols):
        return samples_dir / 'house_prices_test.csv'
    
    # Default to test_data
    return samples_dir / 'test_data_for_frontend.csv'

def generate_synthetic_test_data(model_info, num_samples=10):
    """Generate synthetic test data based on model features"""
    feature_cols = model_info.get('feature_columns', [])
    
    if not feature_cols:
        return None
    
    # Generate random data for each feature
    data = {}
    for col in feature_cols:
        # Try to infer data type from column name
        col_lower = col.lower()
        
        if any(word in col_lower for word in ['age', 'year', 'count', 'number']):
            data[col] = np.random.randint(20, 80, num_samples)
        elif any(word in col_lower for word in ['price', 'amount', 'salary', 'income', 'cost']):
            data[col] = np.random.uniform(1000, 100000, num_samples)
        elif any(word in col_lower for word in ['rate', 'score', 'percent', 'ratio']):
            data[col] = np.random.uniform(0, 100, num_samples)
        elif any(word in col_lower for word in ['category', 'type', 'class', 'status']):
            data[col] = np.random.choice(['A', 'B', 'C'], num_samples)
        else:
            # Default to random floats
            data[col] = np.random.uniform(0, 100, num_samples)
    
    return pd.DataFrame(data)

def test_model():
    """Main testing function"""
    print("🧪 AUTOMATED MODEL TESTING")
    print("="*80)
    
    # Load latest model
    model_path = find_latest_model()
    if not model_path:
        return
    
    print(f"\n📦 Loading model: {model_path.name}")
    model_package = joblib.load(model_path)
    
    # Display model info
    print("\n📋 MODEL INFORMATION:")
    print("="*80)
    print(f"  Task Type:      {model_package.get('task_type', 'Unknown')}")
    print(f"  Model Type:     {model_package.get('model_type', 'Unknown')}")
    print(f"  Target Column:  {model_package.get('target_column', 'Unknown')}")
    print(f"  Features:       {', '.join(model_package.get('feature_columns', []))}")
    print(f"  Timestamp:      {model_package.get('timestamp', 'Unknown')}")
    
    # Display training metrics
    metrics = model_package.get('metrics', {})
    if metrics:
        print("\n📊 TRAINING METRICS:")
        print("="*80)
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                print(f"  {key:20s}: {value:.4f}")
    
    # Extract model details
    task_type = model_package.get('task_type')
    feature_cols = model_package.get('feature_columns', [])
    target_col = model_package.get('target_column')
    # Model can be stored as 'model' or 'pipeline'
    model = model_package.get('model') or model_package.get('pipeline')
    
    if not model or not feature_cols:
        print("\n❌ Invalid model package: missing model or feature columns")
        return
    
    # Try to find matching sample data
    print("\n🔍 FINDING TEST DATA...")
    print("="*80)
    
    sample_file = find_matching_sample_data(model_package)
    df_test = None
    
    if sample_file and sample_file.exists():
        print(f"  Found sample file: {sample_file.name}")
        try:
            df_test = pd.read_csv(sample_file)
            # Check if all features are present
            missing_features = [col for col in feature_cols if col not in df_test.columns]
            if missing_features:
                print(f"  ⚠️  Missing features in sample: {missing_features}")
                df_test = None
            else:
                print(f"  ✅ All features present in sample data")
        except Exception as e:
            print(f"  ⚠️  Error loading sample: {e}")
            df_test = None
    
    # If no sample data, generate synthetic
    if df_test is None:
        print("  📊 Generating synthetic test data...")
        df_test = generate_synthetic_test_data(model_package, num_samples=10)
        if df_test is None:
            print("  ❌ Failed to generate test data")
            return
        print(f"  ✅ Generated {len(df_test)} synthetic samples")
    
    # Prepare features
    X_test = df_test[feature_cols]
    
    print(f"\n📊 TEST DATA PREVIEW (first 5 rows):")
    print("="*80)
    print(X_test.head())
    
    # Make predictions
    print("\n🔮 MAKING PREDICTIONS...")
    print("="*80)
    predictions = model.predict(X_test)
    
    print(f"\n✅ Generated {len(predictions)} predictions")
    print("\n📋 PREDICTIONS PREVIEW:")
    print("="*80)
    print(f"{'Row':<5} {'Prediction':<15} {'Features...'}")
    print("-"*80)
    for i in range(min(10, len(predictions))):
        feature_preview = ', '.join([f"{col}={X_test.iloc[i][col]:.2f}" if isinstance(X_test.iloc[i][col], (int, float)) 
                                     else f"{col}={X_test.iloc[i][col]}" 
                                     for col in feature_cols[:3]])  # Show first 3 features
        print(f"{i:<5} {str(predictions[i]):<15} {feature_preview}")
    
    # Check if we have actual target values for validation
    has_target = target_col and target_col in df_test.columns
    
    if has_target:
        y_test = df_test[target_col]
        print(f"\n✅ VALIDATION RESULTS (comparing with actual {target_col}):")
        print("="*80)
        
        if task_type == 'classification':
            accuracy = accuracy_score(y_test, predictions)
            precision = precision_score(y_test, predictions, average='weighted', zero_division=0)
            recall = recall_score(y_test, predictions, average='weighted', zero_division=0)
            f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
            
            print(f"  Accuracy:  {accuracy:.4f} ({'✅ GOOD' if accuracy > 0.7 else '⚠️  LOW'})")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1 Score:  {f1:.4f}")
            
            print("\n📋 Sample Predictions vs Actual:")
            print("-"*80)
            print(f"{'Actual':<15} {'Predicted':<15} {'Match'}")
            print("-"*80)
            for i in range(min(10, len(predictions))):
                match = "✅" if y_test.iloc[i] == predictions[i] else "❌"
                print(f"{str(y_test.iloc[i]):<15} {str(predictions[i]):<15} {match}")
            
            # Show accuracy breakdown
            correct = sum(y_test == predictions)
            total = len(predictions)
            print(f"\n🎯 Correct predictions: {correct}/{total} ({100*correct/total:.1f}%)")
            
        elif task_type == 'regression':
            r2 = r2_score(y_test, predictions)
            mse = mean_squared_error(y_test, predictions)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(y_test - predictions))
            
            print(f"  R² Score: {r2:.4f} ({'✅ GOOD' if r2 > 0.7 else '⚠️  LOW'})")
            print(f"  MSE:      {mse:.4f}")
            print(f"  RMSE:     {rmse:.4f}")
            print(f"  MAE:      {mae:.4f}")
            
            print("\n📋 Sample Predictions vs Actual:")
            print("-"*80)
            print(f"{'Actual':<15} {'Predicted':<15} {'Error':<15} {'% Error'}")
            print("-"*80)
            for i in range(min(10, len(predictions))):
                actual = y_test.iloc[i]
                pred = predictions[i]
                error = abs(actual - pred)
                pct_error = 100 * error / actual if actual != 0 else 0
                print(f"{actual:<15.2f} {pred:<15.2f} {error:<15.2f} {pct_error:.1f}%")
            
            # Show average error
            avg_pct_error = 100 * mae / np.mean(y_test) if np.mean(y_test) != 0 else 0
            print(f"\n📊 Average prediction error: {avg_pct_error:.1f}%")
    
    else:
        print(f"\n⚠️  No target column '{target_col}' in test data - showing predictions only")
        print("   (Cannot validate correctness without ground truth labels)")
    
    # Save predictions
    output_file = Path(__file__).parent / f'predictions_output_{model_path.stem}.csv'
    df_test['predicted'] = predictions
    df_test.to_csv(output_file, index=False)
    print(f"\n💾 Predictions saved to: {output_file.name}")
    
    print("\n" + "="*80)
    print("✅ TESTING COMPLETE!")
    print("="*80)

if __name__ == "__main__":
    test_model()
