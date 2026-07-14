"""
Simple test to verify cleaning works
"""
import pandas as pd
import numpy as np
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_cleaning_directly():
    print("🧪 Direct Cleaning Test")
    print("=" * 50)
    
    # Create a messy dataset that matches what users typically have
    messy_data = {
        'Name': ['John Doe', 'Jane Smith', 'John Doe', '', 'Bob Johnson', np.nan, 'Alice Brown'],
        'Age': [25, np.nan, 25, 30, np.nan, 35, 28],
        'Email': ['john@test.com', 'jane@test.com', 'john@test.com', '', 'bob@test.com', np.nan, 'alice@test.com'],
        'Unnamed: 3': [np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan],  # Completely empty
        'Score': [85, 90, 85, np.nan, 75, np.nan, 95],
        'Category': ['A', 'B', 'A', '', 'A', np.nan, 'C'],
        '': ['', '', '', '', '', '', '']  # Empty column name
    }
    
    df = pd.DataFrame(messy_data)
    
    # Add some empty rows
    empty_row = pd.DataFrame([[np.nan] * len(df.columns)] * 2, columns=df.columns)
    df = pd.concat([df, empty_row], ignore_index=True)
    
    print("📊 BEFORE Cleaning:")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"Missing values: {df.isnull().sum().sum()}")
    print(f"Duplicate rows: {df.duplicated().sum()}")
    print(f"Empty columns: {[col for col in df.columns if df[col].isnull().all() or str(col).strip() == '']}")
    print("\\nData sample:")
    print(df)
    
    # Import and use the cleaning function
    try:
        from main import perform_standard_cleaning
        
        print("\\n" + "="*50)
        print("🧹 CLEANING IN PROGRESS...")
        print("="*50)
        
        cleaned_df = perform_standard_cleaning(df, missing_threshold=0.8, fill_strategy='auto')
        
        print("\\n" + "="*50)
        print("📊 AFTER Cleaning:")
        print(f"Shape: {cleaned_df.shape}")
        print(f"Columns: {list(cleaned_df.columns)}")
        print(f"Missing values: {cleaned_df.isnull().sum().sum()}")
        print(f"Duplicate rows: {cleaned_df.duplicated().sum()}")
        print("\\nCleaned data:")
        print(cleaned_df)
        
        print("\\n" + "="*50)
        print("🎯 CLEANING SUMMARY:")
        print(f"✅ Rows: {df.shape[0]} → {cleaned_df.shape[0]} (removed {df.shape[0] - cleaned_df.shape[0]})")
        print(f"✅ Columns: {df.shape[1]} → {cleaned_df.shape[1]} (removed {df.shape[1] - cleaned_df.shape[1]})")
        print(f"✅ Missing values: {df.isnull().sum().sum()} → {cleaned_df.isnull().sum().sum()}")
        print(f"✅ Duplicates: {df.duplicated().sum()} → {cleaned_df.duplicated().sum()}")
        
        # Verify quality
        issues_remaining = cleaned_df.isnull().sum().sum() + cleaned_df.duplicated().sum()
        if issues_remaining == 0:
            print("\\n🎉 SUCCESS: All data quality issues resolved!")
            return True
        else:
            print(f"\\n⚠️  WARNING: {issues_remaining} issues remaining")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Cleaning error: {e}")
        return False

if __name__ == "__main__":
    success = test_cleaning_directly()
    if success:
        print("\\n✅ The cleaning function works correctly!")
    else:
        print("\\n❌ The cleaning function has issues!")