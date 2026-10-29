from fastapi import Header, HTTPException, status
from backend.app.core.config import settings

def get_current_admin(
    x_admin_key: str = Header(None, alias="X-Admin-Key"),
    authorization: str = Header(None, alias="Authorization")
) -> str:
    """
    Validates administrative access token via X-Admin-Key or Authorization Bearer header.
    Never bypasses backend authentication.
    """
    token = None
    if x_admin_key:
        token = x_admin_key.strip()
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()

    if not token or token != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid Administrator API Key required to access this endpoint.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return "admin@rvitm.edu.in"
