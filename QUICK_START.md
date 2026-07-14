# 🚀 Quick Start Guide - Model Builder

## Prerequisites Check ✅

Before starting, ensure you have:
- [x] Python 3.12+ installed
- [x] Node.js installed
- [x] All dependencies installed (see below)

---

## Step 1: Install Dependencies

### Backend Dependencies
```powershell
cd backend
python -m pip install scikit-learn joblib matplotlib seaborn xgboost --user
```

### Frontend Dependencies
```powershell
cd data-cleaner-ui
npm install
```

---

## Step 2: Start the Servers

### Terminal 1 - Backend Server
```powershell
cd backend
python main.py
```
✅ Backend running on: http://localhost:8000

### Terminal 2 - Frontend Server
```powershell
cd data-cleaner-ui
npm run dev
```
✅ Frontend running on: http://localhost:5173

---

## Step 3: Try Model Builder

1. **Open Browser:** http://localhost:5173
2. **Click:** "🧠 Model Builder" tab
3. **Upload:** Use one of the test datasets:
   - `data/samples/loan_approval_test.csv` (Classification)
   - `data/samples/house_prices_test.csv` (Regression)

---

## Example Workflow: Loan Approval Prediction

### 1. Upload Data
- Click "📤 Choose CSV File"
- Select: `data/samples/loan_approval_test.csv`
- ✅ Preview shows 10 rows

### 2. Configure
- **Target Column:** `approved`
- **Features:** Check all (age, income, credit_score, years_employed, num_credit_cards)
- **Task Type:** Classification
- **Model:** Random Forest

### 3. Set Parameters
- **Number of Trees:** 100
- **Max Depth:** 10
- **Min Samples Split:** 2

### 4. Train
- **Test Size:** 20% (use slider)
- Click: "🎯 Train Model"
- ⏳ Watch progress bar

### 5. Review Results
- ✅ Accuracy: ~60%
- ✅ F1 Score: ~60%
- 📊 Confusion Matrix displayed

### 6. Download
- Click: "💾 Download Model (.pkl)"
- Click: "📊 Download Metrics Report (.json)"
- ✅ Files saved successfully!

---

## Verify Model File is NOT Empty

After download, check:
```powershell
# Check model file exists and size
dir backend\models\*.pkl
```

Expected output:
```
    Directory: backend\models

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        11/3/2025   2:30 PM         125432 model_classification_RandomForest_20251103_143022.pkl
```

✅ File size should be > 100 KB (not 0 bytes!)

---

## Test Model Loading (Optional)

```python
import joblib

# Load the model
model_package = joblib.load('backend/models/model_classification_RandomForest_20251103_143022.pkl')

# Inspect
print("Model type:", model_package['model_type'])
print("Task type:", model_package['task_type'])
print("Features:", model_package['feature_columns'])
print("Metrics:", model_package['metrics'])
```

---

## Troubleshooting Quick Fixes

### Issue: Backend won't start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <PID> /F
```

### Issue: Frontend won't start
```powershell
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Clear npm cache
npm cache clean --force
rm -rf node_modules
npm install
```

### Issue: Model file is empty
```powershell
# Check models directory exists
cd backend
mkdir models -Force

# Check permissions
icacls models
```

### Issue: Charts not showing
- Check browser console (F12)
- Verify matplotlib is installed: `python -m pip show matplotlib`
- Clear browser cache

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/train-model/` | POST | Train ML model |
| `/api/download-model/{filename}` | GET | Download model file |
| `/api/model-info/{filename}` | GET | Get model metadata |

---

## Model Types Available

### Classification (5 models)
1. Logistic Regression
2. Random Forest
3. Decision Tree
4. Support Vector Machine (SVM)
5. XGBoost

### Regression (6 models)
1. Linear Regression
2. Random Forest Regressor
3. Decision Tree Regressor
4. Ridge Regression
5. Lasso Regression
6. XGBoost Regressor

### Clustering (3 models)
1. K-Means
2. DBSCAN
3. Agglomerative Clustering

---

## Metrics Explained

### Classification Metrics
- **Accuracy:** % of correct predictions (use when classes are balanced)
- **Precision:** Of predicted positives, how many are actually positive
- **Recall:** Of actual positives, how many were found
- **F1 Score:** Harmonic mean of precision and recall
- **ROC-AUC:** Area under ROC curve (binary classification only)

### Regression Metrics
- **R² Score:** 0-1, how well model fits data (1 = perfect)
- **MAE:** Mean Absolute Error (average prediction error)
- **MSE:** Mean Squared Error (penalizes large errors more)
- **RMSE:** Root MSE (in same units as target)

### Clustering Metrics
- **Silhouette Score:** -1 to 1 (higher = better clusters)
- **Inertia:** Sum of distances to cluster centers (lower = better)

---

## Next Steps

1. **Try Different Models:** Compare Random Forest vs XGBoost
2. **Tune Parameters:** Experiment with hyperparameters
3. **Use Your Data:** Upload your own cleaned CSV files
4. **Compare Results:** Train multiple models and pick the best
5. **Deploy:** Use the downloaded model in your application

---

## Need Help?

- 📖 Full Guide: `MODEL_BUILDER_GUIDE.md`
- 📋 Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- 🐛 Check backend logs for errors
- 🌐 Check browser console (F12) for frontend errors

---

## Success Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Test data uploaded successfully
- [ ] Model trained without errors
- [ ] Metrics displayed correctly
- [ ] Confusion matrix/plot visible
- [ ] Model file downloaded (size > 100 KB)
- [ ] Metrics report downloaded

---

**Congratulations! You're ready to build ML models with DataFixer! 🎉**
