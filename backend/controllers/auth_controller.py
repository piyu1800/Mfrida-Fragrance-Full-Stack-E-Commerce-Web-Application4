from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user_model import UserCreate, UserLogin, UserResponse, Address
from services.auth_service import AuthService
from decorators.authentication import create_access_token, verify_token
from decorators.authorization import require_auth

def get_auth_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["Authentication"])
    auth_service = AuthService(db)
    
    @router.post("/signup", response_model=dict)
    async def signup(user_data: UserCreate):
        try:
            user = await auth_service.create_user(user_data)
            token = create_access_token({
                "sub": user.id,
                "email": user.email,
                "role": user.role
            })
            
            return {
                "token": token,
                "user": user.model_dump()
            }
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    @router.post("/login", response_model=dict)
    async def login(credentials: UserLogin):
        user = await auth_service.authenticate_user(credentials.email, credentials.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"]
        })
        
        user.pop("password", None)
        
        return {
            "token": token,
            "user": user
        }
    
    @router.get("/me", response_model=dict)
    async def get_current_user(current_user: dict = Depends(require_auth)):
        user = await auth_service.get_user_by_id(current_user["user_id"])
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
    
    @router.post("/address", response_model=dict)
    async def add_address(address: Address, current_user: dict = Depends(require_auth)):
        user = await auth_service.add_address(current_user["user_id"], address)
        return user
    
    return router
