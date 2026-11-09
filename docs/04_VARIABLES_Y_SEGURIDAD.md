# 04 · Variables de entorno y defensa por capas

## Variables LOCAL: archivo `.env` en la raíz (nunca se publica)

| Variable | Ejemplo | Uso |
|---|---|---|
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama escucha sólo en la PC |
| `OLLAMA_MODEL` | `llama3.1:8b` | Etiqueta exacta de `ollama list` |
| `MAX_AGENT_STEPS` | `3` | Límite estricto de pasos del agente (máx. 6) |
| `GUARDIAN_API_KEY` | **Generada por instalar.ps1** | Autorización backend obligatoria; mantener secreta |
| `GUARDIAN_ENABLE_DOCS` | `0` | Desactiva Swagger/OpenAPI al exponer el túnel |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS sólo en desarrollo; Cloudflare usa same-origin |
| `MLFLOW_TRACKING_URI` | vacío/opcional | MLflow local opcional |
| `OPENAI_API_KEY`, `DATABASE_URL` | vacío | Reservadas para otras unidades; no requeridas |

**No llenar variables de acceso externo en el .env local de Ollama.**

## Variables CLOUDFLARE PAGES: Settings → Variables and Secrets

### Permanente, recomendado

| Variable | Tipo | Valor |
|---|---|---|
| `GUARDIAN_API_ORIGIN` | Texto | `https://guardian-api.TU_DOMINIO.COM` |
| `GUARDIAN_ACCESS_CLIENT_ID` | **Secret (Encrypt)** | Client ID de token Cloudflare Access |
| `GUARDIAN_ACCESS_CLIENT_SECRET` | **Secret (Encrypt)** | Client Secret de token Cloudflare Access |

### Quick Tunnel de pruebas (sin dominio)

| Variable | Tipo | Valor |
|---|---|---|
| `GUARDIAN_API_ORIGIN` | Texto | `https://xxxxx.trycloudflare.com` |
| `GUARDIAN_ALLOW_UNPROTECTED_ORIGIN` | Texto | `1` |

No definir credenciales de Access en Quick Tunnel. Nunca usar Quick para datos de clientes.

## Qué nunca poner en el repositorio ni el frontend

- `.env` (la clave local) o variables `VITE_GUARDIAN_API_KEY`.
- Token del túnel remoto; credenciales del servicio cloudflared.
- Client secret de Access.
- Archivos `.sqlite3` de alumnos, clientes reales, modelos serializados o logs.

## Controles implementados

- Todas las rutas `/api/...` del backend requieren `X-Guardian-Key`.
- Sin clave local de longitud adecuada, FastAPI responde 503 (fail closed).
- La Pages Function permite sólo cinco endpoints conocidos, con métodos limitados.
- No reenvía cabeceras arbitrarias del navegador ni cookies.
- Sin service token de Access, la Function NO accede a un dominio permanente.
- La excepción Quick Tunnel debe habilitarse explícitamente y sólo permite `*.trycloudflare.com`.
- La UI sólo guarda la clave en `sessionStorage`, no en el build.
- Ollama está en `127.0.0.1:11434`, sin publicación ni herramientas destructivas.
- Respuestas de la API con `Cache-Control: no-store`.

## Límites y mejoras antes de un curso masivo

- La clave del laboratorio es compartida: si se filtra, cualquiera con ese valor puede
  usar el endpoint. Rotar con `scripts/generar-clave.ps1 -Rotar` e iniciar de nuevo la API.
- No se implementó rate limiting centralizado, identidad por alumno, auditoría por persona,
  colas por usuario ni presupuestos por modelo. Añadirlos antes de acceso abierto.
- Evitar usar datos privados en prompts o trazas: los logs del agente son inspeccionables.
- En la primera clase, preferir acceso sólo del docente y DEMO para estudiantes.
