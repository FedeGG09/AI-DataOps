# Guía docente · Unidad 1 — AI DataOps Guardian

## Propósito

Comparar tres sistemas ante los mismos incidentes:

1. Un **script rígido** con lógica fija; su función es mostrar limitaciones.
2. Un **pipeline validado** que captura fallos e informa causas sin LLM.
3. Un **agente** con herramientas reales de lectura y propuestas que requieren aprobación humana.

**No presentar el pipeline Python como si fuera Prefect**: Prefect 3 está instalado opcionalmente y su ejemplo ejecutable está en `backend/app/prefect_workflow.py`. MLflow también es opcional. La demo pública nunca ejecuta herramientas reales.

## Sugerencia de clase de 90 minutos (módulo de automatización)

| Minutos | Objetivo | Acción | Pregunta a estudiantes |
|---|---|---|---|
| 0–10 | Presentar problema | Dataset sintético churn, variables y predicción | ¿Qué hace un DS después de entrenar? |
| 10–25 | Script rígido | Ejecutar `schema_change` en modo script | ¿Por qué un renombre rompe todo? |
| 25–40 | Calidad de datos | `null_values` y `duplicates` en modo pipeline | ¿Quién decide si se imputa? |
| 40–55 | Resiliencia | `api_failure` y tres reintentos | ¿Qué falla se debe reintentar? |
| 55–70 | Agentic Workflow | `schema_change` en agente con Ollama | ¿Qué herramientas consultó? |
| 70–80 | Human-in-the-loop | Aprobar corrección y revalidar | ¿Qué riesgo hay en dar permisos ilimitados? |
| 80–90 | Reproducibilidad | Dockerfile, .env, check_env.py | ¿Qué evidencia exige el checkpoint? |

## Extensión de 30 minutos: CI/CD real en la nube

**Preparación**: tener el repositorio publicado, Cloudflare Pages conectado al mismo repo y `main` protegido con el status check `Guardian / quality gate`. Consultar `docs/CI_CD_EN_VIVO.md`.

| Minutos | Objetivo | Evidencia en vivo |
|---|---|---|
| 0–5 | Cambiar React en VS Code | Hot reload local |
| 5–10 | Git: rama, commit, push | Historial de commits |
| 10–18 | CI y preview | Tests GitHub Actions + preview Cloudflare |
| 18–23 | Pull Request y merge | Guardrail antes de producción |
| 23–30 | Error TypeScript intencional | CI rojo, bloqueo de merge, corrección |

**Importante**: CI en Actions prueba el repositorio, Cloudflare Pages despliega el frontend. Ni MLflow ni el modelo ni Ollama están siendo desplegados por ese proceso.

## Comandos del docente

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-todo.ps1
ollama list
```

Visitar `http://127.0.0.1:5173`, seleccionar **Local**, verificar conectividad, ejecutar.

## Experimentos sugeridos

### Incidente 1 — Cambio de esquema

- Script: error por columna que no existe.
- Pipeline: bloquea explícitamente antes de inferir.
- Agente: consulta herramientas y sugiere renombre de columna; no lo ejecuta sin aprobación.
- Aprobar y repetir: el programa aplica solo el alias autorizado, revalida y predice.

### Incidente 2 — API 503 intermitente

- Script: falla inmediatamente.
- Pipeline: simula un servicio que falla dos veces y responde a la tercera, con una espera didáctica corta.
- Discusión: no todo error se reintenta; los fallos de esquema se corrigen, no se reintentan.

### Incidente 3 — Data Drift

- Script: predice y no informa cambios.
- Pipeline: calcula PSI respecto al entrenamiento, advierte y conserva artefactos.
- Agente: explica por qué drift no garantiza caída de desempeño; para medir model drift hacen falta etiquetas reales.

## Objetivos de aprendizaje por artefacto

| Concepto | Archivo | Evidencia |
|---|---|---|
| Reproducibilidad | Dockerfile, .devcontainer/devcontainer.json | `docker-check.ps1` |
| Variables de entorno | .env.example, backend/app/config.py | Sin credenciales hardcodeadas |
| Script vs. pipeline | backend/app/engine.py | Cambios de estado |
| Calidad de datos | backend/app/data.py y engine.py | Nulls, duplicados, alias |
| Predicción real | backend/app/model.py | LogisticRegression entrenada |
| MLOps | backend/app/model.py | PSI, opcional MLflow |
| Orquestación | backend/app/prefect_workflow.py | Flow/task opcional |
| Tool calling real | backend/app/agent.py | Trazas del agente |
| Human-in-the-loop | backend/app/service.py | Propuesta y aprobación |
| Auditoría | backend/app/storage.py | SQLite |
| Interfaz | frontend/src/App.tsx | Experimentos interactivos |
| Git + GitHub Actions | .github/workflows/ci.yml | Tests Python y build React |
| CD de frontend | frontend/vite.config.ts, frontend/.node-version | SHA y rama publicados en Cloudflare |

## Evaluación formativa

Proponer a cada grupo: un incidente nuevo, explicar qué rompe un script, cómo se valida sin IA, qué herramienta agregaría al agente y qué acciones requieren aprobación. La entrega oficial de esta primera unidad **no exige implementar un agente**, solo el ambiente reproducible y su evidencia en PDF.

## Seguridad de demostración

- Backend de desarrollo con `--host 127.0.0.1`; Ollama permanece en la PC.
- No conectar un Cloudflare Pages público al backend local sin autenticación perimetral.
- Herramientas disponibles solo lectura; remediaciones limitadas a nombres preaprobados.
- No subir `.env`, modelos locales, SQLite ni registros reales al repositorio.
- Cuando el modelo no responde, la aplicación distingue entre respuesta LLM y reglas.

## Limitaciones explícitas de v0.2.0

- Los incidentes usan datos y fallos sintéticos.
- El pipeline de la API es Python instrumentado; el flow Prefect está separado como demostración opcional.
- Existe CI/CD del frontend React hacia Cloudflare Pages, **pero no** despliegue real del modelo de ML ni control de versiones de datasets.
- El PSI demuestra un cambio de distribución, no pérdida de accuracy.
- Sin observabilidad distribuida ni herramientas de trazas de LLM (se puede añadir LangSmith posteriormente).
- En Cloudflare se ejecuta una simulación Javascript, no API local.

## Próximas iteraciones

1. Integrar **Prefect** directamente al backend, con flujo por tarea e historial centralizado.
2. Seguimiento y comparación champion/challenger con MLflow.
3. Calidad avanzada de datos, contratos con Pandera / Great Expectations.
4. Historial de decisiones de herramientas y límites por usuario.
5. Autenticación y canal seguro si se necesita una demo remota real.
