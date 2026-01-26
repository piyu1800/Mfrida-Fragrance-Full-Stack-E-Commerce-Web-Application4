from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.review_model import ReviewCreate, ReviewUpdate, Review
from services.review_service import ReviewService
from services.auth_service import AuthService
from decorators.authorization import require_auth, require_admin
from typing import List, Optional

def get_review_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/reviews", tags=["Reviews"])
    review_service = ReviewService(db)
    auth_service = AuthService(db)
    
    @router.post("/", response_model=Review)
    async def create_review(review_data: ReviewCreate, current_user: dict = Depends(require_auth)):
        user = await auth_service.get_user_by_id(current_user["user_id"])
        return await review_service.create_review(
            current_user["user_id"],
            user["name"],
            review_data
        )
    
    @router.get("/", response_model=List[Review])
    async def get_reviews(
        product_id: Optional[str] = None,
        is_approved: Optional[bool] = True,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100)
    ):
        return await review_service.get_reviews(
            product_id=product_id,
            is_approved=is_approved,
            skip=skip,
            limit=limit
        )
    
    @router.put("/{review_id}", response_model=Review)
    async def update_review(review_id: str, review_data: ReviewUpdate, current_user: dict = Depends(require_admin)):
        review = await review_service.update_review(review_id, review_data)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return review
    
    return router
