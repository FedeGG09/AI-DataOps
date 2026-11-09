<#
 Instala como servicio Windows un túnel PERMANENTE creado desde Cloudflare Zero Trust.
 Requiere PowerShell elevado a administrador. El token se ingresa de forma privada.
 Este script NO guarda el token en el repositorio.
#>
$ErrorActionPreference='Stop'
$id=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=New-Object Security.Principal.WindowsPrincipal($id)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Abrí Windows PowerShell como Administrador antes de instalar el servicio.'
}
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { throw 'No se encuentra cloudflared en PATH.' }
Write-Host 'Creá primero el túnel permanente en Cloudflare Zero Trust -> Networking -> Tunnels.' -ForegroundColor Cyan
Write-Host 'Ingresá SÓLO el token del túnel (no el comando completo de cloudflared).' -ForegroundColor Yellow
$secure=Read-Host 'TUNNEL_TOKEN (entrada oculta)' -AsSecureString
$bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token=''
try {
  $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  if ($token.Length -lt 30) { throw 'Token demasiado corto; comprobá que copiaste el valor correcto.' }
  & cloudflared service install $token
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflared no pudo instalar el servicio.' }
  Write-Host 'Túnel configurado como servicio. Verificá Get-Service cloudflared.' -ForegroundColor Green
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  $token=$null
}
