from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from models.user_model import Address

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    quantity: int
    price: float
    discount: float
    final_price: float

class TrackingUpdate(BaseModel):
    status: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_id: str
    items: List[OrderItem]
    subtotal: float
    discount: float
    total: float
    shipping_address: Address
    order_status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    payment_method: Optional[str] = None  # upi, card, netbanking, wallet
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    tracking_updates: List[TrackingUpdate] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: Address

class OrderUpdate(BaseModel):
    order_status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[str] = None

class OrderTrackingUpdate(BaseModel):
    order_id: str
    status: str
    message: str
