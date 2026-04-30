import pytest
from unittest.mock import MagicMock

def test_get_accounts_route(client, mock_supabase, test_user_id):
    # Setup mock response for the service call inside the route
    mock_data = [{
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Main Bank",
        "include_in_total": True,
        "user_profile_id": test_user_id,
        "created_at": "2026-04-30T12:00:00",
        "updated_at": "2026-04-30T12:00:00"
    }]
    execute_mock = MagicMock()
    execute_mock.data = mock_data
    execute_mock.error = None
    mock_supabase.execute.return_value = execute_mock

    # We use a valid Bearer token (any string will do since get_current_user is overridden)
    response = client.get("/api/accounts", headers={"Authorization": "Bearer fake-token"})
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Main Bank"

def test_add_account_route(client, mock_supabase, test_user_id):
    mock_data = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Savings",
        "include_in_total": True,
        "user_profile_id": test_user_id,
        "created_at": "2026-04-30T12:00:00",
        "updated_at": "2026-04-30T12:00:00"
    }
    execute_mock = MagicMock()
    execute_mock.data = [mock_data]
    execute_mock.error = None
    mock_supabase.execute.return_value = execute_mock
    
    payload = {"name": "Savings", "include_in_total": True}
    response = client.post(
        "/api/accounts", 
        json=payload,
        headers={"Authorization": "Bearer fake-token"}
    )
    
    assert response.status_code == 200
    assert response.json()["name"] == "Savings"
