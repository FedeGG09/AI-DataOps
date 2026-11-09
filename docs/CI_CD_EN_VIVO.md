# Unidad 1: CI/CD real con React + GitHub + Cloudflare Pages

## 0. Objetivos de aprendizaje

- **Git**: registrar un cambio local mediante commit, rama y push.
- **CI**: correr pruebas Python y compilación de React en un runner de GitHub Actions.
- **CD**: publicar automáticamente el frontend después de incorporar cambios a `main`.
- **Previo a producción**: usar preview URLs por rama/PR.
- **Trazabilidad**: identificar en el navegador el commit/branch concretos que generaron la publicación.
- **Seguridad**: mantener backend FastAPI, Ollama y secretos estrictamente locales.

**Distinción clave**: Cloudflare Pages (Git integration) construye y publica de forma independiente de GitHub Actions. El preview puede generarse aunque la CI haya fallado. La promoción a `main` se controla con protección de rama y checks requeridos. Nunca hacer direct push a main tras activar la protección.

## 1. Arquitectura

```text
VS Code (Windows)                   GitHub                        Cloudflare Pages
  frontend/src/App.tsx       -->  rama demo/cambio-en-vivo -->   URL preview
  backend/tests/             -->  Pull Request            -->   Preview update
                                 | 
                                 +--> Actions: pytest y npm ci + build
                                 +--> quality gate
                                      |
                                      +--> Merge a main --> despliegue producción
                                                                    |
                                                     panel React / CI/CD en vivo
                                                     branch=main, sha del commit

      En paralelo: backend Python + Ollama locales, NO desplegados en Pages
```

## 2. Preparar la máquina (una vez)

Instalar Git, Node.js 22+, Python 3.11+ y VS Code. Desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\tests.ps1
```

`instalar.ps1` genera `frontend/package-lock.json` si todavía no existe. **Este lockfile debe subirse a Git**. En CI usamos `npm ci`, que respeta las versiones exactas de lockfile y falla si no está alineado con `package.json`.

Configurar Git una vez:

```powershell
git config --global user.name "Tu nombre"
git config --global user.email "tu-correo@example.com"
git --version
```

Autenticarse en GitHub con Git Credential Manager o `gh auth login`. No guardar tokens en el repositorio.

## 3. Crear el repositorio y hacer push inicial

Primero, desde github.com/new crear un repo **vacío**: `AI-DataOps-Guardian` (sin README, .gitignore ni licencia autogenerados). Usar tu propio usuario real en la URL.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\git-inicializar.ps1 -RemoteUrl "https://github.com/TU_USUARIO/AI-DataOps-Guardian.git"
```

El script verifica que existe el lockfile, revisa que `.env` no esté staged, crea commit en `main` y hace `git push`. Si el proyecto ya está bajo Git, NO usar `git-inicializar.ps1`; configurar el remote manualmente y hacer push de los cambios.

```powershell
git remote -v
git log --oneline -5
git status
```

## 4. Conectar Cloudflare Pages a GitHub (una sola vez)

Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git → elegir el repositorio GitHub. Configuración del proyecto:

| Campo | Valor |
|---|---|
| Framework preset | React / Vite |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Environment variables | Ninguna API key / no Ollama |
| Versión de Node | `frontend/.node-version` fija Node 22.23.4 |

El deploy resultante es una web pública en modo DEMO, sin conectar al backend Python. `frontend/public/_redirects` habilita fallback para SPA. En el panel «CI/CD en vivo» se muestran commit, rama, plataforma y versión, inyectados en la compilación con `CF_PAGES_COMMIT_SHA`, `CF_PAGES_BRANCH` y `CF_PAGES`.

Cloudflare Pages puede desplegar una rama preview antes de conocer el resultado de Actions: esto es normal. **No representa CI aprobada**.

## 5. Activar protección de main (clave para CI/CD)

En GitHub, Settings → Branches → Add branch protection rule (o Rules → Rulesets):

- Patrón `main`.
- «Require a pull request before merging» (se puede activar sin exigir una aprobación de otra persona en un repo docente individual).
- «Require status checks to pass before merging» y seleccionar **Guardian / quality gate** (aparece después de la primera ejecución de Actions).
- Restringir los pushes directos a `main`; aplicar también a administradores si lo permite la configuración.

En un repositorio público GitHub Free suele permitir proteger ramas; revisar las políticas según el plan del propietario y la visibilidad del repo. Si la protección no está disponible, **no** afirmar que CI bloquea de verdad producción.

## 6. Demo 1: cambiar React en vivo y pasar CI

**A.** Crear rama:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-cicd.ps1 -Accion crear-rama
```

**B.** En VS Code abrir `frontend/src/App.tsx`, cambiar el texto del subtítulo principal (buscar `De scripts rígidos a sistemas`) por algo visible como `Diplomatura AI Automation — edición en vivo`. No cambiar backend ni el LLM.

**C.** Ver en local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-frontend.ps1
```

Abrir `http://127.0.0.1:5173`; Vite hace hot reload. El panel CI/CD en local dirá «Desarrollo local» (no falsificar el SHA local).

**D.** Verificar, commitear y publicar rama:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci-push.ps1 -Mensaje "feat: edición visual en clase"
```

**E.** En GitHub, crear Pull Request `demo/cambio-en-vivo → main` y abrir pestaña Actions: deben aparecer `Python / pytest`, `React / build`, `Guardian / quality gate`. En Cloudflare debe aparecer un preview de la rama. El orden en que terminan Cloudflare y Actions no está garantizado.

**F.** Con los checks verdes y la protección activa, fusionar el PR desde GitHub. Abrir sitio de producción Cloudflare, ir a «CI/CD en vivo» y comprobar `branch=main`, commit SHA de merge y nueva pantalla. Nota: el SHA de un merge puede ser distinto del commit original de la rama.

## 7. Demo 2: provocar un error real en CI (sin romper producción)

Usar **otra rama** creada desde main. Si `demo/cambio-en-vivo` ya existe, crear una nueva:

```powershell
git switch main
git pull --ff-only origin main
git switch -c demo/ci-rojo
```

Introducir un error deliberado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-cicd.ps1 -Accion romper-build
```

Este script crea `frontend/src/demo_ci_error.ts` con `export const demoIncorrecto: number = "ERROR..."`. TypeScript detecta la incompatibilidad.

Enviar sin ejecutar validación local (exclusivamente para demostrar CI fallida):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci-push.ps1 -Mensaje "test: demostrar check CI rojo" -PermitirFallos
```

Crear un PR `demo/ci-rojo → main`. Ver que `React / build` falla y `Guardian / quality gate` aparece en rojo; **no fusionar**. Cloudflare Preview podría no compilar, pero producción sigue con la versión anterior.

Corregir:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-cicd.ps1 -Accion reparar-build
powershell -ExecutionPolicy Bypass -File .\scripts\ci-push.ps1 -Mensaje "fix: corregir error de TypeScript"
```

En GitHub verificar que el PR cambia a verde. Dejarlo sin merge o fusionarlo si querés demostrar recuperación.

## 8. ¿Por qué no usamos un deploy action a Cloudflare?

Porque Cloudflare Pages ya hace el CD al conectarse al repo Git: **no duplicar un deploy paralelo desde Actions**, ya que originaría builds/destinos distintos y exigiría guardar tokens de Cloudflare. Si en el futuro se requiere que ni los previews se publiquen antes de un check exitoso, habría que cambiar de arquitectura a despliegue controlado por GitHub Actions/Cloudflare API, con tokens y entornos protegidos.

## 9. Checklist docente

- [ ] `git status` limpio y `frontend/package-lock.json` commiteado
- [ ] Repo GitHub accesible y Actions habilitado
- [ ] Cloudflare Pages conectado a GitHub con root `frontend`
- [ ] `main` configurada como rama de producción
- [ ] Rama protegida con check `Guardian / quality gate`
- [ ] Prueba de commit válido → CI verde y preview → merge → producción
- [ ] Prueba de TypeScript inválido → CI rojo → merge bloqueado
- [ ] Frontend público en modo demo y Python/Ollama exclusivamente locales

## 10. Conceptos para explicar en clase

**Git no es CI**: Git guarda historial; GitHub Actions hace pruebas automáticas.

**CI no es CD**: CI valida; Cloudflare automatiza la compilación/publicación del frontend.

**Lockfile**: registra la resolución de dependencias para instalar de forma repetible.

**Branch / Pull Request / Preview**: colaboración y prueba antes de modificar producción.

**Protected main**: política que bloquea merges cuando los controles requeridos fallan.

**Build SHA**: evidencia técnica de qué versión se está viendo en el navegador.

**Separación de ambientes**: el deploy web demuestra CD frontend, NO despliegue del modelo de ML ni de Ollama.
