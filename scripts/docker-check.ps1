# Validación reproducible exigida en el checkpoint oficial (requiere Docker Desktop).
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
docker build -t guardian-checkpoint:unidad1 .
if ($LASTEXITCODE -ne 0) { throw 'Falló docker build' }
docker run --rm guardian-checkpoint:unidad1
if ($LASTEXITCODE -ne 0) { throw 'Falló docker run' }
