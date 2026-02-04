from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.wishlist_service import WishlistService
from decorators.authorization import require_auth
from pydantic import BaseModel

class WishlistRequest(BaseModel):
    product_id: str

def get_wishlist_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/wishlist", tags=["Wishlist"])
    wishlist_service = WishlistService(db)
    
    @router.post("/add")
    async def add_to_wishlist(
        request: WishlistRequest,
        current_user: dict = Depends(require_auth)
    ):
        try:
            result = await wishlist_service.add_to_wishlist(
                current_user["user_id"],
                request.product_id
            )
            return result
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
    @router.post("/remove")
    async def remove_from_wishlist(
        request: WishlistRequest,
        current_user: dict = Depends(require_auth)
    ):
        result = await wishlist_service.remove_from_wishlist(
            current_user["user_id"],
            request.product_id
        )
        return result
    
    @router.get("/")
    async def get_wishlist(current_user: dict = Depends(require_auth)):
        products = await wishlist_service.get_wishlist(current_user["user_id"])
        return products
    
    @router.get("/check/{product_id}")
    async def check_in_wishlist(
        product_id: str,
        current_user: dict = Depends(require_auth)
    ):
        in_wishlist = await wishlist_service.check_in_wishlist(
            current_user["user_id"],
            product_id
        )
        return {"in_wishlist": in_wishlist}
    
    return router