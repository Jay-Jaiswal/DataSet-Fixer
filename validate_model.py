"""
Test the trained model with labeled test data to verify predictions
"""
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix

# Load the model
model_path = Path('backend/models/model_classification_RandomForest_20260106_125041.pkl')
print("🧪 TESTING TRAINED MODEL WITH LABELED DATA")
print("="*80)
print(f"\n📦 Loading: {model_path.name}\n")

model_package = joblib.load(model_path)

# Display model info
print("📋 MODEL INFO:")
print(f"  Task: {model_package['task_type']}")
print(f"  Algorithm: {model_package['model_type']}")
print(f"  Features: {', '.join(model_package['feature_columns'])}")
print(f"  Target: {model_package['target_column']}")

# Display training performance
print("\n📊 TRAINING PERFORMANCE:")
metrics = model_package['metrics']
for key in ['accuracy', 'precision', 'recall', 'f1_score']:
    print(f"  {key.capitalize():12}: {metrics[key]:.4f}")

# Load test data
test_file = 'test_placement_data.csv'
print(f"\n📁 Loading test data: {test_file}")
df_test = pd.read_csv(test_file)
print(f"  Samples: {len(df_test)}")
print(f"  Features: {', '.join(df_test.columns.tolist())}")

# Prepare features and target
feature_cols = model_package['feature_columns']
target_col = model_package['target_column']

X_test = df_test[feature_cols]
y_test = df_test[target_col]

# Get the model (stored as 'pipeline')
model = model_package['pipeline']

# Make predictions
print("\n🔮 MAKING PREDICTIONS...")
predictions = model.predict(X_test)

# Calculate test metrics
accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average='weighted', zero_division=0)
recall = recall_score(y_test, predictions, average='weighted', zero_division=0)
f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)

print("\n" + "="*80)
print("✅ TEST RESULTS (ON NEW DATA)")
print("="*80)
print(f"  Accuracy:  {accuracy:.4f} ({100*accuracy:.1f}%) {'✅ EXCELLENT' if accuracy > 0.9 else '✅ GOOD' if accuracy > 0.7 else '⚠️  NEEDS IMPROVEMENT'}")
print(f"  Precision: {precision:.4f}")
print(f"  Recall:    {recall:.4f}")
print(f"  F1 Score:  {f1:.4f}")

# Show sample predictions
print("\n📋 SAMPLE PREDICTIONS (First 15):")
print("="*80)
print(f"{'CGPA':<8} {'IQ':<8} {'Actual':<10} {'Predicted':<12} {'Match'}")
print("-"*80)

correct = 0
for i in range(min(15, len(predictions))):
    cgpa = X_test.iloc[i]['cgpa']
    iq = X_test.iloc[i]['iq']
    actual = y_test.iloc[i]
    pred = predictions[i]
    match = "✅" if actual == pred else "❌"
    if actual == pred:
        correct += 1
    
    actual_label = "Placed" if actual == 1 else "Not Placed"
    pred_label = "Placed" if pred == 1 else "Not Placed"
    
    print(f"{cgpa:<8.2f} {iq:<8.1f} {actual_label:<10} {pred_label:<12} {match}")

print("-"*80)
print(f"Correct in sample: {correct}/15 ({100*correct/15:.1f}%)")

# Overall accuracy breakdown
total_correct = sum(y_test == predictions)
total = len(predictions)
print(f"\n🎯 OVERALL: {total_correct}/{total} correct predictions ({100*total_correct/total:.1f}%)")

# Confusion Matrix
print("\n📊 CONFUSION MATRIX:")
print("="*80)
cm = confusion_matrix(y_test, predictions)
print(f"                  Predicted")
print(f"                  Not Placed  Placed")
print(f"Actual Not Placed    {cm[0][0]:4d}       {cm[0][1]:4d}")
print(f"       Placed         {cm[1][0]:4d}       {cm[1][1]:4d}")

# Calculate specific metrics
true_negatives = cm[0][0]
false_positives = cm[0][1]
false_negatives = cm[1][0]
true_positives = cm[1][1]

print(f"\n  True Negatives (Correctly predicted NOT placed): {true_negatives}")
print(f"  True Positives (Correctly predicted placed):     {true_positives}")
print(f"  False Positives (Wrongly predicted placed):      {false_positives}")
print(f"  False Negatives (Wrongly predicted NOT placed):  {false_negatives}")

# Interpretation
print("\n💡 INTERPRETATION:")
print("="*80)
if accuracy > 0.9:
    print("  ✅ EXCELLENT: Model is highly accurate on test data!")
    print("  ✅ The model generalizes well to new, unseen data.")
elif accuracy > 0.7:
    print("  ✅ GOOD: Model performs well on test data.")
    print("  ✅ Predictions are reliable for most cases.")
else:
    print("  ⚠️  Model accuracy could be improved.")
    print("  Consider retraining with more data or different features.")

if false_positives > 0:
    print(f"  ⚠️  {false_positives} students wrongly predicted to get placed")
if false_negatives > 0:
    print(f"  ⚠️  {false_negatives} students wrongly predicted to NOT get placed")

# Save predictions
output_file = 'test_results_with_predictions.csv'
df_test['predicted'] = predictions
df_test['correct'] = df_test[target_col] == predictions
df_test.to_csv(output_file, index=False)
print(f"\n💾 Detailed results saved to: {output_file}")

print("\n" + "="*80)
print("✅ MODEL VALIDATION COMPLETE!")
print("="*80)
