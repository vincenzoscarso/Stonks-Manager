from __future__ import annotations

import os
from typing import Any, Dict, cast
from supabase import create_client
from app.models.user import NewUserProfile, UserProfile
from dotenv import load_dotenv


ENV_PATH = ".\\.env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise EnvironmentError(f"Missing required environment variable: {name}")
    return value


class UserService:
    def __init__(self, supabase_client: Any | None = None) -> None:
        if supabase_client is not None:
            self.supabase = supabase_client
            return

        supabase_url = get_required_env("SUPABASE_URL")
        supabase_key = get_required_env("SUPABASE_KEY")

        self.supabase: Any = create_client(supabase_url, supabase_key)

    def add_user(self, user_profile: NewUserProfile) -> UserProfile:
        payload: Dict[str, Any] = {
            "display_name": user_profile.display_name,
            "email": user_profile.email,
        }
        response: Any = self.supabase.table("user_profile").insert(payload).select("*").execute()

        if getattr(response, "error", None):
            raise RuntimeError(str(response.error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Invalid response from Supabase when adding user")

        first_row = cast(Dict[str, Any], data[0])
        return UserProfile.model_validate(first_row)
