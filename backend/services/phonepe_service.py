import os
import hashlib
import base64
import json
import requests
from typing import Dict, Optional
import uuid

PHONEPE_CLIENT_ID = os.environ.get("PHONEPE_CLIENT_ID", "M2371CVXMIY5Z_2602102100")
PHONEPE_CLIENT_SECRET = os.environ.get("PHONEPE_CLIENT_SECRET", "NmMzMDRiNTUtNWI5YS00YjRhLTgwN2ItM2VhZGE2MGJhMDk1")
PHONEPE_SALT_KEY = os.environ.get("PHONEPE_SALT_KEY", "")
PHONEPE_SALT_INDEX = os.environ.get("PHONEPE_SALT_INDEX", "1")
PHONEPE_ENVIRONMENT = os.environ.get("PHONEPE_ENVIRONMENT", "test")

# API URLs based on environment
if PHONEPE_ENVIRONMENT == "production":
    PHONEPE_BASE_URL = "https://api.phonepe.com/apis/hermes"
    PHONEPE_AUTH_URL = "https://api.phonepe.com/v1/oauth/token"
else:
    PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"
    PHONEPE_AUTH_URL = "https://api-preprod.phonepe.com/v1/oauth/token"


class PhonePeService:
    
    @staticmethod
    def get_access_token() -> Optional[str]:
        """
        Get OAuth access token from PhonePe
        """
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "client_id": PHONEPE_CLIENT_ID,
                "client_secret": PHONEPE_CLIENT_SECRET,
                "grant_type": "client_credentials"
            }
            
            response = requests.post(PHONEPE_AUTH_URL, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            else:
                print(f"PhonePe Auth Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"PhonePe Auth Exception: {str(e)}")
            return None
    
    @staticmethod
    def generate_checksum(payload: str, endpoint: str) -> str:
        """
        Generate X-VERIFY checksum for PhonePe API
        Formula: SHA256(Base64(payload) + endpoint + saltKey) + "###" + saltIndex
        """
        base64_payload = base64.b64encode(payload.encode()).decode()
        string_to_hash = f"{base64_payload}{endpoint}{PHONEPE_SALT_KEY}"
        sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
        checksum = f"{sha256_hash}###{PHONEPE_SALT_INDEX}"
        return checksum
    
    @staticmethod
    def create_payment_order(amount: float, merchant_order_id: str, redirect_url: str, callback_url: str, merchant_user_id: str = None) -> Dict:
        """
        Create PhonePe payment order
        amount: Amount in rupees (will be converted to paise)
        merchant_order_id: Unique order ID
        redirect_url: URL to redirect after payment
        callback_url: Server callback URL for payment status
        """
        try:
            print("*******************************************************8")
            # Convert amount to paise
            amount_in_paise = int(amount * 100)
            
            # Generate merchant transaction ID
            merchant_transaction_id = f"MT{uuid.uuid4().hex[:20].upper()}"
            
            # If no merchant_user_id provided, generate one
            if not merchant_user_id:
                merchant_user_id = f"USER{uuid.uuid4().hex[:15].upper()}"
                
            print("Client Id", PHONEPE_CLIENT_ID)
            
            # Prepare payload
            payload_data = {
                "merchantId": PHONEPE_CLIENT_ID,
                "merchantTransactionId": merchant_transaction_id,
                "merchantUserId": merchant_user_id,
                "amount": amount_in_paise,
                "redirectUrl": redirect_url,
                "redirectMode": "POST",
                "callbackUrl": callback_url,
                "mobileNumber": "",
                "paymentInstrument": {
                    "type": "PAY_PAGE"
                }
            }
            
            # Convert to JSON string
            payload_json = json.dumps(payload_data)
            
            # Generate base64 payload
            base64_payload = base64.b64encode(payload_json.encode()).decode()
            
            # Generate checksum
            endpoint = "/pg/v1/pay"
            checksum = PhonePeService.generate_checksum(payload_json, endpoint)
            
            # API request
            headers = {
                "Content-Type": "application/json",
                "X-VERIFY": checksum
            }
            
            request_payload = {
                "request": base64_payload
            }
            
            url = f"{PHONEPE_BASE_URL}{endpoint}"
            response = requests.post(url, json=request_payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    return {
                        "success": True,
                        "merchant_transaction_id": merchant_transaction_id,
                        "redirect_url": data["data"]["instrumentResponse"]["redirectInfo"]["url"],
                        "message": data.get("message", "Payment initiated")
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Payment initiation failed")
                    }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Exception: {str(e)}"
            }
    
    @staticmethod
    def check_payment_status(merchant_transaction_id: str) -> Dict:
        """
        Check payment status for a transaction
        """
        try:
            endpoint = f"/pg/v1/status/{PHONEPE_CLIENT_ID}/{merchant_transaction_id}"
            
            # Generate checksum for status check
            string_to_hash = f"{endpoint}{PHONEPE_SALT_KEY}"
            sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
            checksum = f"{sha256_hash}###{PHONEPE_SALT_INDEX}"
            
            headers = {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": PHONEPE_CLIENT_ID
            }
            
            url = f"{PHONEPE_BASE_URL}{endpoint}"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": data.get("success", False),
                    "code": data.get("code"),
                    "message": data.get("message"),
                    "data": data.get("data", {})
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Exception: {str(e)}"
            }
    
    @staticmethod
    def verify_webhook_signature(x_verify_header: str, response_body: str) -> bool:
        """
        Verify webhook callback signature
        """
        try:
            # Decode base64 response
            decoded_response = base64.b64decode(response_body).decode()
            
            # Calculate expected checksum
            string_to_hash = f"{decoded_response}{PHONEPE_SALT_KEY}"
            expected_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
            expected_checksum = f"{expected_hash}###{PHONEPE_SALT_INDEX}"
            
            return x_verify_header == expected_checksum
            
        except Exception as e:
            print(f"Webhook verification error: {str(e)}")
            return False
