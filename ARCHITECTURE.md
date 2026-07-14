# 🏗️ Model Builder Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React + Vite Frontend)                      │
│                   http://localhost:5173                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              │ (Axios)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TAB NAVIGATION                             │
│  ┌─────────────────────┐     ┌──────────────────────┐          │
│  │   🧹 Data Cleaner   │     │  🧠 Model Builder    │          │
│  │   (Existing)        │     │  (NEW!)              │          │
│  └─────────────────────┘     └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────────┐
│  Data Cleaner    │                    │   Model Builder      │
│   Features       │                    │    Features          │
├──────────────────┤                    ├──────────────────────┤
│ • Upload CSV     │                    │ • Upload CSV         │
│ • Analyze Data   │                    │ • Preview Data       │
│ • Clean File     │                    │ • Select Target      │
│ • Profile Report │                    │ • Select Features    │
│ • Download       │                    │ • Choose Model       │
└──────────────────┘                    │ • Set Parameters     │
                                        │ • Train Model        │
                                        │ • View Metrics       │
                                        │ • Download Model     │
                                        └──────────────────────┘
                                                    │
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              │         Backend API Layer                 │
                              │      (FastAPI + Python 3.12+)            │
                              │      http://localhost:8000               │
                              └─────────────────────┬─────────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
        ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
        │ /api/train-model/    │      │ /api/download-model/ │      │ /api/model-info/     │
        │                      │      │                      │      │                      │
        │ POST: Train ML model │      │ GET: Download .pkl   │      │ GET: Model metadata  │
        └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
                    │
                    │ Processing Pipeline
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌────────────────┐    ┌────────────────────┐
│ Data Pipeline  │    │  ML Pipeline       │
├────────────────┤    ├────────────────────┤
│ 1. Parse CSV   │    │ 1. Model Selection │
│ 2. Validate    │    │ 2. Preprocessing   │
│ 3. Encode      │    │ 3. Training        │
│ 4. Scale       │    │ 4. Evaluation      │
│ 5. Split       │    │ 5. Visualization   │
└────────────────┘    │ 6. Serialization   │
                      └────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │   Model Storage    │
                    │  backend/models/   │
                    ├────────────────────┤
                    │ • .pkl files       │
                    │ • Metadata         │
                    │ • Encoders         │
                    │ • Scaler           │
                    │ • Metrics          │
                    └────────────────────┘
```

---

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ModelBuilder Component                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Upload      │    │  Configure   │    │  Results     │
│  Section     │    │  Section     │    │  Section     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ • File input │    │ • Task type  │    │ • Metrics    │
│ • Preview    │    │ • Model type │    │ • Charts     │
│ • Columns    │    │ • Parameters │    │ • Download   │
└──────────────┘    │ • Split      │    └──────────────┘
                    └──────────────┘
```

---

## Data Flow

```
User Action                 State Change                Backend Call
───────────                 ────────────                ────────────

1. Upload CSV
   │
   ├──> file = File
   │    columns = [...]
   │    dataPreview = [...]
   │
   └──> Display preview table

2. Select Target
   │
   ├──> targetColumn = "approved"
   │    featureColumns = [...others]
   │
   └──> Update feature checkboxes

3. Choose Model
   │
   ├──> taskType = "classification"
   │    modelType = "RandomForest"
   │    modelParams = {n_estimators: 100, ...}
   │
   └──> Display parameter form

4. Train Model
   │
   ├──> isTraining = true
   │    trainingProgress = 0-100%
   │
   ├──> POST /api/train-model/
   │    ├─ FormData:
   │    │  • file
   │    │  • target_column
   │    │  • feature_columns
   │    │  • task_type
   │    │  • model_type
   │    │  • model_params
   │    │
   │    └─> Backend Processing:
   │        ├─ Parse CSV
   │        ├─ Encode data
   │        ├─ Train model
   │        ├─ Generate metrics
   │        ├─ Create visualizations
   │        └─ Save model.pkl
   │
   ├──> Response:
   │    • metrics: {...}
   │    • confusion_matrix_plot: "base64..."
   │    • model_download_url: "/api/download-model/..."
   │
   └──> isTraining = false
        results = response
        Display metrics & charts

5. Download Model
   │
   └──> GET /api/download-model/{filename}
        └─> Returns .pkl file
```

---

## State Management

```javascript
// ModelBuilder Component State
{
  // Upload
  file: File | null,
  dataPreview: Array<Object>,
  columns: Array<string>,
  
  // Configuration
  targetColumn: string,
  featureColumns: Array<string>,
  taskType: 'classification' | 'regression' | 'clustering',
  modelType: string,
  modelParams: Object,
  testSize: number,
  
  // Training
  isTraining: boolean,
  trainingProgress: number,
  
  // Results
  results: {
    success: boolean,
    task_type: string,
    model_type: string,
    metrics: Object,
    model_filename: string,
    model_download_url: string,
    confusion_matrix_plot: string (base64)
  },
  
  // UI
  error: string,
  showToast: boolean,
  toastMessage: string,
  toastType: 'success' | 'error'
}
```

---

## Backend Processing Pipeline

```python
# /api/train-model/ Endpoint

1. Receive Request
   ├─ file: UploadFile
   ├─ target_column: str
   ├─ feature_columns: str (JSON)
   ├─ task_type: str
   ├─ model_type: str
   └─ model_params: str (JSON)

2. Parse & Validate
   ├─ Read CSV into DataFrame
   ├─ Validate columns exist
   └─ Extract X (features) and y (target)

3. Preprocess Data
   ├─ Encode categorical features (LabelEncoder)
   ├─ Encode target if needed
   ├─ Handle missing values
   └─ Scale features (StandardScaler) if needed

4. Split Data
   └─ train_test_split(X, y, test_size=0.2)

5. Train Model
   ├─ Initialize model with parameters
   ├─ model.fit(X_train, y_train)
   └─ y_pred = model.predict(X_test)

6. Evaluate
   ├─ Calculate metrics (accuracy, F1, R², etc.)
   ├─ Generate confusion matrix / scatter plot
   └─ Convert plot to base64

7. Save Model
   ├─ Create model_package dict
   ├─ joblib.dump(model_package, 'models/model_xxx.pkl')
   └─ Verify file exists and size > 0

8. Return Response
   └─ JSON with metrics, plot, download URL
```

---

## Technology Stack

### Frontend
```
React 19.1.1
├─ Vite 7.1.2 (build tool)
├─ Axios 1.6.2 (HTTP client)
└─ CSS3 (styling)
```

### Backend
```
FastAPI 0.116.1
├─ Uvicorn 0.32.1 (ASGI server)
├─ Pandas 2.3.2 (data manipulation)
├─ NumPy 2.3.2 (numerical computing)
├─ scikit-learn 1.7.2 (ML algorithms)
├─ XGBoost 3.1.1 (gradient boosting)
├─ Matplotlib 3.10.0 (plotting)
├─ Seaborn 0.13.2 (statistical visualization)
└─ Joblib 1.5.2 (model serialization)
```

---

## File Organization

```
DataFixer-main/
│
├── backend/
│   ├── main.py                 # FastAPI app with endpoints
│   ├── detection.py            # Data issue detection
│   ├── solution.py             # Data cleaning solutions
│   ├── requirements.txt        # Python dependencies
│   ├── create_test_data.py     # Test data generator
│   └── models/                 # Trained model storage
│       ├── .gitignore
│       ├── .gitkeep
│       └── model_*.pkl         # Saved models
│
├── data-cleaner-ui/
│   ├── src/
│   │   ├── App.jsx             # Main app with tab navigation
│   │   ├── App.css             # Global styles
│   │   ├── components/
│   │   │   ├── Report.jsx      # Data analysis report
│   │   │   ├── ModelBuilder.jsx # ML model training UI
│   │   │   └── ModelBuilder.css # Model builder styles
│   │   └── main.jsx            # Entry point
│   ├── package.json            # Node dependencies
│   └── vite.config.js          # Vite configuration
│
├── data/
│   └── samples/
│       ├── loan_approval_test.csv    # Classification test data
│       └── house_prices_test.csv     # Regression test data
│
└── docs/
    ├── MODEL_BUILDER_GUIDE.md         # Comprehensive guide
    ├── IMPLEMENTATION_SUMMARY.md      # Implementation details
    └── QUICK_START.md                 # Quick start guide
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                      │
└─────────────────────────────────────────────────────────┘

1. Input Validation
   ├─ File type checking (.csv only)
   ├─ Column name validation
   ├─ Data type validation
   └─ Parameter range checking

2. CORS Configuration
   ├─ Whitelist specific origins
   ├─ Allow only POST/GET methods
   └─ Restrict headers

3. File Handling
   ├─ Temporary file storage
   ├─ Size limits (prevent DoS)
   ├─ Path traversal prevention
   └─ Automatic cleanup

4. Model Storage
   ├─ Local filesystem only
   ├─ Restricted access (no public URL)
   ├─ Timestamped filenames
   └─ .gitignore for security

5. Error Handling
   ├─ Generic error messages
   ├─ No stack traces to client
   ├─ Logging on server side
   └─ Graceful degradation
```

---

## Performance Optimization

```
Frontend Optimizations:
├─ React hooks (useState, useEffect)
├─ Lazy loading for large files
├─ Debounced parameter changes
├─ Progress bar for feedback
└─ Session persistence (localStorage)

Backend Optimizations:
├─ Async/await for file operations
├─ Streaming for large responses
├─ Model caching (joblib)
├─ Vectorized operations (NumPy)
└─ Efficient data structures (Pandas)

Network Optimizations:
├─ Base64 for inline images
├─ Compressed responses
├─ FormData for file uploads
└─ Proper HTTP status codes
```

---

This architecture provides a robust, scalable foundation for the Model Builder feature! 🏗️
