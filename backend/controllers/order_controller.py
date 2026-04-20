from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.order_model import OrderCreate, OrderUpdate, Order, OrderStatus, OrderTrackingUpdate , PaymentStatus
from services.order_service import OrderService
from services.phonepe_service import PhonePeService
from decorators.authorization import require_auth, require_admin
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import hashlib
import base64
import json
import os

FRONTEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").replace("/api", "").replace(":8001", ":3000")
BACKEND_API_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001") + "/api"

class PaymentStatusCheck(BaseModel):
    order_id: str
    merchant_transaction_id: Optional[str] = None

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
        # callback_url = f"{BACKEND_API_URL}/orders/phonepe-webhook"
        
        # Create PhonePe payment order
        phonepe_response = PhonePeService.create_payment_order(
            amount=order.total,
            merchant_order_id=order_id,
            redirect_url=redirect_url,
            # callback_url=callback_url,
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
        Verify PhonePe payment status after user returns from payment page.
        merchant_transaction_id is optional — falls back to the one stored on the order.
        """
        order = await order_service.get_order_by_id(payment_check.order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if order.user_id != current_user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        # Fallback: use merchant_transaction_id stored on the order during payment initiation
        merchant_txn_id = payment_check.merchant_transaction_id or order.phonepe_merchant_transaction_id
        if not merchant_txn_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No PhonePe transaction linked to this order"
            )

        # If payment is already marked completed (e.g., webhook fired first), short-circuit success
        if order.payment_status == PaymentStatus.COMPLETED:
            return {
                "success": True,
                "message": "Payment verified successfully",
                "transaction_id": order.phonepe_transaction_id or ""
            }

        status_response = PhonePeService.check_payment_status(merchant_txn_id)

        if not status_response.get("success"):
            await order_service.update_payment_failed(
                payment_check.order_id,
                status_response.get("error") or f"Payment state: {status_response.get('state', 'UNKNOWN')}"
            )
            return {
                "success": False,
                "message": status_response.get("error") or f"Payment state: {status_response.get('state', 'UNKNOWN')}"
            }

        # Payment successful — map V2 response keys
        transaction_id = status_response.get("transaction_id", "") or ""
        response_code = status_response.get("state", "")
        payment_method = status_response.get("payment_mode", "") or ""

        await order_service.update_payment_info_phonepe(
            payment_check.order_id,
            merchant_txn_id,
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
        Handle PhonePe V2 webhook callback.
        V2 uses HTTP Basic Auth: Authorization header is SHA256(username:password).
        """
        try:
            # 1. Read and decode the raw body
            body = await request.body()
            body_str = body.decode("utf-8")
            
            # 2. Verify Authorization header
            auth_header = request.headers.get("Authorization", "")
            if not verify_phonepe_webhook(auth_header):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Invalid webhook signature"
                )

            # 3. Parse JSON Data
            data = json.loads(body_str)
            event = data.get("event", "")
            payload = data.get("payload", {})
            
            merchant_order_id = payload.get("merchantOrderId")
            state = payload.get("state", "").upper()

            if not merchant_order_id:
                return {"success": False, "error": "Missing merchantOrderId"}

            # 4. Fetch the order from DB
            order = await db.orders.find_one({"id": merchant_order_id})
            if not order:
                # We return 200 even if not found to stop PhonePe from retrying a dead order
                return {"success": False, "error": "Order not found"}

            # 5. Process Payment Success
            if state == "COMPLETED" or event == "checkout.order.completed":
                # Safely extract payment details
                details = payload.get("paymentDetails", [{}])[0]
                transaction_id = details.get("transactionId", "")
                payment_instrument = details.get("paymentMode") or details.get("instrumentType") or "UNKNOWN"

                await order_service.update_payment_info_phonepe(
                    order_id=order["id"],
                    merchant_order_id=merchant_order_id,
                    transaction_id=transaction_id,
                    state=state,
                    payment_instrument=payment_instrument,
                )

            # 6. Process Payment Failure
            elif state == "FAILED" or event == "checkout.order.failed":
                await order_service.update_payment_failed(
                    order["id"], 
                    f"PhonePe reported failure: {state}"
                )

            return {"success": True}

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
        except Exception as e:
            # Log the error properly in a production environment
            print(f"[PhonePe Webhook Error]: {e}")
            return {"success": False, "message": "Internal processing error"}
    
    def verify_phonepe_webhook(authorization_header: str) -> bool:
        """
        Helper to verify the SHA256 hash of the webhook credentials.
        """
        user = os.environ.get("PHONEPE_WEBHOOK_USERNAME", "")
        password = os.environ.get("PHONEPE_WEBHOOK_PASSWORD", "")
        
        if not user or not password:
            # In Sandbox/Dev, you might skip this, but it's risky
            return True
            
        expected_hash = hashlib.sha256(f"{user}:{password}".encode()).hexdigest()
        return authorization_header.strip() == expected_hash        
        

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
