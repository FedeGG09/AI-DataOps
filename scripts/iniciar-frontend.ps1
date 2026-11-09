# Vite aplica un proxy HTTP a FastAPI en desarrollo; no se necesita CORS aquí.
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location (Join-Path $Root 'frontend')
if (-not (Test-Path 'node_modules')) { throw 'Ejecutá scripts\instalar.ps1 primero.' }
Write-Host 'Laboratorio: http://127.0.0.1:5173' -ForegroundColor Green
npm run dev
