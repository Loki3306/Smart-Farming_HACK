# Production-Ready Sanitization Script - Phase 4
# Production Optimization

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION SANITIZATION - PHASE 4" -ForegroundColor Cyan
Write-Host "Production Optimization" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "C:\code\Smart-Farming_HACK"

Write-Host "🔍 Checking backend entry point configuration...`n" -ForegroundColor Yellow

# Check main.py for reload=False in production
$mainPyPath = Join-Path $rootPath "backend\app\main.py"
if (Test-Path $mainPyPath) {
    $content = Get-Content $mainPyPath -Raw
    
    if ($content -match "reload=True") {
        Write-Host "⚠️  WARNING: main.py has reload=True (development mode)" -ForegroundColor Yellow
        Write-Host "   For production, set reload=False in uvicorn.run()" -ForegroundColor Yellow
    }
    elseif ($content -match "reload=False") {
        Write-Host "✅ main.py configured for production (reload=False)" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  main.py doesn't specify reload parameter" -ForegroundColor Cyan
        Write-Host "   Ensure uvicorn is started with --no-reload in production" -ForegroundColor Cyan
    }
}

Write-Host "`n🔍 Checking Bootstrap ML auto-initialization...`n" -ForegroundColor Yellow

# Check if bootstrap.py has auto-run capability
$bootstrapPath = Join-Path $rootPath "backend\app\ml_models\bootstrap.py"
if (Test-Path $bootstrapPath) {
    $content = Get-Content $bootstrapPath -Raw
    
    if ($content -match "def.*bootstrap|def.*generate") {
        Write-Host "✅ bootstrap.py has data generation functions" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  WARNING: bootstrap.py may not have auto-generation capability" -ForegroundColor Yellow
    }
}

# Check if advanced_models.py calls bootstrap on missing data
$advancedModelsPath = Join-Path $rootPath "backend\app\ml_models\advanced_models.py"
if (Test-Path $advancedModelsPath) {
    $content = Get-Content $advancedModelsPath -Raw
    
    if ($content -match "bootstrap|generate.*data") {
        Write-Host "✅ advanced_models.py has bootstrap integration" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  WARNING: advanced_models.py may not auto-bootstrap on missing data" -ForegroundColor Yellow
    }
}

Write-Host "`n🔍 Checking environment configuration...`n" -ForegroundColor Yellow

# Check .env file exists
$envPath = Join-Path $rootPath ".env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check for critical environment variables
    $envContent = Get-Content $envPath -Raw
    
    $requiredVars = @(
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        "VITE_GEMINI_API_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠️  $var not found" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Create .env file with required environment variables" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking .gitignore configuration...`n" -ForegroundColor Yellow

$gitignorePath = Join-Path $rootPath ".gitignore"
if (Test-Path $gitignorePath) {
    $content = Get-Content $gitignorePath -Raw
    
    $criticalIgnores = @(
        ".env",
        "node_modules",
        "__pycache__",
        ".venv",
        "*.pyc"
    )
    
    $allPresent = $true
    foreach ($ignore in $criticalIgnores) {
        if ($content -match [regex]::Escape($ignore)) {
            Write-Host "  ✅ $ignore in .gitignore" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠️  $ignore not in .gitignore" -ForegroundColor Yellow
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host "`n✅ .gitignore properly configured" -ForegroundColor Green
    }
}
else {
    Write-Host "⚠️  .gitignore not found" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 4 COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Production optimization check complete!" -ForegroundColor Green

Write-Host "`n📋 Production Deployment Checklist:" -ForegroundColor Cyan
Write-Host "  1. Set reload=False in uvicorn configuration" -ForegroundColor White
Write-Host "  2. Ensure .env file is configured with production keys" -ForegroundColor White
Write-Host "  3. Verify bootstrap ML auto-runs on missing data" -ForegroundColor White
Write-Host "  4. Test all critical endpoints before deployment" -ForegroundColor White
Write-Host "  5. Set up production database (Supabase)" -ForegroundColor White
Write-Host "  6. Configure production MQTT broker" -ForegroundColor White
Write-Host "  7. Set up monitoring and logging" -ForegroundColor White

Write-Host "`n"
