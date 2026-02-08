from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_variant_model import ProductVariant, ProductVariantCreate
from typing import List
import uuid

class ProductVariantService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['product_variants']
    
    async def create_variant(self, variant_data: ProductVariantCreate) -> ProductVariant:
        variant_dict = variant_data.model_dump()
        variant_dict['id'] = str(uuid.uuid4())
        
        await self.collection.insert_one(variant_dict)
        return ProductVariant(**variant_dict)
    
    async def get_product_variants(self, product_id: str) -> List[ProductVariant]:
        cursor = self.collection.find({'parent_product_id': product_id})
        variants = await cursor.to_list(length=100)
        return [ProductVariant(**v) for v in variants]
    
    async def delete_variant(self, variant_id: str) -> bool:
        result = await self.collection.delete_one({'id': variant_id})
        return result.deleted_count > 0
    
    async def delete_product_variants(self, product_id: str) -> bool:
        result = await self.collection.delete_many({'parent_product_id': product_id})
        return result.deleted_count > 0