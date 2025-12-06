"""Authentication utilities for FastAPI."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase import get_supabase_client
from typing import Optional

# Use auto_error=False to prevent automatic 403 on missing credentials
# This allows CORS middleware to handle OPTIONS requests properly
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Validate JWT token and return user information.
    
    CORS middleware handles OPTIONS requests before this dependency is called.
    This function only validates actual API requests with credentials.
    
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Check if credentials are provided
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    supabase = get_supabase_client()
    
    try:
        # Validate token with Supabase
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "id": user.user.id,
            "email": user.user.email,
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

