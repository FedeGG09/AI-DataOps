<#
  Crea el repositorio inicial y lo publica en un repo GitHub YA CREADO y vacío.
  Antes ejecutar instalar.ps1, que genera frontend/package-lock.json.
  No subir ningún .env ni credencial al control de versiones.
  Ejemplo: .\scripts\git-inicializar.ps1 -RemoteUrl https://github.com/USUARIO/AI-DataOps-Guardian.git
#>
param([Parameter(Mandatory = $true)][string]$RemoteUrl)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
if ($RemoteUrl -notmatch '^https://github\.com/[\w.-]+/[\w.-]+(?:\.git)?$') {
    throw 'Usá una URL https://github.com/USUARIO/REPOSITORIO.git'
}
if (Test-Path '.git') { throw 'Este directorio ya tiene .git. Usá los comandos de la guía para el repo existente.' }
if (-not (Test-Path 'frontend\package-lock.json')) {
    throw 'Falta frontend/package-lock.json. Ejecutá scripts/instalar.ps1 primero y luego este script.'
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'No se encontró Git en PATH.' }
if (-not (git config user.email) -or -not (git config user.name)) { throw 'Configurá git config --global user.name y user.email antes.' }

git init
if ($LASTEXITCODE -ne 0) { throw 'Fallo git init' }
git branch -M main
git add .
if ($LASTEXITCODE -ne 0) { throw 'Fallo git add' }
# Guardarraíl: chequear explícitamente que los secretos no quedan staged.
$Staged = @(git diff --cached --name-only)
if ($Staged -contains '.env' -or @($Staged | Where-Object { $_ -match '(^|/)\.env\.local$' }).Count -gt 0) {
    throw 'ALERTA: archivo de credenciales staged. Quitalo del índice antes de continuar.'
}
git commit -m 'feat: Guardian v0.2 con CI y despliegue en Cloudflare'
if ($LASTEXITCODE -ne 0) { throw 'Fallo git commit' }
git remote add origin $RemoteUrl
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'No se pudo hacer push; verificá el repositorio vacío y autenticación GitHub.' }
Write-Host 'Repositorio inicial publicado. Conectalo desde Cloudflare Pages.' -ForegroundColor Green
