# FastAPI + Ollama local: jamás escucha 0.0.0.0 para no exponer datos en la red.
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$Python = Join-Path $Root '.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) { throw 'Ejecutá scripts\instalar.ps1 primero.' }
Write-Host 'API: http://127.0.0.1:8000/docs' -ForegroundColor Green
& $Python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
