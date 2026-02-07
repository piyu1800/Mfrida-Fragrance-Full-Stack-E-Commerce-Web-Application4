from motor.motor_asyncio import AsyncIOMotorDatabase
from models.review_model import ReviewCreate, ReviewUpdate, Review
import uuid
from datetime import datetime, timezone
from typing import List, Optional

class ReviewService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.reviews
        self.products_collection = db.products
    
    async def create_review(self, user_id: str, user_name: str, review_data: ReviewCreate) -> Review:
        review_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        doc = {
            "id": review_id,
            "product_id": review_data.product_id,
            "user_id": user_id,
            "user_name": user_name,
            "rating": review_data.rating,
            "comment": review_data.comment,
            "is_approved": False,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self.collection.insert_one(doc)
        doc.pop("_id", None)
        return Review(**doc)
    
    async def get_reviews(
        self,
        product_id: Optional[str] = None,
        is_approved: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Review]:
        query = {}
        if product_id:
            query["product_id"] = product_id
        if is_approved is not None:
            query["is_approved"] = is_approved
        
        reviews = await self.collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return [Review(**review) for review in reviews]
    
    async def update_review(self, review_id: str, review_data: ReviewUpdate) -> Optional[Review]:
        update_data = {k: v for k, v in review_data.model_dump().items() if v is not None}
        if not update_data:
            review = await self.collection.find_one({"id": review_id}, {"_id": 0})
            return Review(**review) if review else None
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"id": review_id},
            {"$set": update_data}
        )
        
        review = await self.collection.find_one({"id": review_id}, {"_id": 0})
        
        if review and "is_approved" in update_data:
            await self._update_product_rating(review["product_id"])
        
        return Review(**review) if review else None
    
    async def _update_product_rating(self, product_id: str):
        reviews = await self.get_reviews(product_id=product_id, is_approved=True)
        
        if reviews:
            total_rating = sum(review.rating for review in reviews)
            average_rating = total_rating / len(reviews)
            
            await self.products_collection.update_one(
                {"id": product_id},
                {"$set": {
                    "average_rating": round(average_rating, 1),
                    "total_reviews": len(reviews)
                }}
            )
                
    async def delete_review(self, review_id: str, user_id: str) -> bool:
            # Check if review belongs to user
            review = await self.collection.find_one({"id": review_id, "user_id": user_id})
            if not review:
                return False
            
            product_id = review["product_id"]
            result = await self.collection.delete_one({"id": review_id, "user_id": user_id})
            
            if result.deleted_count > 0:
                await self._update_product_rating(product_id)
                return True
            return False
        
    async def update_user_review(self, review_id: str, user_id: str, rating: int, comment: str) -> Optional[Review]:
            # Check if review belongs to user
            review = await self.collection.find_one({"id": review_id, "user_id": user_id})
            if not review:
                return None
            
            update_data = {
                "rating": rating,
                "comment": comment,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.collection.update_one(
                {"id": review_id, "user_id": user_id},
                {"$set": update_data}
            )
            
            updated_review = await self.collection.find_one({"id": review_id}, {"_id": 0})
            
            if updated_review:
                await self._update_product_rating(updated_review["product_id"])
            
            return Review(**updated_review) if updated_review else None
        
    async def get_user_review_for_product(self, user_id: str, product_id: str) -> Optional[Review]:
            review = await self.collection.find_one({"user_id": user_id, "product_id": product_id}, {"_id": 0})
            return Review(**review) if review else None
