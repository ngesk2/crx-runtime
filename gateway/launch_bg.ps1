$env:POSTGRES_HOST='localhost'
$env:POSTGRES_PORT='5432'
$env:POSTGRES_DB='crx_runtime'
$env:POSTGRES_USER='postgres'
$env:POSTGRES_PASSWORD='postgres'
$env:QDRANT_URL='http://localhost:6333'
$env:OLLAMA_BASE_URL='http://localhost:11434'
$env:PORT='8080'

$logFile = "C:\Users\nolan\AppData\Local\Temp\opencode\gw-live.log"

# Start node detached, stdout/stderr to log file
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node"
$psi.Arguments = "server.js"
$psi.WorkingDirectory = "C:\Users\nolan\.local\share\opencode\worktree\a0b0bfa71232ff53146749a3cad1f1b9013dc3e9\curious-squid\gateway"
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.Environment["POSTGRES_HOST"] = "localhost"
$psi.Environment["POSTGRES_PORT"] = "5432"
$psi.Environment["POSTGRES_DB"] = "crx_runtime"
$psi.Environment["POSTGRES_USER"] = "postgres"
$psi.Environment["POSTGRES_PASSWORD"] = "postgres"
$psi.Environment["QDRANT_URL"] = "http://localhost:6333"
$psi.Environment["OLLAMA_BASE_URL"] = "http://localhost:11434"
$psi.Environment["PORT"] = "8080"

$p = [System.Diagnostics.Process]::Start($psi)

# Async reader for stdout
$writer = [System.IO.StreamWriter]::new($logFile, $false)
$p.BeginOutputReadLine()
$p.BeginErrorReadLine()

# Redirect output to file via events
Register-ObjectEvent $p -EventName OutputDataReceived -Action {
    if ($EventArgs.Data) { Add-Content -Path "C:\Users\nolan\AppData\Local\Temp\opencode\gw-live.log" -Value $EventArgs.Data }
}
Register-ObjectEvent $p -EventName ErrorDataReceived -Action {
    if ($EventArgs.Data) { Add-Content -Path "C:\Users\nolan\AppData\Local\Temp\opencode\gw-live.log" -Value $EventArgs.Data }
}

Write-Host "Gateway PID: $($p.Id)"
