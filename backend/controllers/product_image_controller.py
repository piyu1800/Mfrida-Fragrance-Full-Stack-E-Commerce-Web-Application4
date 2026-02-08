from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_image_model import ProductImageCreate, ProductImageUpdate, ProductImage
from services.product_image_service import ProductImageService
from decorators.authorization import require_admin
from typing import List

def get_product_image_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/product-images", tags=["Product Images"])
    service = ProductImageService(db)
    
    @router.post("/", response_model=ProductImage)
    async def create_product_image(
        image_data: ProductImageCreate,
        current_user: dict = Depends(require_admin)
    ):
        return await service.create_image(image_data)
    
    @router.get("/product/{product_id}", response_model=List[ProductImage])
    async def get_product_images(product_id: str):
        return await service.get_product_images(product_id)
    
    @router.put("/{image_id}", response_model=ProductImage)
    async def update_product_image(
        image_id: str,
        update_data: ProductImageUpdate,
        current_user: dict = Depends(require_admin)
    ):
        result = await service.update_image(image_id, update_data)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        return result
    
    @router.delete("/{image_id}")
    async def delete_product_image(
        image_id: str,
        current_user: dict = Depends(require_admin)
    ):
        success = await service.delete_image(image_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        return {"message": "Image deleted successfully"}
    
    return router

