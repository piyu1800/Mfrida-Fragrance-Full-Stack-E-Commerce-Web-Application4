from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_image_model import ProductImage, ProductImageCreate, ProductImageUpdate
from typing import List, Optional
import uuid

class ProductImageService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['product_images']
    
    async def create_image(self, image_data: ProductImageCreate) -> ProductImage:
        image_dict = image_data.model_dump()
        image_dict['id'] = str(uuid.uuid4())
        
        # If this is marked as primary, unset other primary images for this product
        if image_dict.get('is_primary'):
            await self.collection.update_many(
                {'product_id': image_dict['product_id']},
                {'$set': {'is_primary': False}}
            )
        
        await self.collection.insert_one(image_dict)
        return ProductImage(**image_dict)
    
    async def get_product_images(self, product_id: str) -> List[ProductImage]:
        cursor = self.collection.find({'product_id': product_id}).sort('sort_order', 1)
        images = await cursor.to_list(length=100)
        return [ProductImage(**img) for img in images]
    
    async def update_image(self, image_id: str, update_data: ProductImageUpdate) -> Optional[ProductImage]:
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        if not update_dict:
            return None
        
        # If setting as primary, unset others
        if update_dict.get('is_primary'):
            image = await self.collection.find_one({'id': image_id})
            if image:
                await self.collection.update_many(
                    {'product_id': image['product_id'], 'id': {'$ne': image_id}},
                    {'$set': {'is_primary': False}}
                )
        
        result = await self.collection.find_one_and_update(
            {'id': image_id},
            {'$set': update_dict},
            return_document=True
        )
        return ProductImage(**result) if result else None
    
    async def delete_image(self, image_id: str) -> bool:
        result = await self.collection.delete_one({'id': image_id})
        return result.deleted_count > 0
    
    async def delete_product_images(self, product_id: str) -> bool:
        result = await self.collection.delete_many({'product_id': product_id})
        return result.deleted_count > 0