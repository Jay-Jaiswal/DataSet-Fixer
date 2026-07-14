"""
Debug the cleaning functionality by testing directly
"""
import pandas as pd
import numpy as np
import requests
import io

def create_test_data():
    """Create a problematic dataset"""
    data = {
        'Name': ['John Doe', 'Jane Smith', 'John Doe', '', 'Bob Wilson', np.nan],
        'Age': [25, np.nan, 25, 30, np.nan, 35],
        'Email': ['john@test.com', 'jane@test.com', 'john@test.com', '', 'bob@test.com', np.nan],
        'Unnamed: 3': [np.nan, np.nan, np.nan, np.nan, np.nan, np.nan],  # Empty column
        'Score': [85, 90, 85, np.nan, 78, np.nan],
        '': ['', '', '', '', '', '']  # Empty column with empty name
    }
    return pd.DataFrame(data)

def test_api_cleaning():
    """Test the API cleaning endpoint"""
    print("🧪 Testing API Cleaning...")
    
    # Create test data
    df = create_test_data()
    print(f"📊 Original data shape: {df.shape}")
    print(f"📊 Original missing values: {df.isnull().sum().sum()}")
    print(f"📊 Original duplicates: {df.duplicated().sum()}")
    print("\n📋 Original data:")
    print(df)
    
    # Save to CSV
    csv_data = df.to_csv(index=False)
    print(f"\n📄 CSV Data being sent:")
    print(csv_data)
    
    # Test the API
    files = {'file': ('test.csv', io.StringIO(csv_data), 'text/csv')}
    
    try:
        print("\n🌐 Calling API...")
        response = requests.post('http://127.0.0.1:8000/api/clean-file/', files=files)
        
        if response.status_code == 200:
            print("✅ API call successful!")
            
            # Parse the response
            cleaned_csv = response.content.decode('utf-8')
            cleaned_df = pd.read_csv(io.StringIO(cleaned_csv))
            
            print(f"\n📊 Cleaned data shape: {cleaned_df.shape}")
            print(f"📊 Cleaned missing values: {cleaned_df.isnull().sum().sum()}")
            print(f"📊 Cleaned duplicates: {cleaned_df.duplicated().sum()}")
            print("\n📋 Cleaned data:")
            print(cleaned_df)
            
            # Check if cleaning worked
            original_issues = df.isnull().sum().sum() + df.duplicated().sum() + len([col for col in df.columns if 'Unnamed' in str(col) or str(col).strip() == ''])
            cleaned_issues = cleaned_df.isnull().sum().sum() + cleaned_df.duplicated().sum()
            
            print(f"\n🎯 Cleaning Assessment:")
            print(f"   Original issues: {original_issues}")
            print(f"   Remaining issues: {cleaned_issues}")
            
            if cleaned_issues < original_issues:
                print("✅ Cleaning improved the data!")
            else:
                print("❌ Cleaning didn't improve the data enough")
                
        else:
            print(f"❌ API error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api_cleaning()