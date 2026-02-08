from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.frequently_bought_model import FrequentlyBoughtCreate, FrequentlyBought
from services.frequently_bought_service import FrequentlyBoughtService
from decorators.authorization import require_admin
from typing import Optional

def get_frequently_bought_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/frequently-bought", tags=["Frequently Bought Together"])
    service = FrequentlyBoughtService(db)
    
    @router.post("/", response_model=FrequentlyBought)
    async def create_or_update_frequently_bought(
        data: FrequentlyBoughtCreate,
        current_user: dict = Depends(require_admin)
    ):
        return await service.create_or_update(data)
    
    @router.get("/product/{product_id}", response_model=Optional[FrequentlyBought])
    async def get_frequently_bought(product_id: str):
        return await service.get_by_product(product_id)
    
    @router.delete("/product/{product_id}")
    async def delete_frequently_bought(
        product_id: str,
        current_user: dict = Depends(require_admin)
    ):
        success = await service.delete_by_product(product_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return {"message": "Deleted successfully"}
    
    return router