<#
  Operaciones repetibles para mostrar CI/CD en una clase.
  Ejecución: .\scripts\demo-cicd.ps1 -Accion crear-rama
  Comandos disponibles:
    crear-rama   => crea demo/cambio-en-vivo a partir de main
    romper-build => agrega un archivo TypeScript con error intencional
    reparar-build=> elimina el archivo, restaurando el build
    validar      => ejecuta pytest y build local
    estado       => muestra rama, archivos y commits
  Este script NO publica commits por su cuenta.
#>
param([Parameter(Mandatory = $true)]
  [ValidateSet('crear-rama','romper-build','reparar-build','validar','estado')]
  [string]$Accion)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
if (-not (Test-Path '.git')) { throw 'Primero inicializá y publicá el repositorio GitHub.' }
$Rama = (git branch --show-current).Trim()
$ArchivoError = Join-Path $Root 'frontend\src\demo_ci_error.ts'
if ($Accion -eq 'crear-rama') {
    if ($Rama -ne 'main') { throw 'Volvé a main antes de crear la rama de demostración.' }
    if ((git status --porcelain).Count -gt 0) { throw 'Hay cambios sin confirmar; commitealos antes.' }
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo actualizar main.' }
    git switch -c demo/cambio-en-vivo
    if ($LASTEXITCODE -ne 0) { throw 'La rama ya existe o no pudo crearse.' }
    Write-Host 'Rama de clase creada: demo/cambio-en-vivo' -ForegroundColor Green
}
elseif ($Accion -eq 'romper-build') {
    if ($Rama -eq 'main') { throw 'No insertar errores en main. Usá crear-rama.' }
    # El compilador TypeScript detectará que string no es asignable a number.
    Set-Content -Path $ArchivoError -Encoding UTF8 -Value @(
      '// Error intencional para la demostracion de CI/CD.'
      'export const demoIncorrecto: number = "ERROR de CI intencional"'
    )
    Write-Host 'Error intencional agregado. npm run build debe FALLAR.' -ForegroundColor Yellow
}
elseif ($Accion -eq 'reparar-build') {
    if ($Rama -eq 'main') { throw 'No es una rama de demostración.' }
    if (Test-Path $ArchivoError) { Remove-Item -LiteralPath $ArchivoError -Force }
    Write-Host 'Se quitó el error intencional. Probá npm run build.' -ForegroundColor Green
}
elseif ($Accion -eq 'validar') {
    if (-not (Test-Path '.venv\Scripts\python.exe')) { throw 'Ejecutá scripts/instalar.ps1 primero.' }
    & '.\.venv\Scripts\python.exe' -m pytest backend\tests -q
    if ($LASTEXITCODE -ne 0) { throw 'Falló pytest' }
    Push-Location 'frontend'
    try { npm run build; if ($LASTEXITCODE -ne 0) { throw 'Falló el build React' } }
    finally { Pop-Location }
    Write-Host 'Validaciones locales completas.' -ForegroundColor Green
}
elseif ($Accion -eq 'estado') {
    git status --short --branch
    git log -5 --oneline --decorate
}
