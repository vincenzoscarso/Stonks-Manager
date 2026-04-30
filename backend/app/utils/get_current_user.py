from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.utils.get_supabase_client import get_supabase_client, security

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client)
) -> str:
    """
    Dependency that returns the current user's ID.
    """
    token = credentials.credentials
    try:
        # Pass the token explicitly to get_user
        response = supabase.auth.get_user(token)

        if response and response.user:
            return str(response.user.id)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e
