import razorpay
import os
import hmac
import hashlib

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_demo")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "demo_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class PaymentService:
    
    @staticmethod
    def create_razorpay_order(amount: float, currency: str = "INR") -> dict:
        amount_in_paise = int(amount * 100)
        
        order_data = {
            "amount": amount_in_paise,
            "currency": currency,
            "payment_capture": 1
        }
        
        order = client.order.create(data=order_data)
        return order
    
    @staticmethod
    def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(generated_signature, razorpay_signature)
