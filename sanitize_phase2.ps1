# Production-Ready Sanitization Script - Phase 2
# Removes non-critical test and debug scripts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION SANITIZATION - PHASE 2" -ForegroundColor Cyan
Write-Host "Removing Test & Debug Scripts" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "C:\code\Smart-Farming_HACK"
$deletedCount = 0

# Phase 2: Test and Debug Scripts to Delete
$scriptsToDelete = @(
    # IoT Irrigation test scripts
    "backend\iot_irrigation\debug_bridge.py",
    "backend\iot_irrigation\test_actuation_bridge.py",
    "backend\iot_irrigation\verify_agronomy_features.py",
    "backend\iot_irrigation\test_bootstrap_ai.py",
    "backend\iot_irrigation\verify_bootstrap_direct.py",
    "backend\iot_irrigation\test_iot_system.py",
    "backend\iot_irrigation\comprehensive_iot_test.py",
    "backend\iot_irrigation\alternating_test.py",
    "backend\iot_irrigation\simple_auto_actuation.py",
    "backend\iot_irrigation\auto_actuation_test.py",
    
    # ESP32 simulator (not needed in production)
    "backend\iot_irrigation\esp32_simulator.py"
)

# CRITICAL FILES TO PROTECT (DO NOT DELETE)
$protectedFiles = @(
    "backend\app\utils\agronomy.py",  # FAO-56 math
    "backend\app\ml_models\bootstrap.py",  # Self-healing AI
    "backend\app\ml_models\advanced_models.py",  # ML Manager
    "backend\app\agents\agronomy_expert.py",  # Main AI logic
    "backend\iot_irrigation\mqtt_client.py",  # Core MQTT
    "backend\iot_irrigation\router.py",  # Core routing
    "backend\iot_irrigation\models.py",  # Data models
    "backend\iot_irrigation\__init__.py"  # Module init
)

Write-Host "Deleting test and debug scripts...`n" -ForegroundColor Yellow

foreach ($file in $scriptsToDelete) {
    $fullPath = Join-Path $rootPath $file
    
    # Double-check it's not a protected file
    if ($protectedFiles -contains $file) {
        Write-Host "🔒 PROTECTED (skipped): $file" -ForegroundColor Magenta
        continue
    }
    
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "✅ Deleted: $file" -ForegroundColor Green
            $deletedCount++
        }
        catch {
            Write-Host "❌ Failed to delete: $file - $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor DarkGray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 2 COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test scripts deleted: $deletedCount" -ForegroundColor Green

Write-Host "`n📋 Protected Files (NOT deleted):" -ForegroundColor Cyan
foreach ($file in $protectedFiles) {
    Write-Host "  🔒 $file" -ForegroundColor Green
}

Write-Host "`n"
