"""
Comprehensive test of the DataFixer cleaning functionality
"""
import requests
import pandas as pd
import io

def test_full_workflow():
    print("🔬 COMPREHENSIVE DATAFIXER CLEANING TEST")
    print("=" * 60)
    
    # Step 1: Create problematic test data
    problematic_csv = """Name,Age,Email,Unnamed: 1,Score,Category,
John Doe,25,john@test.com,,85,A,
Jane Smith,,jane@test.com,,90,B,
John Doe,25,john@test.com,,85,A,
Bob Johnson,30,,,75,A,
Alice Brown,,alice@test.com,,95,C,
,,,,,,
Charlie Wilson,35,charlie@test.com,,80,B,
,40,,,88,,
John Doe,25,john@test.com,,85,A,
,,,,,,"""

    print("📄 STEP 1: Test Data Created")
    print("Raw CSV content:")
    print(problematic_csv)
    
    # Parse to see the problems
    original_df = pd.read_csv(io.StringIO(problematic_csv))
    print(f"\n📊 Original Data Analysis:")
    print(f"   Shape: {original_df.shape}")
    print(f"   Columns: {list(original_df.columns)}")
    print(f"   Missing values: {original_df.isnull().sum().sum()}")
    print(f"   Duplicate rows: {original_df.duplicated().sum()}")
    print(f"   Empty columns: {[col for col in original_df.columns if original_df[col].isnull().all() or str(col).strip() == '']}")
    
    # Show the problematic data
    print(f"\n📋 Original DataFrame:")
    print(original_df)
    
    # Step 2: Test the API
    print(f"\n🌐 STEP 2: Testing Cleaning API")
    try:
        files = {'file': ('test.csv', io.StringIO(problematic_csv), 'text/csv')}
        response = requests.post('http://127.0.0.1:8000/api/clean-file/', files=files)
        
        if response.status_code == 200:
            print("✅ API call successful!")
            
            # Get cleaning metadata from headers
            headers_info = {}
            for key, value in response.headers.items():
                if key.startswith('X-'):
                    headers_info[key] = value
            
            print(f"\n📋 Cleaning Metadata:")
            for key, value in headers_info.items():
                print(f"   {key}: {value}")
            
            # Parse the cleaned result
            cleaned_csv = response.content.decode('utf-8')
            print(f"\n📄 Cleaned CSV Content:")
            print(cleaned_csv)
            
            cleaned_df = pd.read_csv(io.StringIO(cleaned_csv))
            
            print(f"\n📊 STEP 3: Cleaned Data Analysis")
            print(f"   Shape: {cleaned_df.shape}")
            print(f"   Columns: {list(cleaned_df.columns)}")
            print(f"   Missing values: {cleaned_df.isnull().sum().sum()}")
            print(f"   Duplicate rows: {cleaned_df.duplicated().sum()}")
            
            print(f"\n📋 Cleaned DataFrame:")
            print(cleaned_df)
            
            # Step 4: Detailed comparison
            print(f"\n🎯 STEP 4: Cleaning Results Summary")
            print("=" * 40)
            
            rows_removed = original_df.shape[0] - cleaned_df.shape[0]
            cols_removed = original_df.shape[1] - cleaned_df.shape[1]
            missing_values_fixed = original_df.isnull().sum().sum() - cleaned_df.isnull().sum().sum()
            duplicates_removed = original_df.duplicated().sum() - cleaned_df.duplicated().sum()
            
            print(f"📈 Rows: {original_df.shape[0]} → {cleaned_df.shape[0]} (removed {rows_removed})")
            print(f"📈 Columns: {original_df.shape[1]} → {cleaned_df.shape[1]} (removed {cols_removed})")
            print(f"📈 Missing values: {original_df.isnull().sum().sum()} → {cleaned_df.isnull().sum().sum()} (fixed {missing_values_fixed})")
            print(f"📈 Duplicates: {original_df.duplicated().sum()} → {cleaned_df.duplicated().sum()} (removed {duplicates_removed})")
            
            # Overall assessment
            total_issues_before = original_df.isnull().sum().sum() + original_df.duplicated().sum() + cols_removed
            total_issues_after = cleaned_df.isnull().sum().sum() + cleaned_df.duplicated().sum()
            
            print(f"\n🎯 OVERALL ASSESSMENT:")
            print(f"   Issues before: {total_issues_before}")
            print(f"   Issues after: {total_issues_after}")
            print(f"   Improvement: {((total_issues_before - total_issues_after) / max(total_issues_before, 1)) * 100:.1f}%")
            
            if total_issues_after == 0:
                print(f"\n🎉 SUCCESS: Cleaning worked perfectly!")
                print(f"   ✅ All duplicates removed")
                print(f"   ✅ All empty columns removed")  
                print(f"   ✅ All missing values handled")
                print(f"   ✅ Data is clean and ready for analysis")
                return True
            else:
                print(f"\n⚠️  PARTIAL SUCCESS: Some issues remain")
                if cleaned_df.isnull().sum().sum() > 0:
                    print(f"   ⚠️  {cleaned_df.isnull().sum().sum()} missing values remain")
                if cleaned_df.duplicated().sum() > 0:
                    print(f"   ⚠️  {cleaned_df.duplicated().sum()} duplicates remain")
                return False
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to API server")
        print("   Make sure the backend server is running on http://127.0.0.1:8000")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting comprehensive test...")
    success = test_full_workflow()
    
    if success:
        print(f"\n" + "="*60)
        print("✅ CONCLUSION: DataFixer cleaning is working correctly!")
        print("   You can now use the frontend to upload files and get cleaned results.")
    else:
        print(f"\n" + "="*60)
        print("❌ CONCLUSION: There are issues with the cleaning functionality.")
        print("   Please check the errors above and fix accordingly.")