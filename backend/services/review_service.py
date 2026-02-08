from motor.motor_asyncio import AsyncIOMotorDatabase
from models.review_model import Review, ReviewCreate, ReviewUpdate
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class ReviewService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['reviews']
        self.products_collection = db['products']
    
    async def create_review(self, review_data: ReviewCreate, current_user: dict) -> Review:
        review_dict = review_data.model_dump()
        review_dict['id'] = str(uuid.uuid4())
        review_dict['user_id'] = current_user['id']
        review_dict['user_name'] = current_user.get('name', current_user.get('email', 'Anonymous'))
        review_dict['is_approved'] = False
        
        await self.collection.insert_one(review_dict)
        
        # Update product rating
        await self._update_product_rating(review_data.product_id)
        
        return Review(**review_dict)
    
    async def get_reviews(
        self,
        product_id: Optional[str] = None,
        is_approved: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Review]:
        query = {}
        if product_id:
            query['product_id'] = product_id
        if is_approved is not None:
            query['is_approved'] = is_approved
        
        cursor = self.collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        reviews = await cursor.to_list(length=limit)
        return [Review(**review) for review in reviews]
    
    async def get_review_stats(self, product_id: str):
        """Get review statistics for a product"""
        pipeline = [
            {'$match': {'product_id': product_id, 'is_approved': True}},
            {'$group': {
                '_id': '$rating',
                'count': {'$sum': 1}
            }}
        ]
        
        rating_distribution = {}
        total_reviews = 0
        total_rating_sum = 0
        
        async for doc in self.collection.aggregate(pipeline):
            rating = doc['_id']
            count = doc['count']
            rating_distribution[rating] = count
            total_reviews += count
            total_rating_sum += rating * count
        
        # Fill in missing ratings with 0
        for i in range(1, 6):
            if i not in rating_distribution:
                rating_distribution[i] = 0
        
        average_rating = total_rating_sum / total_reviews if total_reviews > 0 else 0
        
        return {
            'average_rating': round(average_rating, 1),
            'total_reviews': total_reviews,
            'rating_distribution': rating_distribution
        }
    
    async def get_review_by_id(self, review_id: str) -> Optional[Review]:
        review = await self.collection.find_one({'id': review_id})
        return Review(**review) if review else None
    
    async def update_review(self, review_id: str, update_data: ReviewUpdate) -> Optional[Review]:
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        if not update_dict:
            return None
        
        update_dict['updated_at'] = datetime.now(timezone.utc)
        
        result = await self.collection.find_one_and_update(
            {'id': review_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            # Update product rating
            await self._update_product_rating(result['product_id'])
            return Review(**result)
        return None
    
    async def update_user_review(self, review_id: str, rating: int, comment: str, current_user: dict) -> Optional[Review]:
        # Find review and check ownership
        review = await self.collection.find_one({'id': review_id, 'user_id': current_user['id']})
        if not review:
            return None
        
        update_dict = {
            'rating': rating,
            'comment': comment,
            'is_approved': False,  # Reset approval status
            'updated_at': datetime.now(timezone.utc)
        }
        
        result = await self.collection.find_one_and_update(
            {'id': review_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            await self._update_product_rating(result['product_id'])
            return Review(**result)
        return None
    
    async def delete_review(self, review_id: str, current_user: dict) -> bool:
        # Check if user is admin or review owner
        review = await self.collection.find_one({'id': review_id})
        if not review:
            return False
        
        is_admin = current_user.get('role') == 'admin'
        is_owner = review['user_id'] == current_user['id']
        
        if not (is_admin or is_owner):
            return False
        
        product_id = review['product_id']
        result = await self.collection.delete_one({'id': review_id})
        
        if result.deleted_count > 0:
            await self._update_product_rating(product_id)
            return True
        return False
    
    async def _update_product_rating(self, product_id: str):
        """Update product's average rating and total reviews"""
        pipeline = [
            {'$match': {'product_id': product_id, 'is_approved': True}},
            {'$group': {
                '_id': None,
                'average_rating': {'$avg': '$rating'},
                'total_reviews': {'$sum': 1}
            }}
        ]
        
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            await self.products_collection.update_one(
                {'id': product_id},
                {'$set': {
                    'average_rating': round(result[0]['average_rating'], 1),
                    'total_reviews': result[0]['total_reviews']
                }}
            )
        else:
            await self.products_collection.update_one(
                {'id': product_id},
                {'$set': {'average_rating': 0, 'total_reviews': 0}}
            )