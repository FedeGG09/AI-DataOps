<# Diagnóstico completo de la PC. No imprime claves ni tokens. #>
param([string]$PagesUrl='')
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
function Test-App($name) {
  $cmd=Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { Write-Host "[OK] $name instalado" -ForegroundColor Green }
  else { Write-Host "[FALTA] $name" -ForegroundColor Yellow }
}
Write-Host '== 1. Requisitos =='
'git','node','npm','ollama','cloudflared' | ForEach-Object { Test-App $_ }
if (Test-Path '.venv\Scripts\python.exe') { Write-Host '[OK] Python venv' -ForegroundColor Green }
else { Write-Warning 'Falta .venv. Ejecutá scripts/instalar.ps1.' }
$EnvFile=Join-Path $Root '.env'
$Key=''
if (Test-Path $EnvFile) {
  $Line=Get-Content $EnvFile | Where-Object { $_ -match '^GUARDIAN_API_KEY=' } | Select-Object -First 1
  if ($Line) { $Key=$Line.Substring('GUARDIAN_API_KEY='.Length).Trim() }
  if ($Key.Length -ge 32) { Write-Host '[OK] GUARDIAN_API_KEY (sin imprimir)' -ForegroundColor Green }
  else { Write-Warning 'Clave no configurada; ejecutá scripts/generar-clave.ps1.' }
} else { Write-Warning 'Falta .env' }
Write-Host '== 2. Backend =='
if ($Key.Length -ge 32) {
  try {
    $Health=Invoke-RestMethod -TimeoutSec 7 -Uri 'http://127.0.0.1:8000/api/health' -Headers @{'X-Guardian-Key'=$Key}
    Write-Host "[OK] FastAPI $($Health.version) Python $($Health.python)" -ForegroundColor Green
  } catch { Write-Warning 'FastAPI no responde / clave inválida. Iniciá backend.ps1.' }
} else { Write-Warning 'No se puede probar FastAPI sin clave válida.' }
Write-Host '== 3. Ollama =='
try {
  $Data=Invoke-RestMethod -TimeoutSec 7 -Uri 'http://127.0.0.1:11434/api/tags'
  $Names=@($Data.models | ForEach-Object {$_.name})
  Write-Host "[OK] Ollama funcionando; modelos: $($Names -join ', ')" -ForegroundColor Green
} catch { Write-Warning 'Ollama no responde en el puerto 11434.' }
if ($PagesUrl -and $Key.Length -ge 32) {
  Write-Host '== 4. Cloudflare Pages / LIVE =='
  try {
    $Url=$PagesUrl.TrimEnd('/') + '/api/health'
    if (-not $Url.StartsWith('https://')) { throw 'Se requiere URL https de Pages' }
    $Reply=Invoke-RestMethod -TimeoutSec 25 -Uri $Url -Headers @{'X-Guardian-Key'=$Key}
    Write-Host "[OK] Pages -> Function -> Tunnel -> FastAPI. Version $($Reply.version)" -ForegroundColor Green
  } catch { Write-Warning "No se pudo verificar el LIVE remoto: $($_.Exception.Message)" }
}
