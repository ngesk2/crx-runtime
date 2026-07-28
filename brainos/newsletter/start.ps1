# CRX Newsletter Brain v1 - Windows Startup Script

Write-Host "Starting CRX Newsletter Brain v1" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found. Please copy .env.example to .env and configure your credentials." -ForegroundColor Red
    exit 1
}

# Check if Ollama is running
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Ollama is not running. Please start Ollama first." -ForegroundColor Red
    Write-Host "Run: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Check if required model is available
Write-Host "Checking Ollama model..." -ForegroundColor Yellow
$modelCheck = ollama list
if ($modelCheck -match "qwen2.5-coder:7b") {
    Write-Host "Model qwen2.5-coder:7b is available" -ForegroundColor Green
} else {
    Write-Host "Pulling qwen2.5-coder:7b model..." -ForegroundColor Yellow
    ollama pull qwen2.5-coder:7b
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
python -c "from database import init_database; init_database(); print('Database initialized')"

# Test Yahoo connection
Write-Host "Testing Yahoo Mail connection..." -ForegroundColor Yellow
python -c "from yahoo_client import YahooMailClient; client = YahooMailClient(); client.test_connection()"

# Start the dashboard in background
Write-Host "Starting metrics dashboard..." -ForegroundColor Yellow
$dashboardJob = Start-Job -ScriptBlock { python dashboard.py }

# Start the worker
Write-Host "Starting newsletter ingestion worker..." -ForegroundColor Yellow
python worker.py

# Cleanup
Stop-Job $dashboardJob
Remove-Job $dashboardJob
