# 01 · Instalación en tu PC — Windows 11 y PowerShell

## Qué necesitás realmente

- Windows 11, PowerShell, VS Code.
- Python 3.11 (recomendado por la clase), `py -3.11 --version`.
- Node.js 22 y npm, `node -v` y `npm -v`.
- Git, `git --version`.
- Ollama, instalado como app Windows; `ollama --version`.
- Cloudflare `cloudflared` sólo para LIVE remoto.
- Internet para descargar paquetes, publicar React y conectar Cloudflare.
- Unos GB libres para el modelo local y suficiente RAM; Llama 3 en CPU puede responder lentamente.

**No necesitás GPU ni pagar un proveedor LLM;** el tiempo de respuesta depende de tu hardware.

## Extraer el kit

Descargá el ZIP, extraelo en una carpeta de trabajo, por ejemplo:

```powershell
$raiz = "$env:USERPROFILE\Documents\Repos\AI-DataOps-Guardian"
cd $raiz
Get-ChildItem
```

Confirmá que aparecen `frontend`, `backend`, `scripts`, `README.md`.
Si los archivos están dentro de una subcarpeta `AI_DataOps_Guardian`, entrá allí.

## Instalar dependencias

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
```

Esto crea `.venv`, descarga paquetes Python y npm, genera `frontend/package-lock.json`,
y crea `.env` con una clave privada aleatoria para el laboratorio.
No sobrescribe una clave existente.

## Ollama

```powershell
ollama list
ollama pull llama3.1:8b
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Si `ollama list` responde, normalmente Ollama ya está ejecutándose. Si no responde,
iniciá Ollama desde el menú Inicio o `ollama serve` en otra ventana. No ejecutes
`ollama serve` dos veces si el puerto 11434 ya está ocupado.
Si tu modelo es `llama3:8b` u otro, modificá **únicamente** `OLLAMA_MODEL` en `.env`.

## Iniciar laboratorio completo local

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-todo.ps1
```

Abre dos ventanas: API en `http://127.0.0.1:8000/api/health` y React en
`http://127.0.0.1:5173`. Para diagnóstico:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verificar-sistema.ps1
```

Abrí React, elegí **LIVE**. En otra terminal ejecutá:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\mostrar-clave.ps1 -Copiar
```

Pegá la clave (Ctrl+V) en la sección LIVE y presioná **Conectar LIVE**.
No proyectes el secreto durante la clase; si lo compartís con alumnos, usá una
clave específica para clase y rotala luego.

## Arranque para clase presencial/remota

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-modo-live.ps1
```

La ventana del backend debe quedar abierta. Confirmá Ollama y que cloudflared esté activo.
Si creaste un túnel permanente como servicio, verificá `Get-Service cloudflared`.
Con Quick Tunnel, abrí además `scripts/iniciar-tunel-temporal.ps1`.

## Calidad de código

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tests.ps1
```

Valida Pytest, Pages proxy y build React. Si npm falla o `package-lock.json` no existe,
repetí `scripts/instalar.ps1` con conexión a Internet. Docker y Dev Containers se
pueden probar después para el checkpoint del módulo.
