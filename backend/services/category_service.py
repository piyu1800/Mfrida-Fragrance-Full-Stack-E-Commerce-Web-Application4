from motor.motor_asyncio import AsyncIOMotorDatabase
from models.category_model import CategoryCreate, CategoryUpdate, Category
import uuid
from datetime import datetime, timezone
from typing import List, Optional

class CategoryService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.categories
    
    async def create_category(self, category_data: CategoryCreate) -> Category:
        category_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        doc = {
            **category_data.model_dump(),
            "id": category_id,
            "is_active": True,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self.collection.insert_one(doc)
        doc.pop("_id", None)
        return Category(**doc)
    
    async def get_categories(self, is_active: Optional[bool] = None) -> List[Category]:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        categories = await self.collection.find(query, {"_id": 0}).sort("display_order", 1).to_list(1000)
        return [Category(**cat) for cat in categories]
    
    async def get_category_by_id(self, category_id: str) -> Optional[Category]:
        category = await self.collection.find_one({"id": category_id}, {"_id": 0})
        if category:
            return Category(**category)
        return None
    
    async def update_category(self, category_id: str, category_data: CategoryUpdate) -> Optional[Category]:
        update_data = {k: v for k, v in category_data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_category_by_id(category_id)
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"id": category_id},
            {"$set": update_data}
        )
        
        return await self.get_category_by_id(category_id)
    
    async def delete_category(self, category_id: str) -> bool:
        result = await self.collection.delete_one({"id": category_id})
        return result.deleted_count > 0
