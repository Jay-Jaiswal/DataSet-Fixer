"""
Test script to verify Model Builder functionality
"""
import pandas as pd
import numpy as np
import os

# Create a sample dataset for testing
def create_sample_dataset():
    np.random.seed(42)
    
    # Create classification dataset
    n_samples = 200
    
    data = {
        'age': np.random.randint(18, 70, n_samples),
        'income': np.random.randint(20000, 150000, n_samples),
        'credit_score': np.random.randint(300, 850, n_samples),
        'years_employed': np.random.randint(0, 40, n_samples),
        'num_credit_cards': np.random.randint(0, 10, n_samples),
        'approved': np.random.choice([0, 1], n_samples, p=[0.4, 0.6])
    }
    
    df = pd.DataFrame(data)
    
    # Save to CSV
    output_path = os.path.join('..', 'data', 'samples', 'loan_approval_test.csv')
    df.to_csv(output_path, index=False)
    print(f"✅ Created test dataset: {output_path}")
    print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"   Columns: {list(df.columns)}")
    print(f"\nFirst 5 rows:")
    print(df.head())
    
    # Create regression dataset
    data_reg = {
        'bedrooms': np.random.randint(1, 6, n_samples),
        'bathrooms': np.random.randint(1, 4, n_samples),
        'sqft': np.random.randint(500, 5000, n_samples),
        'year_built': np.random.randint(1950, 2024, n_samples),
        'garage': np.random.choice([0, 1, 2], n_samples),
        'price': np.random.randint(100000, 1000000, n_samples)
    }
    
    df_reg = pd.DataFrame(data_reg)
    output_path_reg = os.path.join('..', 'data', 'samples', 'house_prices_test.csv')
    df_reg.to_csv(output_path_reg, index=False)
    print(f"\n✅ Created regression test dataset: {output_path_reg}")
    print(f"   Rows: {len(df_reg)}, Columns: {len(df_reg.columns)}")
    
    return df, df_reg

if __name__ == "__main__":
    print("🧪 Creating test datasets for Model Builder...\n")
    create_sample_dataset()
    print("\n✅ Test datasets created successfully!")
    print("\nYou can now:")
    print("1. Start the backend: python main.py")
    print("2. Start the frontend: cd ../data-cleaner-ui && npm run dev")
    print("3. Upload loan_approval_test.csv in Model Builder")
    print("4. Try training a classification model!")
