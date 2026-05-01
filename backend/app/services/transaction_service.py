from __future__ import annotations

from typing import Any, Dict, List, cast, Optional
from postgrest.base_request_builder import APIResponse
from supabase import create_client, Client
from app.models.transaction import NewTransaction, Transaction
from backend.app.utils.get_env_variable import getEnvVariable
from backend.app.services.account_service import AccountService


class TransactionService:
    def __init__(self, supabase_client: Any | None = None) -> None:
        # Use provided client (e.g., authenticated client from FastAPI dependency injection)
        if supabase_client is not None:
            self.supabase = supabase_client
            return

        # Fallback: create a new client if none is provided.
        # Useful for standalone scripts, background tasks, or testing where
        # a request-scoped authenticated client is not available.
        supabase_url = getEnvVariable("SUPABASE_URL")
        supabase_key = getEnvVariable("SUPABASE_KEY")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    def getTransactions(self, user_id: str) -> List[Transaction]:
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

    def addTransaction(self, user_id: str, transaction: NewTransaction) -> Transaction:
        # Security check: verify that the destination account belongs to the user
        account_service = AccountService(self.supabase)
        if not account_service.doesAccountBelongToUser(user_id, str(transaction.account_id)):
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

    def updateTransaction(self, user_id: str, transaction_id: str, transaction: NewTransaction) -> Transaction:
        if not self.doesTransactionBelongToUser(user_id, transaction_id):
            raise ValueError("Transaction not found or does not belong to user")

        account_service = AccountService(self.supabase)
        if not account_service.doesAccountBelongToUser(user_id, str(transaction.account_id)):
            raise ValueError("Target account not found or does not belong to user")

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

    def deleteTransaction(self, user_id: str, transaction_id: str) -> None:
        if not self.doesTransactionBelongToUser(user_id, transaction_id):
            raise ValueError("Transaction not found or does not belong to user")

        response: APIResponse = self.supabase.table("transaction").delete().eq("id", transaction_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

    def doesTransactionBelongToUser(self, user_id: str, transaction_id: str) -> bool:
        response = (
            self.supabase.table("transaction")
            .select("id, account!inner(user_profile_id)")
            .eq("id", transaction_id)
            .eq("account.user_profile_id", user_id)
            .execute()
        )
        return bool(response.data)
