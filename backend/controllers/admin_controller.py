from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.homepage_model import HomepageConfig, HomepageConfigUpdate
from models.navigation_model import NavigationItem, NavigationItemCreate, NavigationItemUpdate
from models.user_model import User
from decorators.authorization import require_admin
import uuid
from datetime import datetime, timezone
from typing import List

def get_admin_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/admin", tags=["Admin"])
    
    @router.get("/dashboard")
    async def get_dashboard_stats(current_user: dict = Depends(require_admin)):
        # Get stats
        total_orders = await db.orders.count_documents({})
        total_products = await db.products.count_documents({})
        total_users = await db.users.count_documents({"role": "customer"})
        pending_orders = await db.orders.count_documents({"order_status": "pending"})
        
        # Calculate total revenue
        completed_orders = await db.orders.find({"payment_status": "completed"}).to_list(10000)
        total_revenue = sum(order.get("total", 0) for order in completed_orders)
        
        # Get recent orders
        recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
        
        # Get low stock products
        low_stock = await db.products.find({"stock": {"$lt": 10}}, {"_id": 0}).limit(10).to_list(10)
        
        return {
            "total_orders": total_orders,
            "total_products": total_products,
            "total_users": total_users,
            "pending_orders": pending_orders,
            "total_revenue": total_revenue,
            "recent_orders": recent_orders,
            "low_stock_products": low_stock
        }
    
    @router.get("/users", response_model=List[User])
    async def get_all_users(current_user: dict = Depends(require_admin)):
        users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
        return [User(**user) for user in users]
    
    @router.get("/homepage", response_model=HomepageConfig)
    async def get_homepage_config():
        config = await db.homepage_config.find_one({"id": "homepage_config"}, {"_id": 0})
        if not config:
            default_config = HomepageConfig(id="homepage_config")
            doc = default_config.model_dump()
            doc["updated_at"] = doc["updated_at"].isoformat()
            await db.homepage_config.insert_one(doc)
            return default_config
        return HomepageConfig(**config)
    
    @router.put("/homepage", response_model=HomepageConfig)
    async def update_homepage_config(config_data: HomepageConfigUpdate, current_user: dict = Depends(require_admin)):
        update_data = {k: v for k, v in config_data.model_dump().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.homepage_config.update_one(
                {"id": "homepage_config"},
                {"$set": update_data},
                upsert=True
            )
        
        config = await db.homepage_config.find_one({"id": "homepage_config"}, {"_id": 0})
        return HomepageConfig(**config)
    
    @router.post("/navigation", response_model=NavigationItem)
    async def create_navigation_item(nav_data: NavigationItemCreate, current_user: dict = Depends(require_admin)):
        nav_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        doc = {
            **nav_data.model_dump(),
            "id": nav_id,
            "is_active": True,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.navigation_items.insert_one(doc)
        doc.pop("_id", None)
        return NavigationItem(**doc)
    
    @router.get("/navigation", response_model=List[NavigationItem])
    async def get_navigation_items():
        items = await db.navigation_items.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
        return [NavigationItem(**item) for item in items]
    
    @router.put("/navigation/{nav_id}", response_model=NavigationItem)
    async def update_navigation_item(nav_id: str, nav_data: NavigationItemUpdate, current_user: dict = Depends(require_admin)):
        update_data = {k: v for k, v in nav_data.model_dump().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.navigation_items.update_one(
                {"id": nav_id},
                {"$set": update_data}
            )
        
        nav_item = await db.navigation_items.find_one({"id": nav_id}, {"_id": 0})
        if not nav_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Navigation item not found")
        return NavigationItem(**nav_item)
    
    @router.delete("/navigation/{nav_id}")
    async def delete_navigation_item(nav_id: str, current_user: dict = Depends(require_admin)):
        result = await db.navigation_items.delete_one({"id": nav_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Navigation item not found")
        return {"message": "Navigation item deleted successfully"}
    
    return router
