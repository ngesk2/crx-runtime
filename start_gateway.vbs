Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\nolan\.local\share\opencode\worktree\a0b0bfa71232ff53146749a3cad1f1b9013dc3e9\curious-squid"
WshShell.Environment("Process")("POSTGRES_HOST") = "localhost"
WshShell.Environment("Process")("POSTGRES_PORT") = "5433"
WshShell.Environment("Process")("POSTGRES_DB") = "ping_runtime"
WshShell.Environment("Process")("POSTGRES_USER") = "postgres"
WshShell.Environment("Process")("POSTGRES_PASSWORD") = "postgres"
WshShell.Environment("Process")("PORT") = "8080"
Set fso = CreateObject("Scripting.FileSystemObject")
Set logFile = fso.CreateTextFile("C:\Users\nolan\AppData\Local\Temp\ping-gateway.log", True)
WshShell.Run "cmd /c node gateway/server.js >> ""C:\Users\nolan\AppData\Local\Temp\ping-gateway.log"" 2>&1", 0, False
