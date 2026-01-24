# Production-Ready Sanitization Script
# Removes all non-essential documentation and test artifacts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION SANITIZATION - PHASE 1" -ForegroundColor Cyan
Write-Host "Removing Non-Essential Documentation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = "C:\code\Smart-Farming_HACK"
$deletedCount = 0
$protectedCount = 0

# Phase 1: Documentation Files to Delete
$docsToDelete = @(
    # Root level documentation
    "WEBSOCKET_FIX_SUMMARY.md",
    "WEBSOCKET_FIX_FINAL.md",
    "COMPREHENSIVE_IOT_TEST_RESULTS.md",
    "ALTERNATING_TEST_GUIDE.md",
    "AUTO_ACTUATION_GUIDE.md",
    "BOOTSTRAP_AI_SUMMARY.md",
    "HYBRID_ACTUATION_BRIDGE.md",
    "FINAL_FIX_SUMMARY.md",
    "SYSTEM_RESTART_GUIDE.md",
    "FINAL_STEPS.md",
    "IOT_TESTING_GUIDE.md",
    "IOT_SENSOR_ANALYSIS.md",
    "IOT_README.md",
    "IOT_QUICK_START.md",
    "IOT_IMPLEMENTATION_SUMMARY.md",
    "IOT_COMPLETE.md",
    "IOT_ARCHITECTURE.md",
    "LIVE_SYSTEM_STATUS.md",
    "MQTT_IOT_DETAILED_ANALYSIS.md",
    "QUICK_TEST_COMMANDS.md",
    "PRECISION_AGRICULTURE_COMPLETE.md",
    "SENSOR_QUICK_REFERENCE.md",
    
    # Backend documentation
    "backend\README.md",
    "backend\iot_irrigation\README.md",
    "backend\iot_irrigation\QUICK_TEST_COMMANDS.md",
    "backend\iot_irrigation\WEBSOCKET_FIX_FINAL.md",
    "backend\iot_irrigation\ADVANCED_AGRONOMY_IMPLEMENTATION.md",
    
    # MD folder (all documentation)
    "MD\WHATSAPP_INTEGRATION_GUIDE.md",
    "MD\WEATHER_API_SETUP.md",
    "MD\UI_IMPROVEMENTS_CHANGELOG.md",
    "MD\TROUBLESHOOTING.md",
    "MD\SHARE_FEATURE_GUIDE.md",
    "MD\SETUP_GUIDE.md",
    "MD\REPORT_SYSTEM_GUIDE.md",
    "MD\REPLACEMENT_STEPS.md",
    "MD\README_LEARN_BACKEND.md",
    "MD\QUICK_FIX_REFERENCE.md",
    "MD\NOTIFICATION_SYSTEM_GUIDE.md",
    "MD\MODEL_ANALYSIS_REPORT.md",
    "MD\MARKETPLACE_SETUP.md",
    "MD\LEARN_QUICK_REFERENCE.md",
    "MD\LEARN_IMPLEMENTATION_SUMMARY.md",
    "MD\LEARN_FEATURE_GUIDE.md",
    "MD\LEARN_BACKEND_SETUP.md",
    "MD\IMPLEMENTATION_SUMMARY.md",
    "MD\GEMINI_SETUP.md",
    "MD\GEMINI_INTEGRATION_GUIDE.md",
    "MD\FEATURE_IMPLEMENTATION_GUIDE.md",
    "MD\FARM_SETUP_GUIDE.md",
    "MD\DISEASE_MODEL_SETUP.md",
    "MD\DEPLOYMENT_GUIDE.md",
    "MD\DATABASE_SETUP.md",
    "MD\COMMUNITY_SETUP.md",
    "MD\COMMUNITY_IMPLEMENTATION.md",
    "MD\CHAT_SYSTEM_GUIDE.md",
    "MD\BLOCKCHAIN_SETUP.md",
    "MD\BACKEND_SETUP.md",
    "MD\AUDIT_TRAIL_GUIDE.md"
)

# Files to PROTECT (critical for operation)
$protectedFiles = @(
    "README.md",  # Main project README
    "package.json",
    "tsconfig.json",
    ".env",
    ".gitignore"
)

Write-Host "Deleting non-essential documentation files...`n" -ForegroundColor Yellow

foreach ($file in $docsToDelete) {
    $fullPath = Join-Path $rootPath $file
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

# Delete entire unwanted_docs folder
$unwantedDocsPath = Join-Path $rootPath "unwanted_docs"
if (Test-Path $unwantedDocsPath) {
    try {
        Remove-Item $unwantedDocsPath -Recurse -Force
        Write-Host "`n✅ Deleted entire folder: unwanted_docs\" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "`n❌ Failed to delete unwanted_docs folder: $_" -ForegroundColor Red
    }
}

# Delete entire MD folder
$mdFolderPath = Join-Path $rootPath "MD"
if (Test-Path $mdFolderPath) {
    try {
        Remove-Item $mdFolderPath -Recurse -Force
        Write-Host "✅ Deleted entire folder: MD\" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "❌ Failed to delete MD folder: $_" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 1 COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Documentation files deleted: $deletedCount" -ForegroundColor Green
Write-Host "`n"
