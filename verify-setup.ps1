# DataFixer Setup Verification Script
Write-Host "🔍 Verifying DataFixer Setup..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = "c:\Users\jaisw\OneDrive\Desktop\Mix\DataFixer-main"
$errors = @()
$warnings = @()
$success = @()

# Check 1: Project directory
Write-Host "📁 Checking project directory..." -ForegroundColor Yellow
if (Test-Path $projectRoot) {
    $success += "✅ Project directory found"
} else {
    $errors += "❌ Project directory not found"
}

# Check 2: Backend files
Write-Host "🐍 Checking backend files..." -ForegroundColor Yellow
$backendFiles = @("main.py", "detection.py", "solution.py", "requirements.txt")
foreach ($file in $backendFiles) {
    if (Test-Path "$projectRoot\backend\$file") {
        $success += "✅ Backend file: $file"
    } else {
        $errors += "❌ Missing backend file: $file"
    }
}

# Check 3: Virtual environment
if (Test-Path "$projectRoot\backend\venv312") {
    $success += "✅ Python virtual environment found"
} else {
    $warnings += "⚠️ Python virtual environment not found (run: python -m venv venv312)"
}

# Check 4: Next.js files
Write-Host "⚛️ Checking Next.js files..." -ForegroundColor Yellow
$nextFiles = @("package.json", "next.config.mjs", "tsconfig.json")
foreach ($file in $nextFiles) {
    if (Test-Path "$projectRoot\$file") {
        $success += "✅ Next.js file: $file"
    } else {
        $errors += "❌ Missing Next.js file: $file"
    }
}

# Check 5: App directory
if (Test-Path "$projectRoot\app") {
    $success += "✅ App directory found"
    
    # Check for key pages
    $pages = @("page.tsx", "layout.tsx", "upload", "clean", "reports", "train")
    foreach ($page in $pages) {
        if (Test-Path "$projectRoot\app\$page") {
            $success += "✅ App page/folder: $page"
        } else {
            $warnings += "⚠️ Missing app page/folder: $page"
        }
    }
} else {
    $errors += "❌ App directory not found"
}

# Check 6: Old frontend removed
if (!(Test-Path "$projectRoot\data-cleaner-ui")) {
    $success += "✅ Old frontend (data-cleaner-ui) removed"
} else {
    $warnings += "⚠️ Old frontend still exists (should be removed)"
}

# Check 7: Node modules
if (Test-Path "$projectRoot\node_modules") {
    $success += "✅ Node modules installed"
} else {
    $warnings += "⚠️ Node modules not installed (run: npm install)"
}

# Check 8: Configuration files
if (Test-Path "$projectRoot\.env.local") {
    $success += "✅ .env.local file exists"
} else {
    $warnings += "⚠️ .env.local not found (should contain NEXT_PUBLIC_API_URL)"
}

# Check 9: Documentation files
$docs = @("SETUP.md", "MIGRATION_SUMMARY.md", "start-dev.ps1")
foreach ($doc in $docs) {
    if (Test-Path "$projectRoot\$doc") {
        $success += "✅ Documentation: $doc"
    } else {
        $warnings += "⚠️ Missing documentation: $doc"
    }
}

# Print results
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    VERIFICATION RESULTS                " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "✅ SUCCESSFUL CHECKS ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "   $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "   $item" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ ERRORS ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   $item" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "🎉 SETUP VERIFICATION PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    if ($warnings -match "Node modules") {
        Write-Host "1. Install frontend dependencies: npm install" -ForegroundColor Yellow
    }
    if ($warnings -match "virtual environment") {
        Write-Host "2. Create Python virtual environment in backend/" -ForegroundColor Yellow
    }
    Write-Host "3. Run the application: .\start-dev.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📍 Backend: http://localhost:8000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  SETUP HAS ISSUES - Please fix errors above" -ForegroundColor Red
}
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
