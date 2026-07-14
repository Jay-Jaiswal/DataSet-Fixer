# 🧠 Model Builder - Complete Setup Guide

## Overview
The Model Builder is an advanced feature in DataFixer that allows you to train machine learning models directly on your cleaned datasets. It provides a simplified AutoML-like interface for classification, regression, and clustering tasks.

## ✨ Features

### 1. **Upload Section**
- CSV file upload with automatic preview
- Displays first 10 rows of your dataset
- Shows all column names dynamically

### 2. **Target & Feature Selection**
- Select target (label) column from dropdown
- Multi-select checkboxes for feature columns
- Auto-excludes target from features
- Supports clustering (no target needed)

### 3. **Model Configuration**
- **Task Types:**
  - Classification
  - Regression
  - Clustering

- **Available Models:**
  - **Classification:** Logistic Regression, Random Forest, Decision Tree, SVM, XGBoost
  - **Regression:** Linear Regression, Random Forest, Ridge, Lasso, XGBoost
  - **Clustering:** K-Means, DBSCAN, Agglomerative

- **Dynamic Parameters:** Automatically shows relevant hyperparameters for selected model

### 4. **Train/Test Split**
- Interactive slider (10% - 50%)
- Default: 80/20 split

### 5. **Training & Evaluation**
- Progress bar with percentage
- Task-specific metrics:
  - **Classification:** Accuracy, F1, Precision, Recall, ROC-AUC, Confusion Matrix
  - **Regression:** R², MAE, MSE, RMSE, Actual vs Predicted plot
  - **Clustering:** Silhouette Score, Inertia, Cluster sizes

### 6. **Output & Download**
- Download trained model (.pkl file)
- Download metrics report (.json)
- Visual charts (Confusion Matrix/Scatter Plot)

### 7. **UX Features**
- Toast notifications for success/error
- Session persistence (localStorage)
- Responsive design
- Dark theme support

---

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Activate virtual environment:**
   ```powershell
   .\venv312\Scripts\Activate.ps1
   ```

3. **Install new dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

   This will install:
   - `scikit-learn` - ML algorithms
   - `joblib` - Model serialization
   - `matplotlib` & `seaborn` - Visualizations
   - `xgboost` - Gradient boosting

4. **Create models directory:**
   ```powershell
   New-Item -ItemType Directory -Path models -Force
   ```

5. **Start the backend server:**
   ```powershell
   python main.py
   ```

   The API will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd ..\data-cleaner-ui
   ```

2. **Install new dependencies:**
   ```powershell
   npm install
   ```

   This will install:
   - `axios` - HTTP client for API calls

3. **Start the development server:**
   ```powershell
   npm run dev
   ```

   The UI will run on `http://localhost:5173`

---

## 📖 How to Use

### Step-by-Step Guide

1. **Open the Application**
   - Navigate to `http://localhost:5173` in your browser
   - Click on the **🧠 Model Builder** tab

2. **Upload Your Dataset**
   - Click "📤 Choose CSV File" or drag & drop
   - Wait for the preview to load (shows first 10 rows)

3. **Select Target & Features**
   - Choose your target column (what you want to predict)
   - Select feature columns (inputs for prediction)
   - For clustering, skip target selection

4. **Configure Model**
   - Select task type (Classification/Regression/Clustering)
   - Choose a model from the dropdown
   - Adjust hyperparameters if needed

5. **Set Train/Test Split**
   - Use the slider to set your preferred split ratio
   - Default is 80/20 (80% training, 20% testing)

6. **Train Model**
   - Click "🎯 Train Model"
   - Watch the progress bar
   - Wait for training to complete

7. **Review Results**
   - Check the metrics displayed
   - View the confusion matrix or prediction plot
   - Download the model file (.pkl)
   - Download the metrics report (.json)

---

## 🔧 API Endpoints

### 1. Train Model
```
POST /api/train-model/
```

**Parameters:**
- `file` - CSV file (multipart/form-data)
- `target_column` - Target column name
- `feature_columns` - JSON array of feature names
- `task_type` - "classification", "regression", or "clustering"
- `model_type` - Model name (e.g., "RandomForest")
- `test_size` - Train/test split ratio (default: 0.2)
- `random_state` - Random seed (default: 42)
- `model_params` - JSON object with hyperparameters

**Response:**
```json
{
  "success": true,
  "task_type": "classification",
  "model_type": "RandomForest",
  "metrics": {
    "accuracy": 0.95,
    "f1_score": 0.94,
    "precision": 0.96,
    "recall": 0.93
  },
  "model_filename": "model_classification_RandomForest_20231103_143022.pkl",
  "model_download_url": "/api/download-model/model_classification_RandomForest_20231103_143022.pkl",
  "confusion_matrix_plot": "base64_encoded_image...",
  "timestamp": "20231103_143022"
}
```

### 2. Download Model
```
GET /api/download-model/{filename}
```

Downloads the trained model file (.pkl format).

### 3. Get Model Info
```
GET /api/model-info/{filename}
```

Returns metadata about a trained model.

---

## 💡 Example Use Cases

### 1. **Predict Customer Churn (Classification)**
- Upload: `customer_data.csv`
- Target: `churned` (0/1)
- Features: `age`, `tenure`, `monthly_charges`, etc.
- Model: Random Forest
- Metrics: Accuracy, F1-score

### 2. **House Price Prediction (Regression)**
- Upload: `house_prices.csv`
- Target: `price`
- Features: `bedrooms`, `sqft`, `location`, etc.
- Model: XGBoost Regressor
- Metrics: R², MAE, RMSE

### 3. **Customer Segmentation (Clustering)**
- Upload: `customer_behavior.csv`
- No target needed
- Features: `purchase_frequency`, `avg_spend`, etc.
- Model: K-Means
- Metrics: Silhouette Score

---

## 🐛 Troubleshooting

### Issue: Empty Model File Downloaded

**Cause:** The model file path is not correctly saved or the `models/` directory doesn't exist.

**Solution:**
1. Ensure the `models/` directory exists in the backend folder:
   ```powershell
   New-Item -ItemType Directory -Path models -Force
   ```

2. Check backend logs for errors

3. Verify file permissions on the `models/` directory

### Issue: Training Takes Too Long

**Solution:**
- Use a smaller dataset (sample your data)
- Reduce hyperparameters (e.g., fewer trees in Random Forest)
- Use simpler models (Logistic Regression instead of XGBoost)

### Issue: "Connection Refused" Error

**Solution:**
- Ensure backend server is running on port 8000
- Check firewall settings
- Verify CORS settings in `main.py`

### Issue: Chart Not Displaying

**Solution:**
- Check browser console for errors
- Ensure matplotlib backend is set to 'Agg'
- Verify base64 encoding is working

---

## 🎨 Customization

### Add New Models

Edit `backend/main.py` and add to the `model_map`:

```python
model_map = {
    'classification': {
        'YourModel': YourModelClass,
        # ...
    }
}
```

### Add New Parameters

Edit `data-cleaner-ui/src/components/ModelBuilder.jsx`:

```javascript
const parameterConfigs = {
  YourModel: [
    { name: 'param_name', label: 'Label', type: 'number', default: 10, min: 1, max: 100 }
  ]
};
```

### Customize Styling

Edit `data-cleaner-ui/src/components/ModelBuilder.css` to change colors, sizes, or layouts.

---

## 📊 Model Persistence

Models are saved with the following structure:

```python
{
    'model': trained_model_object,
    'feature_columns': ['col1', 'col2', ...],
    'target_column': 'target',
    'task_type': 'classification',
    'model_type': 'RandomForest',
    'scaler': scaler_object,
    'label_encoders': {...},
    'target_encoder': encoder_object,
    'metrics': {...},
    'timestamp': '20231103_143022'
}
```

To load and use a model:

```python
import joblib

# Load model
model_package = joblib.load('models/model_file.pkl')

# Make predictions
X_new = prepare_features(new_data)
predictions = model_package['model'].predict(X_new)
```

---

## 🔒 Security Notes

- Models are saved locally in the `models/` directory
- Ensure proper file permissions
- Don't expose the models directory publicly
- Validate all file uploads
- Limit file sizes to prevent DoS attacks

---

## 📝 Future Enhancements

Potential features to add:
- [ ] Auto-suggest best model based on data
- [ ] Hyperparameter tuning (Grid Search/Random Search)
- [ ] Feature importance visualization
- [ ] Model comparison (train multiple models)
- [ ] Cross-validation scores
- [ ] Export to ONNX format
- [ ] Real-time prediction API
- [ ] Model versioning

---

## 📞 Support

If you encounter issues:
1. Check the console logs (browser & backend)
2. Verify all dependencies are installed
3. Ensure correct Python version (3.12+)
4. Check file paths and permissions

---

## 📄 License

This feature is part of DataFixer and follows the same license as the main project.

---

**Enjoy building models with DataFixer! 🚀**
