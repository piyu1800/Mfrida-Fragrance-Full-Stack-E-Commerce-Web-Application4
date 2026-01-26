from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.category_model import CategoryCreate, CategoryUpdate, Category
from services.category_service import CategoryService
from decorators.authorization import require_admin
from typing import List, Optional

def get_category_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/categories", tags=["Categories"])
    category_service = CategoryService(db)
    
    @router.post("/", response_model=Category)
    async def create_category(category_data: CategoryCreate, current_user: dict = Depends(require_admin)):
        return await category_service.create_category(category_data)
    
    @router.get("/", response_model=List[Category])
    async def get_categories(is_active: Optional[bool] = None):
        return await category_service.get_categories(is_active=is_active)
    
    @router.get("/{category_id}", response_model=Category)
    async def get_category(category_id: str):
        category = await category_service.get_category_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category
    
    @router.put("/{category_id}", response_model=Category)
    async def update_category(category_id: str, category_data: CategoryUpdate, current_user: dict = Depends(require_admin)):
        category = await category_service.update_category(category_id, category_data)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category
    
    @router.delete("/{category_id}")
    async def delete_category(category_id: str, current_user: dict = Depends(require_admin)):
        success = await category_service.delete_category(category_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return {"message": "Category deleted successfully"}
    
    return router
