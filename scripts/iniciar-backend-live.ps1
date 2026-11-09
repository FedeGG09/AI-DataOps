<#
 Inicia el backend de la clase sin --reload (no reinicios por cambios de archivos).
 Escucha sólo localhost; Cloudflare Tunnel establece la conexión de salida.
#>
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$Python=Join-Path $Root '.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) { throw 'Falta Python venv; ejecutá instalar.ps1.' }
if (-not (Test-Path '.env')) { throw 'Falta .env; ejecutá instalar.ps1.' }
Write-Host 'AI DataOps Guardian backend LIVE -> http://127.0.0.1:8000/api/health' -ForegroundColor Green
Write-Host 'Para apagar, Ctrl+C. No cierres esta ventana durante la clase.'
& $Python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --workers 1
