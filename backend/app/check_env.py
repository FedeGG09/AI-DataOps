"""Checkpoint unidad 1: evidencia de Python, variables y contenedor."""
import os
import platform
from pathlib import Path


def main():
    print('AI DATAOPS GUARDIAN — VALIDACIÓN DEL ENTORNO')
    print('Python:', platform.python_version())
    print('Sistema:', platform.system())
    print('Carpeta de trabajo:', Path.cwd())
    print('Dentro de contenedor:', Path('/.dockerenv').exists())
    for name in ('OLLAMA_URL', 'OLLAMA_MODEL', 'MLFLOW_TRACKING_URI'):
        # No imprimir jamás credenciales reales.
        print(f'{name}:', 'definida' if os.getenv(name) else 'no definida')
    print('OK: script de verificación ejecutado')

if __name__ == '__main__':
    main()
