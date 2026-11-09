# Ejecuta los tests y la compilación; requiere instalar.ps1 previo.
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
& '.\.venv\Scripts\python.exe' -m pytest backend\tests -q
if ($LASTEXITCODE -ne 0) { throw 'Fallaron los tests Python' }
Write-Host 'Probando Pages Function local...' -ForegroundColor Cyan
node --test frontend/tests/proxy.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'Fallaron los tests del proxy Cloudflare' }
Push-Location 'frontend'
try { npm run build; if ($LASTEXITCODE -ne 0) { throw 'Falló el build React' } }
finally { Pop-Location }
Write-Host 'Pruebas y frontend OK' -ForegroundColor Green
