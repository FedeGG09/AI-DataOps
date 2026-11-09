# 05 · Subir v0.3 a GitHub y actualizar Cloudflare Pages

El repositorio de la clase es:
https://github.com/FedeGG09/AI-DataOps-Guardian

**Importante:** ese repo ya tiene contenido. NO hagas `git init` ni `push --force` sobre él.

## Forma recomendada: actualizar tu clon local existente

1. Abrí PowerShell en la carpeta con el `.git` del proyecto actual.
2. Guardá o commiteá cambios propios si los tenés.
3. Actualizá tu copia:

```powershell
git switch main
git pull --ff-only origin main
git status
```

4. Descomprimí el ZIP v0.3 en otra carpeta temporal.
5. Para copiar el kit sin sobreescribir `.env` ni la carpeta `.git`, ejecutá
   **DESDE EL KIT EXTRAÍDO**:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\copiar-kit-a-repo.ps1 -Repositorio "$env:USERPROFILE\Documents\Repos\AI-DataOps-Guardian"
```

   El script comprueba que el repositorio esté limpio, actualiza `main` y copia
   el código. Después entrá en el clon para instalar y publicar.
6. En la raíz del clon, actualizá dependencias y validá:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\tests.ps1
```

7. Revisá exactamente lo que Git va a subir:

```powershell
git status --short
git check-ignore .env
git add -A
git status --short
git diff --cached --stat
git diff --cached --name-only
```

Si `.env`, `.dev.vars`, secretos o tokens aparecen en staging, **NO HAGAS COMMIT**.

8. Publicá:

```powershell
git commit -m "feat: Guardian v0.3 Pages Tunnel y Ollama LIVE"
git push origin main
```

También podés usar `scripts/publicar-v03.ps1` después de actualizar el clon,
instalar y ejecutar pruebas. Ese script verifica origen, rama, lockfile y secretos.

## Qué ocurre tras el push

GitHub Actions inicia sus trabajos:

- `Python / pytest` (tests de Data Science, HITL y seguridad)
- `React / build` (incluye el proxy con `node --test` y `npm ci`)
- `Guardian / quality gate`

La integración GitHub de Cloudflare Pages construye `frontend/` y publica
React + Pages Functions; NO publica el backend ni Ollama.

## Cloudflare Pages para este monorepo

| Campo | Valor |
|---|---|
| Repositorio | `FedeGG09/AI-DataOps-Guardian` |
| Production branch | `main` |
| Root directory | `frontend` |
| Framework | React / Vite |
| Build command | `npm run build` |
| Build output | `dist` |
| Node | v22 según `.node-version` |

Si ya existe un proyecto Pages vinculado al repositorio, NO hace falta crearlo
de nuevo: un push a `main` dispara otra publicación.

**Comprobación:** abrí la pantalla CI/CD de Guardian, compará rama y SHA con
GitHub Actions y verificá el estado de Pages. Después configurarás los bindings
del túnel descritos en el documento 02 y volverás a desplegar Pages.

## Ejercicio CI/CD en vivo

```powershell
git switch -c demo/live-v03
# Cambiar un texto de frontend/src/App.tsx en VS Code
git add .
git commit -m "demo: actualizar texto de la interfaz"
git push -u origin demo/live-v03
```

Abrí PR → verificá CI → Cloudflare Preview → merge a `main` con aprobación
cuando corresponda → producción actualizada. Protegé main para impedir merges
con fallos de quality gate. Los previews de Pages se generan independientemente
de los tests de Actions.
