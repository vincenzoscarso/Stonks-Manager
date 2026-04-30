import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import create_app
from backend.app.utils.get_supabase_client import get_supabase_client
from app.utils.get_current_user import get_current_user

from uuid import uuid4

@pytest.fixture
def mock_supabase():
    """Fixture to provide a mocked Supabase client."""
    mock = MagicMock()
    # Mocking basic structure to avoid chain errors
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.or_.return_value = mock
    
    # Ensure .execute().error is None by default
    execute_mock = MagicMock()
    execute_mock.error = None
    mock.execute.return_value = execute_mock
    
    return mock

@pytest.fixture
def test_user_id():
    """Fixture to provide a valid UUID string for tests."""
    return str(uuid4())

@pytest.fixture
def client(mock_supabase, test_user_id):
    """Fixture to provide a FastAPI TestClient with dependency overrides."""
    app = create_app()
    
    # Override get_supabase_client to return our mock
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    
    # Override get_current_user to return a fixed test user ID
    app.dependency_overrides[get_current_user] = lambda: test_user_id
    
    with TestClient(app) as c:
        yield c
    
    # Clear overrides after test
    app.dependency_overrides = {}
