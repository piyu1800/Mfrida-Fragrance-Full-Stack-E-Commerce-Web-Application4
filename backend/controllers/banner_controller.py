from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.banner_model import Banner, BannerCreate, BannerUpdate
from decorators.authorization import require_admin
from typing import List
import uuid
from datetime import datetime, timezone

def get_banner_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/banners", tags=["Banners"])
    
    @router.post("/", response_model=Banner)
    async def create_banner(banner_data: BannerCreate, current_user: dict = Depends(require_admin)):
        banner_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        doc = {
            **banner_data.model_dump(),
            "id": banner_id,
            "is_active": True,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.banners.insert_one(doc)
        doc.pop("_id", None)
        return Banner(**doc)
    
    @router.get("/", response_model=List[Banner])
    async def get_banners(is_active: bool = None):
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        banners = await db.banners.find(query, {"_id": 0}).sort("display_order", 1).to_list(1000)
        return [Banner(**banner) for banner in banners]
    
    @router.get("/{banner_id}", response_model=Banner)
    async def get_banner(banner_id: str):
        banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
        if not banner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
        return Banner(**banner)
    
    @router.put("/{banner_id}", response_model=Banner)
    async def update_banner(banner_id: str, banner_data: BannerUpdate, current_user: dict = Depends(require_admin)):
        update_data = {k: v for k, v in banner_data.model_dump().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.banners.update_one(
                {"id": banner_id},
                {"$set": update_data}
            )
        
        banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
        if not banner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
        return Banner(**banner)
    
    @router.delete("/{banner_id}")
    async def delete_banner(banner_id: str, current_user: dict = Depends(require_admin)):
        result = await db.banners.delete_one({"id": banner_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
        return {"message": "Banner deleted successfully"}
    
    return router
