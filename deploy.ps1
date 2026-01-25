# Smart Farming Platform - Deployment Script (PowerShell)
# Usage: .\deploy.ps1 [dev|prod|stop|rebuild|logs|status]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev','prod','stop','rebuild','logs','status')]
    [string]$Command
)

# Functions
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Check-Requirements {
    Print-Info "Checking requirements..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Print-Error "Docker is not installed"
        exit 1
    }
    
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Print-Error "Docker Compose is not installed"
        exit 1
    }
    
    Print-Success "Requirements check passed"
}

function Check-Env {
    if (!(Test-Path .env)) {
        Print-Error ".env file not found"
        Print-Info "Creating .env from .env.example..."
        Copy-Item .env.example .env
        Print-Info "Please configure .env file with your settings"
        exit 1
    }
    Print-Success "Environment file found"
}

function Deploy-Dev {
    Print-Info "Starting development deployment..."
    Check-Requirements
    Check-Env
    
    docker-compose down
    docker-compose up -d --build
    
    Print-Success "Development environment started"
    Print-Info "Services:"
    Print-Info "  - Frontend: http://localhost:5173"
    Print-Info "  - Backend API: http://localhost:8000"
    Print-Info "  - Disease Model: http://localhost:8001"
    Print-Info "  - PostgreSQL: localhost:5432"
    Print-Info "  - Redis: localhost:6379"
    Print-Info "  - MQTT: localhost:1883"
    
    Print-Info "`nView logs with: docker-compose logs -f"
}

function Deploy-Prod {
    Print-Info "Starting production deployment..."
    Check-Requirements
    Check-Env
    
    # Check if required env vars are set
    $envContent = Get-Content .env -Raw
    if (!($envContent -match "SUPABASE_URL=") -or !($envContent -match "SUPABASE_KEY=")) {
        Print-Error "SUPABASE_URL and SUPABASE_KEY must be set in .env for production"
        exit 1
    }
    
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    
    Print-Success "Production environment started"
    Print-Info "Services:"
    Print-Info "  - Frontend: http://localhost:80"
    Print-Info "  - Backend API: http://localhost:8000"
    Print-Info "  - Disease Model: http://localhost:8001"
    
    Print-Info "`nView logs with: docker-compose -f docker-compose.prod.yml logs -f"
    Print-Info "`nHealth checks:"
    Start-Sleep -Seconds 10
    
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/api/regime/health" -UseBasicParsing | Out-Null
        Print-Success "Backend is healthy"
    } catch {
        Print-Error "Backend health check failed"
    }
    
    try {
        Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing | Out-Null
        Print-Success "Disease model is healthy"
    } catch {
        Print-Error "Disease model health check failed"
    }
}

function Stop-Services {
    Print-Info "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    Print-Success "All services stopped"
}

function Rebuild-Services {
    Print-Info "Rebuilding all services..."
    docker-compose build --no-cache
    Print-Success "Rebuild complete"
}

function Show-Logs {
    Print-Info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

function Show-Status {
    Print-Info "Service Status:"
    docker-compose ps
    Write-Host ""
    Print-Info "Resource Usage:"
    docker stats --no-stream
}

# Main script
switch ($Command) {
    'dev' { Deploy-Dev }
    'prod' { Deploy-Prod }
    'stop' { Stop-Services }
    'rebuild' { Rebuild-Services }
    'logs' { Show-Logs }
    'status' { Show-Status }
}
