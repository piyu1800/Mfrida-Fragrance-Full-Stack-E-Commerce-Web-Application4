from fastapi import HTTPException, status, Depends
from decorators.authentication import verify_token

def require_admin(current_user: dict = Depends(verify_token)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_auth(current_user: dict = Depends(verify_token)):
    return current_user
