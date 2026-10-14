import pytest
from backend.schemas.community import sanitize_text

def test_health_check(client):
    """
    Verify system health-check endpoint responds with operational status.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "operational" in data["message"]

def test_profile_unauthorized(client):
    """
    Verify accessing protected profile endpoint without JWT token is denied.
    """
    response = client.get("/api/v1/profile/")
    assert response.status_code in (401, 403)

def test_recommendations_endpoint_anonymous(client):
    """
    Verify recommendation service returns structured fallback for anonymous visits.
    """
    response = client.get("/api/v1/recommendations/?department=Computer+Science&semester=7")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "alerts" in data
    assert data["semester"] == 7

def test_community_post_sanitization_xss():
    """
    Verify text sanitization removes malicious script tags and escapes HTML.
    """
    dangerous_input = "<script>alert('pwned')</script><b>Check this hackathon out!</b>"
    cleaned = sanitize_text(dangerous_input)
    assert "<script>" not in cleaned
    assert "</script>" not in cleaned
    assert "Check this hackathon out!" in cleaned
