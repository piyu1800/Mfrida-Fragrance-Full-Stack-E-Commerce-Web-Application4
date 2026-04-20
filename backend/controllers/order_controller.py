from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.order_model import OrderCreate, OrderUpdate, Order, OrderStatus, OrderTrackingUpdate
from services.order_service import OrderService
from services.phonepe_service import PhonePeService
from decorators.authorization import require_auth, require_admin
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import base64
import json
import os

FRONTEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").replace("/api", "").replace(":8001", ":3000")
BACKEND_API_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001") + "/api"

class PaymentStatusCheck(BaseModel):
    order_id: str
    merchant_transaction_id: str

def get_order_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/orders", tags=["Orders"])
    order_service = OrderService(db)
    
    @router.post("/", response_model=Order)
    async def create_order(order_data: OrderCreate, current_user: dict = Depends(require_auth)):
        return await order_service.create_order(current_user["user_id"], order_data)
    
    @router.post("/create-phonepe-payment", response_model=dict)
    async def create_phonepe_payment(order_id: str, current_user: dict = Depends(require_auth)):
        """
        Create PhonePe payment for an order
        """
        order = await order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # PhonePe redirect and callback URLs
        redirect_url = f"{FRONTEND_URL}/payment-status?order_id={order_id}"
        callback_url = f"{BACKEND_API_URL}/orders/phonepe-webhook"
        
        # Create PhonePe payment order
        phonepe_response = PhonePeService.create_payment_order(
            amount=order.total,
            merchant_order_id=order_id,
            redirect_url=redirect_url,
            callback_url=callback_url,
            merchant_user_id=current_user["user_id"]
        )
        
        if not phonepe_response.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=phonepe_response.get("error", "Payment initiation failed")
            )
        
        # Store merchant transaction ID in order
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "phonepe_merchant_transaction_id": phonepe_response["merchant_transaction_id"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "merchant_transaction_id": phonepe_response["merchant_transaction_id"],
            "redirect_url": phonepe_response["redirect_url"],
            "amount": order.total,
            "order_id": order_id
        }
    
    @router.post("/verify-phonepe-payment")
    async def verify_phonepe_payment(payment_check: PaymentStatusCheck, current_user: dict = Depends(require_auth)):
        """
        Verify PhonePe payment status after user returns from payment page
        """
        order = await order_service.get_order_by_id(payment_check.order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Check payment status from PhonePe
        status_response = PhonePeService.check_payment_status(payment_check.merchant_transaction_id)
        
        if not status_response.get("success"):
            await order_service.update_payment_failed(
                payment_check.order_id,
                status_response.get("message", "Payment verification failed")
            )
            return {
                "success": False,
                "message": status_response.get("message", "Payment verification failed")
            }
        
        # Payment successful
        payment_data = status_response.get("data", {})
        transaction_id = payment_data.get("transactionId", "")
        response_code = status_response.get("code", "")
        payment_method = payment_data.get("paymentInstrument", {}).get("type", "")
        
        await order_service.update_payment_info_phonepe(
            payment_check.order_id,
            payment_check.merchant_transaction_id,
            transaction_id,
            response_code,
            payment_method
        )
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "transaction_id": transaction_id
        }
    
    @router.post("/phonepe-webhook")
    async def phonepe_webhook(request: Request):
        """
        Handle PhonePe webhook callback
        """
        try:
            body = await request.body()
            body_str = body.decode()
            
            # Get X-VERIFY header
            x_verify = request.headers.get("X-VERIFY", "")
            
            # Parse the body
            data = json.loads(body_str)
            response_base64 = data.get("response", "")
            
            # Verify signature
            if not PhonePeService.verify_webhook_signature(x_verify, response_base64):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
            
            # Decode response
            decoded_response = base64.b64decode(response_base64).decode()
            response_data = json.loads(decoded_response)
            
            # Extract payment info
            if response_data.get("success"):
                merchant_transaction_id = response_data.get("data", {}).get("merchantTransactionId", "")
                transaction_id = response_data.get("data", {}).get("transactionId", "")
                response_code = response_data.get("code", "")
                
                # Find order by merchant_transaction_id
                order = await db.orders.find_one({"phonepe_merchant_transaction_id": merchant_transaction_id})
                
                if order:
                    await order_service.update_payment_info_phonepe(
                        order["id"],
                        merchant_transaction_id,
                        transaction_id,
                        response_code
                    )
            
            return {"success": True}
            
        except Exception as e:
            print(f"Webhook error: {str(e)}")
            return {"success": False, "error": str(e)}
    
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
