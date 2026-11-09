"""FastAPI local. Por defecto escucha SOLO en 127.0.0.1 (sin acceso de red pública)."""
from __future__ import annotations
import platform
from fastapi import FastAPI, Depends, Header, HTTPException
import secrets
from threading import BoundedSemaphore
from fastapi.middleware.cors import CORSMiddleware
from .agent import ollama_status
from .config import ALLOWED_ORIGINS, API_KEY
from .engine import SCENARIOS
from .model import get_model, MODEL_PATH
from .schemas import RunRequest, RunResponse
from .service import execute
from .storage import recent, counts

# Swagger sigue disponible en localhost. Para mayor seguridad se puede desactivar
# con GUARDIAN_ENABLE_DOCS=0 cuando el backend sea accesible por un túnel.
import os
# Protegemos CPU/RAM: un solo diagnóstico LLM simultáneo por proceso.
_LLM_GATE = BoundedSemaphore(value=1)

app = FastAPI(title='AI DataOps Guardian', version='0.3.0',
              docs_url='/docs' if os.getenv('GUARDIAN_ENABLE_DOCS', '0') == '1' else None,
              redoc_url=None, openapi_url='/openapi.json' if os.getenv('GUARDIAN_ENABLE_DOCS', '0') == '1' else None)
# No usamos CORS en Pages: la Function expone /api en el MISMO origen que React.
# CORS permite sólo desarrollo local; no habilita accesos externos por sí mismo.
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
                   allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'X-Guardian-Key'])

@app.middleware('http')
async def no_store(request, call_next):
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


def optional_api_key(x_guardian_key: str | None = Header(default=None)):
    """Protección obligatoria y comparación constante. Nunca operar sin clave."""
    if not API_KEY or len(API_KEY) < 32:
        raise HTTPException(status_code=503, detail='Configurar GUARDIAN_API_KEY (mínimo 32 caracteres)')
    if not x_guardian_key or not secrets.compare_digest(x_guardian_key, API_KEY):
        raise HTTPException(status_code=401, detail='Clave del laboratorio inválida')

@app.get('/api/health', dependencies=[Depends(optional_api_key)])
def health():
    return {'status': 'ok', 'python': platform.python_version(), 'model_ready': MODEL_PATH.exists(),
            'service': 'backend-local', 'version': '0.3.0'}

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
    # Las solicitudes de Llama 3 son costosas en CPU. Para no saturar la PC del
    # docente al recibir múltiples alumnos, aceptamos sólo una simultánea.
    # Las otras obtienen 429; pueden volver a intentar luego.
    if request.mode == 'agent' and request.use_llm:
        if not _LLM_GATE.acquire(blocking=False):
            raise HTTPException(status_code=429, detail='Ollama ocupado; probá nuevamente en unos momentos')
        try:
            return execute(request)
        finally:
            _LLM_GATE.release()
    return execute(request)
