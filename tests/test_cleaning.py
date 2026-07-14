"""
Test the data cleaning functionality
"""
import pandas as pd
import numpy as np
import sys
import os

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main import perform_standard_cleaning

def create_messy_test_data():
    """Create a messy dataset to test cleaning"""
    data = {
        'Name': ['John Doe', 'jane smith', '  Bob Wilson  ', '', 'null', np.nan, 'Alice Brown', 'John Doe'],  # duplicates, whitespace, nulls
        'Age': [25, np.nan, 30, 45, np.nan, np.nan, 28, 25],  # missing values, duplicates
        'Email': ['john@test.com', 'jane@test.com', '  bob@test.com  ', '', None, np.nan, 'alice@test.com', 'john@test.com'],
        'Unnamed: 3': [np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan],  # completely empty
        'Score': [85.5, 90.0, np.nan, 78.5, np.nan, np.nan, 92.0, 85.5],
        'Category': ['A', 'B', 'A', '', 'null', np.nan, 'C', 'A'],
        '': ['', '', '', '', '', '', '', ''],  # empty column name and data
        'Mostly Empty': ['value1', np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan],  # mostly empty
    }
    
    df = pd.DataFrame(data)
    
    # Add some completely empty rows
    empty_row = pd.DataFrame([[np.nan] * len(df.columns)] * 2, columns=df.columns)
    df = pd.concat([df, empty_row], ignore_index=True)
    
    return df

def test_cleaning():
    print("🧪 Testing Data Cleaning Function")
    print("=" * 50)
    
    # Create messy test data
    messy_df = create_messy_test_data()
    
    print("📊 Original Data:")
    print(f"Shape: {messy_df.shape}")
    print(f"Columns: {list(messy_df.columns)}")
    print(f"Missing values: {messy_df.isnull().sum().sum()}")
    print(f"Duplicate rows: {messy_df.duplicated().sum()}")
    print("\nSample data:")
    print(messy_df.head(10))
    
    print("\n" + "="*50)
    
    # Clean the data
    cleaned_df = perform_standard_cleaning(messy_df, missing_threshold=0.8, fill_strategy='auto')
    
    print("\n" + "="*50)
    print("📊 Cleaned Data:")
    print(f"Shape: {cleaned_df.shape}")
    print(f"Columns: {list(cleaned_df.columns)}")
    print(f"Missing values: {cleaned_df.isnull().sum().sum()}")
    print(f"Duplicate rows: {cleaned_df.duplicated().sum()}")
    print("\nCleaned data:")
    print(cleaned_df)
    
    # Verification
    print("\n" + "="*50)
    print("✅ Verification Results:")
    
    issues_found = []
    
    # Check for remaining nulls
    null_count = cleaned_df.isnull().sum().sum()
    if null_count > 0:
        issues_found.append(f"❌ {null_count} null values remaining")
    else:
        print("✅ No missing values remaining")
    
    # Check for duplicates
    duplicate_count = cleaned_df.duplicated().sum()
    if duplicate_count > 0:
        issues_found.append(f"❌ {duplicate_count} duplicate rows remaining")
    else:
        print("✅ No duplicate rows remaining")
    
    # Check for empty columns
    empty_cols = []
    for col in cleaned_df.columns:
        if cleaned_df[col].isnull().all() or (cleaned_df[col].astype(str).str.strip() == '').all():
            empty_cols.append(col)
    
    if empty_cols:
        issues_found.append(f"❌ Empty columns remaining: {empty_cols}")
    else:
        print("✅ No empty columns remaining")
    
    # Check column names
    problematic_names = [col for col in cleaned_df.columns if str(col).strip().lower().startswith('unnamed') or str(col).strip() == '']
    if problematic_names:
        issues_found.append(f"❌ Problematic column names: {problematic_names}")
    else:
        print("✅ Column names are clean")
    
    if issues_found:
        print("\n❌ Issues found:")
        for issue in issues_found:
            print(f"  {issue}")
        return False
    else:
        print("\n🎉 All cleaning tests passed!")
        return True

if __name__ == "__main__":
    success = test_cleaning()
    if success:
        print("\n✅ Cleaning function is working correctly!")
    else:
        print("\n❌ Cleaning function needs more work!")