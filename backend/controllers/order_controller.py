from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.order_model import OrderCreate, OrderUpdate, Order, OrderStatus, OrderTrackingUpdate
from services.order_service import OrderService
from services.payment_service import PaymentService
from decorators.authorization import require_auth, require_admin
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

class PaymentVerification(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: Optional[str] = None

def get_order_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/orders", tags=["Orders"])
    order_service = OrderService(db)
    
    @router.post("/", response_model=Order)
    async def create_order(order_data: OrderCreate, current_user: dict = Depends(require_auth)):
        return await order_service.create_order(current_user["user_id"], order_data)
    
    @router.post("/create-payment", response_model=dict)
    async def create_payment_order(order_id: str, current_user: dict = Depends(require_auth)):
        order = await order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        razorpay_order = PaymentService.create_razorpay_order(order.total)
        
        return {
            "razorpay_order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "order_id": order_id
        }
    
    @router.post("/verify-payment")
    async def verify_payment(verification: PaymentVerification, current_user: dict = Depends(require_auth)):
        order = await order_service.get_order_by_id(verification.order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        is_valid = PaymentService.verify_payment_signature(
            verification.razorpay_order_id,
            verification.razorpay_payment_id,
            verification.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")
        
        await order_service.update_payment_info(
            verification.order_id,
            verification.razorpay_order_id,
            verification.razorpay_payment_id,
            verification.razorpay_signature,
            verification.payment_method
        )
        
        return {"message": "Payment verified successfully", "success": True}
    
    @router.get("/", response_model=List[Order])
    async def get_orders(
        status_filter: Optional[OrderStatus] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100),
        current_user: dict = Depends(require_auth)
    ):
        if current_user["role"] == "admin":
            return await order_service.get_orders(status=status_filter, skip=skip, limit=limit)
        else:
            return await order_service.get_orders(user_id=current_user["user_id"], status=status_filter, skip=skip, limit=limit)
    
    @router.get("/{order_id}", response_model=Order)
    async def get_order(order_id: str, current_user: dict = Depends(require_auth)):
        order = await order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        if current_user["role"] != "admin" and order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        return order
    
    @router.put("/{order_id}", response_model=Order)
    async def update_order(order_id: str, order_data: OrderUpdate, current_user: dict = Depends(require_admin)):
        order = await order_service.update_order(order_id, order_data)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order
    
    @router.post("/{order_id}/tracking", response_model=Order)
    async def add_tracking_update(order_id: str, tracking_data: OrderTrackingUpdate, current_user: dict = Depends(require_admin)):
        order = await order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        # Add tracking update
        tracking_update = {
            "status": tracking_data.status,
            "message": tracking_data.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.update_one(
            {"id": order_id},
            {
                "$push": {"tracking_updates": tracking_update},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        updated_order = await order_service.get_order_by_id(order_id)
        return updated_order
    
    return router
