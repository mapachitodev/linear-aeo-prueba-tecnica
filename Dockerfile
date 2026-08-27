# syntax=docker/dockerfile:1

# ---- Stage 1: build the React/Vite frontend -------------------------------
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: Python backend, serving the built frontend as static files --
FROM python:3.11-slim AS backend
WORKDIR /app

# curl is only needed for the container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY pytest.ini ./
COPY --from=frontend-build /frontend/dist ./static

ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
