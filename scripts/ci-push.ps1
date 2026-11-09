<#
  Crea un commit y hace push en una rama de demostración.
  Por defecto exige pruebas locales. -PermitirFallos es solo para enseñar CI rojo.
  Ejemplos:
    .\scripts\ci-push.ps1 -Mensaje 'feat: nueva explicación visual de CI/CD'
    .\scripts\ci-push.ps1 -Mensaje 'test: demostrar CI fallido' -PermitirFallos
#>
param(
  [Parameter(Mandatory = $true)][string]$Mensaje,
  [switch]$PermitirFallos
)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
if (-not (Test-Path '.git')) { throw 'No hay repo Git.' }
$Rama = (git branch --show-current).Trim()
if (-not $Rama -or $Rama -eq 'main') { throw 'Por seguridad este script solo publica ramas de trabajo. No publica main.' }
if (-not $PermitirFallos) { & (Join-Path $PSScriptRoot 'demo-cicd.ps1') -Accion validar }
else { Write-Warning 'Se omiten los controles locales SOLO para demostrar un check rojo en el PR.' }
git add -A
$Staged = @(git diff --cached --name-only)
if ($Staged.Count -eq 0) { throw 'No hay cambios para commitear.' }
if ($Staged -contains '.env') { throw 'No subas el archivo .env.' }
git commit -m $Mensaje
if ($LASTEXITCODE -ne 0) { throw 'Falló git commit.' }
git push -u origin $Rama
if ($LASTEXITCODE -ne 0) { throw 'Falló git push.' }
Write-Host ('Rama publicada: ' + $Rama + '. Abrí un Pull Request en GitHub.') -ForegroundColor Green
