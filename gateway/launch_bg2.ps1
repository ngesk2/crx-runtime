$env:POSTGRES_HOST='localhost'
$env:POSTGRES_PORT='5432'
$env:POSTGRES_DB='crx_runtime'
$env:POSTGRES_USER='postgres'
$env:POSTGRES_PASSWORD='postgres'
$env:QDRANT_URL='http://localhost:6333'
$env:OLLAMA_BASE_URL='http://localhost:11434'
$env:PORT='8080'

Set-Location "C:\Users\nolan\.local\share\opencode\worktree\a0b0bfa71232ff53146749a3cad1f1b9013dc3e9\curious-squid\gateway"

Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -RedirectStandardOutput "C:\Users\nolan\AppData\Local\Temp\opencode\gw-out.log" -RedirectStandardError "C:\Users\nolan\AppData\Local\Temp\opencode\gw-err.log"
