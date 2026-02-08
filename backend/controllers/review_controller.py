from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.review_model import ReviewCreate, ReviewUpdate, Review
from services.review_service import ReviewService
from decorators.authorization import require_auth, require_admin
from typing import List, Optional

def get_review_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/reviews", tags=["Reviews"])
    review_service = ReviewService(db)
    
    @router.post("/", response_model=Review)
    async def create_review(review_data: ReviewCreate, current_user: dict = Depends(require_auth)):
        return await review_service.create_review(review_data, current_user)
    
    @router.get("/", response_model=List[Review])
    async def get_reviews(
        product_id: Optional[str] = None,
        is_approved: Optional[bool] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100)
    ):
        return await review_service.get_reviews(product_id, is_approved, skip, limit)
    
    @router.get("/stats/{product_id}")
    async def get_review_stats(product_id: str):
        """Get review statistics for a product"""
        return await review_service.get_review_stats(product_id)
    
    @router.get("/{review_id}", response_model=Review)
    async def get_review(review_id: str):
        review = await review_service.get_review_by_id(review_id)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return review
    
    @router.put("/user/{review_id}", response_model=Review)
    async def update_user_review(
        review_id: str,
        rating: int = Query(..., ge=1, le=5),
        comment: str = Query(...),
        current_user: dict = Depends(require_auth)
    ):
        review = await review_service.update_user_review(review_id, rating, comment, current_user)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found or unauthorized")
        return review
    
    @router.put("/{review_id}", response_model=Review)
    async def update_review(review_id: str, review_data: ReviewUpdate, current_user: dict = Depends(require_admin)):
        review = await review_service.update_review(review_id, review_data)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return review
    
    @router.delete("/{review_id}")
    async def delete_review(review_id: str, current_user: dict = Depends(require_auth)):
        success = await review_service.delete_review(review_id, current_user)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found or unauthorized")
        return {"message": "Review deleted successfully"}
    
    return router
