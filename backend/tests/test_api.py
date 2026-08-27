"""Smoke tests for the FastAPI HTTP surface."""

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_survey_run_completes_synchronously():
    # No API key configured in the test environment, so this exercises the
    # simulated-response path in GeminiAsyncClient - no network, deterministic.
    response = client.post("/api/v1/survey/run", json={"iterations_per_prompt": 1})
    assert response.status_code == 200
    body = response.json()
    assert body["survey_id"].startswith("SRV-")
    assert body["status"] == "completed"
    assert body["total"] == 18
    assert body["progress"] == 18
    assert len(body["results"]) == 18
    assert body["brand_metrics"] is not None


def test_evaluate_single_prompt():
    response = client.post("/api/v1/evaluate", json={"prompt": "Best project management tool for a startup?"})
    assert response.status_code == 200
    body = response.json()
    assert "response" in body
    assert isinstance(body["target_mentioned"], bool)
