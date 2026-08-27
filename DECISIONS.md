# Architecture Decision Record (ADR) — AEO Intelligence Engine
**Proyecto:** Framework de Evaluación y Benchmarking de Visibilidad de Marca en LLMs (Linear vs. Competidores)  
**Target Engine:** Google Gemini (Gemini 1.5 Architecture)  
**Status:** Accepted / Production Ready MVP  
**Autor:** [Tu Nombre / GitHub Handle]  

---

## 1. Contexto y Definición del Problema (AEO vs. SEO)

El auge de los motores de respuesta generativa (*Answer Engines*) ha transformado la búsqueda tradicional basada en índices indexados (10 enlaces deterministas) en **respuestas sintéticas probabilísticas**. En este entorno:

1. **Efecto Embudo Extremo:** El usuario no navega 10 páginas; recibe una respuesta condensada donde solo 2 o 3 marcas capturan el 100% de la atención.
2. **No-Determinismo y Estocasticidad:** Respuestas sucesivas a la misma intención varían en orden, tono y omisión según la temperatura, el muestreo de núcleos (*Top-P*) y la formulación sintáctica del prompt.
3. **Sesgo de Posición y Polaridad:** La visibilidad no es binaria (aparecer/no aparecer). Incluye la posición de mención (*Primacy Effect*), el contexto semántico de recomendación y la atribución de casos de uso (ej. *"Linear para velocidad/ingeniería"* vs. *"Jira para compliance/enterprise"*).

**Objetivo del Sistema:** Construir un motor de auditoría automatizado que someta a Gemini a una matriz de evaluación estocástica, normalice las respuestas en un esquema estructurado e infiera métricas cuantitativas reproducibles de visibilidad, cuota de voz y sentimiento competitivo para **Linear** frente a **Jira, Asana, Monday y Notion**.

---

## 2. Diagrama de Arquitectura

```mermaid
flowchart TB
    classDef config fill:#4f46e5,color:#fff,stroke:#3730a3,stroke-width:2px;
    classDef api fill:#eab308,color:#000,stroke:#ca8a04,stroke-width:2px;
    classDef storage fill:#059669,color:#fff,stroke:#047857,stroke-width:2px;
    classDef ui fill:#2563eb,color:#fff,stroke:#1d4ed8,stroke-width:2px;
    classDef engine fill:#ea580c,color:#fff,stroke:#c2410c,stroke-width:2px;
    classDef rate fill:#7c3aed,color:#fff,stroke:#6d28d2,stroke-width:2px;

    subgraph Capa_Entrada ["1. Capa de Entrada (AEO Benchmark Config)"]
        Q[Taxonomía de Prompts<br/>Discovery, Persona, H2H, Migration]:::config
        C[Entidades Competitivas<br/>Linear vs Jira, Asana, Monday, Notion]:::config
        K[Credenciales & Config<br/>Gemini API Key & Model Specs]:::config
    end

    subgraph Capa_Ejecucion ["2. Orquestación Asíncrona & Muestreo Estocástico"]
        E[Async Orchestrator<br/>FastAPI + httpx + asyncio.gather]:::engine
        RL[Concurrency Guard & Rate Limiter<br/>Token Bucket / asyncio.Semaphore]:::rate
        
        subgraph Monte_Carlo ["Multi-Temperature Sampling (N-Runs)"]
            R1[Run 1: Temp 0.3<br/>Consistencia / Baseline]
            R2[Run 2: Temp 0.7<br/>Comportamiento Real]
            R3[Run 3: Temp 1.0<br/>Exploración / Alta Variabilidad]
            R4[Run 4: Temp 0.3<br/>Consistencia]
            R5[Run 5: Temp 0.7<br/>Comportamiento Real]
        end
    end

    subgraph Motor_IA ["3. Motor de Inferencia Generativa"]
        G[(Google Gemini 1.5 API)]:::api
    end

    subgraph Capa_Extraccion ["4. Extracción Estructurada Determinista (Pydantic v2)"]
        JUDGE[LLM-as-a-Judge / Parser<br/>Temp: 0.0 + JSON Schema Enforced]:::engine
        M[Brand Mention Detector<br/>Validación de Entidades]
        S[Sentiment & Context Classifier<br/>Positivo / Neutral / Crítico]
        P[Positional Rank Calculator<br/>Orden y Primacy Index]
    end

    subgraph Capa_Almacenamiento ["5. Capa de Datos & Estado"]
        STATE[(State Engine / Storage<br/>In-Memory Session / Persistence)]:::storage
    end

    subgraph Capa_Analitica ["6. Motor Analítico Vectorizado (Pandas & NumPy)"]
        AGG[Vectorized Aggregator<br/>Pandas DataFrames]:::engine
        METRICS["Cálculo de Métricas AEO:
        • Share of Voice (SoV)
        • Mean Reciprocal Rank (MRR)
        • Win Rate (% Top Pick)
        • Matriz de Co-ocurrencia"]:::engine
    end

    subgraph Capa_Presentacion ["7. Capa de Presentación (React 19 + Tailwind 4)"]
        SPA[Dashboard SPA<br/>React 19 + TypeScript + Vite 6]:::ui
        CHARTS[Data Visualization<br/>Motion + Lucide React]:::ui
        EXPORT[Data Export<br/>JSON / CSV Reports]:::ui
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

3. Decisiones de Arquitectura y Diseño de Dominio
3.1. Taxonomía Semántica y Diseño del Dataset de Evaluación

En lugar de consultas arbitrarias, se estructuró una matriz ortogonal de prompts basada en la jornada de decisión de compra técnica:

    Top-of-Funnel / Generic Discovery (SoV base): Intenciones amplias de búsqueda (ej. "Best issue tracking software for modern engineering teams").

    Feature & Persona Specific (Nicho de Linear): Fricción, rendimiento y ergonomía (ej. "Fastest keyboard-first project management tool").

    Competitive Head-to-Head (Intercepción de marca): Consultas de comparación directa (ej. "Linear vs Jira for a 50-person high-growth tech startup").

    Enterprise / Migration Triggers: Casos de reemplazo e integración (ej. "Jira alternatives with clean GitHub/GitLab integration").

3.2. Modelo Matemático y Métricas AEO

Para convertir lenguaje natural no estructurado en telemetría cuantitativa y comparable, se formalizaron las siguientes métricas:
A. Share of Voice (SoV)

Proporción de ocurrencia de una marca b en el conjunto total de evaluaciones N:
SoVb​=N1​i=1∑N​I(b∈Mentionsi​)×100
B. Mean Reciprocal Rank Ponderado (MRRAEO​)

Captura el Primacy Bias (la primera marca mencionada tiene mayor tasa de adopción psicológica). Si la marca no aparece, su rango es ∞ (1/rank=0):
MRRb​=N1​i=1∑N​Position(b,i)1​
C. Direct Win Rate (WR)

Frecuencia con la que el modelo declara explícitamente a la marca como la recomendación primaria o ganadora unívoca:
WRb​=N∑i=1N​I(TopPicki​=b)​×100
D. Matriz de Co-ocurrencia y Distancia Semántica

Cálculo de frecuencias cruzadas C(b1​,b2​) para detectar agrupamientos automáticos generados por el LLM (ej. cómo Linear suele co-ocurrir con Notion en startups, pero con Jira en debates de escalabilidad).
3.3. Estrategia de Dos Pasos: Generación vs. Extracción

Para evitar contaminar el razonamiento del modelo y garantizar consistencia estadística, se desacopló el pipeline en dos etapas independientes:

    Inference Run (Simulación de Usuario): Se ejecuta el prompt del usuario en un entorno libre con temperatura representativa (T=0.7) para capturar la respuesta natural que recibiría un consumidor.

    Deterministic Extraction (LLM-as-a-Judge / Parser): La respuesta en texto plano se pasa por un extractor con temperatura T=0.0 y Pydantic Structured Outputs (JSON Schema estricto) para identificar entidades, orden posicional, sentimiento (Positive, Neutral, Critical) y atributos categóricos.

3.4. Justificación del Stack Técnico
Capa	Tecnología	Justificación de Ingeniería
Backend Core	FastAPI + Python 3.11+	Asincronía nativa (asyncio) con mínimo overhead para manejar I/O concurrente hacia Gemini API sin saturar threads del sistema operativo.
HTTP Engine	httpx (Async Client)	Soporte nativo de HTTP/2, pooling de conexiones TCP persistentes y control granular de timeouts para mitigar la latencia de inferencia de LLMs.
Data Validation	Pydantic v2 (Rust-backed)	Garantía de invariantes de tipos en runtime y deserialización de esquemas JSON con latencia sub-milisegundo.
Analytics Engine	Pandas / NumPy	Agregaciones vectorizadas para cálculo de varianzas, distribuciones percentiles y matrices de correlación sin bucles manuales de Python.
Frontend Framework	React 19 + TypeScript	Manejo declarativo del estado de la aplicación, concurrencia en renderizado y tipado estricto extremo con interfaces compartidas del backend.
Tooling & Styling	Vite 6 + Tailwind CSS 4	Zero-runtime CSS, optimización de assets con Tree-Shaking y build estático ultra-liviano.
Motion Layer	Motion (Framer Motion)	Microinteracciones y transiciones de datos para elevar la experiencia visual a estándar SaaS enterprise.
Packaging & Ops	Docker (Multi-stage)	Generación de una imagen ligera y segura que sirve los estáticos del frontend desde FastAPI, eliminando problemas de CORS y facilitando el despliegue en un único puerto.
4. Lo que se asumió (Hypotheses & Explicit Constraints)

    Topología de Competidores: Se fijó el benchmark en 5 entidades: Linear (Target), Jira (Legacy Enterprise), Asana (Cross-team PM), Monday (No-code / Operations) y Notion (Knowledge base / Hybrid task manager).

    Condiciones de Inferencia de Gemini: Se utilizó el modelo gemini-1.5-flash / gemini-1.5-pro como baseline representativo de la familia de modelos de Google, asumiendo su distribución de pesos de entrenamiento en software engineering.

    Aislamiento de Grounding: En el baseline del MVP se evaluó el conocimiento paramétrico intrínseco del modelo (sin activar Search Grounding en tiempo real) para medir el "sesgo puro" del LLM antes de intervenciones de RAG web.

5. Trade-offs y Decisiones de Alcance (Lo que se dejó afuera de forma deliberada)

Un entregable senior se define tanto por lo que construye como por lo que decide postergar para maximizar el retorno de valor en tiempo limitado:

                  ┌─────────────────────────────────────┐
                  │          DECISIÓN DE ALCANCE        │
                  └─────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│       PRIORIZADO EN EL MVP          │     │        DELEGADO A V2 / ROADMAP      │
├─────────────────────────────────────┤     ├─────────────────────────────────────┤
│ • Pipeline Asíncrono de Gemini      │     │ • Multi-LLM (ChatGPT, Claude, Perpx)│
│ • Extracción Estructurada Determinista│   │ • Snapshots Temporales (TimescaleDB)│
│ • Métricas AEO (SoV, MRR, Win Rate) │     │ • Web-Grounding / RAG Dynamic Toggle│
│ • Single-Container Deployment       │     │ • Auth & Multi-Tenancy (SaaS)       │
└─────────────────────────────────────┘     └─────────────────────────────────────┘

    Multi-LLM Benchmarking:

        Decisión: Concentrarse al 100% en la profundidad analítica sobre Gemini.

        Razón: Probar superficialmente 4 modelos sin el debido rigor estadístico aporta menos valor que dominar la instrumentación y taxonomía sobre uno solo.

        Roadmap v2: Abstraer una interfaz polimórfica LLMClientStrategy para conectar OpenAI, Anthropic y Perplexity con el mismo pipeline de métricas.

    Persistencia Histórica en Base de Datos:

        Decisión: Procesamiento en memoria por sesión de auditoría.

        Razón: Evitar dependencias de bases de datos externas en el entorno de despliegue que agreguen puntos de fallo en la revisión.

        Roadmap v2: Implementar PostgreSQL + TimescaleDB con cron-workers para series de tiempo y alertas de caída de visibilidad.

    Rate Limiting & Resiliencia Distribuida:

        Decisión: Concurrencia controlada con semáforos asíncronos (asyncio.Semaphore) y backoff exponencial en el cliente.

        Roadmap v2: Implementar Redis con algoritmo Token Bucket para distribuir cuotas si se escala a cientos de prompts por minuto.

6. Metodología de Ingeniería con Subagentes y Skills

Para acelerar el ciclo de desarrollo manteniendo estándares de producción, se implementó un flujo de trabajo asistido por agentes especializados:

    frontend-designer (UI/UX Engineering):

        Orquestación de sistemas de diseño consistentes (tokens de color, espaciado semántico).

        Implementación de estados de carga resilientes (Skeleton screens interactivos) para mitigar la percepción de latencia en llamadas a LLMs.

        Aseguramiento de accesibilidad (ARIA tags, contraste cromático para métricas).

    security-auditor (DevSecOps & Hardening):

        Análisis estático para evitar fugas de credenciales en el código fuente y bundle del cliente.

        Configuración del contenedor Docker para correr bajo un usuario sin privilegios (non-root).

        Validación de superficies de API y sanitización de esquemas de entrada para prevenir inyecciones de prompts maliciosos en la capa de evaluación.

### 6.1. Despliegue Serverless (Vercel) y su impacto en el modelo de estado

El MVP original asumía un proceso único de larga vida (Docker): `POST /survey/run` disparaba el batch de 90 llamadas a Gemini como una `BackgroundTasks` de FastAPI y devolvía un `survey_id` de inmediato; el progreso y el resultado vivían en un dict en memoria del proceso (`_surveys` en `survey_service.py`), y el frontend lo pooleaba con `GET /survey/{id}` cada 1.5s.

Ese diseño se rompe al mover el backend a funciones serverless de Vercel:

    No hay garantía de que la función siga corriendo después de mandar una respuesta — un `BackgroundTasks` no tiene ninguna promesa de terminar.

    No hay garantía de que un GET de polling posterior caiga en la misma instancia/contenedor que procesó el POST — el dict en memoria no es visible entre invocaciones.

    Cambio de decisión: `POST /survey/run` ahora corre el batch completo de forma síncrona dentro de una sola invocación (`await asyncio.gather(...)` sobre las 90 llamadas) y devuelve el resultado ya terminado en esa misma respuesta. Sin `survey_id` que pollear, sin estado de servidor entre requests.

    Qué se mantiene: la decisión original de "sin Redis/Postgres" (sección 5) sigue vigente — no se agregó ningún store externo. El resultado de la última auditoría y el historial de la sesión ahora se persisten en `localStorage` del navegador en lugar de en memoria del proceso; es el mismo espíritu "estado por sesión, sin infraestructura extra", solo que el límite de esa sesión pasa a ser la pestaña del navegador en vez del proceso de Python.

    Costo aceptado: se pierde la barra de progreso en vivo del servidor durante los 1-3 minutos que tarda una auditoría — no hay forma simple de streamear progreso real desde una función serverless de Python en una sola request/response. El frontend muestra en cambio un progreso estimado por tiempo transcurrido (ver `estimateAuditDurationMs` en `src/lib/api.ts`), explícitamente una aproximación, no un conteo real.

    Restricción de plan: la función `api/index.py` pide `maxDuration: 300` en `vercel.json`, lo cual requiere plan Pro de Vercel (Hobby limita a 60s, insuficiente para el batch completo).

7. Conclusión y Valor de Negocio

El proyecto demuestra que AEO no es magia; es una disciplina de observabilidad de datos no estructurados. Con este motor, una marca como Linear puede saber con precisión quirúrgica en qué prompts gana, en qué casos de uso es omitida y qué competidores están absorbiendo su tráfico de intención en la era post-búsqueda.