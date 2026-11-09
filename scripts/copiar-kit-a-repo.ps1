<#
 Copia el código del ZIP (carpeta fuente de este script) SOBRE el clon Git.
 No borra archivos, no copia .env, .git, .venv ni modelos del docente.
 Primero comprueba que el clon no tenga cambios locales no guardados.
 Ejemplo: .\scripts\copiar-kit-a-repo.ps1 -Repositorio 'C:\Users\Usuario\Documents\Repos\AI-DataOps-Guardian'
#>
param([Parameter(Mandatory=$true)][string]$Repositorio)
$ErrorActionPreference='Stop'
$Fuente=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path -LiteralPath $Repositorio)) { throw 'La carpeta de clon no existe. Ejecutá git clone antes.' }
$Destino=(Resolve-Path -LiteralPath $Repositorio).Path
if ($Fuente -eq $Destino) { throw 'El kit ya está ubicado dentro del repositorio. No es necesario copiar.' }
if (-not (Test-Path (Join-Path $Destino '.git'))) { throw 'El destino no contiene .git. Usá la carpeta del clon, no el ZIP.' }
Push-Location $Destino
try {
  $Remote=(& git remote get-url origin 2>$null)
  if ($LASTEXITCODE -ne 0 -or $Remote -notmatch 'FedeGG09/AI-DataOps-Guardian') { throw "Repositorio GitHub inesperado: $Remote" }
  $Cambios=@(& git status --porcelain)
  if ($Cambios.Count -gt 0) { throw 'El clon tiene cambios. Guardalos/commitealos antes de actualizar; no se sobrescribió nada.' }
  & git switch main
  if ($LASTEXITCODE -ne 0) { throw 'No se puede seleccionar main.' }
  & git pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo sincronizar main. No se copió nada.' }
} finally { Pop-Location }
Write-Host 'Copiando archivos del kit al clon sin tocar secretos ni .git...' -ForegroundColor Cyan
& robocopy $Fuente $Destino /E /R:1 /W:1 /XD .git .venv node_modules dist __pycache__ .pytest_cache /XF .env .env.local .dev.vars '*.sqlite3' '*.joblib' '*.log' '*.pyc' '*.secret' '*.pem' '*.tmp'
if ($LASTEXITCODE -ge 8) { throw "Robocopy falló con código $LASTEXITCODE" }
Write-Host 'Copia finalizada. Instalá y probá desde la carpeta del clon antes de hacer push.' -ForegroundColor Green
