from fastapi import APIRouter, HTTPException, Depends

from app.models.user import NewUserProfile, UserProfile
from app.services.user_service import UserService
from app.utils.get_current_user import get_current_user

router = APIRouter()
user_service = UserService()


@router.get("/users", response_model=UserProfile)
async def get_user(user_id: str = Depends(get_current_user)) -> UserProfile:
    try:
        return user_service.get_user(user_id)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/users", response_model=UserProfile)
async def add_user(user: NewUserProfile, user_id: str = Depends(get_current_user)) -> UserProfile:
    try:
        return user_service.add_user(user_id, user)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/users", response_model=UserProfile)
async def update_user(user: NewUserProfile, user_id: str = Depends(get_current_user)) -> UserProfile:
    try:
        return user_service.update_user(user_id, user)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/users")
async def delete_user(user_id: str = Depends(get_current_user)) -> dict:
    try:
        user_service.delete_user(user_id)
        return {"message": "User deleted successfully"}
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
