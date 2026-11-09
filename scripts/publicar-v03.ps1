<#
 Publica esta carpeta sobre tu repositorio YA INICIALIZADO en Git.
 No hace --force, no borra el remoto ni crea un repo nuevo.
 Para el primer commit, clonar y copiar contenido de este kit al clone primero.
#>
param([string]$Mensaje='feat: Guardian v0.3 Cloudflare Tunnel y Ollama LIVE')
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
if (-not (Test-Path '.git')) { throw 'Esta carpeta no tiene .git. Cloná el repo existente y copiá el contenido del kit dentro.' }
$remote = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -ne 0) { throw 'Falta remote origin. Usá git remote add origin https://github.com/FedeGG09/AI-DataOps-Guardian.git' }
if ($remote -notmatch 'FedeGG09/AI-DataOps-Guardian') { throw "Remote inesperado: $remote" }
$Branch=(& git branch --show-current).Trim()
if ($Branch -ne 'main') { throw "Estás en $Branch, no main. Volvé a main antes de publicar." }
if (-not (Test-Path 'frontend\package-lock.json')) { throw 'Falta package-lock.json: ejecutar scripts/instalar.ps1.' }
& git fetch origin main
if ($LASTEXITCODE -ne 0) { throw 'Git fetch falló. Revisá la red o tu login.' }
$RemoteHead=(& git rev-parse origin/main).Trim()
$LocalHead=(& git rev-parse HEAD).Trim()
if ($RemoteHead -ne $LocalHead) { throw 'El remoto tiene cambios que aún no integraste. Antes de copiar el kit, git pull --ff-only origin main.' }
& git add -A
if ($LASTEXITCODE -ne 0) { throw 'git add falló' }
$staged=@(& git diff --cached --name-only)

# Seguridad: aceptar SOLO archivos de ejemplo sin credenciales reales.
# .env.example y .dev.vars.example documentan la configuracion y se versionan.
# .env, .env.local, .env.production, .dev.vars, etc. NO se versionan.
$secretFiles = @($staged | Where-Object {
    $path = $_ -replace '\\', '/'
    $fileName = ($path -split '/')[-1]
    $isEnvSecret = ($fileName -match '^\.env($|\.)') -and ($fileName -ne '.env.example')
    $isDevSecret = ($fileName -match '^\.dev\.vars($|\.)') -and ($fileName -ne '.dev.vars.example')
    $isPrivateFile = $fileName -match '\.(pem|secret|key)$'
    $isEnvSecret -or $isDevSecret -or $isPrivateFile
})
if ($secretFiles.Count -gt 0) {
    Write-Host 'Archivos potencialmente sensibles detectados en staging:' -ForegroundColor Red
    $secretFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    throw 'ALERTA: se detectaron archivos sensibles. No se hizo commit ni push.'
}
if ($staged.Count -eq 0) { Write-Host 'No hay cambios pendientes.' -ForegroundColor Yellow; exit 0 }
& git commit -m $Mensaje
if ($LASTEXITCODE -ne 0) { throw 'Commit falló' }
& git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Push falló. Revisa credenciales y estado del remoto.' }
Write-Host 'v0.3 subida. GitHub Actions y Cloudflare Pages deben iniciar automáticamente.' -ForegroundColor Green
