from fastapi import Depends, HTTPException, status
from supabase import Client
from backend.app.utils.get_supabase_client import get_supabase_client

def get_current_user(supabase: Client = Depends(get_supabase_client)) -> str:
    """
    Dependency that returns the current user's ID.
    It uses the Supabase client provided by get_supabase_client,
    which already has the session set.
    """
    try:
        # get_user() without arguments uses the session already set in the client
        response = supabase.auth.get_user()

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
