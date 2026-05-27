from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from backend.app.models.category import NewCategory, Category
from backend.app.services.category_service import CategoryService
from backend.app.utils.get_current_user import getCurrentUser
from backend.app.utils.get_supabase_client import getSupabaseClient
from supabase import Client

router = APIRouter()


def getCategoryService(supabase: Client = Depends(getSupabaseClient)) -> CategoryService:
    return CategoryService(supabase_client=supabase)


@router.get("/categories", response_model=list[Category])
async def getCategories(
    user_id: str = Depends(getCurrentUser), service: CategoryService = Depends(getCategoryService)
) -> list[Category]:

    try:
        return service.getCategories(user_id)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/categories", response_model=Category)
async def addCategory(
    category: NewCategory, user_id: str = Depends(getCurrentUser), service: CategoryService = Depends(getCategoryService)
) -> Category:

    try:
        return service.addCategory(user_id, category)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.put("/categories/{category_id}", response_model=Category)
async def updateCategory(
    category_id: str,
    category: NewCategory,
    user_id: str = Depends(getCurrentUser),
    service: CategoryService = Depends(getCategoryService),
) -> Category:

    try:
        return service.updateCategory(user_id, category_id, category)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/categories/{category_id}")
async def deleteCategory(
    category_id: str,
    replace_with: Optional[str] = Query(None, description="ID of the category to reassign transactions to before deletion"),
    user_id: str = Depends(getCurrentUser),
    service: CategoryService = Depends(getCategoryService),
) -> dict:

    try:
        service.deleteCategory(user_id, category_id, replace_with_category_id=replace_with)
        return {"message": "Category deleted successfully"}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
