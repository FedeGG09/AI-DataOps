# Bloques de código comentados — Guía de lectura

Esta guía señala los bloques centrales de la implementación. Para ver **todos los módulos completos**, abrir `CODIGO_COMPLETO.md`, que incluye el código fuente de cada archivo del proyecto.

## 1. React → FastAPI local (`frontend/vite.config.ts`)

```ts
// Solo durante `npm run dev`: redirigir peticiones /api a la API privada.
server: {
  proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } }
}
```

La ventaja es que el navegador habla con el mismo origen local de Vite y éste enruta a FastAPI. **Cloudflare no ejecuta este proxy**; de ahí el modo demo offline.

## 2. API validada (`backend/app/schemas.py`)

```python
class RunRequest(BaseModel):
    scenario: Scenario = 'normal'
    mode: Mode = 'script'
    use_llm: bool = True
    approve_action: bool = False
    max_steps: int = Field(default=3, ge=1, le=6)
```

Pydantic limita escenarios, modos y cantidad de ciclos del agente, evitando parámetros arbitrarios.

## 3. Modelo de churn (`backend/app/model.py`)

```python
pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=500, random_state=42)),
])
pipe.fit(x_train, y_train)
```

Es un algoritmo real, aunque los datos son sintéticos. Un pipeline de ML para transformar características **no equivale** a un orquestador de tareas como Prefect.

## 4. PSI (`backend/app/model.py`)

```python
# Compara proporciones de bins entre referencia y observación.
return float(np.sum((b - a) * np.log(b / a)))
```

La alerta se activa a partir de PSI >= 0.25 como **umbral didáctico**; en un sistema real debe calibrarse y combinarse con métricas y contexto.

## 5. Controles sin LLM (`backend/app/engine.py`)

```python
missing = [name for name in FEATURES if name not in df.columns]
if missing:
    r.status = 'error'
    r.summary = f'Validación de esquema fallida: faltan {missing}.'
    return r
```

Es correcta ingeniería de datos: no necesitamos un LLM para detectar una columna obligatoria ausente.

## 6. Tool Calling con Ollama (`backend/app/agent.py`)

```python
response = client.post(f'{OLLAMA_URL}/api/chat', json={
    'model': OLLAMA_MODEL,
    'messages': messages,
    'tools': TOOLS,
    'stream': False,
    'options': {'temperature': 0},
})
```

El agente recibe las definiciones de funciones y puede solicitar su ejecución. `tool_result()` resuelve **solo** nombres de herramientas permitidos; no evalúa código generado ni deja escribir archivos.

## 7. Human-in-the-loop (`backend/app/service.py`)

```python
if proposal['can_execute'] and not request.approve_action:
    result.status = 'needs_approval'
else:
    # Tras una aprobación explícita, se aplica SOLO una acción segura.
    fixed = apply_safe_action(initial_dataframe(request.scenario), proposal['action_id'])
```

No equivale a conceder libertad completa al modelo: la acción es fija, auditable y revalidada.

## 8. Prefect opcional (`backend/app/prefect_workflow.py`)

```python
@task(name='extraer-datos', retries=2, retry_delay_seconds=1)
def extract(scenario: str):
    return initial_dataframe(scenario)

@flow(name='guardian-churn-flow', log_prints=True)
def guardian_flow(scenario: str = 'normal'):
    extracted = extract(scenario)
    checked = check_schema(extracted)
    clean = check_quality(checked)
    return inference(clean, scenario)
```

La semántica de retry en este ejemplo es real: Prefect reintenta la función cuando **lanza una excepción**, no cuando una función devuelve un estado `error`.

## 9. Reproducibilidad (`Dockerfile`)

```dockerfile
FROM python:3.11-slim
WORKDIR /workspace
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY backend/ ./backend/
COPY src/ ./src/
CMD ["python", "src/check_env.py"]
```

Para reproducibilidad rigurosa se recomienda posteriormente fijar las versiones exactas con un lockfile y digest de imagen. La base de esta unidad cubre los principios y la demostración del contenedor.
