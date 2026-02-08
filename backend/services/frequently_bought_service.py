from motor.motor_asyncio import AsyncIOMotorDatabase
from models.frequently_bought_model import FrequentlyBought, FrequentlyBoughtCreate, FrequentlyBoughtUpdate
from typing import Optional
from datetime import datetime, timezone
import uuid

class FrequentlyBoughtService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['frequently_bought_together']
    
    async def create_or_update(self, data: FrequentlyBoughtCreate) -> FrequentlyBought:
        existing = await self.collection.find_one({'product_id': data.product_id})
        
        if existing:
            # Update existing
            update_dict = data.model_dump()
            update_dict['updated_at'] = datetime.now(timezone.utc)
            
            result = await self.collection.find_one_and_update(
                {'product_id': data.product_id},
                {'$set': update_dict},
                return_document=True
            )
            return FrequentlyBought(**result)
        else:
            # Create new
            fbt_dict = data.model_dump()
            fbt_dict['id'] = str(uuid.uuid4())
            
            await self.collection.insert_one(fbt_dict)
            return FrequentlyBought(**fbt_dict)
    
    async def get_by_product(self, product_id: str) -> Optional[FrequentlyBought]:
        result = await self.collection.find_one({'product_id': product_id})
        return FrequentlyBought(**result) if result else None
    
    async def delete_by_product(self, product_id: str) -> bool:
        result = await self.collection.delete_one({'product_id': product_id})
        return result.deleted_count > 0