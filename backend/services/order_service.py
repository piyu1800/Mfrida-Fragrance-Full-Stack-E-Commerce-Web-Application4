from motor.motor_asyncio import AsyncIOMotorDatabase
from models.order_model import OrderCreate, OrderUpdate, Order, OrderStatus, PaymentStatus
import uuid
from datetime import datetime, timezone
from typing import List, Optional

class OrderService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.orders
    
    async def create_order(self, user_id: str, order_data: OrderCreate) -> Order:
        order_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        subtotal = sum(item.final_price * item.quantity for item in order_data.items)
        discount = sum((item.price - item.final_price) * item.quantity for item in order_data.items)
        total = subtotal
        
        doc = {
            "id": order_id,
            "user_id": user_id,
            "items": [item.model_dump() for item in order_data.items],
            "subtotal": round(subtotal, 2),
            "discount": round(discount, 2),
            "total": round(total, 2),
            "shipping_address": order_data.shipping_address.model_dump(),
            "order_status": OrderStatus.PENDING,
            "payment_status": PaymentStatus.PENDING,
            "tracking_updates": [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self.collection.insert_one(doc)
        doc.pop("_id", None)
        return Order(**doc)
    
    async def get_orders(
        self,
        user_id: Optional[str] = None,
        status: Optional[OrderStatus] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Order]:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if status:
            query["order_status"] = status
        
        orders = await self.collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return [Order(**order) for order in orders]
    
    async def get_order_by_id(self, order_id: str) -> Optional[Order]:
        order = await self.collection.find_one({"id": order_id}, {"_id": 0})
        if order:
            return Order(**order)
        return None
    
    async def update_order(self, order_id: str, order_data: OrderUpdate) -> Optional[Order]:
        update_data = {k: v for k, v in order_data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_order_by_id(order_id)
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"id": order_id},
            {"$set": update_data}
        )
        
        return await self.get_order_by_id(order_id)
    
    async def update_payment_info(self, order_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str, payment_method: str = None):
        update_data = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
            "payment_status": PaymentStatus.COMPLETED,
            "order_status": OrderStatus.CONFIRMED,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if payment_method:
            update_data["payment_method"] = payment_method
        
        # Add initial tracking update
        tracking_update = {
            "status": "confirmed",
            "message": "Order confirmed and payment received",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.collection.update_one(
            {"id": order_id},
            {
                "$set": update_data,
                "$push": {"tracking_updates": tracking_update}
            }
        )
