# AI DataOps Guardian v0.3 — laboratorio de AI Automation

**React + Cloudflare Pages (DEMO y LIVE) ↔ Pages Function ↔ Cloudflare Access ↔ Tunnel ↔ FastAPI + Ollama en Windows.**

## ¿Qué es? sd

Laboratorio didáctico de la Unidad 1 de una diplomatura de AI Automation para Data Scientists.
Enseña la transición del script Python lineal a pipelines observables y agentes que consultan
herramientas **sin delegar la autorización de acciones al LLM**. Se utilizan datos sintéticos de
clientes de suscripción para predecir churn con Scikit-learn.

Los alumnos eligen un incidente (normal, esquema cambiado, nulos, API 503 inyectada,
data drift o duplicados) y comparan tres enfoques: script, pipeline y agente Ollama.
SQLite persiste ejecuciones; los incidentes de calidad y las propuestas quedan auditados.

**No es un servicio productivo para datos sensibles.** El pipeline estándar sigue siendo
Python instrumentado; `prefect_workflow.py` y MLflow son ampliaciones opcionales de la diplomatura.

## Versiones disponibles

- **DEMO**: se ejecuta completamente en React, incluso si la PC está apagada; los resultados son ilustrativos.
- **LIVE local**: React `http://127.0.0.1:5173` usa el proxy Vite hasta FastAPI local.
- **LIVE remoto**: React en Cloudflare Pages usa `/api` same-origin; una Pages Function valida rutas
  y envía solicitudes autenticadas a un túnel de Cloudflare, que termina en FastAPI local.
  FastAPI consulta Ollama local en el puerto 11434. La clave de laboratorio se escribe en la interfaz
  y se guarda sólo en `sessionStorage` de esa pestaña.

## Instalación rápida (Windows)

Desde la raíz del proyecto en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
ollama pull llama3.1:8b
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-todo.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\mostrar-clave.ps1 -Copiar
```

En React (http://127.0.0.1:5173) elegí **LIVE**, pegá la clave y presioná **Conectar LIVE**.

Los scripts no necesitan Docker para ejecutar el laboratorio; Docker y Dev Containers son
parte de la evidencia del checkpoint oficial de la Unidad 1.

## Instalación y publicación remota

1. [Instalación de Windows](docs/01_INSTALACION_WINDOWS.md)
2. [Cloudflare Pages + Tunnel sin/con dominio](docs/02_CLOUDFLARE_PAGES_TUNNEL.md)
3. [Arquitectura, flujo docente y límites reales](docs/03_QUE_HACE_EL_PROYECTO.md)
4. [Variables y seguridad](docs/04_VARIABLES_Y_SEGURIDAD.md)
5. [Actualizar repo GitHub y CI/CD](docs/05_PUBLICAR_GITHUB_Y_CI_CD.md)
6. [Código completo de todos los archivos del kit](docs/CODIGO_COMPLETO_V03.md)

## Servicios y puertos

| Servicio | Dónde | Dirección / función |
|---|---|---|
| React/Vite | PC, opcional | http://127.0.0.1:5173 |
| FastAPI | PC, requerido en LIVE | http://127.0.0.1:8000 (loopback) |
| Ollama | PC, requerido para agente con LLM | http://127.0.0.1:11434 (loopback) |
| cloudflared | PC, requerido para LIVE remoto | conexión saliente al túnel |
| Pages Functions | Cloudflare | `/api/*` del mismo origen que React |
| Cloudflare Pages | Internet | URL propia `*.pages.dev` |

No se expone `11434` ni `8000` en el router. El backend local requiere una
`GUARDIAN_API_KEY` de 256 bits generada por el script de instalación.

## Pruebas

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\tests.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\verificar-sistema.ps1
```

Para probar LIVE remoto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verificar-sistema.ps1 -PagesUrl 'https://TU-PROYECTO.pages.dev'
```

## CI/CD

GitHub Actions valida Pytest, el proxy Cloudflare y el build React;
la integración GitHub de Pages realiza despliegues por commit.

- Repositorio: https://github.com/FedeGG09/AI-DataOps-Guardian
- Framework: React (Vite)
- Root directory: `frontend`
- Build command: `npm run build`
- Output: `dist`
- **NO colocar claves de API en variables `VITE_*`.**

**Nota:** La instalación de npm requiere acceso al registro de paquetes de Node. Si el ZIP no trae
`frontend/package-lock.json`, ejecutá `scripts/instalar.ps1` para generarlo antes del push.

<!-- Redeploy Cloudflare Pages v0.4 -->
