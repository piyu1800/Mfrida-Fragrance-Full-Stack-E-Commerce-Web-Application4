from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_variant_model import ProductVariantCreate, ProductVariant
from services.product_variant_service import ProductVariantService
from decorators.authorization import require_admin
from typing import List

def get_product_variant_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/product-variants", tags=["Product Variants"])
    service = ProductVariantService(db)
    
    @router.post("/", response_model=ProductVariant)
    async def create_product_variant(
        variant_data: ProductVariantCreate,
        current_user: dict = Depends(require_admin)
    ):
        return await service.create_variant(variant_data)
    
    @router.get("/product/{product_id}", response_model=List[ProductVariant])
    async def get_product_variants(product_id: str):
        return await service.get_product_variants(product_id)
    
    @router.delete("/{variant_id}")
    async def delete_product_variant(
        variant_id: str,
        current_user: dict = Depends(require_admin)
    ):
        success = await service.delete_variant(variant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
        return {"message": "Variant deleted successfully"}
    
    return router