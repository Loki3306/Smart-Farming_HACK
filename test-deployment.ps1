# Smart Farming Platform - Docker Test Script
# This script tests all services and models

param(
    [switch]$Quick
)

Write-Host "🧪 Smart Farming Platform - Docker Test Suite" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [int]$Timeout = 5
    )
    
    Write-Host "Testing $Name..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
    return $false
}

function Test-Port {
    param(
        [string]$Name,
        [string]$Host,
        [int]$Port
    )
    
    Write-Host "Testing $Name (port $Port)..." -NoNewline
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($Host, $Port)
        $tcpClient.Close()
        Write-Host " ✓ PASS" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        return $false
    }
}

# Check if Docker is running
Write-Host "`n📦 Checking Docker..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    exit 1
}

try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    exit 1
}

# Check if services are running
Write-Host "`n🔍 Checking Services..." -ForegroundColor Yellow
$containers = docker-compose ps --services 2>$null
if ($containers) {
    Write-Host "✓ Docker Compose services found" -ForegroundColor Green
}
else {
    Write-Host "✗ No services running. Run: .\deploy.ps1 dev" -ForegroundColor Red
    exit 1
}

# Test HTTP Services
Write-Host "`n🌐 Testing HTTP Services..." -ForegroundColor Yellow

if (Test-Service "Backend API Health" "http://localhost:8000/api/regime/health") {
    $testsPassed++
}
else {
    $testsFailed++
}

if (Test-Service "Disease Model Health" "http://localhost:8001/health") {
    $testsPassed++
}
else {
    $testsFailed++
}

if (Test-Service "Frontend" "http://localhost:5173") {
    $testsPassed++
}
else {
    $testsFailed++
}

# Test API Endpoints
if (!$Quick) {
    Write-Host "`n🔬 Testing API Endpoints..." -ForegroundColor Yellow
    
    if (Test-Service "Backend API Docs" "http://localhost:8000/docs") {
        $testsPassed++
    }
    else {
        $testsFailed++
    }
    
    if (Test-Service "Disease Model Docs" "http://localhost:8001/docs") {
        $testsPassed++
    }
    else {
        $testsFailed++
    }
}

# Test Ports
Write-Host "`n🔌 Testing Ports..." -ForegroundColor Yellow

if (Test-Port "PostgreSQL" "localhost" 5432) {
    $testsPassed++
}
else {
    $testsFailed++
}

if (Test-Port "Redis" "localhost" 6379) {
    $testsPassed++
}
else {
    $testsFailed++
}

if (Test-Port "MQTT" "localhost" 1883) {
    $testsPassed++
}
else {
    $testsFailed++
}

# Test Models
if (!$Quick) {
    Write-Host "`n🤖 Testing ML Models..." -ForegroundColor Yellow
    
    Write-Host "Checking backend models..." -NoNewline
    $backendModels = docker-compose exec -T backend ls app/ml_models/saved_models/ 2>$null
    if ($backendModels -match "crop_model.pkl") {
        Write-Host " ✓ PASS" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        $testsFailed++
    }
    
    Write-Host "Checking disease model..." -NoNewline
    $diseaseModel = docker-compose exec -T disease-model ls models/ 2>$null
    if ($diseaseModel -match "plant_disease_resnet50_fast.pth") {
        Write-Host " ✓ PASS" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        $testsFailed++
    }
}

# Summary
Write-Host "`n" + "="*45 -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "="*45 -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Your deployment is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your services:" -ForegroundColor Yellow
    Write-Host "  Frontend:      http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend API:   http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  Disease Model: http://localhost:8001/docs" -ForegroundColor White
    exit 0
}
else {
    Write-Host "⚠️  Some tests failed. Check the logs:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1 logs" -ForegroundColor White
    exit 1
}
