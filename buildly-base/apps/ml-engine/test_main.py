import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "Brain ML Engine"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


def test_predict_material_delay():
    """Test material delay prediction."""
    response = client.post("/predict/material-delay", json={
        "material_id": "MAT-001",
        "context": {"obra_id": "OBR-001"}
    })
    assert response.status_code == 200
    data = response.json()
    assert "material_id" in data
    assert "delay_probability" in data
    assert "confidence_score" in data


def test_retrain_model():
    """Test model retraining."""
    response = client.post("/retrain", json={
        "feedback_data": {"samples": []}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "retraining"
    assert "model_version" in data
