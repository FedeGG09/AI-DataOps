# Abre dos ventanas PowerShell y lanza ambos procesos de desarrollo.
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Backend = Join-Path $Root 'scripts\iniciar-backend.ps1'
$Frontend = Join-Path $Root 'scripts\iniciar-frontend.ps1'
Start-Process powershell.exe -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $Backend + '"'))
Start-Sleep -Seconds 3
Start-Process powershell.exe -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $Frontend + '"'))
Write-Host 'Backend: http://127.0.0.1:8000/docs'
Write-Host 'Frontend: http://127.0.0.1:5173'
