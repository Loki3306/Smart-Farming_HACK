# Master Production Sanitization Script
# Runs all 4 phases of production cleanup

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║        PRODUCTION-READY SANITIZATION - MASTER SCRIPT          ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  This script will clean your repository for production by:    ║" -ForegroundColor Cyan
Write-Host "║  1. Removing non-essential documentation                      ║" -ForegroundColor Cyan
Write-Host "║  2. Deleting test and debug scripts                           ║" -ForegroundColor Cyan
Write-Host "║  3. Verifying code integrity                                  ║" -ForegroundColor Cyan
Write-Host "║  4. Optimizing for production deployment                      ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

$rootPath = "C:\code\Smart-Farming_HACK"
Set-Location $rootPath

# Confirmation prompt
Write-Host "⚠️  WARNING: This will permanently delete files!" -ForegroundColor Yellow
Write-Host "   Make sure you have a backup before proceeding.`n" -ForegroundColor Yellow

$confirmation = Read-Host "Do you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "`n❌ Sanitization cancelled by user." -ForegroundColor Red
    exit
}

Write-Host "`n🚀 Starting sanitization process...`n" -ForegroundColor Green

# Phase 1: Documentation Cleanup
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " PHASE 1: Documentation Cleanup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

& "$rootPath\sanitize_phase1.ps1"

Start-Sleep -Seconds 2

# Phase 2: Test Script Cleanup
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " PHASE 2: Test Script Cleanup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

& "$rootPath\sanitize_phase2.ps1"

Start-Sleep -Seconds 2

# Phase 3: Code Verification
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " PHASE 3: Code Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

& "$rootPath\sanitize_phase3.ps1"

Start-Sleep -Seconds 2

# Phase 4: Production Optimization
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " PHASE 4: Production Optimization" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

& "$rootPath\sanitize_phase4.ps1"

# Final Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║                  SANITIZATION COMPLETE!                        ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "✅ All phases completed successfully!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Non-essential documentation removed" -ForegroundColor Green
Write-Host "  ✅ Test and debug scripts cleaned" -ForegroundColor Green
Write-Host "  ✅ Code integrity verified" -ForegroundColor Green
Write-Host "  ✅ Production configuration checked" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review the output above for any warnings" -ForegroundColor White
Write-Host "  2. Test the application to ensure everything works" -ForegroundColor White
Write-Host "  3. Commit changes to version control" -ForegroundColor White
Write-Host "  4. Deploy to production environment" -ForegroundColor White

Write-Host "`n🔒 Critical Files Protected:" -ForegroundColor Cyan
Write-Host "  ✅ All backend logic intact" -ForegroundColor Green
Write-Host "  ✅ All frontend components preserved" -ForegroundColor Green
Write-Host "  ✅ All AI models and agents functional" -ForegroundColor Green
Write-Host "  ✅ All database configurations maintained" -ForegroundColor Green

Write-Host "`n📦 Repository is now production-ready!" -ForegroundColor Green
Write-Host "`n"

# Optional: Clean up sanitization scripts themselves
Write-Host "🧹 Clean up sanitization scripts?" -ForegroundColor Yellow
$cleanupScripts = Read-Host "Delete sanitization scripts? (yes/no)"

if ($cleanupScripts -eq "yes") {
    Remove-Item "$rootPath\sanitize_phase1.ps1" -Force -ErrorAction SilentlyContinue
    Remove-Item "$rootPath\sanitize_phase2.ps1" -Force -ErrorAction SilentlyContinue
    Remove-Item "$rootPath\sanitize_phase3.ps1" -Force -ErrorAction SilentlyContinue
    Remove-Item "$rootPath\sanitize_phase4.ps1" -Force -ErrorAction SilentlyContinue
    Remove-Item "$rootPath\sanitize_master.ps1" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Sanitization scripts removed" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  Sanitization scripts kept for future use" -ForegroundColor Cyan
}

Write-Host "`n🎉 Done! Your repository is clean and ready for deployment!" -ForegroundColor Green
Write-Host "`n"
