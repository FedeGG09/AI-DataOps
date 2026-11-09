<# Muestra el secreto SOLO por decisión expresa del docente. No lo subas a Git ni lo proyectes. #>
param([switch]$Copiar)
$ErrorActionPreference='Stop'
$Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$File=Join-Path $Root '.env'
if (!(Test-Path $File)) { throw 'Falta .env. Ejecutá instalar.ps1.' }
$Line=(Get-Content -LiteralPath $File | Where-Object { $_ -match '^GUARDIAN_API_KEY=' } | Select-Object -First 1)
if (-not $Line) { throw 'No hay GUARDIAN_API_KEY. Ejecutá generar-clave.ps1.' }
$Key=$Line.Substring('GUARDIAN_API_KEY='.Length)
if ($Key.Length -lt 32) { throw 'Clave demasiado corta. Ejecutá generar-clave.ps1 -Rotar.' }
if ($Copiar) {
  Set-Clipboard -Value $Key
  Write-Host 'Clave copiada al portapapeles; pegala en la sección Conexión LIVE de React.' -ForegroundColor Green
} else {
  Write-Warning 'No compartas esta salida en capturas de pantalla ni transmisiones.'
  Write-Output $Key
}
