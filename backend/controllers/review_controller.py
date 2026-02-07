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
        limit: int = Query(50, ge=1, le=5000)
    ):
        return await review_service.get_reviews(
            product_id=product_id,
            is_approved=is_approved,
            skip=skip,
            limit=limit
        )
        
    @router.delete("/{review_id}")
    async def delete_review(review_id: str, current_user: dict = Depends(require_auth)):
        # Check if user is admin
        if current_user.get("role") == "admin":
            # Admin can delete any review
            result = await review_service.collection.delete_one({"id": review_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
            
            # Update product rating after deletion
            review = await review_service.collection.find_one({"id": review_id})
            if review:
                await review_service._update_product_rating(review["product_id"])
            
            return {"message": "Review deleted successfully"}
        else:
            # Regular user can only delete their own review
            success = await review_service.delete_review(review_id, current_user["user_id"])
            if not success:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found or unauthorized")
            return {"message": "Review deleted successfully"}
    
    @router.put("/user/{review_id}", response_model=Review)
    async def update_user_review(review_id: str, rating: int, comment: str, current_user: dict = Depends(require_auth)):
        review = await review_service.update_user_review(review_id, current_user["user_id"], rating, comment)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found or unauthorized")
        return review
    
    @router.put("/{review_id}", response_model=Review)
    async def update_review(review_id: str, review_data: ReviewUpdate, current_user: dict = Depends(require_admin)):
        review = await review_service.update_review(review_id, review_data)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        return review
    
    return router
