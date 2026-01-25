Write-Host "Starting Smart Farming System..." -ForegroundColor Green

# 1. Install & Start Backend
Write-Host "`nSetting up Python Backend..." -ForegroundColor Cyan
if (!(Test-Path "backend\venv")) {
    python -m venv backend\venv
}
.\backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

Write-Host "Launching ML Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Disease Model Service (Port 8001)
Write-Host "`nStarting Disease Model Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd disease_model; ..\backend\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"

# 3. Install & Start Frontend/Server
Write-Host "`nSetting up Node.js App..." -ForegroundColor Cyan
npm install

Write-Host "Launching App Server & Dashboard (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# 4. Start Simulator
Write-Host "`nStarting Farm Simulator..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python farm_sensor_simulator.py --demo"

Write-Host "`nAll systems triggered!" -ForegroundColor Green
Write-Host "-> Dashboard: http://localhost:5000"
Write-Host "-> ML Backend: http://localhost:8000/docs"
Write-Host "-> Disease Svc: http://localhost:8001/docs"
