# DataFixer Development Startup Script
Write-Host "🚀 Starting DataFixer Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
$projectRoot = "c:\Users\jaisw\OneDrive\Desktop\Mix\DataFixer-main"
if (!(Test-Path $projectRoot)) {
    Write-Host "❌ Error: Project directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# Function to start backend
function Start-Backend {
    Write-Host "📦 Starting Backend Server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        Set-Location '$projectRoot\backend'
        Write-Host '🐍 Activating Python Virtual Environment...' -ForegroundColor Yellow
        .\venv312\Scripts\Activate.ps1
        Write-Host '🚀 Starting FastAPI Backend on http://localhost:8000' -ForegroundColor Green
        python main.py
"@
    Start-Sleep -Seconds 2
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        Set-Location '$projectRoot'
        Write-Host '📦 Installing dependencies if needed...' -ForegroundColor Yellow
        if (!(Test-Path 'node_modules')) {
            npm install
        }
        Write-Host '🚀 Starting Next.js Frontend on http://localhost:3000' -ForegroundColor Green
        npm run dev
"@
    Start-Sleep -Seconds 2
}

# Start both servers
Start-Backend
Start-Frontend

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "📍 Frontend UI: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📍 API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray
