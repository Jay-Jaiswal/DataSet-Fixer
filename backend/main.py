import pandas as pd
import numpy as np
import json
import os
import io
import base64
from io import StringIO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from detection import DataIssueDetector
from solution import DataIssueSolver
from typing import Optional, Dict, Any
import joblib
from datetime import datetime
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, mean_absolute_error, mean_squared_error, precision_score,
    r2_score, recall_score, f1_score, roc_auc_score,
)
from dotenv import load_dotenv


def read_uploaded_dataframe(content: bytes, filename: Optional[str]) -> pd.DataFrame:
    """Load CSV, JSON, or Excel uploads with useful client-facing validation errors."""
    extension = os.path.splitext(filename or "")[1].lower()

    if extension == ".csv":
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
        return pd.read_csv(StringIO(text), sep=None, engine="python")

    if extension == ".json":
        try:
            data = json.loads(content.decode("utf-8"))
        except UnicodeDecodeError:
            data = json.loads(content.decode("latin-1"))
        return pd.DataFrame(data) if isinstance(data, list) else pd.json_normalize(data)

    if extension in {".xlsx", ".xls"}:
        try:
            return pd.read_excel(io.BytesIO(content))
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="Excel support is not installed. Run: pip install -r requirements.txt"
            ) from exc

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Upload a CSV, JSON, XLSX, or XLS file."
    )

# Load environment variables
load_dotenv()

# Production configuration
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
ENV = os.environ.get("ENV", "development")

# CORS origins for local development and the deployed Vercel frontend.
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://data-set-fixer.vercel.app",
]
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS)).split(",")
    if origin.strip()
]

# Keep local development friction-free; production must use explicit origins.
if ENV == "development":
    CORS_ORIGINS = ["*"]

app = FastAPI(
    title="DataFixer API",
    description="Professional data cleaning and analysis API",
    version="1.0.0",
    docs_url="/docs" if ENV != "production" else None,  # Hide docs in production
    redoc_url="/redoc" if ENV != "production" else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS, 
    allow_credentials=True, 
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    try:
        import ydata_profiling
        profiling_available = True
        profiling_version = ydata_profiling.__version__
    except ImportError:
        profiling_available = False
        profiling_version = None
    
    return {
        "message": "Data Cleaner API running.",
        "endpoints": {
            "analyze": "/api/upload-and-analyze/ (POST multipart/form-data file=...)",
            "clean": "/api/clean-file/ (POST multipart/form-data file=...)",
            "preview_cleaning": "/api/preview-cleaning/ (POST multipart/form-data file=...)",
            "profile_report": "/api/profile-report/ (POST multipart/form-data file=...) returns HTML report" if profiling_available else "/api/profile-report/ (DISABLED - ydata-profiling not available)",
            "profiling_status": "/api/profiling-status",
            "docs": "/docs"
        },
        "cleaning_options": {
            "missing_threshold": "Configurable threshold for dropping columns (default: 0.8 = 80%)",
            "fill_strategy": "auto/drop/fill - controls how to handle high-missing-value columns",
            "preview_mode": "Use /api/preview-cleaning/ to see what will happen before cleaning"
        },
        "features": {
            "profiling_available": profiling_available,
            "profiling_version": profiling_version,
            "auto_install_fallback": True
        }
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/profiling-status")
async def profiling_status():
    """
    Check if ydata-profiling is available for use.
    """
    try:
        import ydata_profiling
        return {
            "available": True,
            "version": ydata_profiling.__version__,
            "message": "Profiling functionality is available"
        }
    except ImportError:
        return {
            "available": False,
            "version": None,
            "message": "ydata-profiling is not installed. Install with: pip install ydata-profiling"
        }


def generate_data_report(df: pd.DataFrame) -> dict:
    report = {
        'overview': {
            'rows': int(df.shape[0]), 
            'columns': int(df.shape[1]),
            'total_missing_values': int(df.isnull().sum().sum()), 
            'duplicate_rows': int(df.duplicated().sum())
        },
        'column_details': {}
    }
    
    from collections import Counter
    column_counts = Counter(df.columns)
    
    # Track cleanliness metrics
    total_issues = 0
    total_possible_issues = 0
    
    for col in df.columns:
        col_data = df[col]
        missing_count = int(col_data.isnull().sum())
        details = {
            'dtype': str(col_data.dtype), 
            'missing_values': missing_count,
            'missing_percentage': float(round((missing_count / len(df)) * 100, 2)),
            'unique_values': int(col_data.nunique())
        }
        
        # Outlier detection for numeric columns
        details['outlier_count'] = 0
        if pd.api.types.is_numeric_dtype(col_data.dtype):
            try:
                q1, q3 = col_data.quantile(0.25), col_data.quantile(0.75)
                iqr = q3 - q1
                lower_bound, upper_bound = q1 - 1.5 * iqr, q3 + 1.5 * iqr
                outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
                details['outlier_count'] = int(len(outliers))
            except Exception:
                details['outlier_count'] = 0
        
        details['mixed_capitalization'] = False
        details['is_numeric_like'] = False
        
        if pd.api.types.is_object_dtype(col_data.dtype):
            try:
                lower_unique = col_data.dropna().str.lower().nunique()
                if details['unique_values'] > 0:
                    diff_ratio = (details['unique_values'] - lower_unique) / details['unique_values']
                else:
                    diff_ratio = 0
                if diff_ratio >= 0.2:
                    details['mixed_capitalization'] = True
            except Exception:
                details['mixed_capitalization'] = False
            
            try:
                numeric_vals = pd.to_numeric(col_data, errors='coerce')
                if (1 - numeric_vals.isnull().sum() / max(1, len(col_data))) * 100 > 90:
                    details['is_numeric_like'] = True
            except Exception:
                details['is_numeric_like'] = False
        
        reasons = []
        column_issues = 0
        
        # Count issues for cleanliness calculation
        if details['missing_percentage'] > 20:
            reasons.append(f"High missing rate: {details['missing_percentage']}%")
            column_issues += 1
        if details.get('mixed_capitalization'):
            reasons.append("Inconsistent capitalization")
            column_issues += 1
        if details.get('outlier_count', 0) > 0:
            reasons.append(f"{details.get('outlier_count', 0)} potential outliers")
            column_issues += 1
        if details.get('is_numeric_like'):
            reasons.append("Numeric-looking strings")
            column_issues += 1
        
        if column_counts[col] > 1:
            details['has_problem'] = True
            details['reasons'] = reasons + [f"Duplicate column name: {col}"]
            column_issues += 1
        else:
            details['has_problem'] = missing_count > 0
            details['reasons'] = reasons
            if missing_count > 0:
                column_issues += 1
        
        # Add to totals for cleanliness calculation
        total_issues += column_issues
        total_possible_issues += 6  # max possible issues per column
        
        report['column_details'][col] = details
    
    # Calculate overall cleanliness percentage based on actual data quality
    total_cells = len(df) * len(df.columns)
    total_missing = report['overview']['total_missing_values']
    duplicate_rows = report['overview']['duplicate_rows']
    
    # Calculate data completeness (100% - missing percentage)
    data_completeness = 100 - (total_missing / total_cells * 100) if total_cells > 0 else 100
    
    # Penalize for duplicates (each 1% of duplicates reduces score by 5 points)
    duplicate_penalty = (duplicate_rows / len(df) * 100) * 5 if len(df) > 0 else 0
    
    # Penalize for columns with high missing rates (>50%)
    high_missing_cols = sum(1 for col_details in report['column_details'].values() 
                            if col_details['missing_percentage'] > 50)
    high_missing_penalty = high_missing_cols * 5  # 5 points per bad column
    
    # Calculate final score
    overall_cleanliness = max(0, min(100, int(
        data_completeness - duplicate_penalty - high_missing_penalty
    )))
    
    report['overview']['cleanliness_percentage'] = overall_cleanliness
    
    return report


def generate_recommendations(df: pd.DataFrame, report: dict) -> list:
    recommendations = []
    
    if report['overview']['duplicate_rows'] > 0:
        recommendations.append(f"Found {report['overview']['duplicate_rows']} duplicate rows. Consider removing them.")
    
    if report['overview']['total_missing_values'] > 0:
        recommendations.append("The dataset contains missing values. Consider a strategy to fill or remove them.")
    
    if any(col.lower().startswith('unnamed:') for col in df.columns):
        recommendations.append("The file seems to be missing proper headers.")
    
    for col_name, details in report['column_details'].items():
        if details['missing_percentage'] > 20:
            recommendations.append(f"Column '{col_name}' is {details['missing_percentage']}% empty. Consider dropping it.")
        if details.get('mixed_capitalization'):
            recommendations.append(f"Column '{col_name}' has inconsistent capitalization. Standardize it.")
        if details.get('is_numeric_like'):
            recommendations.append(f"Column '{col_name}' seems numeric but is stored as text. Convert its data type.")
        if details.get('outlier_count', 0) > 0:
            recommendations.append(f"Column '{col_name}' has {details['outlier_count']} potential outliers.")
    
    if not recommendations:
        recommendations.append("Good News: No major data quality issues found!")
    
    return recommendations


def perform_standard_cleaning(df: pd.DataFrame, 
                            missing_threshold: float = 0.8,
                            fill_strategy: str = 'auto') -> pd.DataFrame:
    """
    Clean the dataframe with intelligent handling of high-missing-value columns.
    
    Args:
        df: Input dataframe
        missing_threshold: Threshold above which columns are dropped (0.8 = 80%)
        fill_strategy: Strategy for filling missing values ('auto', 'drop', 'fill')
    
    Returns:
        Cleaned dataframe
    """
    print(f"🧹 Starting cleaning process...")
    print(f"📊 Original shape: {df.shape}")
    
    df_cleaned = df.copy()
    
    # Step 1: Remove completely empty rows and columns first
    print("🔍 Step 1: Removing completely empty rows and columns...")
    initial_rows = len(df_cleaned)
    initial_cols = len(df_cleaned.columns)
    
    # Remove rows that are completely empty
    df_cleaned = df_cleaned.dropna(how='all')
    
    # Remove columns that are completely empty
    df_cleaned = df_cleaned.dropna(axis=1, how='all')
    
    # Remove columns that only contain whitespace or "Unnamed" patterns
    columns_to_remove = []
    for col in df_cleaned.columns:
        col_name_str = str(col).strip().lower()
        # Check if column name is problematic
        if (col_name_str.startswith('unnamed:') or 
            col_name_str == '' or 
            col_name_str == 'nan' or
            col_name_str.startswith('index.')):
            
            # Also check if the column has mostly empty values
            non_empty_count = df_cleaned[col].dropna().astype(str).str.strip().replace('', np.nan).count()
            if non_empty_count == 0 or non_empty_count < len(df_cleaned) * 0.1:  # Less than 10% meaningful data
                columns_to_remove.append(col)
                print(f"   ❌ Removing empty/unnamed column: '{col}'")
    
    if columns_to_remove:
        df_cleaned = df_cleaned.drop(columns=columns_to_remove)
    
    rows_removed = initial_rows - len(df_cleaned)
    cols_removed = initial_cols - len(df_cleaned.columns)
    print(f"   ✅ Removed {rows_removed} empty rows and {cols_removed} empty/unnamed columns")
    
    # Step 2: Remove duplicate rows
    print("🔍 Step 2: Removing duplicate rows...")
    initial_rows = len(df_cleaned)
    # Remove duplicates more thoroughly
    df_cleaned = df_cleaned.drop_duplicates(keep='first')
    duplicates_removed = initial_rows - len(df_cleaned)
    print(f"   ✅ Removed {duplicates_removed} duplicate rows")
    
    # Step 3: Analyze and handle missing values by column
    print("🔍 Step 3: Handling missing values...")
    missing_analysis = {}
    columns_to_drop_missing = []
    
    for col in df_cleaned.columns:
        missing_count = df_cleaned[col].isnull().sum()
        missing_percentage = missing_count / len(df_cleaned) if len(df_cleaned) > 0 else 0
        missing_analysis[col] = {
            'missing_count': missing_count,
            'missing_percentage': missing_percentage
        }
        
        # Mark columns with too much missing data for removal
        if missing_percentage >= missing_threshold:
            columns_to_drop_missing.append(col)
            print(f"   ❌ Column '{col}': {missing_percentage*100:.1f}% missing - will be dropped")
    
    # Drop high-missing columns if strategy allows
    if fill_strategy != 'fill' and columns_to_drop_missing:
        df_cleaned = df_cleaned.drop(columns=columns_to_drop_missing)
        print(f"   ✅ Dropped {len(columns_to_drop_missing)} columns with >{missing_threshold*100}% missing values")
    
    # Step 4: Fill remaining missing values intelligently
    if len(df_cleaned.columns) > 0:
        print("🔍 Step 4: Filling remaining missing values...")
        
        # Handle numeric columns
        numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df_cleaned[col].isnull().sum() > 0:
                # Use median for numeric columns (more robust than mean)
                median_val = df_cleaned[col].median()
                if pd.notna(median_val):
                    df_cleaned.loc[:, col] = df_cleaned[col].fillna(median_val)
                    print(f"   ✅ Filled {col} missing values with median: {median_val}")
                else:
                    # If median is also NaN, use 0
                    df_cleaned.loc[:, col] = df_cleaned[col].fillna(0)
                    print(f"   ✅ Filled {col} missing values with 0 (no valid median)")
        
        # Handle text/object columns
        text_cols = df_cleaned.select_dtypes(include=['object', 'string']).columns
        for col in text_cols:
            if df_cleaned[col].isnull().sum() > 0:
                # Clean and standardize first
                df_cleaned.loc[:, col] = df_cleaned[col].astype(str).str.strip()
                df_cleaned.loc[:, col] = df_cleaned[col].replace(['nan', 'NaN', 'None', ''], np.nan)
                
                # Use mode for text columns
                try:
                    mode_val = df_cleaned[col].mode()
                    if len(mode_val) > 0 and pd.notna(mode_val.iloc[0]):
                        df_cleaned.loc[:, col] = df_cleaned[col].fillna(mode_val.iloc[0])
                        print(f"   ✅ Filled {col} missing values with mode: '{mode_val.iloc[0]}'")
                    else:
                        df_cleaned.loc[:, col] = df_cleaned[col].fillna("Not Specified")
                        print(f"   ✅ Filled {col} missing values with 'Not Specified'")
                except:
                    df_cleaned.loc[:, col] = df_cleaned[col].fillna("Not Specified")
                    print(f"   ✅ Filled {col} missing values with 'Not Specified' (fallback)")
    
    # Step 5: Clean text data
    print("🔍 Step 5: Cleaning text data...")
    text_cols = df_cleaned.select_dtypes(include=['object', 'string']).columns
    for col in text_cols:
        try:
            # Remove leading/trailing whitespace
            df_cleaned[col] = df_cleaned[col].astype(str).str.strip()
            # Replace multiple spaces with single space
            df_cleaned[col] = df_cleaned[col].str.replace(r'\s+', ' ', regex=True)
            # Replace common null representations
            df_cleaned[col] = df_cleaned[col].replace(['nan', 'NaN', 'null', 'NULL', 'None', ''], np.nan)
            df_cleaned[col] = df_cleaned[col].fillna("Not Specified")
        except Exception as e:
            print(f"   ⚠️ Warning: Could not clean text in column '{col}': {e}")
    
    # Step 6: Clean column names (but keep them readable)
    print("🔍 Step 6: Cleaning column names...")
    new_columns = []
    for col in df_cleaned.columns:
        # Convert to string and clean
        clean_name = str(col).strip()
        # Replace problematic characters but keep readability
        clean_name = clean_name.replace('\n', ' ').replace('\r', ' ')
        clean_name = ' '.join(clean_name.split())  # Remove extra whitespace
        # Only replace spaces with underscores if needed, but keep original case mostly
        if ' ' in clean_name:
            clean_name = clean_name.replace(' ', '_')
        new_columns.append(clean_name)
    
    df_cleaned.columns = new_columns
    
    # Step 7: Final validation and summary
    print("🔍 Step 7: Final validation...")
    
    # Remove duplicates again (in case filling created new duplicates)
    initial_rows = len(df_cleaned)
    df_cleaned = df_cleaned.drop_duplicates(keep='first')
    final_duplicates_removed = initial_rows - len(df_cleaned)
    if final_duplicates_removed > 0:
        print(f"   ✅ Removed {final_duplicates_removed} additional duplicate rows after cleaning")
    
    final_shape = df_cleaned.shape
    
    # Remove any columns that became completely empty after cleaning
    final_empty_cols = []
    for col in df_cleaned.columns:
        if df_cleaned[col].isnull().all() or (df_cleaned[col].astype(str).str.strip() == '').all():
            final_empty_cols.append(col)
    
    if final_empty_cols:
        df_cleaned = df_cleaned.drop(columns=final_empty_cols)
        print(f"   ❌ Removed {len(final_empty_cols)} columns that became empty after cleaning")
    
    print(f"✅ Cleaning complete!")
    print(f"📊 Final shape: {df_cleaned.shape}")
    print(f"📈 Data reduction: {df.shape[0] - df_cleaned.shape[0]} rows, {df.shape[1] - df_cleaned.shape[1]} columns removed")
    
    # Verify the result
    remaining_nulls = df_cleaned.isnull().sum().sum()
    remaining_duplicates = df_cleaned.duplicated().sum()
    print(f"🎯 Quality check: {remaining_nulls} missing values, {remaining_duplicates} duplicates remaining")
    
    return df_cleaned


@app.post("/api/profile-report/")
async def profile_report(file: UploadFile = File(...)):
    """
    Generate a ydata-profiling (pandas-profiling) HTML report for the uploaded dataset.
    Returns a downloadable HTML file.
    """
    try:
        # Lazy import with automatic installation fallback
        try:
            from ydata_profiling import ProfileReport  # package: ydata-profiling
        except ImportError:
            # Attempt to install ydata-profiling automatically
            import subprocess
            import sys
            try:
                print("ydata-profiling not found. Attempting to install...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "ydata-profiling"])
                from ydata_profiling import ProfileReport
                print("ydata-profiling installed successfully!")
            except Exception as install_error:
                return JSONResponse(
                    status_code=501,
                    content={
                        "message": (
                            "Profiling not available: ydata-profiling could not be installed automatically. "
                            "Please install it manually using: pip install ydata-profiling"
                        ),
                        "detail": str(install_error)
                    }
                )
        except Exception as e:
            return JSONResponse(
                status_code=501,
                content={
                    "message": (
                        "Profiling not available: ydata-profiling is not installed or not supported. "
                        "Please ensure ydata-profiling is installed and compatible with your Python version."
                    ),
                    "detail": str(e)
                }
            )

        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''

        # Reuse robust parsing logic
        if file_extension == 'csv':
            try:
                txt = content.decode('utf-8')
            except Exception:
                txt = content.decode('latin-1')
            df = pd.read_csv(StringIO(txt), sep=None, engine='python')
        elif file_extension == 'json':
            try:
                obj = json.loads(content.decode('utf-8'))
            except Exception:
                obj = json.loads(content.decode('latin-1'))
            if isinstance(obj, list):
                df = pd.DataFrame(obj)
            else:
                df = pd.json_normalize(obj)
        else:
            return JSONResponse(status_code=400, content={"message": "Unsupported file type"})

        # Guard against extremely large datasets: sample up to 10k rows for speed
        max_rows = 10000
        if len(df) > max_rows:
            df = df.sample(n=max_rows, random_state=42)

        # Generate profile (minimal to speed up, no progress bar in server logs)
        profile: ProfileReport = ProfileReport(df, minimal=True, explorative=False)
        html_content = profile.to_html()
        html_bytes = html_content.encode('utf-8')

        headers = {
            "Content-Disposition": f"attachment; filename=profile_{file.filename.rsplit('.', 1)[0]}.html"
        }
        return StreamingResponse(iter([html_bytes]), media_type="text/html", headers=headers)

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error generating profile: {str(e)}"})


@app.post("/api/upload-and-analyze/")
async def upload_and_analyze(file: UploadFile = File(...)):
    try:
        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        
        if file_extension == 'csv':
            try:
                txt = content.decode('utf-8')
            except Exception:
                txt = content.decode('latin-1')
            df = pd.read_csv(StringIO(txt), sep=None, engine='python')
        elif file_extension == 'json':
            try:
                obj = json.loads(content.decode('utf-8'))
            except Exception:
                obj = json.loads(content.decode('latin-1'))
            if isinstance(obj, list):
                df = pd.DataFrame(obj)
            else:
                df = pd.json_normalize(obj)
        else:
            return JSONResponse(status_code=400, content={"message": "Unsupported file type"})
        
        report = generate_data_report(df)
        recommendations = generate_recommendations(df, report)
        preview = df.head().to_dict(orient='records')
        
        payload = {
            "report": report, 
            "preview": preview, 
            "columns": df.columns.tolist(), 
            "recommendations": recommendations
        }
        
        safe = jsonable_encoder(payload)
        
        def _make_json_safe(obj):
            if isinstance(obj, dict):
                return {k: _make_json_safe(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_make_json_safe(v) for v in obj]
            try:
                if isinstance(obj, float):
                    if np.isnan(obj) or np.isinf(obj):
                        return None
            except Exception:
                pass
            return obj
        
        safe2 = _make_json_safe(safe)
        return JSONResponse(content=safe2)
        
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": f"Error parsing file: {str(e)}"})


@app.post("/api/clean-file/")
async def clean_file(file: UploadFile = File(...), 
                    missing_threshold: float = 0.8,
                    fill_strategy: str = "auto"):
    """
    Clean file with configurable missing value handling.
    
    Args:
        file: File to clean
        missing_threshold: Threshold above which columns are dropped (0.8 = 80%)
        fill_strategy: Strategy for missing values ('auto', 'drop', 'fill')
    """
    try:
        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        
        if file_extension == 'csv':
            try:
                txt = content.decode('utf-8')
            except Exception:
                txt = content.decode('latin-1')
            df = pd.read_csv(StringIO(txt), sep=None, engine='python')
        elif file_extension == 'json':
            try:
                obj = json.loads(content.decode('utf-8'))
            except Exception:
                obj = json.loads(content.decode('latin-1'))
            if isinstance(obj, list):
                df = pd.DataFrame(obj)
            else:
                df = pd.json_normalize(obj)
        else:
            return JSONResponse(status_code=400, content={"message": "Unsupported file type"})
        
        # Analyze missing values before cleaning
        missing_analysis = {}
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            missing_percentage = missing_count / len(df)
            missing_analysis[col] = {
                'missing_count': int(missing_count),
                'missing_percentage': float(missing_percentage * 100),
                'will_be_dropped': missing_percentage >= missing_threshold and fill_strategy != 'fill'
            }
        
        # Perform cleaning with specified strategy
        cleaned_df = perform_standard_cleaning(df, missing_threshold, fill_strategy)
        
        # Generate cleaning summary
        original_columns = len(df.columns)
        final_columns = len(cleaned_df.columns)
        dropped_columns = original_columns - final_columns
        
        if file_extension == 'csv':
            output_bytes = cleaned_df.to_csv(index=False).encode('utf-8')
            media_type = "text/csv"
            filename = f"cleaned_{file.filename}"
        else:
            output_bytes = cleaned_df.to_json(orient='records', indent=4).encode('utf-8')
            media_type = "application/json"
            filename = f"cleaned_{file.filename}"
        
        # Add cleaning metadata to response headers
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
            "X-Cleaning-Strategy": fill_strategy,
            "X-Missing-Threshold": str(missing_threshold),
            "X-Original-Columns": str(original_columns),
            "X-Final-Columns": str(final_columns),
            "X-Dropped-Columns": str(dropped_columns)
        }
        
        return StreamingResponse(
            iter([output_bytes]), 
            media_type=media_type, 
            headers=headers
        )
        
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": f"An error occurred during cleaning: {str(e)}"})


@app.post("/api/preview-cleaning/")
async def preview_cleaning(file: UploadFile = File(...), 
                          missing_threshold: float = 0.8,
                          fill_strategy: str = "auto"):
    """
    Preview what will happen during cleaning without actually cleaning the file.
    Useful for understanding the impact of different cleaning strategies.
    """
    try:
        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        
        if file_extension == 'csv':
            try:
                txt = content.decode('utf-8')
            except Exception:
                txt = content.decode('latin-1')
            df = pd.read_csv(StringIO(txt), sep=None, engine='python')
        elif file_extension == 'json':
            try:
                obj = json.loads(content.decode('utf-8'))
            except Exception:
                obj = json.loads(content.decode('latin-1'))
            if isinstance(obj, list):
                df = pd.DataFrame(obj)
            else:
                df = pd.json_normalize(obj)
        else:
            return JSONResponse(status_code=400, content={"message": "Unsupported file type"})
        
        # Analyze missing values and predict cleaning impact
        cleaning_preview = {
            'file_info': {
                'filename': file.filename,
                'file_type': file_extension,
                'total_rows': len(df),
                'total_columns': len(df.columns)
            },
            'missing_value_analysis': {},
            'cleaning_strategy': {
                'missing_threshold': missing_threshold,
                'fill_strategy': fill_strategy
            },
            'predicted_actions': [],
            'columns_to_drop': [],
            'columns_to_fill': []
        }
        
        # Analyze each column
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            missing_percentage = missing_count / len(df)
            dtype = str(df[col].dtype)
            
            col_analysis = {
                'column_name': col,
                'data_type': dtype,
                'missing_count': int(missing_count),
                'missing_percentage': float(missing_percentage * 100),
                'unique_values': int(df[col].nunique()),
                'will_be_dropped': missing_percentage >= missing_threshold and fill_strategy != 'fill'
            }
            
            # Predict filling strategy
            if missing_count > 0 and missing_percentage < missing_threshold:
                if dtype.startswith(('int', 'float')):
                    # Numeric column
                    if missing_percentage > 0.5:  # High missing rate
                        col_analysis['fill_strategy'] = 'median (high missing rate)'
                    else:
                        col_analysis['fill_strategy'] = 'mean'
                else:
                    # Object/text column
                    if missing_percentage > 0.5:  # High missing rate
                        col_analysis['fill_strategy'] = 'Unknown (high missing rate)'
                    else:
                        col_analysis['fill_strategy'] = 'mode'
            elif missing_percentage >= missing_threshold:
                col_analysis['fill_strategy'] = 'column will be dropped'
                cleaning_preview['columns_to_drop'].append(col)
            else:
                col_analysis['fill_strategy'] = 'no action needed'
            
            cleaning_preview['missing_value_analysis'][col] = col_analysis
            
            # Add to appropriate action lists
            if col_analysis['will_be_dropped']:
                cleaning_preview['columns_to_drop'].append(col)
                cleaning_preview['predicted_actions'].append(f"Drop column '{col}' ({missing_percentage*100:.1f}% missing)")
            elif missing_count > 0:
                cleaning_preview['columns_to_fill'].append(col)
                cleaning_preview['predicted_actions'].append(f"Fill missing values in '{col}' using {col_analysis['fill_strategy']}")
        
        # Summary statistics
        total_missing_columns = len([col for col in df.columns if df[col].isnull().sum() > 0])
        high_missing_columns = len(cleaning_preview['columns_to_drop'])
        
        cleaning_preview['summary'] = {
            'total_missing_columns': total_missing_columns,
            'high_missing_columns': high_missing_columns,
            'columns_after_cleaning': len(df.columns) - high_missing_columns,
            'estimated_improvement': f"{(high_missing_columns / len(df.columns) * 100):.1f}% reduction in problematic columns"
        }
        
        return JSONResponse(content=cleaning_preview)
        
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": f"Error previewing cleaning: {str(e)}"})


@app.post("/api/train-model/")
async def train_model(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    feature_columns: str = Form(...),  # JSON string of list
    task_type: str = Form(...),
    model_type: str = Form(...),
    test_size: float = Form(0.2),
    random_state: int = Form(42),
    model_params: str = Form("{}")  # JSON string of parameters
):
    """
    Train an ML model on uploaded dataset.
    
    Parameters:
    - file: CSV file with cleaned dataset
    - target_column: Name of target/label column
    - feature_columns: JSON string of feature column names
    - task_type: "classification", "regression", or "clustering"
    - model_type: Model name (e.g., "RandomForest", "LogisticRegression")
    - test_size: Train/test split ratio (default 0.2 = 80/20)
    - random_state: Random seed for reproducibility
    - model_params: JSON string of model hyperparameters
    """
    try:
        # Import ML libraries
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder, StandardScaler
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score, 
            confusion_matrix, classification_report, roc_auc_score,
            mean_squared_error, mean_absolute_error, r2_score,
            silhouette_score
        )
        from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
        from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
        from sklearn.ensemble import (
            RandomForestClassifier, RandomForestRegressor,
            GradientBoostingClassifier, GradientBoostingRegressor
        )
        from sklearn.svm import SVC, SVR
        from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
        import xgboost as xgb
        import matplotlib
        matplotlib.use('Agg')  # Non-GUI backend
        import matplotlib.pyplot as plt
        import seaborn as sns
        
        # Parse feature columns and model params
        feature_cols = json.loads(feature_columns)
        params = json.loads(model_params)
        
        # Filter out empty strings from feature columns
        feature_cols = [col for col in feature_cols if col and col.strip()]
        
        if not feature_cols:
            raise HTTPException(status_code=400, detail="No valid feature columns provided")
        
        # Read uploaded file
        content = await file.read()
        try:
            txt = content.decode('utf-8')
        except:
            txt = content.decode('latin-1')
        df = pd.read_csv(StringIO(txt))
        
        # Validate columns
        if target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in dataset")
        
        for col in feature_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Feature column '{col}' not found in dataset")
        
        # Prepare features and target
        X = df[feature_cols].copy()
        y = df[target_column].copy() if task_type != "clustering" else None
        
        # Auto-detect task type if needed (prevent classification on continuous data)
        if task_type == "classification" and y is not None:
            # Check if target has too many unique values for classification
            n_unique = y.nunique()
            n_samples = len(y)
            
            # If more than 30% unique values or more than 50 unique classes, likely regression
            if n_unique > 50 or (n_unique / n_samples) > 0.3:
                print(f"Warning: Target has {n_unique} unique values. Switching from classification to regression.")
                task_type = "regression"
                # Also update model type to regression equivalent
                if model_type == 'LogisticRegression':
                    model_type = 'LinearRegression'
                elif model_type == 'SVM':
                    model_type = 'Ridge'
                elif model_type == 'XGBoost':
                    model_type = 'XGBoost'  # XGBoost auto-detects
        
        # Identify numeric and categorical columns
        numeric_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Encode target if classification
        target_encoder = None
        if task_type == "classification" and y is not None:
            if y.dtype == 'object' or y.dtype.name == 'category':
                target_encoder = LabelEncoder()
                y = target_encoder.fit_transform(y)
        
        # Create preprocessing pipelines
        # For numeric columns: impute missing values, optionally scale
        if model_type in ['SVM', 'LogisticRegression', 'Ridge', 'Lasso', 'KMeans', 'DBSCAN']:
            numeric_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ])
        else:
            numeric_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='mean'))
            ])
        
        # For categorical columns: impute missing values, encode
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
            ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ])
        
        # Combine preprocessing steps using ColumnTransformer
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_cols),
                ('cat', categorical_transformer, categorical_cols)
            ],
            remainder='passthrough'  # Keep any other columns as-is
        )
        
        # Model selection
        model_map = {
            'classification': {
                'LogisticRegression': LogisticRegression,
                'RandomForest': RandomForestClassifier,
                'DecisionTree': DecisionTreeClassifier,
                'GradientBoosting': GradientBoostingClassifier,
                'SVM': SVC,
                'XGBoost': xgb.XGBClassifier
            },
            'regression': {
                'LinearRegression': LinearRegression,
                'RandomForest': RandomForestRegressor,
                'DecisionTree': DecisionTreeRegressor,
                'GradientBoosting': GradientBoostingRegressor,
                'Ridge': Ridge,
                'Lasso': Lasso,
                'XGBoost': xgb.XGBRegressor
            },
            'clustering': {
                'KMeans': KMeans,
                'DBSCAN': DBSCAN,
                'Agglomerative': AgglomerativeClustering
            }
        }
        
        if task_type not in model_map or model_type not in model_map[task_type]:
            raise HTTPException(status_code=400, detail=f"Invalid model type '{model_type}' for task '{task_type}'")
        
        ModelClass = model_map[task_type][model_type]
        
        # Filter valid parameters for the model
        import inspect
        valid_params = inspect.signature(ModelClass.__init__).parameters.keys()
        filtered_params = {k: v for k, v in params.items() if k in valid_params}
        
        # Initialize model
        base_model = ModelClass(**filtered_params)
        
        # Create full pipeline with preprocessing and model
        model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('model', base_model)
        ])
        
        # Training and evaluation
        metrics = {}
        confusion_mat_base64 = None
        
        if task_type in ['classification', 'regression']:
            # Train/test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )
            
            # Train model (preprocessing happens automatically in pipeline)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            if task_type == 'classification':
                # Classification metrics
                metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                metrics['precision'] = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['recall'] = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['f1_score'] = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                
                # ROC-AUC for binary classification
                if len(np.unique(y)) == 2:
                    try:
                        if hasattr(model, 'predict_proba'):
                            y_proba = model.predict_proba(X_test)[:, 1]
                            metrics['roc_auc'] = float(roc_auc_score(y_test, y_proba))
                    except:
                        pass
                
                # Confusion matrix
                cm = confusion_matrix(y_test, y_pred)
                metrics['confusion_matrix'] = cm.tolist()
                
                # Plot confusion matrix
                plt.figure(figsize=(8, 6))
                sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
                plt.title('Confusion Matrix')
                plt.ylabel('True Label')
                plt.xlabel('Predicted Label')
                
                # Convert plot to base64
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png', bbox_inches='tight')
                buffer.seek(0)
                confusion_mat_base64 = base64.b64encode(buffer.getvalue()).decode()
                plt.close()
                
            else:  # regression
                # Regression metrics
                metrics['r2_score'] = float(r2_score(y_test, y_pred))
                metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                metrics['rmse'] = float(np.sqrt(metrics['mse']))
                
                # Plot actual vs predicted
                plt.figure(figsize=(8, 6))
                plt.scatter(y_test, y_pred, alpha=0.5)
                plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
                plt.xlabel('Actual Values')
                plt.ylabel('Predicted Values')
                plt.title('Actual vs Predicted')
                
                # Convert plot to base64
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png', bbox_inches='tight')
                buffer.seek(0)
                confusion_mat_base64 = base64.b64encode(buffer.getvalue()).decode()
                plt.close()
        
        else:  # clustering
            # For clustering, fit_transform to get preprocessed data then fit clustering model
            X_transformed = preprocessor.fit_transform(X)
            base_model = ModelClass(**filtered_params)
            cluster_labels = base_model.fit_predict(X_transformed)
            
            # Create pipeline for consistency
            model = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('model', base_model)
            ])
            
            # Clustering metrics
            if len(np.unique(cluster_labels)) > 1:
                metrics['silhouette_score'] = float(silhouette_score(X_transformed, cluster_labels))
            
            if hasattr(base_model, 'inertia_'):
                metrics['inertia'] = float(base_model.inertia_)
            
            metrics['n_clusters'] = int(len(np.unique(cluster_labels)))
            metrics['cluster_sizes'] = {int(k): int(v) for k, v in zip(*np.unique(cluster_labels, return_counts=True))}
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"model_{task_type}_{model_type}_{timestamp}.pkl"
        model_path = os.path.join('models', model_filename)
        
        # Save model with all necessary components
        model_package = {
            'pipeline': model,  # Full pipeline with preprocessing
            'feature_columns': feature_cols,
            'numeric_columns': numeric_cols,
            'categorical_columns': categorical_cols,
            'target_column': target_column,
            'task_type': task_type,
            'model_type': model_type,
            'target_encoder': target_encoder,
            'metrics': metrics,
            'timestamp': timestamp
        }
        
        joblib.dump(model_package, model_path)
        
        # Prepare response
        response = {
            'success': True,
            'task_type': task_type,
            'model_type': model_type,
            'metrics': metrics,
            'model_filename': model_filename,
            'model_download_url': f'/api/download-model/{model_filename}',
            'confusion_matrix_plot': confusion_mat_base64,
            'feature_columns': feature_cols,
            'target_column': target_column,
            'train_test_split': f"{int((1-test_size)*100)}/{int(test_size*100)}",
            'timestamp': timestamp
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in train_model: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.get("/api/download-model/{filename}")
async def download_model(filename: str):
    """
    Download a trained model file.
    """
    try:
        model_path = os.path.join('models', filename)
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Model file not found")
        
        return FileResponse(
            path=model_path,
            media_type='application/octet-stream',
            filename=filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.get("/api/model-info/{filename}")
async def get_model_info(filename: str):
    """
    Get information about a trained model.
    """
    try:
        model_path = os.path.join('models', filename)
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Model file not found")
        
        model_package = joblib.load(model_path)
        
        info = {
            'filename': filename,
            'task_type': model_package.get('task_type'),
            'model_type': model_package.get('model_type'),
            'feature_columns': model_package.get('feature_columns'),
            'target_column': model_package.get('target_column'),
            'metrics': model_package.get('metrics'),
            'timestamp': model_package.get('timestamp')
        }
        
        return JSONResponse(content=info)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model info: {str(e)}")


@app.post("/api/test-model/")
async def test_model(
    file: UploadFile = File(...),
    model_file: UploadFile = File(...),
    target_column: Optional[str] = Form(None)
):
    """
    Test an uploaded model on a new dataset and return predictions plus optional evaluation metrics.
    """
    try:
        model_filename = model_file.filename or "uploaded-model.pkl"
        if not model_filename.lower().endswith(('.pkl', '.joblib')):
            raise HTTPException(status_code=400, detail="Please upload a .pkl or .joblib model file")

        model_content = await model_file.read()
        if not model_content:
            raise HTTPException(status_code=400, detail="The uploaded model file is empty")

        model_package = joblib.load(io.BytesIO(model_content))
        pipeline = model_package.get('pipeline')
        feature_columns = model_package.get('feature_columns', [])
        task_type = model_package.get('task_type', 'classification')
        target_encoder = model_package.get('target_encoder')
        stored_target_column = model_package.get('target_column')

        if pipeline is None:
            raise HTTPException(
                status_code=400,
                detail="This older saved model cannot be tested because it has no preprocessing pipeline. Retrain it from the Train page."
            )

        content = await file.read()
        df = read_uploaded_dataframe(content, file.filename)

        if not feature_columns:
            raise HTTPException(status_code=400, detail="Saved model is missing feature column metadata")

        missing_features = [col for col in feature_columns if col not in df.columns]
        if missing_features:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded dataset is missing required feature columns: {', '.join(missing_features)}"
            )

        X = df[feature_columns].copy()
        predictions = pipeline.predict(X)

        resolved_target_column = target_column if target_column and target_column in df.columns else None
        if resolved_target_column is None and stored_target_column and stored_target_column in df.columns:
            resolved_target_column = stored_target_column

        actual_available = bool(resolved_target_column and task_type != 'clustering')
        actual_values = None
        encoded_actual = None
        display_predictions = predictions
        display_actual = None
        metrics: Dict[str, Any] = {}

        if task_type == 'classification' and target_encoder is not None:
            try:
                display_predictions = target_encoder.inverse_transform(np.asarray(predictions).astype(int))
            except Exception:
                display_predictions = predictions

        if actual_available:
            actual_values = df[resolved_target_column].copy()

            if task_type == 'classification' and target_encoder is not None:
                try:
                    encoded_actual = target_encoder.transform(actual_values)
                    display_actual = actual_values.astype(str).to_numpy()
                except Exception:
                    encoded_actual = actual_values
                    display_actual = actual_values.astype(str).to_numpy()
            else:
                encoded_actual = actual_values.to_numpy()
                display_actual = actual_values.to_numpy()

            if task_type == 'classification':
                metrics['accuracy'] = float(accuracy_score(encoded_actual, predictions))
                metrics['precision'] = float(precision_score(encoded_actual, predictions, average='weighted', zero_division=0))
                metrics['recall'] = float(recall_score(encoded_actual, predictions, average='weighted', zero_division=0))
                metrics['f1_score'] = float(f1_score(encoded_actual, predictions, average='weighted', zero_division=0))

                if hasattr(pipeline, 'predict_proba'):
                    try:
                        y_proba = pipeline.predict_proba(X)
                        if len(np.unique(encoded_actual)) == 2 and y_proba.shape[1] >= 2:
                            metrics['roc_auc'] = float(roc_auc_score(encoded_actual, y_proba[:, 1]))
                    except Exception:
                        pass
            elif task_type == 'regression':
                actual_array = np.asarray(encoded_actual, dtype=float)
                prediction_array = np.asarray(predictions, dtype=float)
                mse = mean_squared_error(actual_array, prediction_array)
                mae = mean_absolute_error(actual_array, prediction_array)
                rmse = np.sqrt(mse)
                r2 = r2_score(actual_array, prediction_array)

                metrics['mse'] = float(mse)
                metrics['mae'] = float(mae)
                metrics['rmse'] = float(rmse)
                metrics['r2_score'] = float(r2)

        elif task_type == 'clustering':
            metrics['cluster_count'] = int(len(np.unique(predictions)))

        preview_count = min(len(df), 20)
        predictions_preview = []
        for idx in range(preview_count):
            row = {
                'row': idx + 1,
                'predicted': display_predictions[idx].item() if hasattr(display_predictions[idx], 'item') else display_predictions[idx]
            }

            if display_actual is not None:
                row['actual'] = display_actual[idx].item() if hasattr(display_actual[idx], 'item') else display_actual[idx]
                row['match'] = bool(row['predicted'] == row['actual'])

            predictions_preview.append(row)

        return JSONResponse(content={
            'success': True,
            'model_filename': model_filename,
            'model_type': model_package.get('model_type'),
            'task_type': task_type,
            'stored_target_column': stored_target_column,
            'tested_target_column': resolved_target_column,
            'feature_columns': feature_columns,
            'metrics': metrics,
            'predictions_preview': predictions_preview,
            'prediction_count': int(len(predictions)),
            'has_actual_target': actual_available
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model testing failed: {str(e)}")


@app.get("/api/list-files/")
async def list_files():
    """
    List all available files: models, datasets, and reports.
    """
    try:
        files_data = {
            'models': [],
            'datasets': [],
            'reports': []
        }
        
        # List trained models
        models_dir = 'models'
        if os.path.exists(models_dir):
            for filename in os.listdir(models_dir):
                if filename.endswith('.pkl'):
                    filepath = os.path.join(models_dir, filename)
                    try:
                        model_package = joblib.load(filepath)
                        file_stats = os.stat(filepath)
                        
                        files_data['models'].append({
                            'id': filename,
                            'filename': filename,
                            'file_url': f'/api/download-model/{filename}',
                            'model_type': model_package.get('model_type', 'Unknown'),
                            'task_type': model_package.get('task_type', 'Unknown'),
                            'target_column': model_package.get('target_column', ''),
                            'accuracy': model_package.get('metrics', {}).get('accuracy'),
                            'precision': model_package.get('metrics', {}).get('precision'),
                            'recall': model_package.get('metrics', {}).get('recall'),
                            'f1_score': model_package.get('metrics', {}).get('f1_score'),
                            'r2_score': model_package.get('metrics', {}).get('r2_score'),
                            'mae': model_package.get('metrics', {}).get('mae'),
                            'mse': model_package.get('metrics', {}).get('mse'),
                            'rmse': model_package.get('metrics', {}).get('rmse'),
                            'created_at': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                            'size': file_stats.st_size
                        })
                    except Exception as e:
                        print(f"Error loading model {filename}: {e}")
                        continue
        
        # List CSV/JSON datasets in current directory and data/samples
        data_dirs = ['.', 'data', 'data/samples']
        for data_dir in data_dirs:
            if os.path.exists(data_dir):
                for filename in os.listdir(data_dir):
                    if filename.endswith(('.csv', '.json')) and not filename.startswith('.'):
                        filepath = os.path.join(data_dir, filename)
                        try:
                            file_stats = os.stat(filepath)
                            
                            # Try to read basic info
                            row_count = None
                            column_count = None
                            
                            if filename.endswith('.csv'):
                                try:
                                    df = pd.read_csv(filepath, nrows=1)
                                    column_count = len(df.columns)
                                    # Get row count efficiently
                                    with open(filepath, 'r', encoding='utf-8') as f:
                                        row_count = sum(1 for _ in f) - 1  # Subtract header
                                except:
                                    pass
                            
                            files_data['datasets'].append({
                                'id': filename,
                                'filename': filename,
                                'file_url': f'/api/download-file/{filename}',
                                'file_path': filepath,
                                'row_count': row_count,
                                'column_count': column_count,
                                'created_at': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                                'size': file_stats.st_size,
                                'type': 'csv' if filename.endswith('.csv') else 'json'
                            })
                        except Exception as e:
                            print(f"Error reading dataset {filename}: {e}")
                            continue
        
        return JSONResponse(content=files_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@app.get("/api/download-file/{filename}")
async def download_file(filename: str):
    """
    Download a dataset file (CSV or JSON).
    """
    try:
        # Search in multiple locations
        search_paths = [
            filename,
            os.path.join('data', filename),
            os.path.join('data', 'samples', filename)
        ]
        
        filepath = None
        for path in search_paths:
            if os.path.exists(path):
                filepath = path
                break
        
        if not filepath:
            raise HTTPException(status_code=404, detail="File not found")
        
        media_type = 'text/csv' if filename.endswith('.csv') else 'application/json'
        
        return FileResponse(
            path=filepath,
            media_type=media_type,
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting DataFixer API...")
    print(f"📍 Environment: {ENV}")
    print(f"🌐 Host: {HOST}:{PORT}")
    print(f"🔗 CORS Origins: {CORS_ORIGINS}")
    uvicorn.run(app, host=HOST, port=PORT)
