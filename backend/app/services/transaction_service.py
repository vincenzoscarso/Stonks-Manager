from __future__ import annotations

from typing import Any, Dict, List, cast, Optional
from postgrest.base_request_builder import APIResponse
from supabase import create_client, Client
from app.models.transaction import NewTransaction, Transaction
from app.utils.get_required_env import get_required_env


class TransactionService:
    def __init__(self, supabase_client: Any | None = None) -> None:
        if supabase_client is not None:
            self.supabase = supabase_client
            return

        supabase_url = get_required_env("SUPABASE_URL")
        supabase_key = get_required_env("SUPABASE_KEY")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    def get_transactions(self, user_id: str) -> List[Transaction]:
        # Filter transactions by the user_profile_id of the associated account.
        # Uses a PostgREST inner join to filter on a related table's column.
        response: APIResponse = (
            self.supabase.table("transaction")
            .select("*, account!inner(user_profile_id)")
            .eq("account.user_profile_id", user_id)
            .execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list):
            raise RuntimeError("Invalid response from Supabase when fetching transactions")

        return [Transaction.model_validate(row) for row in data]

    def add_transaction(self, user_id: str, transaction: NewTransaction) -> Transaction:
        # Security check: verify that the destination account belongs to the user
        account_response: APIResponse = (
            self.supabase.table("account")
            .select("id")
            .eq("id", str(transaction.account_id))
            .eq("user_profile_id", user_id)
            .execute()
        )
        if not account_response.data:
            raise ValueError("Account not found or does not belong to user")

        payload: Dict[str, Any] = {
            "type": transaction.type,
            "description": transaction.description,
            "amount": str(transaction.amount),  # Supabase expects string for decimal
            "date": transaction.date.isoformat(),
            "account_id": str(transaction.account_id),
            "category_id": str(transaction.category_id),
        }
        response: APIResponse = self.supabase.table("transaction").insert(payload).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Invalid response from Supabase when adding transaction")

        first_row = cast(Dict[str, Any], data[0])
        return Transaction.model_validate(first_row)

    def update_transaction(self, user_id: str, transaction_id: str, transaction: NewTransaction) -> Transaction:
        # Verify account belongs to user
        account_response: APIResponse = (
            self.supabase.table("account")
            .select("id")
            .eq("id", str(transaction.account_id))
            .eq("user_profile_id", user_id)
            .execute()
        )
        if not account_response.data:
            raise ValueError("Account not found or does not belong to user")

        payload: Dict[str, Any] = {
            "type": transaction.type,
            "description": transaction.description,
            "amount": str(transaction.amount),
            "date": transaction.date.isoformat(),
            "account_id": str(transaction.account_id),
            "category_id": str(transaction.category_id),
        }
        response: APIResponse = self.supabase.table("transaction").update(payload).eq("id", transaction_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Transaction not found or update failed")

        first_row = cast(Dict[str, Any], data[0])
        return Transaction.model_validate(first_row)

    def delete_transaction(self, user_id: str, transaction_id: str) -> None:
        response: APIResponse = self.supabase.table("transaction").delete().eq("id", transaction_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))
