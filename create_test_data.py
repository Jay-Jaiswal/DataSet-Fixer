"""
Create test data with ground truth labels for the placement prediction model
This creates data where we know what the correct predictions should be
"""
import pandas as pd
import numpy as np

# Set seed for reproducibility
np.random.seed(42)

# Create test data with clear patterns:
# High CGPA (>7) + High IQ (>100) = Placement (1)
# Low CGPA (<6) + Low IQ (<90) = No Placement (0)

test_data = []

# Case 1: High performers - should get placement (1)
for _ in range(15):
    test_data.append({
        'cgpa': np.random.uniform(7.5, 9.5),
        'iq': np.random.uniform(105, 135),
        'placement': 1
    })

# Case 2: Low performers - should NOT get placement (0)
for _ in range(15):
    test_data.append({
        'cgpa': np.random.uniform(4.0, 5.8),
        'iq': np.random.uniform(75, 95),
        'placement': 0
    })

# Case 3: Medium performers - mixed results
for _ in range(10):
    cgpa = np.random.uniform(6.0, 7.3)
    iq = np.random.uniform(95, 110)
    # Placement if average is good
    placement = 1 if (cgpa > 6.8 and iq > 100) else 0
    test_data.append({
        'cgpa': cgpa,
        'iq': iq,
        'placement': placement
    })

# Create DataFrame
df = pd.DataFrame(test_data)

# Shuffle the data
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Save to CSV
output_file = 'test_placement_data.csv'
df.to_csv(output_file, index=False)

print(f"✅ Created {len(df)} test samples")
print(f"   Placement=1: {sum(df['placement']==1)}")
print(f"   Placement=0: {sum(df['placement']==0)}")
print(f"💾 Saved to: {output_file}")
print("\n📊 Sample data:")
print(df.head(10))
