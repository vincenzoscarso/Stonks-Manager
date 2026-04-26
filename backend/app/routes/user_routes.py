from fastapi import APIRouter, HTTPException

from app.models.user import NewUserProfile, UserProfile
from app.services.user_service import UserService

router = APIRouter()
user_service = UserService()


@router.post("/users", response_model=UserProfile)
async def add_user(user: NewUserProfile) -> UserProfile:
    try:
        return user_service.add_user(user)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
