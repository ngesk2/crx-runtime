# Start PING Mission Control (PowerShell)
# PING Constitutional Stabilization Phase E
# Date: 2026-06-22

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile = Join-Path $ScriptDir "infrastructure\docker\compose\docker-compose-mission-control.yml"
$EnvFile = Join-Path $ScriptDir "config\environments\.env.mission-control"

# Check if docker-compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Host "ERROR: docker-compose file not found: $ComposeFile"
    exit 1
}

# Check if env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "WARNING: Environment file not found: $EnvFile"
    Write-Host "Using default environment variables"
} else {
    # Load environment variables
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

Write-Host "Starting PING Mission Control..."
Write-Host "Docker Compose: $ComposeFile"
Write-Host ""

# Start services
Set-Location $ScriptDir
docker-compose -f $ComposeFile up -d

Write-Host ""
Write-Host "Mission Control started successfully"
Write-Host ""
Write-Host "Services:"
Write-Host "  - Mission Control API: http://localhost:8000"
Write-Host "  - Open WebUI: http://localhost:3000"
Write-Host "  - API Documentation: http://localhost:8000/docs"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker-compose -f $ComposeFile logs -f"
Write-Host ""
Write-Host "To stop services:"
Write-Host "  docker-compose -f $ComposeFile down"
