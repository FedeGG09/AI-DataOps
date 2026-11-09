# AI DataOps Guardian · Diplomatura AI Automation para Data Scientists

**Versión docente 0.2.0 · React + FastAPI + Ollama local + Scikit-learn**

Este repositorio es un laboratorio didáctico para la Unidad 1. Incluye un frontend atractivo que se puede publicar en Cloudflare Pages, un backend **exclusivamente local**, simulaciones reproducibles, un modelo real de churn, controles de datos y un agente **real** basado en Ollama para el modo conectado.

> **Importante:** en Cloudflare Pages el frontend funciona en modo **DEMO**; no ejecuta Python ni Ollama. Para conectarlo realmente con Ollama se debe abrir React con Vite en **la misma computadora** que ejecuta FastAPI. La web pública no está autorizada a atravesar la red hacia `localhost` de tu PC. No expongas la API mediante túneles públicos sin autenticación y políticas de acceso.

## Nuevo en v0.2: GitHub + Cloudflare CI/CD en vivo

- El frontend incorpora la sección **CI/CD en vivo**, donde se ve la versión, rama y SHA real del despliegue (en local se identifica como desarrollo local).
- GitHub Actions realiza tests Python y `npm ci` + build de React en Pull Requests y en `main`.
- Cloudflare Pages usa la integración GitHub nativa para los previews y el despliegue automático a producción.
- `scripts/git-inicializar.ps1`, `demo-cicd.ps1` y `ci-push.ps1` permiten enseñar el proceso desde PowerShell.
- **Antes del primer push ejecutar `instalar.ps1`** y subir `frontend/package-lock.json` creado por npm. El archivo `frontend/.node-version` fija Node.js para los builds de Cloudflare Pages. Es obligatorio para el `npm ci` de Actions.
- Documentación detallada con ejercicios: [`docs/CI_CD_EN_VIVO.md`](docs/CI_CD_EN_VIVO.md).
- Para demostrar que CI bloquea la llegada a `main` por el flujo normal, activar protección de rama y exigir el check **Guardian / quality gate**. Los previews de Cloudflare son independientes y pueden compilar antes de que Actions termine.

## 1. Requisitos

- Windows 11, PowerShell 5.1+, Python **3.11 o superior**, Node.js **20.19+ o 22.12+**, Git.
- Ollama instalado en Windows; recomendado `llama3.1:8b`, configurable en `.env`.
- Docker Desktop **opcional para ejecutar el laboratorio**, pero **obligatorio** para generar la evidencia de checkpoint de la Unidad 1 (junto con VS Code + Dev Containers).
- Se puede probar en CPU y sin GPU dedicada; el LLM local tendrá latencia variable.

## 2. Instalación automática (PowerShell)

Abrí PowerShell en la raíz del repositorio y ejecutá:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
```

El script crea `.env` si falta, prepara `.venv`, instala dependencias Python y `npm install`, y valida el entorno. Luego, en dos terminales:

```powershell
# Terminal 1: iniciar backend local
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-backend.ps1

# Terminal 2: iniciar frontend React
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-frontend.ps1
```

O iniciar las dos ventanas:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-todo.ps1
```

- Interfaz: http://127.0.0.1:5173
- Swagger FastAPI: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

En el navegador seleccioná **Local**. Si el backend no está activo, podés seleccionar **Demo** para usar la simulación.

## 3. Ollama con Llama 3.1

```powershell
ollama list
ollama pull llama3.1:8b
ollama serve
```

Si Ollama ya está ejecutándose en segundo plano no vuelvas a iniciar `ollama serve` (la dirección 11434 ya estará ocupada). Si tu modelo se llama `llama3:latest` o de otra forma, cambiá la línea de `.env`:

```ini
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
```

En el laboratorio seleccioná modo **Agente IA**, dejá activado **Habilitar Llama 3.1 local**, y ejecutá. El backend llamará a `POST /api/chat`, con herramientas `inspect_schema`, `profile_dataset`, `check_data_drift` y `recent_failures`. Ninguna de esas herramientas permite ejecutar código recibido del LLM. Podés ver el rastro de llamadas y sus resultados en la consola de ejecución.

Si Ollama no está disponible, se informa **expresamente** que el diagnóstico LLM no pudo completarse y solo se muestra una propuesta basada en reglas. No se presenta un fallback como si fuera una respuesta de IA.

## 4. Organización

```text
AI_DataOps_Guardian/
├── frontend/                    React + TypeScript + Vite (Cloudflare Pages)
│   ├── src/App.tsx              Pantalla principal y laboratorios
│   ├── src/api.ts               HTTP al backend local (proxy Vite)
│   ├── src/demo.ts              Simulación explícita offline
│   └── src/style.css            Diseño responsive oscuro
├── backend/
│   ├── app/main.py              API FastAPI (health, run, ollama, dashboard)
│   ├── app/schemas.py           Contratos y validación Pydantic
│   ├── app/config.py            Configuración segura por .env
│   ├── app/data.py              Dataset sintético y perfiles
│   ├── app/model.py             ML real con LogisticRegression y PSI
│   ├── app/engine.py            Script, pipeline y reparación segura
│   ├── app/agent.py             Tool Calling real contra Ollama
│   ├── app/service.py           HITL y ejecución auditable
│   ├── app/storage.py           SQLite: historial de ejecuciones
│   ├── app/prefect_workflow.py   Ejemplo real opcional de Prefect 3
│   ├── requirements.txt        Dependencias principales
│   ├── requirements-mlops.txt  Opcionales Prefect + MLflow
│   └── tests/                  Tests pytest
├── src/check_env.py            Checkpoint: prueba de Python/contenedor
├── data/ config/ notebooks/    Estructura oficial de la unidad
├── Dockerfile                  Python 3.11 reproducible
├── .devcontainer/              Configuración VS Code
├── scripts/                    Arranque e instalación PowerShell
├── docs/                       Guías, código y clase docente
└── .github/workflows/ci.yml    Pytest + npm ci/build y quality gate
```

## 5. Escenarios y comportamientos

| Incidente | Script | Pipeline | Agente |
|---|---|---|---|
| Operación normal | Predice sin controles | Valida, predice y registra PSI | Diagnostica sin cambios |
| Cambio de esquema | KeyError | Bloquea y explica | Propone alias; requiere aprobación |
| Valores nulos | Falla | Bloquea | Propone imputación; requiere aprobación |
| API HTTP 503 | Falla | Simula tres intentos con backoff corto | Evalúa la recuperación |
| Data drift | No advierte | Calcula PSI y alerta | Propone investigación, NO reentrena solo |
| Duplicados | Predice repetidos | Bloquea por calidad | Propone deduplicar; requiere aprobación |

**Transparencia pedagógica:** el backend realiza **inferencia real** con Scikit-learn y PSI real sobre datos sintéticos; la API intermitente es un fallo **inyectado**, no un proveedor externo real. El agente LLM usa herramientas de solo lectura. La implementación avanzada de Prefect se incluye como ejemplo ejecutable independiente; las ejecuciones estándar de `/api/run` usan un pipeline Python instrumentado, no invocan Prefect. MLflow es opcional al reentrenar la línea base.

## 6. Prefect / MLflow (extensión avanzada)

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-mlops.txt
.\.venv\Scripts\python.exe -m backend.app.prefect_workflow
powershell -ExecutionPolicy Bypass -File .\scripts\entrenar.ps1 -Mlflow
```

Para entrenar solo el baseline:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\entrenar.ps1
```

## 7. Validaciones y evidencia de la Unidad 1

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\tests.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\docker-check.ps1
```

Con Docker Desktop en funcionamiento, `docker-check.ps1` construye el contenedor y ejecuta `src/check_env.py` en su interior. Abrí VS Code con extensión Dev Containers, elegí **Reopen in Container**, y capturá el explorador de archivos, el contenido de Dockerfile / devcontainer.json y el terminal con `python src/check_env.py`. Es la evidencia que pide el checkpoint, no la captura del agente.

## 8. Deploy a Cloudflare Pages desde GitHub

1. Crear un repositorio vacío GitHub (ej. `AI-DATAOPS-GUARDIAN`) y subir **el contenido de esta carpeta**. Desde la raíz:

```powershell
git init
git add .
git commit -m "AI DataOps Guardian v0.1"
git branch -M main
git remote add origin "https://github.com/TU_USUARIO/AI-DATAOPS-GUARDIAN.git"
git push -u origin main
```
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → importar repositorio GitHub.
3. Configurar **Root directory / Path** como `frontend` (monorepo).
4. **Framework preset**: `Vite` o `React (Vite)`.
5. **Build command**: `npm run build`.
6. **Build output directory**: `dist` (relativo a `frontend`).
7. **Production branch**: `main`.
8. No configurar `VITE_API_URL` ni API keys. La web se publica en modo demo, sin conectar a la computadora del docente.

Recomendación: si luego querés ejecutar la API desde el sitio en Internet, diseñaremos una capa específica de acceso autenticado (ej. Cloudflare Access + Tunnel), con controles de abuso. **No** es parte de esta versión y no se recomienda exponer Ollama ni FastAPI directamente.

## 9. Documentación

- `docs/GUIA_DOCENTE.md`: secuencia pedagógica y actividades.
- `docs/BLOQUES_DE_CODIGO.md`: extractos comentados de los componentes clave.
- `docs/CODIGO_COMPLETO.md`: referencia autocontenida de todos los archivos de código.
- `notebooks/01_churn_laboratorio.ipynb`: ejercicios Python paso a paso.

## Licencia y datos

Los datos son sintéticos, reproducibles y creados exclusivamente para esta demostración. El proyecto no contiene credenciales. No subas `.env`, datasets reales, artefactos `*.joblib` o `*.sqlite3`.
