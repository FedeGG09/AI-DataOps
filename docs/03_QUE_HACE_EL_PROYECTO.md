# 03 · ¿Qué logramos construir con AI DataOps Guardian?

## Propósito

El proyecto demuestra cómo evolucionar una automatización desde un script rígido
hasta un sistema que valida información, conserva registros y consulta a un agente
LLM para diagnosticar incidentes, siempre con un sistema de aprobación humana.

**Caso de negocio:** una compañía de servicios por suscripción necesita predecir
qué clientes abandonarán el servicio (**churn**). Un dataset de entrenamiento
sintético alimenta un clasificador Scikit-learn. La operación diaria puede fallar
por un cambio de columna, nulos, duplicados o datos de distribución distinta.

### Incidentes del laboratorio

| Escenario | Script rígido | Pipeline | Agente Ollama |
|---|---|---|---|
| Normal | Predice | Valida y predice | Puede revisar estado |
| Esquema | Falla con KeyError | Detecta esquema erróneo | Propone alias + aprobación |
| Nulos | Falla | Detecta incompletos | Sugiere imputar + aprobación |
| API 503 | Se detiene | Reintenta fallo inyectado | Evalúa la recuperación |
| Data drift | No alerta | Calcula PSI | Consulta drift, propone investigar |
| Duplicados | Predice repetidos | Rechaza duplicados | Propone deduplicar + aprobación |

## Flujo de una ejecución real

1. El alumno abre la interfaz en su navegador y selecciona un escenario.
2. Elige `Script`, `Pipeline` o `Agente`.
3. El frontend envía un POST JSON `/api/run` con `X-Guardian-Key`.
4. FastAPI valida la clave y los parámetros con Pydantic.
5. Python genera o carga datos sintéticos; Scikit-learn predice sobre un modelo real.
6. En Pipeline, se aplican reglas de calidad y PSI y se registran eventos.
7. En Agente, Ollama puede llamar a herramientas de lectura (esquema, perfil,
   drift e historial). El LLM no ejecuta comandos Python arbitrarios.
8. Las acciones de reparación admitidas se proponen por reglas y requieren
   confirmación humana explícita; después se vuelve a validar.
9. El resultado queda registrado con ID, eventos y métricas en SQLite.
10. React muestra estado, traza y comparación didáctica.

## Relación exacta con Unidad 1

- **Script rígido vs agente:** la misma entrada problemática con tres comportamientos.
- **Tool Calling:** herramientas de análisis Python conectadas a un LLM Ollama.
- **Memoria:** estado de ejecución e historial persistido en SQLite; todavía
  no hay RAG semántico ni memoria vectorial persistente.
- **Reflexión:** verificación determinista posterior a correcciones.
- **Human-in-the-loop:** aprobación obligatoria para reparaciones admitidas.
- **MLOps:** modelo real de clasificación, métricas y PSI.
- **Orquestación:** ejemplo separado Prefect; el endpoint principal utiliza
  un pipeline Python instrumentado, NO un Prefect flow en producción.
- **CI/CD:** pruebas con GitHub Actions y despliegue del FRONTEND en Pages.
- **Reproducibilidad:** requirements, Dockerfile y Dev Containers.
- **Infraestructura híbrida:** React público, cálculo y LLM en PC local.

## Qué está implementado y qué NO

### Real

- Endpoints FastAPI ejecutados en la PC.
- Predicciones Scikit-learn sobre datos generados de forma reproducible.
- PSI real de una distribución de referencia vs datos recientes.
- Consultas a un Ollama local real, si está disponible, por HTTP.
- Validaciones, trazas y SQLite local.
- Protecciones de rutas/clave y Pages Function de redirección segura.
- Tests automatizados en GitHub Actions.

### Simulado o opcional

- El fallo de API 503 es una simulación controlada, no una API externa.
- Las curvas visuales del dashboard son ilustrativas; PSI mostrado desde backend es real.
- `prefect_workflow.py` es un ejemplo ejecutable independiente.
- MLflow se instala por separado y se utiliza opcionalmente en entrenamiento.
- No hay reentrenamiento autónomo ni reemplazo automático del modelo en producción.
- No hay identidades por estudiante ni permisos por rol; la clave LIVE es compartida.
- El modo DEMO no invoca FastAPI, Python ni Ollama.

## ¿Qué debemos mantener activo para hacer LIVE en Internet?

1. **Computadora encendida**, sin suspensión automática.
2. **Conexión a Internet estable**, especialmente de salida hacia Cloudflare.
3. **Ollama activo** con el modelo instalado y memoria suficiente.
4. **FastAPI activo** en `127.0.0.1:8000`.
5. **cloudflared activo** (servicio Windows para permanente o consola para Quick).
6. **Clave privada del laboratorio** de al menos 32 caracteres en `.env`.
7. **Pages desplegado**, con las variables y credenciales configuradas.

Si la PC se apaga, DEMO continúa disponible. LIVE deja de responder. Cloudflare
no ejecuta Llama 3 ni almacena automáticamente el dataset de la PC.

## Dinámica de clase sugerida — 60 a 90 min

- 10 min: explicación de arquitectura y APIs.
- 15 min: script vs pipeline ante cambio de esquema.
- 15 min: agente con Llama 3, tool calling y traza.
- 10 min: autorización humana + verificación de reparación.
- 10 min: data drift y límites de inferencia en CPU.
- 20 min: modificar React → push → Actions → Pages → versión publicada.

No proyectar el valor de `.env` ni el token de túnel durante la clase.
