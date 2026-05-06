from __future__ import annotations

from typing import Any, Dict, cast
from postgrest.base_request_builder import APIResponse
from postgrest.types import CountMethod
from supabase import create_client, Client
from backend.app.models.user import NewUserProfile, UserProfile
from backend.app.utils.get_env_variable import getEnvVariable
from backend.app.config.configuration import USER_LIMIT


class UserService:
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

    def getUser(self, user_id: str) -> UserProfile:
        response: APIResponse = self.supabase.table("user_profile").select("*").eq("id", user_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            # If user profile is missing, suggest re-login to trigger the creation trigger
            raise RuntimeError("User not found")

        first_row = cast(Dict[str, Any], data[0])
        return UserProfile.model_validate(first_row)

    def addUser(self, user_id: str, user_profile: NewUserProfile) -> UserProfile:
        # Check limit
        response: APIResponse = self.supabase.table("user_profile").select("id", count=CountMethod.exact).execute()
        amount_of_users: int = cast(int, response.count)

        if amount_of_users is not None and amount_of_users >= USER_LIMIT:
            raise ValueError(f"Maximum number of users ({USER_LIMIT}) reached")

        payload: Dict[str, Any] = {
            "id": user_id,
            "display_name": user_profile.display_name,
            "email": user_profile.email,
        }
        response: APIResponse = self.supabase.table("user_profile").insert(payload).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Invalid response from Supabase when adding user")

        first_row = cast(Dict[str, Any], data[0])
        return UserProfile.model_validate(first_row)

    def updateUser(self, user_id: str, user_profile: NewUserProfile) -> UserProfile:
        payload: Dict[str, Any] = {
            "display_name": user_profile.display_name,
            "email": user_profile.email,
        }
        response: APIResponse = self.supabase.table("user_profile").update(payload).eq("id", user_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            return self.getUser(user_id)

        first_row = cast(Dict[str, Any], data[0])
        return UserProfile.model_validate(first_row)

    def deleteUser(self, user_id: str) -> None:
        response: APIResponse = self.supabase.table("user_profile").delete().eq("id", user_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))
