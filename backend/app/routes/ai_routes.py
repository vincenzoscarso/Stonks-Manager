from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.services.category_service import CategoryService
from app.utils.get_current_user import getCurrentUser
from app.utils.get_supabase_client import getSupabaseClient
from supabase import Client

router = APIRouter(tags=["AI"])


class QuickInsertRequest(BaseModel):
    text: str


@router.post("/quick-insert")
async def quickInsert(
    request: QuickInsertRequest, user_id: str = Depends(getCurrentUser), supabase: Client = Depends(getSupabaseClient)
):
    try:
        category_service = CategoryService(supabase)
        categories = category_service.getCategories(user_id)

        categories_data = [{"id": str(c.id), "name": c.name, "type": c.type, "description": c.description} for c in categories]

        ai_service = AIService()
        result = await ai_service.quickInsert(request.text, categories_data)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan-receipt")
async def scanReceipt(
    file: UploadFile = File(...), user_id: str = Depends(getCurrentUser), supabase: Client = Depends(getSupabaseClient)
):
    try:
        category_service = CategoryService(supabase)
        categories = category_service.getCategories(user_id)

        categories_data = [{"id": str(c.id), "name": c.name, "type": c.type, "description": c.description} for c in categories]

        image_bytes = await file.read()

        ai_service = AIService()
        result = await ai_service.scanReceipt(image_bytes, categories_data)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
