"""
Generate a very large and dirty dataset for testing DataFixer
This dataset will include all common data quality issues
"""
import pandas as pd
import numpy as np
import random
import string
from datetime import datetime, timedelta

def generate_dirty_dataset(num_rows=5000):
    """Generate a large, dirty dataset with many quality issues"""
    
    print(f"🏭 Generating dirty dataset with {num_rows} rows...")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    data = {}
    
    # 1. Names with various issues
    first_names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
                   'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Ruby']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    names = []
    for i in range(num_rows):
        if i % 20 == 0:  # Empty names
            names.append('')
        elif i % 25 == 0:  # NULL names
            names.append(np.nan)
        elif i % 30 == 0:  # Weird formatting
            names.append('  ' + random.choice(first_names).upper() + '   ' + random.choice(last_names).lower() + '  ')
        elif i % 35 == 0:  # Invalid entries
            names.append('NULL')
        elif i % 40 == 0:  # Numbers as names
            names.append(str(random.randint(1000, 9999)))
        else:
            names.append(random.choice(first_names) + ' ' + random.choice(last_names))
    
    data['Full_Name'] = names
    
    # 2. Ages with outliers and missing values
    ages = []
    for i in range(num_rows):
        if i % 15 == 0:  # Missing ages
            ages.append(np.nan)
        elif i % 50 == 0:  # Impossible ages
            ages.append(random.choice([-5, 0, 150, 200, 999]))
        elif i % 100 == 0:  # String ages
            ages.append(str(random.randint(20, 80)))
        else:
            ages.append(random.randint(18, 85))
    
    data['Age'] = ages
    
    # 3. Emails with various issues
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com']
    emails = []
    for i in range(num_rows):
        if i % 18 == 0:  # Missing emails
            emails.append(np.nan)
        elif i % 22 == 0:  # Empty emails
            emails.append('')
        elif i % 45 == 0:  # Invalid emails
            emails.append('invalid-email')
        elif i % 60 == 0:  # Emails with spaces
            emails.append('  user@domain.com  ')
        elif i % 75 == 0:  # Malformed emails
            emails.append('@domain.com')
        else:
            username = ''.join(random.choices(string.ascii_lowercase, k=random.randint(5, 10)))
            domain = random.choice(domains)
            emails.append(f"{username}@{domain}")
    
    data['Email_Address'] = emails
    
    # 4. Phone numbers with inconsistent formatting
    phones = []
    formats = ['(XXX) XXX-XXXX', 'XXX-XXX-XXXX', 'XXX.XXX.XXXX', 'XXXXXXXXXX', '+1XXXXXXXXXX']
    for i in range(num_rows):
        if i % 12 == 0:  # Missing phones
            phones.append(np.nan)
        elif i % 28 == 0:  # Invalid phones
            phones.append('123')
        elif i % 35 == 0:  # Text in phones
            phones.append('call-me')
        else:
            digits = ''.join([str(random.randint(0, 9)) for _ in range(10)])
            format_choice = random.choice(formats)
            if 'XXX' in format_choice:
                phone = format_choice.replace('XXX', digits[:3], 1).replace('XXX', digits[3:6], 1).replace('XXXX', digits[6:])
            else:
                phone = format_choice.replace('X', lambda m: digits[formats.index(format_choice)])
                phone = ''.join([digits[j] if c == 'X' else c for j, c in enumerate(format_choice) if j < len(digits)])
            phones.append(phone)
    
    data['Phone'] = phones
    
    # 5. Salaries with outliers and formatting issues
    salaries = []
    for i in range(num_rows):
        if i % 20 == 0:  # Missing salaries
            salaries.append(np.nan)
        elif i % 40 == 0:  # Negative salaries
            salaries.append(-random.randint(1000, 50000))
        elif i % 60 == 0:  # Unrealistic salaries
            salaries.append(random.choice([1, 10000000, 999999999]))
        elif i % 80 == 0:  # Text salaries
            salaries.append('$50,000')
        else:
            salaries.append(random.randint(30000, 150000))
    
    data['Annual_Salary'] = salaries
    
    # 6. Departments with inconsistent naming
    departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations']
    dept_variations = {
        'Sales': ['sales', 'SALES', 'Sale', '  Sales  ', 'Sales Dept'],
        'Marketing': ['marketing', 'MARKETING', 'Mktg', 'Marketing Team'],
        'Engineering': ['engineering', 'ENGINEERING', 'Eng', 'Tech', 'Development'],
        'HR': ['hr', 'Human Resources', 'People', 'HR Dept'],
        'Finance': ['finance', 'FINANCE', 'Accounting', 'Finance Team'],
        'Operations': ['operations', 'OPERATIONS', 'Ops', 'Operations Team']
    }
    
    dept_list = []
    for i in range(num_rows):
        if i % 25 == 0:  # Missing departments
            dept_list.append(np.nan)
        elif i % 50 == 0:  # Invalid departments
            dept_list.append('Unknown')
        else:
            base_dept = random.choice(departments)
            variations = dept_variations[base_dept]
            dept_list.append(random.choice(variations))
    
    data['Department'] = dept_list
    
    # 7. Hire dates with various formats and issues
    start_date = datetime(2015, 1, 1)
    end_date = datetime(2024, 12, 31)
    
    hire_dates = []
    date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']
    
    for i in range(num_rows):
        if i % 30 == 0:  # Missing dates
            hire_dates.append(np.nan)
        elif i % 70 == 0:  # Invalid dates
            hire_dates.append('Invalid Date')
        elif i % 90 == 0:  # Future dates (impossible)
            future_date = datetime(2030, 1, 1) + timedelta(days=random.randint(0, 365))
            hire_dates.append(future_date.strftime(random.choice(date_formats)))
        else:
            random_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            hire_dates.append(random_date.strftime(random.choice(date_formats)))
    
    data['Hire_Date'] = hire_dates
    
    # 8. Performance scores with outliers
    scores = []
    for i in range(num_rows):
        if i % 35 == 0:  # Missing scores
            scores.append(np.nan)
        elif i % 100 == 0:  # Impossible scores
            scores.append(random.choice([-10, 150, 999]))
        else:
            scores.append(round(random.uniform(1.0, 5.0), 1))
    
    data['Performance_Score'] = scores
    
    # 9. Add completely empty columns
    data['Unnamed: 1'] = [np.nan] * num_rows  # Completely empty
    data[''] = [''] * num_rows  # Empty column name with empty values
    data['Unnamed: 2'] = ['' if i % 2 == 0 else np.nan for i in range(num_rows)]  # Mostly empty
    
    # 10. Add a column with mostly duplicated values
    data['Status'] = ['Active'] * (num_rows - 50) + ['Inactive'] * 30 + [np.nan] * 20
    
    # 11. Add columns with mixed data types
    mixed_data = []
    for i in range(num_rows):
        if i % 10 == 0:
            mixed_data.append(str(random.randint(1, 100)))
        elif i % 15 == 0:
            mixed_data.append(random.uniform(1.0, 100.0))
        elif i % 20 == 0:
            mixed_data.append(np.nan)
        else:
            mixed_data.append(random.choice(['Yes', 'No', 'Maybe', '']))
    
    data['Mixed_Column'] = mixed_data
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Add duplicate rows
    duplicate_indices = random.sample(range(len(df)), min(500, len(df) // 10))
    duplicate_rows = df.iloc[duplicate_indices].copy()
    df = pd.concat([df, duplicate_rows], ignore_index=True)
    
    # Add some completely empty rows
    empty_rows = pd.DataFrame([[np.nan] * len(df.columns)] * 100, columns=df.columns)
    df = pd.concat([df, empty_rows], ignore_index=True)
    
    # Shuffle the dataframe
    df = df.sample(frac=1).reset_index(drop=True)
    
    return df

def analyze_dataset(df):
    """Analyze the quality issues in the dataset"""
    print(f"\n📊 DATASET ANALYSIS")
    print("=" * 50)
    
    print(f"📏 Shape: {df.shape}")
    print(f"📋 Columns: {list(df.columns)}")
    
    # Missing values analysis
    missing_values = df.isnull().sum()
    total_missing = missing_values.sum()
    print(f"\n🔍 Missing Values: {total_missing} total")
    for col, missing in missing_values.items():
        if missing > 0:
            percentage = (missing / len(df)) * 100
            print(f"   {col}: {missing} ({percentage:.1f}%)")
    
    # Duplicate analysis
    duplicates = df.duplicated().sum()
    print(f"\n🔄 Duplicate Rows: {duplicates}")
    
    # Empty columns
    empty_cols = []
    for col in df.columns:
        if df[col].isnull().all() or (df[col].astype(str).str.strip() == '').all():
            empty_cols.append(col)
    print(f"\n🗑️ Empty Columns: {len(empty_cols)} - {empty_cols}")
    
    # Data type issues
    print(f"\n📊 Data Types:")
    for col in df.columns:
        dtype = df[col].dtype
        unique_vals = df[col].nunique()
        print(f"   {col}: {dtype} ({unique_vals} unique values)")
    
    # Calculate total issues
    empty_col_count = len(empty_cols)
    total_issues = total_missing + duplicates + empty_col_count
    
    print(f"\n🎯 TOTAL QUALITY ISSUES: {total_issues}")
    print(f"   Missing values: {total_missing}")
    print(f"   Duplicate rows: {duplicates}")
    print(f"   Empty columns: {empty_col_count}")
    
    return total_issues

def main():
    print("🏭 CREATING MASSIVE DIRTY DATASET FOR TESTING")
    print("=" * 60)
    
    # Generate the dataset
    dirty_df = generate_dirty_dataset(5000)  # 5000 rows
    
    # Analyze it
    total_issues = analyze_dataset(dirty_df)
    
    # Save to CSV
    filename = 'massive_dirty_dataset.csv'
    dirty_df.to_csv(filename, index=False)
    
    print(f"\n💾 DATASET SAVED: {filename}")
    print(f"📊 Size: {dirty_df.shape[0]} rows, {dirty_df.shape[1]} columns")
    print(f"🎯 Total Issues: {total_issues}")
    
    # Show a sample
    print(f"\n📋 SAMPLE DATA (first 10 rows):")
    print(dirty_df.head(10))
    
    print(f"\n✅ READY FOR TESTING!")
    print(f"   Upload '{filename}' to your DataFixer application")
    print(f"   and see how well it handles this massive dirty dataset!")

if __name__ == "__main__":
    main()