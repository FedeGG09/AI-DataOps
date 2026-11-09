# Setup integral para Windows 11 / PowerShell, sin requerir Docker.
# Ejecutar desde la raíz: powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
Write-Host '[1/5] Creando archivo .env si no existe' -ForegroundColor Cyan
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
Write-Host '[2/5] Buscando Python...' -ForegroundColor Cyan
$PythonCmd = $null
try { & py -3.11 --version 2>$null; if ($LASTEXITCODE -eq 0) { $PythonCmd = @('py', '-3.11') } } catch {}
if (-not $PythonCmd) {
    try { & py -3 --version 2>$null; if ($LASTEXITCODE -eq 0) { $PythonCmd = @('py', '-3') } } catch {}
}
if (-not $PythonCmd) { throw 'No encuentro Python 3.11+. Instalalo y volvé a ejecutar.' }
Write-Host '[3/5] Creando entorno virtual...' -ForegroundColor Cyan
if (-not (Test-Path '.venv\Scripts\python.exe')) {
    if ($PythonCmd[0] -eq 'py') { & py $PythonCmd[1] -m venv .venv }
}
$Python = Join-Path $Root '.venv\Scripts\python.exe'
& $Python -m pip install --upgrade pip
& $Python -m pip install -r backend\requirements.txt
Write-Host '[4/5] Instalando frontend...' -ForegroundColor Cyan
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ / npm no instalado. Instalá Node.js y reintentá.' }
Push-Location 'frontend'
try { if (Test-Path 'package-lock.json') { npm ci } else { npm install }; if ($LASTEXITCODE -ne 0) { throw 'npm falló' } }
finally { Pop-Location }
Write-Host '[5/5] Validando Python...' -ForegroundColor Cyan
& $Python src\check_env.py
Write-Host 'Instalación finalizada. Abrí una terminal para el backend y otra para React.' -ForegroundColor Green
Write-Host 'Backend: powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-backend.ps1'
Write-Host 'Frontend: powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-frontend.ps1'
Write-Host 'Si falta el modelo Llama, ejecutá: ollama pull llama3.1:8b'
