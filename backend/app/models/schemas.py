"""Pydantic schemas and data contracts for AEO Analytics."""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    gemini_configured: bool
    timestamp: str


class ExtractedEntity(BaseModel):
    """Parsed brand mention extracted from a raw LLM response."""
    brand_name: str
    position_index: int
    rank: int
    sentiment: str = Field(default="Neutro", pattern="^(Positivo|Neutro|Negativo)$")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    context_snippet: Optional[str] = None


class PromptEvaluationResult(BaseModel):
    """Result of running one prompt through Gemini once (one iteration)."""
    iteration_id: str
    prompt_id: str
    prompt_text: str
    category: str = "Exploración en vivo"
    language: str = "ES"
    model_name: str
    raw_response: str
    latency_ms: float
    is_simulated: bool = False
    target_mentioned: bool
    target_rank: Optional[int] = None
    target_sentiment: str = "Neutro"
    co_occurring_brands: List[str] = Field(default_factory=list)
    parsed_entities: List[ExtractedEntity] = Field(default_factory=list)


class BrandMetrics(BaseModel):
    """Statistical metrics computed for a single brand over N samples."""
    brand: str
    sample_size_n: int
    visibility_rate: float = Field(description="% of iterations that mention the brand")
    avg_position: float = Field(description="Mean ordinal position when mentioned")
    position_variance: float = Field(description="Sample variance of the position")
    position_std_dev: float = Field(description="Sample standard deviation of the position")
    top_of_mind_rate: float = Field(description="% of iterations where the brand ranks #1")
    share_of_voice: float = Field(description="Brand mentions / total brand mentions across all iterations")
    entropy_score: float = Field(description="Shannon entropy (bits) of the brand's rank distribution")
    aeo_score: float = Field(description="Composite score: 0.4*visibility + 0.3*position + 0.3*sentiment")


class SurveyRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    iterations_per_prompt: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    model_name: Optional[str] = None


class SurveyStatusResponse(BaseModel):
    """Shape of the completed survey returned by POST /survey/run. Status is
    always "completed" here - the run is synchronous, so a "running" or
    "failed" state is never observed by a caller (an in-flight failure just
    raises and the request errors out instead)."""
    survey_id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    progress: int = 0
    total: int = 0
    error: Optional[str] = None
    target_brand: Optional[str] = None
    brand_metrics: Optional[List[BrandMetrics]] = None
    results: Optional[List[PromptEvaluationResult]] = None
    key_findings: Optional[List[str]] = None


class EvaluateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str = Field(min_length=1, max_length=2000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class EvaluateResponse(BaseModel):
    prompt: str
    response: str
    model_used: str
    is_simulated: bool
    latency_ms: float
    target_mentioned: bool
    target_rank: Optional[int] = None
    target_sentiment: str
    other_brands: List[str] = Field(default_factory=list)
    timestamp: str
