<#
 Genera una clave de 256 bits local, sin APIs externas ni proveedores pagos.
 El secreto se guarda SOLO en .env, ignorado por Git.
 No reemplaza una clave ya existente salvo que se use -Rotar (corta sesiones).
#>
param([switch]$Rotar)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$File = Join-Path $Root '.env'
if (-not (Test-Path -LiteralPath $File)) { Copy-Item (Join-Path $Root '.env.example') $File }
$Content = [System.IO.File]::ReadAllText($File)
$Match = [regex]::Match($Content, '(?m)^GUARDIAN_API_KEY\s*=\s*(.*?)\s*$')
if ($Match.Success -and $Match.Groups[1].Value.Trim().Length -ge 32 -and -not $Rotar) {
  Write-Host 'La clave de laboratorio ya está configurada; no se cambió.' -ForegroundColor Green
  exit 0
}
$Bytes = New-Object byte[] 32
$Rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $Rng.GetBytes($Bytes) } finally { $Rng.Dispose() }
$Key = ([Convert]::ToBase64String($Bytes)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
if ($Match.Success) { $Content = [regex]::Replace($Content, '(?m)^GUARDIAN_API_KEY\s*=.*$', "GUARDIAN_API_KEY=$Key") }
else { $Content += "`r`nGUARDIAN_API_KEY=$Key`r`n" }
[System.IO.File]::WriteAllText($File, $Content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Clave privada generada en .env. Ejecutá scripts/mostrar-clave.ps1 para usarla.' -ForegroundColor Green
