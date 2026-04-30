import pytest
from unittest.mock import MagicMock
from app.services.user_service import UserService
from app.models.user import NewUserProfile

from uuid import uuid4

def test_get_user_success(mock_supabase):
    user_id = str(uuid4())
    # Setup mock response
    mock_data = {
        "id": user_id,
        "display_name": "Test User",
        "email": "test@example.com",
        "created_at": "2026-04-30T12:00:00",
        "updated_at": "2026-04-30T12:00:00"
    }
    
    # Configure the execute() mock for this specific call
    execute_mock = MagicMock()
    execute_mock.data = [mock_data]
    execute_mock.error = None
    mock_supabase.execute.return_value = execute_mock
    
    service = UserService(supabase_client=mock_supabase)
    user = service.get_user(user_id)
    
    assert str(user.id) == user_id
    assert user.display_name == "Test User"
    mock_supabase.table.assert_called_with("user_profile")

def test_get_user_not_found(mock_supabase):
    # Setup mock response for empty data
    execute_mock = MagicMock()
    execute_mock.data = []
    execute_mock.error = None
    mock_supabase.execute.return_value = execute_mock
    
    service = UserService(supabase_client=mock_supabase)
    with pytest.raises(RuntimeError, match="User not found"):
        service.get_user("unknown-id")
