"""
Basic scaffold tests to confirm structure, imports, and app integrity.
"""
from fastapi.testclient import TestClient
from apps.api.main import app
import analytics.graph
import analytics.patterns
import analytics.risk
import analytics.temporal

client = TestClient(app)


def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "TraceFuse API" in data["app"]


def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_analytics_modules_importable():
    assert analytics.graph is not None
    assert analytics.patterns is not None
    assert analytics.risk is not None
    assert analytics.temporal is not None
