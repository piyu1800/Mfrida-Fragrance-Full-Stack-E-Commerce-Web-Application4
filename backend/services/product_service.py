from motor.motor_asyncio import AsyncIOMotorDatabase
from models.product_model import ProductCreate, ProductUpdate, Product
import uuid
from datetime import datetime, timezone
from typing import List, Optional

class ProductService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.products
    
    async def create_product(self, product_data: ProductCreate) -> Product:
        product_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        final_price = product_data.price * (1 - product_data.discount / 100)
        
        doc = {
            **product_data.model_dump(),
            "id": product_id,
            "final_price": round(final_price, 2),
            "average_rating": 0,
            "total_reviews": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self.collection.insert_one(doc)
        doc.pop("_id", None)
        return Product(**doc)
    
    async def get_products(
        self,
        category_id: Optional[str] = None,
        is_featured: Optional[bool] = None,
        is_best_selling: Optional[bool] = None,
        is_new_arrival: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: int = -1,
        skip: int = 0,
        limit: int = 50
    ) -> List[Product]:
        query = {}
        
        if category_id:
            query["category_id"] = category_id
        if is_featured is not None:
            query["is_featured"] = is_featured
        if is_best_selling is not None:
            query["is_best_selling"] = is_best_selling
        if is_new_arrival is not None:
            query["is_new_arrival"] = is_new_arrival
        if min_price is not None or max_price is not None:
            query["final_price"] = {}
            if min_price is not None:
                query["final_price"]["$gte"] = min_price
            if max_price is not None:
                query["final_price"]["$lte"] = max_price
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"brand": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        products = await self.collection.find(query, {"_id": 0}).sort(sort_by, sort_order).skip(skip).limit(limit).to_list(limit)
        return [Product(**prod) for prod in products]
    
    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        product = await self.collection.find_one({"id": product_id}, {"_id": 0})
        if product:
            return Product(**product)
        return None
    
    async def get_product_by_slug(self, slug: str) -> Optional[Product]:
        product = await self.collection.find_one({"slug": slug}, {"_id": 0})
        if product:
            return Product(**product)
        return None
    
    # NEW: Get product variants
    async def get_product_variants(self, product_id: str) -> List[Product]:
            """Get all variants of a product (products with same variant_group), excluding current"""
            product = await self.get_product_by_id(product_id)
            print("***********************************")
            print(product)
            if not product or not product.variant_group:
                return []
            print("-----------------product varient------------------", product.variant_group)
            
            # Find all products with the same variant_group, excluding the current product
            variants = await self.collection.find(
                {
                    "variant_group": product.variant_group,
                    "id": {"$ne": product_id}
                },
                {"_id": 0}
            ).to_list(100)
            print("----------------varients-------------------")
            print(variants)
            
            # Sort by variant_name if available (e.g., "5 ML", "8 ML", "12 ML")
            variants_list = [Product(**variant) for variant in variants]
            variants_list.sort(key=lambda x: float(''.join(filter(str.isdigit, x.variant_name or '0'))) if x.variant_name else 0)
            
            return variants_list
    
    # NEW: Get related products by IDs
    async def get_related_products_by_ids(self, product_ids: List[str]) -> List[Product]:
        """Get products by their IDs"""
        if not product_ids:
            return []
        
        products = await self.collection.find(
            {"id": {"$in": product_ids}},
            {"_id": 0}
        ).to_list(len(product_ids))
        
        return [Product(**prod) for prod in products]
    
    async def update_product(self, product_id: str, product_data: ProductUpdate) -> Optional[Product]:
        update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_product_by_id(product_id)
        
        if "price" in update_data or "discount" in update_data:
            product = await self.get_product_by_id(product_id)
            price = update_data.get("price", product.price)
            discount = update_data.get("discount", product.discount)
            update_data["final_price"] = round(price * (1 - discount / 100), 2)
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"id": product_id},
            {"$set": update_data}
        )
        
        return await self.get_product_by_id(product_id)
    
    async def delete_product(self, product_id: str) -> bool:
        result = await self.collection.delete_one({"id": product_id})
        return result.deleted_count > 0
    
    async def update_product_rating(self, product_id: str, average_rating: float, total_reviews: int):
        await self.collection.update_one(
            {"id": product_id},
            {"$set": {
                "average_rating": round(average_rating, 1),
                "total_reviews": total_reviews
            }}
        )
