from fastapi import APIRouter, HTTPException, Depends

from backend.app.models.user import NewUserProfile, UserProfile
from backend.app.services.user_service import UserService
from backend.app.utils.get_current_user import getCurrentUser
from backend.app.utils.get_supabase_client import getSupabaseClient
from supabase import Client

router = APIRouter()


def getUserService(supabase: Client = Depends(getSupabaseClient)) -> UserService:
    return UserService(supabase_client=supabase)


@router.get("/users", response_model=UserProfile)
async def getUser(user_id: str = Depends(getCurrentUser), service: UserService = Depends(getUserService)) -> UserProfile:

    try:
        return service.getUser(user_id)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/users", response_model=UserProfile)
async def addUser(
    user: NewUserProfile, user_id: str = Depends(getCurrentUser), service: UserService = Depends(getUserService)
) -> UserProfile:

    try:
        return service.addUser(user_id, user)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/users", response_model=UserProfile)
async def updateUser(
    user: NewUserProfile, user_id: str = Depends(getCurrentUser), service: UserService = Depends(getUserService)
) -> UserProfile:

    try:
        return service.updateUser(user_id, user)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/users")
async def deleteUser(user_id: str = Depends(getCurrentUser), service: UserService = Depends(getUserService)) -> dict:

    try:
        service.deleteUser(user_id)
        return {"message": "User deleted successfully"}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
