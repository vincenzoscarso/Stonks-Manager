from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.utils.get_required_env import get_required_env

security = HTTPBearer()

def get_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    """
    Dependency that returns a Supabase client instance configured with the user's session.
    This avoids race conditions by providing a unique client instance per request.
    """
    token = credentials.credentials
    supabase_url = get_required_env("SUPABASE_URL")
    supabase_key = get_required_env("SUPABASE_KEY")

    client = create_client(supabase_url, supabase_key)

    try:
        # Authenticate the PostgREST client for RLS
        client.postgrest.auth(token)
        
        return client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from e
