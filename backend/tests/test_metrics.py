"""Unit tests for the statistical metrics engine."""

from backend.app.services.metrics_engine import MetricsEngine
from backend.app.models.schemas import ExtractedEntity, PromptEvaluationResult


def _result(rank_linear, rank_jira=None, sentiment="Positivo") -> PromptEvaluationResult:
    entities = [ExtractedEntity(brand_name="Linear", position_index=0, rank=rank_linear, sentiment=sentiment)]
    if rank_jira is not None:
        entities.append(ExtractedEntity(brand_name="Jira", position_index=10, rank=rank_jira, sentiment="Neutro"))
    return PromptEvaluationResult(
        iteration_id="IT", prompt_id="P_1", prompt_text="Top tools", model_name="gemini-2.5-flash",
        raw_response="1. Linear\n2. Jira", latency_ms=120.0,
        target_mentioned=True, target_rank=rank_linear, target_sentiment=sentiment,
        co_occurring_brands=[e.brand_name for e in entities], parsed_entities=entities,
    )


def test_metrics_calculation_basic():
    results = [_result(1, rank_jira=2), _result(2, rank_jira=1)]

    metrics = MetricsEngine.calculate_metrics(results, brand="Linear")
    assert metrics.sample_size_n == 2
    assert metrics.visibility_rate == 100.0
    assert metrics.avg_position == 1.5
    assert metrics.position_std_dev > 0
    assert metrics.top_of_mind_rate == 50.0
    assert metrics.entropy_score > 0.0


def test_metrics_no_mentions_returns_zeroed_metrics():
    metrics = MetricsEngine.calculate_metrics([], brand="Linear")
    assert metrics.sample_size_n == 0
    assert metrics.visibility_rate == 0.0
    assert metrics.aeo_score == 0.0


def test_metrics_computed_independently_per_brand():
    results = [_result(1, rank_jira=2), _result(1, rank_jira=2)]

    linear_metrics = MetricsEngine.calculate_metrics(results, brand="Linear")
    jira_metrics = MetricsEngine.calculate_metrics(results, brand="Jira")

    assert linear_metrics.top_of_mind_rate == 100.0
    assert jira_metrics.top_of_mind_rate == 0.0
    assert jira_metrics.avg_position == 2.0
