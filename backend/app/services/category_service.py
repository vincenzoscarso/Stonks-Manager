from __future__ import annotations


from typing import Any, Dict, List, cast, Optional
from postgrest.base_request_builder import APIResponse
from supabase import create_client, Client
from app.models.category import NewCategory, Category
from app.utils.get_required_env import get_required_env


class CategoryService:
    def __init__(self, supabase_client: Any | None = None) -> None:
        if supabase_client is not None:
            self.supabase = supabase_client
            return

        supabase_url = get_required_env("SUPABASE_URL")
        supabase_key = get_required_env("SUPABASE_KEY")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    def get_categories(self, user_id: str) -> List[Category]:
        # Get user categories and global categories
        response: APIResponse = (
            self.supabase.table("category").select("*").or_(f"user_profile_id.eq.{user_id},user_profile_id.is.null").execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list):
            raise RuntimeError("Invalid response from Supabase when fetching categories")

        return [Category.model_validate(row) for row in data]

    def add_category(self, user_id: str, category: NewCategory) -> Category:
        payload: Dict[str, Any] = {
            "name": category.name,
            "description": category.description,
            "user_profile_id": user_id,
        }
        response: APIResponse = self.supabase.table("category").insert(payload).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Invalid response from Supabase when adding category")

        first_row = cast(Dict[str, Any], data[0])
        return Category.model_validate(first_row)

    def update_category(self, user_id: str, category_id: str, category: NewCategory) -> Category:
        payload: Dict[str, Any] = {
            "name": category.name,
            "description": category.description,
        }
        response: APIResponse = (
            self.supabase.table("category").update(payload).eq("id", category_id).eq("user_profile_id", user_id).execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise RuntimeError("Category not found or update failed")

        first_row = cast(Dict[str, Any], data[0])
        return Category.model_validate(first_row)

    def delete_category(self, user_id: str, category_id: str) -> None:
        response: APIResponse = (
            self.supabase.table("category").delete().eq("id", category_id).eq("user_profile_id", user_id).execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))
