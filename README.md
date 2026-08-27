# ⚡ SearchBrand AEO Intelligence Engine

> **Framework de Auditoría y Benchmarking de Visibilidad de Marca en Respuestas de IA (AEO)**  
> *Caso de Estudio:* **Linear** vs. **Jira**, **Asana**, **Monday** y **Notion** en **Google Gemini**.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688.svg?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Single--Container-2496ED.svg?style=flat-square&logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Pytest%20Passing-success.svg?style=flat-square&logo=pytest&logoColor=white)

---

## 🔗 Accesos Rápidos

- **🚀 Demo en Producción:** https://linear-aeo.vercel.app/
- **📖 Architecture Decision Record (ADR):** Consulta [DECISIONS.md](./DECISIONS.md) para conocer las decisiones estadísticas, el desacoplamiento de inferencia y los trade-offs técnicos.
- **📑 Documentación Interactiva API:** `http://localhost:8000/docs` (Swagger UI).

---

## 🎯 ¿Qué es este proyecto?

En la era post-búsqueda, los usuarios no leen 10 enlaces azules: **le preguntan a los LLMs**. Cuando alguien consulta a Gemini por una herramienta de gestión de proyectos, el modelo sintetiza y recomienda solo 2 o 3 opciones, omitiendo al resto del mercado.

Este motor de **Answer Engine Optimization (AEO)** permite a marcas como **Linear**:

1. **Auditar su presencia real** frente a Jira, Asana, Monday y Notion mediante un banco de prompts ortogonales.
2. **Modelar la estocasticidad del modelo** mediante muestreo Monte Carlo a distintas temperaturas ($T=0.3, 0.7, 1.0$).
3. **Calcular métricas cuantitativas reproducibles:** *Share of Voice (SoV)*, *Mean Reciprocal Rank (MRR)* para sesgo posicional, *Direct Win Rate* y *Matrices de Co-ocurrencia*.

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TB
    classDef config fill:#4f46e5,color:#fff,stroke:#3730a3,stroke-width:2px;
    classDef api fill:#eab308,color:#000,stroke:#ca8a04,stroke-width:2px;
    classDef storage fill:#059669,color:#fff,stroke:#047857,stroke-width:2px;
    classDef ui fill:#2563eb,color:#fff,stroke:#1d4ed8,stroke-width:2px;
    classDef engine fill:#ea580c,color:#fff,stroke:#c2410c,stroke-width:2px;
    classDef rate fill:#7c3aed,color:#fff,stroke:#6d28d2,stroke-width:2px;

    subgraph Capa_Entrada ["1. Capa de Entrada (AEO Benchmark Config)"]
        Q["Taxonomía de Prompts<br/>Discovery, Persona, H2H, Migration"]:::config
        C["Entidades Competitivas<br/>Linear vs Jira, Asana, Monday, Notion"]:::config
        K["Credenciales & Config<br/>Gemini API Key & Model Specs"]:::config
    end

    subgraph Capa_Ejecucion ["2. Orquestación Asíncrona & Muestreo Estocástico"]
        E["Async Orchestrator<br/>FastAPI + httpx + asyncio.gather"]:::engine
        RL["Concurrency Guard & Rate Limiter<br/>Token Bucket / asyncio.Semaphore"]:::rate
        
        subgraph Monte_Carlo ["Multi-Temperature Sampling (N-Runs)"]
            R1["Run 1: Temp 0.3<br/>Consistencia / Baseline"]
            R2["Run 2: Temp 0.7<br/>Comportamiento Real"]
            R3["Run 3: Temp 1.0<br/>Exploración / Alta Variabilidad"]
            R4["Run 4: Temp 0.3<br/>Consistencia"]
            R5["Run 5: Temp 0.7<br/>Comportamiento Real"]
        end
    end

    subgraph Motor_IA ["3. Motor de Inferencia Generativa"]
        G[(Google Gemini 1.5 API)]:::api
    end

    subgraph Capa_Extraccion ["4. Extracción Estructurada Determinista (Pydantic v2)"]
        JUDGE["LLM-as-a-Judge / Parser<br/>Temp: 0.0 + JSON Schema Enforced"]:::engine
        M["Brand Mention Detector<br/>Validación de Entidades"]
        S["Sentiment & Context Classifier<br/>Positivo / Neutral / Crítico"]
        P["Positional Rank Calculator<br/>Orden y Primacy Index"]
    end

    subgraph Capa_Almacenamiento ["5. Capa de Datos & Estado"]
        STATE[(State Engine / Storage<br/>In-Memory Session / Persistence)]:::storage
    end

    subgraph Capa_Analitica ["6. Motor Analítico Vectorizado (Pandas & NumPy)"]
        AGG["Vectorized Aggregator<br/>Pandas DataFrames"]:::engine
        METRICS["Cálculo de Métricas AEO:<br/>Share of Voice (SoV)<br/>Mean Reciprocal Rank (MRR)<br/>Win Rate (% Top Pick)<br/>Matriz de Co-ocurrencia"]:::engine
    end

    subgraph Capa_Presentacion ["7. Capa de Presentación (React 19 + Tailwind 4)"]
        SPA["Dashboard SPA<br/>React 19 + TypeScript + Vite 6"]:::ui
        CHARTS["Data Visualization<br/>Motion + Lucide React"]:::ui
        EXPORT["Data Export<br/>JSON / CSV Reports"]:::ui
    end

    %% Flujos de Entrada -> Orquestación
    Q & C & K --> E
    E <--> RL

    %% Orquestación -> Iteraciones concurrentes
    E -->|Dispatch Concurrente| R1 & R2 & R3 & R4 & R5

    %% Iteraciones -> Gemini API
    R1 & R2 & R3 & R4 & R5 <-->|Async Non-blocking HTTP Requests| G

    %% Gemini API -> Extracción Estructurada
    G -->|Raw Natural Language Output| JUDGE
    JUDGE --> M --> S --> P

    %% Extracción -> Almacenamiento/Estado
    P -->|Tipos Validados por Pydantic| STATE

    %% Estado -> Analítica
    STATE --> AGG --> METRICS

    %% Analítica -> Frontend
    METRICS -->|API REST Payload Tipado| SPA
    SPA --> CHARTS
    SPA --> EXPORT
```

## 📊 Métricas AEO Implementadas


| Métrica | Definición | Relevancia Estratégica |
| :--- | :--- | :--- |
| **Share of Voice (SoV)** | $\text{SoV} = \frac{\text{Menciones de Linear}}{\text{Total Prompts Evaluados}} \times 100$ | Porcentaje absoluto de presencia de marca en las respuestas del motor. |
| **Posicional MRR** | $\text{MRR} = \frac{1}{N} \sum_{i=1}^{N} \frac{1}{\text{Posición}_i}$ | Pondera el sesgo de primacía (la primera recomendación captura el 70%+ del CTR). |
| **Direct Win Rate** | $\text{Win Rate} = \frac{\text{Veces que Linear es la Opción 1}}{\text{Total Prompts}} \times 100$ | Capacidad de Linear de ganar la recomendación unívoca del LLM. |


Este proyecto fue desarrollado como parte del proceso de selección técnica para SearchBrand. Código bajo licencia MIT. 
