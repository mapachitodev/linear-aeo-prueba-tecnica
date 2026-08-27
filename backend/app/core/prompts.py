"""Calibrated prompt bank used for the official AEO audit batch.

18 prompts spanning the query intents a prospective Linear buyer is likely to
type into an answer engine: direct comparisons, top-N lists, migrations,
alternative-seeking, use-case-specific asks, opinions and general
recommendations, in both English and Spanish. Mixing language and intent is
what makes the sample size (18 prompts x N repetitions) meaningful instead of
just asking "is Linear good?" ninety times.
"""

from typing import TypedDict


class CalibratedPrompt(TypedDict):
    id: str
    text: str
    category: str
    language: str


CALIBRATED_PROMPTS: list[CalibratedPrompt] = [
    {"id": "P01", "category": "Recomendación (startup)", "language": "EN",
     "text": "What are the fastest and best issue tracking tools for engineering teams in 2026?"},
    {"id": "P02", "category": "Comparación directa", "language": "ES",
     "text": "Linear vs Jira Software: ¿cuál es mejor para un equipo de desarrollo ágil?"},
    {"id": "P03", "category": "Listado top 5", "language": "EN",
     "text": "Top 5 project management tools for modern cross-functional product squads"},
    {"id": "P04", "category": "Migración", "language": "ES",
     "text": "¿Cómo migrar de Asana a un gestor de tickets más enfocado en código?"},
    {"id": "P05", "category": "Búsqueda de alternativa", "language": "EN",
     "text": "Lightweight and fast alternative to Monday.com for sprint planning"},
    {"id": "P06", "category": "Caso de uso específico", "language": "ES",
     "text": "Mejores herramientas de seguimiento de bugs con sincronización en tiempo real con GitHub y Figma"},
    {"id": "P07", "category": "Recomendación (startup)", "language": "EN",
     "text": "What tool should an early-stage Y Combinator startup use for building their product roadmap?"},
    {"id": "P08", "category": "Comparación múltiple", "language": "ES",
     "text": "Comparativa de herramientas de gestión de proyectos: Jira, Asana, Monday y Linear"},
    {"id": "P09", "category": "Opinión directa", "language": "EN",
     "text": "Is Linear worth the switch from Jira for a 50-person engineering team?"},
    {"id": "P10", "category": "Búsqueda de alternativa", "language": "ES",
     "text": "¿Cuáles son las alternativas modernas a Jira para desarrollo de software?"},
    {"id": "P11", "category": "Caso de uso específico", "language": "EN",
     "text": "Best software for two-week agile sprint planning and burndown charts"},
    {"id": "P12", "category": "Caso de uso específico", "language": "ES",
     "text": "Herramientas de gestión de tareas con soporte nativo de atajos de teclado"},
    {"id": "P13", "category": "Caso de uso específico", "language": "EN",
     "text": "How to organize engineering bug triage effectively with automated Slack intake"},
    {"id": "P14", "category": "Recomendación general", "language": "EN",
     "text": "General recommendation for business project management across non-tech departments"},
    {"id": "P15", "category": "Recomendación general", "language": "ES",
     "text": "¿Qué software usar para gestionar tareas de diseño y producto combinadas?"},
    {"id": "P16", "category": "Comparación directa", "language": "EN",
     "text": "Enterprise-wide portfolio roadmap planning across 500+ developers"},
    {"id": "P17", "category": "Opinión directa", "language": "ES",
     "text": "¿Por qué las startups prefieren Linear en lugar de Jira en 2026?"},
    {"id": "P18", "category": "Recomendación (startup)", "language": "EN",
     "text": "Best developer experience (DevEx) tooling for software development tracking"},
]
