# Entorno reproducible del checkpoint de la Unidad 1.
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /workspace
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY backend/ ./backend/
COPY src/ ./src/
COPY .env.example ./.env.example
# Verificación pedida en la preentrega, sin backend expuesto por defecto.
CMD ["python", "src/check_env.py"]
