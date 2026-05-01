from __future__ import annotations

from typing import Any, Dict, List, cast
from postgrest.base_request_builder import APIResponse
from supabase import create_client, Client
from app.models.account import NewAccount, Account
from app.utils.get_required_env import get_required_env


class AccountService:
    def __init__(self, supabase_client: Any | None = None) -> None:
        if supabase_client is not None:
            self.supabase = supabase_client
            return

        supabase_url = get_required_env("SUPABASE_URL")
        supabase_key = get_required_env("SUPABASE_KEY")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    def get_accounts(self, user_id: str) -> List[Account]:
        response: APIResponse = self.supabase.table("account").select("*").eq("user_profile_id", user_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list):
            raise RuntimeError("Invalid response from Supabase when fetching accounts")

        return [Account.model_validate(row) for row in data]

    def add_account(self, user_id: str, account: NewAccount) -> Account:
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

    def update_account(self, user_id: str, account_id: str, account: NewAccount) -> Account:
        # Verify account belongs to user before update
        account_check: APIResponse = (
            self.supabase.table("account")
            .select("id")
            .eq("id", account_id)
            .eq("user_profile_id", user_id)
            .execute()
        )
        if not account_check.data:
            raise ValueError("Account not found or does not belong to user")

        payload: Dict[str, Any] = {
            "name": account.name,
            "include_in_total": account.include_in_total,
        }
        response: APIResponse = (
            self.supabase.table("account")
            .update(payload)
            .eq("id", account_id)
            .execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            # Handle case where Supabase doesn't return data on update
            return self.get_account_by_id(user_id, account_id)

        first_row = cast(Dict[str, Any], data[0])
        return Account.model_validate(first_row)

    def delete_account(self, user_id: str, account_id: str) -> None:
        # Verify account belongs to user
        account_check: APIResponse = (
            self.supabase.table("account")
            .select("id")
            .eq("id", account_id)
            .eq("user_profile_id", user_id)
            .execute()
        )
        if not account_check.data:
            raise ValueError("Account not found or does not belong to user")

        response: APIResponse = (
            self.supabase.table("account")
            .delete()
            .eq("id", account_id)
            .execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

    def get_account_by_id(self, user_id: str, account_id: str) -> Account:
        response: APIResponse = (
            self.supabase.table("account")
            .select("*")
            .eq("id", account_id)
            .eq("user_profile_id", user_id)
            .execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise ValueError("Account not found")

        return Account.model_validate(data[0])
