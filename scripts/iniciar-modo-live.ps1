<#
 Arranque diario del docente. Abre backend LIVE y verifica Ollama.
 El servicio cloudflared permanente corre por Windows; en Quick Tunnel usar
 en otra ventana scripts/iniciar-tunel-temporal.ps1.
#>
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Script=Join-Path $Root 'scripts\iniciar-backend-live.ps1'
Start-Process powershell.exe -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$Script+'"'))
Start-Sleep -Seconds 4
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts\verificar-sistema.ps1')
Write-Host 'Para local UI: powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-frontend.ps1' -ForegroundColor Cyan
Write-Host 'Para remoto: comprobá servicio cloudflared + variables de Cloudflare Pages.' -ForegroundColor Cyan
