# DataFixer Setup Guide

This project now uses a Next.js frontend integrated with the FastAPI backend.

## Project Structure

```
DataFixer-main/
├── backend/              # FastAPI backend
│   ├── main.py          # API server
│   ├── detection.py     # Data issue detection
│   ├── solution.py      # Data cleaning solutions
│   └── requirements.txt # Python dependencies
├── app/                 # Next.js frontend pages
│   ├── page.tsx        # Home page
│   ├── upload/         # Upload page
│   ├── clean/          # Clean data page
│   ├── reports/        # Reports page
│   └── train/          # Model training page
├── components/         # React components
├── lib/               # Utility functions
├── hooks/             # Custom React hooks
├── styles/            # Global styles
├── public/            # Static assets
└── data/              # Sample datasets
```

## Getting Started

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not exists)
python -m venv venv312

# Activate virtual environment
# Windows PowerShell:
.\venv312\Scripts\Activate.ps1
# Windows CMD:
.\venv312\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Run backend server
python main.py
```

Backend will run on: http://localhost:8000

### 2. Frontend Setup

```bash
# From project root directory
cd c:\Users\jaisw\OneDrive\Desktop\Mix\DataFixer-main

# Install dependencies (use npm or pnpm)
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev
```

Frontend will run on: http://localhost:3000

## Development Workflow

1. **Start Backend First**: Run the FastAPI backend on port 8000
2. **Start Frontend**: Run the Next.js frontend on port 3000
3. **Access Application**: Open http://localhost:3000 in your browser

## API Endpoints

- `GET /` - API information
- `POST /api/upload-and-analyze/` - Upload and analyze data
- `POST /api/clean-file/` - Clean data file
- `POST /api/preview-cleaning/` - Preview cleaning operations
- `POST /api/profile-report/` - Generate profiling report
- `POST /api/train-model/` - Train ML model

## Features

### Frontend (Next.js + TypeScript + Tailwind CSS)
- Modern UI with shadcn/ui components
- File upload and preview
- Data analysis reports
- Data cleaning interface
- ML model training
- Responsive design

### Backend (FastAPI + Python)
- Automatic data issue detection
- Smart data cleaning
- ML model training
- Support for CSV and JSON files
- RESTful API

## Technologies

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- Recharts for visualizations

### Backend
- FastAPI
- Pandas
- Scikit-learn
- XGBoost
- NumPy

## Deployment

See `deployment/README.md` and `docs/DEPLOYMENT.md` for deployment instructions.

## Notes

- The old `data-cleaner-ui` (Vite/React) has been removed
- The new frontend is a Next.js application with TypeScript
- Backend CORS is configured for Next.js on port 3000
- Make sure both backend and frontend are running for full functionality
