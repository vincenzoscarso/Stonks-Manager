import pytest
from decimal import Decimal
from unittest.mock import MagicMock
from app.services.transaction_service import TransactionService
from app.models.transaction import NewTransaction
from datetime import datetime
from uuid import uuid4


def test_add_transaction_success(mock_supabase):
    user_id = "test-user-id"
    account_id = uuid4()
    category_id = uuid4()

    # Configure execute() to return account first, then transaction
    account_exec = MagicMock()
    account_exec.data = [{"id": str(account_id)}]
    account_exec.error = None

    mock_transaction_data = {
        "id": str(uuid4()),
        "type": "expense",
        "description": "Pizza",
        "amount": "15.50",
        "date": "2026-04-30T20:00:00",
        "account_id": str(account_id),
        "category_id": str(category_id),
        "created_at": "2026-04-30T20:00:00",
        "updated_at": "2026-04-30T20:00:00",
    }
    tx_exec = MagicMock()
    tx_exec.data = [mock_transaction_data]
    tx_exec.error = None

    # side_effect returns a different mock for each call to execute()
    mock_supabase.execute.side_effect = [account_exec, tx_exec]

    service = TransactionService(supabase_client=mock_supabase)
    new_tx = NewTransaction(
        type="expense",
        description="Pizza",
        amount=Decimal("15.50"),
        date=datetime(2026, 4, 30, 20, 0),
        account_id=account_id,
        category_id=category_id,
    )

    result = service.add_transaction(user_id, new_tx)

    assert result.description == "Pizza"
    assert float(result.amount) == 15.50


def test_add_transaction_invalid_account(mock_supabase):
    user_id = "test-user-id"

    # Mock account check (failure - empty list)
    account_exec = MagicMock()
    account_exec.data = []
    account_exec.error = None
    mock_supabase.execute.return_value = account_exec

    service = TransactionService(supabase_client=mock_supabase)
    new_tx = NewTransaction(
        type="expense", description="Pizza", amount=Decimal("15.50"), date=datetime.now(), account_id=uuid4(), category_id=uuid4()
    )

    with pytest.raises(ValueError, match="Account not found or does not belong to user"):
        service.add_transaction(user_id, new_tx)
