<#
 Acceso temporal para prueba rápida. No es un túnel de producción.
 URL efímera trycloudflare.com. No usar con datos reales ni compartir la clave.
 Requiere FastAPI protegido con GUARDIAN_API_KEY. Si no está configurada, no inicia.
#>
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EnvFile=Join-Path $Root '.env'
if (-not (Test-Path $EnvFile)) { throw 'Falta .env: ejecutá instalar.ps1' }
$Line=Get-Content $EnvFile | Where-Object { $_ -match '^GUARDIAN_API_KEY=' } | Select-Object -First 1
if (-not $Line -or $Line.Substring('GUARDIAN_API_KEY='.Length).Trim().Length -lt 32) { throw 'Por seguridad: configurá GUARDIAN_API_KEY antes del túnel.' }
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { throw 'Instalá cloudflared: winget install --id Cloudflare.cloudflared -e' }
Write-Warning 'La URL de Quick Tunnel será pública. Es SOLO para test; el backend exige clave privada.'
Write-Host 'Copiá la URL https://xxxxx.trycloudflare.com que aparece en la terminal.' -ForegroundColor Cyan
Write-Host 'Configurala en Pages como GUARDIAN_API_ORIGIN y GUARDIAN_ALLOW_UNPROTECTED_ORIGIN=1.' -ForegroundColor Cyan
Write-Host 'Dejá esta ventana abierta mientras dure la demostración.' -ForegroundColor Cyan
& cloudflared tunnel --url http://127.0.0.1:8000
