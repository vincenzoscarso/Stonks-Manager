from fastapi import APIRouter, HTTPException, Depends

from app.models.category import NewCategory, Category
from app.services.category_service import CategoryService
from app.utils.get_current_user import get_current_user
from app.utils.get_supabase_client import get_supabase_client
from supabase import Client


router = APIRouter()

def get_category_service(supabase: Client = Depends(get_supabase_client)) -> CategoryService:
    return CategoryService(supabase_client=supabase)


@router.get("/categories", response_model=list[Category])
async def get_categories(
    user_id: str = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service)
) -> list[Category]:
    try:
        return service.get_categories(user_id)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/categories", response_model=Category)
async def add_category(
    category: NewCategory,
    user_id: str = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service)
) -> Category:
    try:
        return service.add_category(user_id, category)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category: NewCategory,
    user_id: str = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service)
) -> Category:
    try:
        return service.update_category(user_id, category_id, category)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service)
) -> dict:
    try:
        service.delete_category(user_id, category_id)
        return {"message": "Category deleted successfully"}
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
