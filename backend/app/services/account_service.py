from __future__ import annotations

from typing import Any, Dict, List, cast
from postgrest.base_request_builder import APIResponse
from postgrest.types import CountMethod
from supabase import create_client, Client
from app.models.account import NewAccount, Account
from app.utils.get_env_variable import getEnvVariable
from app.config.configuration import PER_USER_ACCOUNT_LIMIT


class AccountService:
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

    def getAccounts(self, user_id: str) -> List[Account]:
        response: APIResponse = self.supabase.table("account").select("*").eq("user_profile_id", user_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list):
            raise RuntimeError("Invalid response from Supabase when fetching accounts")

        return [Account.model_validate(row) for row in data]

    def addAccount(self, user_id: str, account: NewAccount) -> Account:
        # Check limit
        response: APIResponse = (
            self.supabase.table("account").select("id", count=CountMethod.exact).eq("user_profile_id", user_id).execute()
        )
        amount_of_user_accounts = response.count

        if amount_of_user_accounts is not None and amount_of_user_accounts >= PER_USER_ACCOUNT_LIMIT:
            raise ValueError(f"Maximum number of accounts ({PER_USER_ACCOUNT_LIMIT}) reached")

        payload: Dict[str, Any] = {
            "name": account.name,
            "include_in_total": account.include_in_total,
            "user_profile_id": user_id,
        }
        response: APIResponse = self.supabase.table("account").insert(payload).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Invalid response from Supabase when adding account")

        first_row = cast(Dict[str, Any], data[0])
        return Account.model_validate(first_row)

    def updateAccount(self, user_id: str, account_id: str, account: NewAccount) -> Account:
        if not self.doesAccountBelongToUser(user_id, account_id):
            raise ValueError("Account not found or does not belong to user")

        payload: Dict[str, Any] = {
            "name": account.name,
            "include_in_total": account.include_in_total,
        }
        response: APIResponse = self.supabase.table("account").update(payload).eq("id", account_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            # Handle case where Supabase doesn't return data on update
            return self.getAccountById(user_id, account_id)

        first_row = cast(Dict[str, Any], data[0])
        return Account.model_validate(first_row)

    def deleteAccount(self, user_id: str, account_id: str) -> None:
        if not self.doesAccountBelongToUser(user_id, account_id):
            raise ValueError("Account not found or does not belong to user")

        response: APIResponse = self.supabase.table("account").delete().eq("id", account_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

    def getAccountById(self, user_id: str, account_id: str) -> Account:
        response: APIResponse = (
            self.supabase.table("account").select("*").eq("id", account_id).eq("user_profile_id", user_id).execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise ValueError("Account not found")

        return Account.model_validate(data[0])

    def doesAccountBelongToUser(self, user_id: str, account_id: str) -> bool:
        response: APIResponse = (
            self.supabase.table("account").select("id").eq("id", account_id).eq("user_profile_id", user_id).execute()
        )
        return bool(response.data)
