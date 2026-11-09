"""Configuración centralizada: rutas relativas y secretos fuera de Git."""
from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / '.env')
DATA_DIR = ROOT / 'backend' / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434').rstrip('/')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1:8b')
API_KEY = os.getenv('GUARDIAN_API_KEY', '')
MAX_AGENT_STEPS = min(max(int(os.getenv('MAX_AGENT_STEPS', '3')), 1), 6)
ALLOWED_ORIGINS = [x.strip() for x in os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if x.strip()]
