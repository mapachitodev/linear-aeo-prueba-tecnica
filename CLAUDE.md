# CLAUDE.md — Contexto del Proyecto para Agentes de IA

> **Alcance:** Este archivo es la fuente autoritativa de contexto para Claude Code y cualquier agente de IA que opere en este repositorio. Léelo antes de realizar cualquier cambio.

---

## Descripción del Proyecto

**AEO Analytics para SearchBrand** — mide la visibilidad de *Linear* frente a *Jira / Asana / Monday / Notion* en las respuestas generadas por Gemini.

**Arquitectura:** Un único proceso unificado en producción — backend FastAPI (Python) + frontend React/Vite, servidos juntos desde un único punto de entrada.

| Recurso | Propósito |
|---|---|
| [`README.md`](README.md) | Setup local, variables de entorno y cómo ejecutar |
| [`DECISIONS.md`](DECISIONS.md) | Justificación de cada decisión arquitectónica relevante |
| [`AGENTS.md`](AGENTS.md) | Definición de los agentes especializados disponibles en el proyecto |

---

## Reglas No Negociables

Estas reglas nunca deben violarse. Si un cambio entra en conflicto con alguna de ellas, detente y comunica el conflicto explícitamente.

### 🔐 Sin secretos hardcodeados
`GEMINI_API_KEY` debe provenir **únicamente** de variables de entorno, resueltas a través de `backend/app/core/config.py → Settings`.  
Si encuentras una clave o token embebido en el código fuente: **trátalo como un incidente de seguridad** — elimínalo de inmediato, agrega el valor a `.env` (ignorado por git) y nunca lo incluyas en un archivo versionado.

### 🚫 Sin expansión de infraestructura no justificada
**No** reintroduzcas Celery, Redis, PostgreSQL ni una topología de microservicios sin una decisión explícita y documentada.  
Ese fue el diseño original del proyecto; se abandonó porque agregaba complejidad sin beneficio real a la escala actual (ver `DECISIONS.md`).  
El alcance actual — unos cientos de llamadas a Gemini por auditoría, ejecutadas bajo demanda — se resuelve correctamente con `asyncio.Semaphore` y estado en memoria. Si el producto genuinamente necesita persistencia entre reinicios o escalado horizontal multi-instancia, esa decisión se tomará de forma explícita y documentada — nunca como valor por defecto.

### 📋 Los prompts viven en un solo lugar
Las **18 preguntas calibradas** se definen exclusivamente en `backend/app/core/prompts.py`.  
Este es el único punto de verdad para todos los prompts. Los cambios deben hacerse aquí y en ningún otro lugar — ni en el frontend, ni en strings ad-hoc.

### ⚖️ Procesamiento simétrico de marcas
Todas las marcas — la marca objetivo y todos los competidores — deben pasar por el **mismo pipeline**.  
`MetricsEngine.calculate_metrics(results, brand)` se ejecuta una vez por marca sobre el mismo conjunto de datos. No existe un flujo especial para "la marca principal". No lo crees.

### 🚨 Sin datos falsos en la UI
Si una petición al backend falla, muestra el error — no sustituyas con datos fabricados.  
La única excepción válida: si el backend no cuenta con `GEMINI_API_KEY`, puede retornar una respuesta simulada **con `is_simulated: true` explícitamente presente**. En ese caso, el frontend **debe** renderizar una etiqueta de simulación visible. Nunca ocultarla.

---

## Comandos Frecuentes

```bash
# Ejecutar pruebas unitarias del backend (10 tests, sin red — usa modo simulado)
pytest

# Iniciar el servidor de desarrollo del backend
uvicorn backend.app.main:app --reload --port 8000

# Iniciar el servidor de desarrollo del frontend (redirige llamadas a :8000 — ver vite.config.ts)
npm run dev

# Compilar y ejecutar todo en un único contenedor
docker compose up --build
```

---

## Dónde Tocar Qué

- **Nueva métrica estadística** → `backend/app/services/metrics_engine.py` + su schema en `backend/app/models/schemas.py` (`BrandMetrics`).
- **Cambiar cómo se detecta una marca/rango/sentimiento en el texto** → `backend/app/services/parser.py`.
- **Nuevo endpoint** → `backend/app/api/v1/router.py`, registrar el schema en `models/schemas.py`.
- **Estado de auditorías (in-memory)** → `backend/app/services/survey_service.py`. Si esto necesita sobrevivir un reinicio del proceso, ese es el archivo a reemplazar por una capa de persistencia real.
- **Frontend** → `src/lib/api.ts` es el único lugar que conoce la forma de las URLs del backend. Los componentes no arman URLs a mano.

---

## Notas de Arquitectura

- **Estado:** En memoria, dentro del proceso. Sin almacén de estado externo. La concurrencia se controla con `asyncio.Semaphore`.
- **Concurrencia con la API:** Las llamadas a Gemini tienen rate limiting a nivel de aplicación, no mediante una cola de tareas.
- **Despliegue en un solo proceso:** En producción, el frontend se sirve como assets estáticos desde el proceso FastAPI — no hay un servidor Node.js separado.

---

## Ante la Duda

1. Consulta `DECISIONS.md` antes de introducir una nueva dependencia o patrón — puede que ya haya sido evaluada y descartada.
2. Prefiere la solución más simple que satisfaga el requisito a la escala actual.
3. Si alguna regla anterior genera un conflicto real con la tarea en curso, comunícalo explícitamente en lugar de trabajarlo en silencio.

---

## Cómo Se Construyó Este Repo

Este proyecto no arrancó en blanco: heredó dos implementaciones desconectadas entre sí y una API key de Gemini hardcodeada como valor por defecto en dos archivos, tratada como incidente de seguridad y eliminada de inmediato. A mitad de la reescritura surgió la tentación de pivotear a una arquitectura de microservicios (Postgres normalizado, Celery/Redis, Circuit Breaker) — se rechazó explícitamente porque el estado del repo en ese momento era evidencia de que ese camino ya se había intentado y no había llegado a funcionar de punta a punta, dado el plazo de entrega. El razonamiento completo está en [`DECISIONS.md`](DECISIONS.md#punto-de-partida-qué-había-y-por-qué-se-reescribió).

---

## Agentes Disponibles

Este proyecto define subagentes reales en [`.claude/agents/`](.claude/agents/) — Claude Code los
descubre automáticamente, no requieren ninguna convención manual para activarse. El porqué de cada
uno está en [`AGENTS.md`](AGENTS.md).

| Agente | Archivo | Activar cuando... |
|---|---|---|
| `frontend-designer` | [`.claude/agents/frontend-designer.md`](.claude/agents/frontend-designer.md) | Trabajás en componentes React, estilos o UX |
| `security-auditor` | [`.claude/agents/security-auditor.md`](.claude/agents/security-auditor.md) | Revisás código antes de un merge a main o hacés un release |

Se invocan pidiéndoselo a Claude Code en lenguaje natural (p. ej. *"usá el agente security-auditor
antes de mergear esto"*), o dejando que Claude Code los sugiera solo por el contexto de la tarea.

---

## Hook: Bloqueo de Secretos

[`.claude/hooks/block-secret-commit.sh`](.claude/hooks/block-secret-commit.sh) corre como `PreToolUse`
sobre `Bash` (config en [`.claude/settings.json`](.claude/settings.json)) y corta cualquier
`git commit` cuyo diff en staging matchee el patrón de una API key, token o password hardcodeado. Ver
por qué existe en [`AGENTS.md`](AGENTS.md#hook-bloqueo-de-secretos-en-git-commit).
