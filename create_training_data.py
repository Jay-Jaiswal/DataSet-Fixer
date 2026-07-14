"""
Create training data CSV for placement prediction model
Generates realistic data with clear patterns for model training
"""
import pandas as pd
import numpy as np

# Set seed for reproducibility
np.random.seed(123)

training_data = []

# Pattern 1: Excellent students - High CGPA (8-10) + High IQ (110-140) = Placement
print("Creating excellent students data...")
for _ in range(80):
    training_data.append({
        'cgpa': np.random.uniform(8.0, 10.0),
        'iq': np.random.uniform(110, 140),
        'placement': 1
    })

# Pattern 2: Poor students - Low CGPA (4-6) + Low IQ (70-95) = No Placement
print("Creating poor performing students data...")
for _ in range(80):
    training_data.append({
        'cgpa': np.random.uniform(4.0, 6.0),
        'iq': np.random.uniform(70, 95),
        'placement': 0
    })

# Pattern 3: Average students with good IQ - CGPA (6.5-7.8) + High IQ (105-125) = Placement
print("Creating average CGPA but high IQ students data...")
for _ in range(50):
    training_data.append({
        'cgpa': np.random.uniform(6.5, 7.8),
        'iq': np.random.uniform(105, 125),
        'placement': 1
    })

# Pattern 4: Good CGPA but lower IQ - High CGPA (7.5-8.5) + Medium IQ (95-110) = Placement
print("Creating good CGPA but medium IQ students data...")
for _ in range(50):
    training_data.append({
        'cgpa': np.random.uniform(7.5, 8.5),
        'iq': np.random.uniform(95, 110),
        'placement': 1
    })

# Pattern 5: Borderline cases - Medium CGPA (6.0-7.0) + Medium IQ (90-105) = Mixed
print("Creating borderline students data...")
for _ in range(40):
    cgpa = np.random.uniform(6.0, 7.0)
    iq = np.random.uniform(90, 105)
    # If both are on higher end, placement
    placement = 1 if (cgpa > 6.5 and iq > 97) else 0
    training_data.append({
        'cgpa': cgpa,
        'iq': iq,
        'placement': placement
    })

# Pattern 6: Some outliers - High CGPA but very low IQ = No Placement (rare cases)
print("Creating outlier cases...")
for _ in range(10):
    training_data.append({
        'cgpa': np.random.uniform(7.5, 9.0),
        'iq': np.random.uniform(70, 85),
        'placement': 0
    })

# Pattern 7: Low CGPA but exceptional IQ = Placement (rare genius cases)
for _ in range(10):
    training_data.append({
        'cgpa': np.random.uniform(5.5, 6.5),
        'iq': np.random.uniform(125, 145),
        'placement': 1
    })

# Create DataFrame
df = pd.DataFrame(training_data)

# Shuffle the data
df = df.sample(frac=1, random_state=123).reset_index(drop=True)

# Round values for cleaner data
df['cgpa'] = df['cgpa'].round(2)
df['iq'] = df['iq'].round(1)

# Save to CSV
output_file = 'training_placement_data.csv'
df.to_csv(output_file, index=False)

print(f"\n✅ Training dataset created successfully!")
print(f"📊 Total samples: {len(df)}")
print(f"   Placement=1 (Placed):     {sum(df['placement']==1)} ({100*sum(df['placement']==1)/len(df):.1f}%)")
print(f"   Placement=0 (Not Placed): {sum(df['placement']==0)} ({100*sum(df['placement']==0)/len(df):.1f}%)")
print(f"\n💾 Saved to: {output_file}")

print("\n📈 Data Statistics:")
print(df.describe())

print("\n📋 Sample data (first 10 rows):")
print(df.head(10).to_string(index=False))

print("\n📋 Sample data (last 10 rows):")
print(df.tail(10).to_string(index=False))
