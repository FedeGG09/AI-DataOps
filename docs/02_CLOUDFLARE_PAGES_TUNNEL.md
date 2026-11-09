# 02 · Conectar Cloudflare Pages con FastAPI + Ollama en tu PC

La conexión segura usa estas rutas:

```text
ESTUDIANTE EN NAVEGADOR
  |
  | HTTPS: https://TU-PROYECTO.pages.dev
  v
CLOUDFLARE PAGES  (React estático)
  |
  | HTTPS same-origin /api/*; X-Guardian-Key introducida por docente
  v
PAGES FUNCTION  (valida rutas y métodos; secretos Access en servidor)
  |
  | HTTPS + CF-Access-Client-Id + CF-Access-Client-Secret
  v
CLOUDFLARE ACCESS  (Service Auth, en la ruta permanente)
  |
  v
CLOUDFLARE TUNNEL  (saliente desde PC, sin abrir puertos)
  |
  v
FASTAPI 127.0.0.1:8000  (verifica X-Guardian-Key)
  |
  v
OLLAMA 127.0.0.1:11434 / PANDAS / SCIKIT-LEARN / SQLITE
```

**Clave conceptual:** Pages aloja el frontend Y una función proxy, pero NO aloja Ollama.

## Paso previo: repo GitHub y Pages

Repo: https://github.com/FedeGG09/AI-DataOps-Guardian

En Cloudflare Workers & Pages → Pages → conectar GitHub (o usar el proyecto existente):

- Root directory: `frontend`
- Framework preset: React / Vite
- Build: `npm run build`
- Output: `dist`
- Production branch: `main`

El archivo `frontend/functions/api/[[path]].js` se publica automáticamente como
Pages Function por la integración Git (la carpeta `functions` va a nivel raíz
del proyecto Pages: aquí es `frontend/functions`, no `frontend/dist/functions`).
`frontend/public/_routes.json` limita su ejecución a `/api/*`.

El modo DEMO funciona sin variables. El modo LIVE muestra error 503 controlado si todavía no hay conexión.

## OPCIÓN A: sin dominio, Quick Tunnel temporal

Es útil para la PRIMERA DEMOSTRACIÓN; no es un servicio estable ni productivo.

1. Descargá e instalá `cloudflared` desde Cloudflare; `cloudflared --version`.
2. Ejecutá `scripts/iniciar-modo-live.ps1` para arrancar FastAPI; verificá la clave.
3. En otra ventana:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-tunel-temporal.ps1
```

4. La consola informa una URL temporal del tipo `https://xxxxx.trycloudflare.com`.
5. Cloudflare Dashboard → Workers & Pages → tu proyecto Pages → Settings → Variables and Secrets.
   En **Production**, agregá:

```text
GUARDIAN_API_ORIGIN = https://xxxxx.trycloudflare.com
GUARDIAN_ALLOW_UNPROTECTED_ORIGIN = 1
```

No configures `GUARDIAN_ACCESS_CLIENT_ID` ni `GUARDIAN_ACCESS_CLIENT_SECRET` en esta modalidad.
6. Guardá variables y desplegá de nuevo Pages para aplicar los bindings (retry deployment
   o nuevo push de un commit sin cambios funcionales).
7. Abrí `https://TU-PROYECTO.pages.dev` → LIVE → pegá la clave del `.env` → Conectar.

**Limitaciones:** Quick Tunnel cambia URL cuando se reinicia, cualquiera puede intentar
acceder al túnel, no tiene garantías de producción; FastAPI exige una clave aleatoria
que el navegador no recibe del build. No utilices datos de clientes reales.

## OPCIÓN B (RECOMENDADA): dominio propio + túnel permanente + Cloudflare Access

Requiere un dominio incorporado a tu cuenta de Cloudflare; `pages.dev` por sí solo
no permite asignar un hostname estable al túnel.

1. Cloudflare Zero Trust → Networking → Tunnels → Create Tunnel.
2. Nombre `ai-dataops-guardian-local`, conector `cloudflared`.
3. Agregá ruta Published application:
   - Hostname `guardian-api.TU_DOMINIO.COM`
   - Service URL `http://127.0.0.1:8000`
4. Instalá y ejecutá el conector en Windows, idealmente como servicio:
   - Usá el comando de instalación exacto que Cloudflare te muestra,
     o abrí PowerShell como Administrador y ejecutá:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar-tunel-servicio.ps1
Get-Service cloudflared
```

5. En Zero Trust → Access controls → Service credentials → Service Tokens,
   creá un token llamado `guardian-pages-proxy`.
6. Zero Trust → Access controls → Applications → Add application → Self-hosted.
   Protegé el hostname `guardian-api.TU_DOMINIO.COM`. Agregá política
   **Service Auth**, que incluya SOLAMENTE el token `guardian-pages-proxy`.
   No crees una política Allow Everybody para esta API.
7. En Pages → Settings → Variables and Secrets, configurá en Production:

```text
GUARDIAN_API_ORIGIN = https://guardian-api.TU_DOMINIO.COM
GUARDIAN_ACCESS_CLIENT_ID = <Client ID del service token>       (Encrypt)
GUARDIAN_ACCESS_CLIENT_SECRET = <Client Secret>                  (Encrypt)
```

Dejá `GUARDIAN_ALLOW_UNPROTECTED_ORIGIN` AUSENTE. No coloques la clave local de
FastAPI en el dashboard; se introduce en LIVE en el navegador.

8. Guardá la configuración y redistribuí Pages. Verificá que el túnel figure Healthy.
9. Desde el navegador remoto, elegí LIVE e ingresá la clave de `.env`.
10. Comprobá desde tu PC sin imprimir la clave:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verificar-sistema.ps1 -PagesUrl 'https://TU-PROYECTO.pages.dev'
```

### Observación importante sobre seguridad

Cloudflare Access autentica la Pages Function como **servicio**, no a cada estudiante.
El segundo control es `GUARDIAN_API_KEY` (valor secreto compartido de laboratorio).
Para un curso con muchos alumnos o datos sensibles, agregar autenticación individual,
límites de concurrencia/rate limit, autorizaciones por rol y cuotas antes de habilitar LIVE.

## Si falla

| Mensaje | Motivo común | Solución |
|---|---|---|
| 503: falta GUARDIAN_API_ORIGIN | Pages todavía no tiene variables | Settings → Variables and Secrets → Redeploy |
| 503: configurá Access | No hay service token ni Quick opt-in | Completar Access o Quick modo pruebas |
| 401: clave inválida | Clave mal pegada o cambiada | `mostrar-clave.ps1 -Copiar`, volver a conectar |
| 502: no se puede alcanzar backend | PC dormida, túnel apagado, endpoint erróneo | Iniciar FastAPI, Ollama, revisar Tunnel Healthy |
| 502: contenido no JSON | Cloudflare Access devuelve login HTML | Revisar Service Auth y los bindings de Pages |
| DEMO funciona pero LIVE no | LIVE necesita toda la cadena | Verificar local → túnel → Pages → clave |
| La URL Quick cambió | Cada ejecución crea otro hostname | Actualizar variable Pages y desplegar de nuevo |
| API muy lenta | LLM en CPU y alumnos concurrentes | Limitar usuarios, turnos y MAX_AGENT_STEPS |

## Fuentes oficiales

- https://developers.cloudflare.com/tunnel/get-started/
- https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
