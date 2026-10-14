import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    """
    FastAPI TestClient fixture for executing API integration tests.
    """
    with TestClient(app) as test_client:
        yield test_client
