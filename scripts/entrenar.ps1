# Entrena el modelo real de churn y permite activar tracking MLflow opcional.
param([switch]$Mlflow)
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$code = 'from backend.app.model import train_model; print(train_model(track_mlflow=' + $(if ($Mlflow) { 'True' } else { 'False' }) + '))'
& '.\.venv\Scripts\python.exe' -c $code
