from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

class WishlistService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db.users
        self.products_collection = db.products
    
    async def add_to_wishlist(self, user_id: str, product_id: str) -> dict:
        """Add product to user's wishlist"""
        # Check if product exists
        product = await self.products_collection.find_one({"id": product_id})
        if not product:
            raise ValueError("Product not found")
        
        # Check if already in wishlist
        user = await self.users_collection.find_one({"id": user_id})
        if not user:
            raise ValueError("User not found")
        
        wishlist = user.get("wishlist", [])
        if product_id in wishlist:
            return {"message": "Product already in wishlist", "wishlist": wishlist}
        
        # Add to wishlist
        await self.users_collection.update_one(
            {"id": user_id},
            {"$addToSet": {"wishlist": product_id}}
        )
        
        wishlist.append(product_id)
        return {"message": "Product added to wishlist", "wishlist": wishlist}
    
    async def remove_from_wishlist(self, user_id: str, product_id: str) -> dict:
        """Remove product from user's wishlist"""
        result = await self.users_collection.update_one(
            {"id": user_id},
            {"$pull": {"wishlist": product_id}}
        )
        
        if result.modified_count == 0:
            return {"message": "Product not in wishlist"}
        
        user = await self.users_collection.find_one({"id": user_id})
        wishlist = user.get("wishlist", [])
        return {"message": "Product removed from wishlist", "wishlist": wishlist}
    
    async def get_wishlist(self, user_id: str) -> List[dict]:
        """Get user's wishlist with product details"""
        user = await self.users_collection.find_one({"id": user_id})
        if not user:
            return []
        
        wishlist_ids = user.get("wishlist", [])
        if not wishlist_ids:
            return []
        
        # Fetch all products in wishlist
        products = await self.products_collection.find(
            {"id": {"$in": wishlist_ids}},
            {"_id": 0}
        ).to_list(length=None)
        
        return products
    
    async def check_in_wishlist(self, user_id: str, product_id: str) -> bool:
        """Check if product is in user's wishlist"""
        user = await self.users_collection.find_one({"id": user_id})
        if not user:
            return False
        
        wishlist = user.get("wishlist", [])
        return product_id in wishlist