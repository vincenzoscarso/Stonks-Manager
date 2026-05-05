from __future__ import annotations

from typing import Any, Dict, List, cast
from postgrest.base_request_builder import APIResponse
from supabase import create_client, Client
from app.models.category import NewCategory, Category
from app.utils.get_env_variable import getEnvVariable
from postgrest.types import CountMethod
from app.config.configuration import PER_USER_CATEGORY_LIMIT


class CategoryService:
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

    def getCategories(self, user_id: str) -> List[Category]:
        # Fetch both global categories (where user_profile_id is NULL)
        # and categories specific to the current user.
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

    def addCategory(self, user_id: str, category: NewCategory) -> Category:
        # Check limit: max categories (excluding global ones)
        response: APIResponse = (
            self.supabase.table("category").select("id", count=CountMethod.exact).eq("user_profile_id", user_id).execute()
        )
        amount_of_user_categories = response.count

        if amount_of_user_categories is not None and amount_of_user_categories >= PER_USER_CATEGORY_LIMIT:
            raise ValueError(f"Maximum number of categories ({PER_USER_CATEGORY_LIMIT}) reached")

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

    def updateCategory(self, user_id: str, category_id: str, category: NewCategory) -> Category:
        if not self.doesCategoryBelongToUser(user_id, category_id):
            raise ValueError("Category not found or does not belong to user")

        payload: Dict[str, Any] = {
            "name": category.name,
            "description": category.description,
        }
        response: APIResponse = self.supabase.table("category").update(payload).eq("id", category_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            # If update succeeded but no data returned, fetch it again
            return self.getCategoryById(user_id, category_id)

        first_row = cast(Dict[str, Any], data[0])
        return Category.model_validate(first_row)

    def deleteCategory(self, user_id: str, category_id: str) -> None:
        if not self.doesCategoryBelongToUser(user_id, category_id):
            raise ValueError("Category not found or does not belong to user")

        response: APIResponse = self.supabase.table("category").delete().eq("id", category_id).execute()

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

    def getCategoryById(self, user_id: str, category_id: str) -> Category:
        response: APIResponse = (
            self.supabase.table("category")
            .select("*")
            .eq("id", category_id)
            .or_(f"user_profile_id.eq.{user_id},user_profile_id.is.null")
            .execute()
        )

        error = getattr(response, "error", None)
        if error:
            raise RuntimeError(str(error))

        data = getattr(response, "data", None)
        if not isinstance(data, list) or not data:
            raise ValueError("Category not found")

        return Category.model_validate(data[0])

    def doesCategoryBelongToUser(self, user_id: str, category_id: str):
        response: APIResponse = (
            self.supabase.table("category").select("id").eq("id", category_id).eq("user_profile_id", user_id).execute()
        )
        return bool(response.data)
