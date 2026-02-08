from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_model import ProductCreate, ProductUpdate, Product
from services.product_service import ProductService
from decorators.authorization import require_admin
from typing import List, Optional

def get_product_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/products", tags=["Products"])
    product_service = ProductService(db)
    
    @router.post("/", response_model=Product)
    async def create_product(product_data: ProductCreate, current_user: dict = Depends(require_admin)):
        return await product_service.create_product(product_data)
    
    @router.get("/", response_model=List[Product])
    async def get_products(
        category_id: Optional[str] = None,
        is_featured: Optional[bool] = None,
        is_best_selling: Optional[bool] = None,
        is_new_arrival: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        sort_by: str = Query("created_at", regex="^(name|price|final_price|created_at|average_rating)$"),
        sort_order: int = Query(-1, ge=-1, le=1),
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100)
    ):
        return await product_service.get_products(
            category_id=category_id,
            is_featured=is_featured,
            is_best_selling=is_best_selling,
            is_new_arrival=is_new_arrival,
            min_price=min_price,
            max_price=max_price,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
    
    @router.get("/slug/{slug}")
    async def get_product_by_slug(slug: str):
        product = await product_service.get_product_by_slug(slug)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
        # NEW: Get variants for this product
        variants = []
        if product.variant_group:
            variants = await product_service.get_variants_by_group(product.variant_group, product.id)
        
        # Return product with variants
        product_dict = product.model_dump()
        product_dict['variants'] = [v.model_dump() for v in variants]
        
        return product_dict
    
    # NEW: Get product variants endpoint
    @router.get("/{product_id}/variants", response_model=List[Product])
    async def get_product_variants(product_id: str):
        """Get all variants of a product"""
        variants = await product_service.get_product_variants(product_id)
        return variants
    
    # NEW: Get related products endpoint
    @router.get("/{product_id}/related", response_model=List[Product])
    async def get_related_products(product_id: str):
        """Get related products for a product"""
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
        if not product.related_products:
            return []
        
        related = await product_service.get_related_products_by_ids(product.related_products)
        return related
    
    @router.get("/{product_id}", response_model=Product)
    async def get_product(product_id: str):
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product
    
    @router.put("/{product_id}", response_model=Product)
    async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(require_admin)):
        product = await product_service.update_product(product_id, product_data)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product
    
    
    @router.get("/variant-groups/list")
    async def get_variant_groups():
        """Get all unique variant groups for dropdown"""
        groups = await product_service.get_all_variant_groups()
        return {"variant_groups": groups}
    
    @router.delete("/{product_id}")
    async def delete_product(product_id: str, current_user: dict = Depends(require_admin)):
        success = await product_service.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return {"message": "Product deleted successfully"}
    
    return router
