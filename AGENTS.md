# AGENTS.md — Agentes y Automatizaciones de IA en Este Repo

> Este documento explica **qué agentes y hooks usa este proyecto y por qué**. Las definiciones
> ejecutables — las que Claude Code realmente carga — viven en [`.claude/agents/`](.claude/agents/)
> y [`.claude/settings.json`](.claude/settings.json). Este archivo es el índice legible, no la fuente
> de verdad: si algo acá contradice esos archivos, ganan esos archivos.

---

## Por qué esto está commiteado

El brief de esta prueba técnica pide explícitamente documentar el uso de agentes, skills, subagentes,
`CLAUDE.md`, reglas o hooks — *"nos interesa tanto como el código"*. Además de documentarlo, decidí
que valía la pena que fuera **real**: no una descripción de cómo *podría* usarse un agente, sino
subagentes que Claude Code efectivamente descubre y puede invocar en este repo, y un hook que
efectivamente corre y puede bloquear un commit.

---

## Subagentes

| Agente | Archivo | Rol |
|---|---|---|
| `frontend-designer` | [`.claude/agents/frontend-designer.md`](.claude/agents/frontend-designer.md) | Diseño UI/UX y accesibilidad del frontend React/Vite |
| `security-auditor` | [`.claude/agents/security-auditor.md`](.claude/agents/security-auditor.md) | Revisión de seguridad del backend, dependencias y Docker |

Se invocan pidiéndoselo a Claude Code en lenguaje natural — por ejemplo *"usá el agente
frontend-designer para revisar el estado de loading de `BrandComparisonChart`"* — o forzando el
subagente explícitamente. Claude Code los descubre automáticamente por estar en `.claude/agents/`; no
hace falta ninguna convención manual adicional.

Ninguno de los dos tomó decisiones de producto ni de arquitectura — todas las que están en
[`DECISIONS.md`](DECISIONS.md) son mías. `frontend-designer` se usó para acelerar trabajo de
componentes React siguiendo criterios de accesibilidad y consistencia visual que yo definí.
`security-auditor` audita exposición de secretos, superficie de la API y configuración Docker antes de
cualquier merge a main — ver su checklist completo en su propio archivo.

---

## Uso de IA en el resto del código

Usé asistencia de IA para generar boilerplate repetitivo (rutas, modelos Pydantic, `Dockerfile`),
ejecutar refactorizaciones mecánicas y autocompletar implementaciones ya especificadas. El flujo fue
siempre: yo defino qué construir y por qué — el agente acelera la escritura. Ninguna decisión de
diseño relevante fue delegada; el registro completo de esas decisiones está en
[`DECISIONS.md`](DECISIONS.md).
