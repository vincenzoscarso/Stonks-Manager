from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from backend.app.utils.get_supabase_client import getSupabaseClient, security


def getCurrentUser(
    credentials: HTTPAuthorizationCredentials = Depends(security), supabase: Client = Depends(getSupabaseClient)
) -> str:
    """
    Dependency that returns the current user's ID after checking for JWT token.
    """

    token = credentials.credentials

    try:
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
