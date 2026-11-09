"""Ruta exigida por el checkpoint: script de verificación del entorno.

Ejecutar desde la raíz: python src/check_env.py
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.app.check_env import main

if __name__ == '__main__':
    main()
