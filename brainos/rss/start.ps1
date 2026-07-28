# CRX Autonomous Content Digestion Worker - Windows Startup Script

Write-Host "Starting CRX Autonomous Content Digestion Worker" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Ollama is running
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Ollama is not running. Please start Ollama first." -ForegroundColor Red
    Write-Host "Run: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Check if required model is available
Write-Host "Checking Ollama model..." -ForegroundColor Yellow
$modelCheck = ollama list
if ($modelCheck -match "llama3.2") {
    Write-Host "Model llama3.2 is available" -ForegroundColor Green
} else {
    Write-Host "Pulling llama3.2 model..." -ForegroundColor Yellow
    ollama pull llama3.2
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start Open WebUI
Write-Host "Starting Open WebUI..." -ForegroundColor Yellow
docker-compose up -d

# Wait for Open WebUI to start
Write-Host "Waiting for Open WebUI to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start the dashboard in background
Write-Host "Starting metrics dashboard..." -ForegroundColor Yellow
$dashboardJob = Start-Job -ScriptBlock { python dashboard.py }

# Start the worker
Write-Host "Starting digestion worker..." -ForegroundColor Yellow
python worker.py

# Cleanup
Stop-Job $dashboardJob
Remove-Job $dashboardJob
