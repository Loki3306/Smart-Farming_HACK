# Production-Ready Sanitization Script - Phase 3
# Codebase Hardening and Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION SANITIZATION - PHASE 3" -ForegroundColor Cyan
Write-Host "Codebase Hardening & Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "C:\code\Smart-Farming_HACK"
$issuesFound = 0

Write-Host "🔍 Checking for imports of deleted test scripts...`n" -ForegroundColor Yellow

# List of deleted test scripts to check for
$deletedScripts = @(
    "debug_bridge",
    "test_actuation_bridge",
    "verify_agronomy_features",
    "test_bootstrap_ai",
    "verify_bootstrap_direct",
    "test_iot_system",
    "comprehensive_iot_test",
    "alternating_test",
    "simple_auto_actuation",
    "auto_actuation_test",
    "esp32_simulator"
)

# Search for imports in Python files
$pythonFiles = Get-ChildItem -Path "$rootPath\backend" -Filter *.py -Recurse -File | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.venv\\" -and
    $_.FullName -notmatch "\\__pycache__\\"
}

foreach ($file in $pythonFiles) {
    $content = Get-Content $file.FullName -Raw
    
    foreach ($script in $deletedScripts) {
        if ($content -match "from.*$script|import.*$script") {
            Write-Host "⚠️  WARNING: $($file.Name) imports deleted script: $script" -ForegroundColor Red
            $issuesFound++
        }
    }
}

if ($issuesFound -eq 0) {
    Write-Host "✅ No imports of deleted scripts found!" -ForegroundColor Green
}

Write-Host "`n🔍 Verifying critical file paths...`n" -ForegroundColor Yellow

# Check agronomy_expert.py for relative paths
$agronomyExpertPath = Join-Path $rootPath "backend\app\agents\agronomy_expert.py"
if (Test-Path $agronomyExpertPath) {
    $content = Get-Content $agronomyExpertPath -Raw
    
    # Check for hardcoded absolute paths
    if ($content -match "C:\\|/home/|/Users/") {
        Write-Host "⚠️  WARNING: agronomy_expert.py contains hardcoded absolute paths!" -ForegroundColor Red
        $issuesFound++
    }
    else {
        Write-Host "✅ agronomy_expert.py uses relative paths" -ForegroundColor Green
    }
}

# Check advanced_models.py for relative paths
$advancedModelsPath = Join-Path $rootPath "backend\app\ml_models\advanced_models.py"
if (Test-Path $advancedModelsPath) {
    $content = Get-Content $advancedModelsPath -Raw
    
    # Check for hardcoded absolute paths
    if ($content -match "C:\\|/home/|/Users/") {
        Write-Host "⚠️  WARNING: advanced_models.py contains hardcoded absolute paths!" -ForegroundColor Red
        $issuesFound++
    }
    else {
        Write-Host "✅ advanced_models.py uses relative paths" -ForegroundColor Green
    }
}

# Check bootstrap.py for relative paths
$bootstrapPath = Join-Path $rootPath "backend\app\ml_models\bootstrap.py"
if (Test-Path $bootstrapPath) {
    $content = Get-Content $bootstrapPath -Raw
    
    # Check for hardcoded absolute paths
    if ($content -match "C:\\|/home/|/Users/") {
        Write-Host "⚠️  WARNING: bootstrap.py contains hardcoded absolute paths!" -ForegroundColor Red
        $issuesFound++
    }
    else {
        Write-Host "✅ bootstrap.py uses relative paths" -ForegroundColor Green
    }
}

Write-Host "`n🔍 Checking critical files exist...`n" -ForegroundColor Yellow

$criticalFiles = @(
    "backend\app\utils\agronomy.py",
    "backend\app\ml_models\bootstrap.py",
    "backend\app\ml_models\advanced_models.py",
    "backend\app\agents\agronomy_expert.py",
    "backend\iot_irrigation\mqtt_client.py",
    "backend\iot_irrigation\router.py",
    "backend\iot_irrigation\models.py"
)

$allExist = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $rootPath $file
    if (Test-Path $fullPath) {
        Write-Host "✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "❌ MISSING: $file" -ForegroundColor Red
        $allExist = $false
        $issuesFound++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 3 COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($issuesFound -eq 0) {
    Write-Host "✅ All checks passed! Codebase is production-ready." -ForegroundColor Green
}
else {
    Write-Host "⚠️  Issues found: $issuesFound" -ForegroundColor Red
    Write-Host "Please review and fix before deployment." -ForegroundColor Yellow
}

Write-Host "`n"
