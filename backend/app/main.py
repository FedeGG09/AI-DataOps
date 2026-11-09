"""FastAPI local. Por defecto escucha SOLO en 127.0.0.1 (sin acceso de red pública)."""
from __future__ import annotations
import platform
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .agent import ollama_status
from .config import ALLOWED_ORIGINS, API_KEY
from .engine import SCENARIOS
from .model import get_model, MODEL_PATH
from .schemas import RunRequest, RunResponse
from .service import execute
from .storage import recent, counts

app = FastAPI(title='AI DataOps Guardian', version='0.1.0', docs_url='/docs')
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'X-Guardian-Key'])


def optional_api_key(x_guardian_key: str | None = Header(default=None)):
    """Protección opcional. Si publicás un túnel, activá autenticación en el perímetro."""
    if API_KEY and x_guardian_key != API_KEY:
        raise HTTPException(status_code=401, detail='Credencial inválida')

@app.get('/api/health', dependencies=[Depends(optional_api_key)])
def health():
    return {'status': 'ok', 'python': platform.python_version(), 'model_ready': MODEL_PATH.exists(),
            'service': 'backend-local', 'version': '0.1.0'}

@app.get('/api/ollama', dependencies=[Depends(optional_api_key)])
def ollama():
    return ollama_status()

@app.get('/api/scenarios', dependencies=[Depends(optional_api_key)])
def scenarios():
    return SCENARIOS

@app.get('/api/dashboard', dependencies=[Depends(optional_api_key)])
def dashboard():
    get_model()
    return {'counters': counts(), 'runs': recent(20), 'model_ready': True}

@app.post('/api/run', response_model=RunResponse, dependencies=[Depends(optional_api_key)])
def run(request: RunRequest):
    return execute(request)
