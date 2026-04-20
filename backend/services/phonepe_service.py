import os
import time
import threading
import requests
from typing import Dict, Optional, Tuple
from dotenv import load_dotenv
load_dotenv()

PHONEPE_CLIENT_ID = os.environ.get("PHONEPE_CLIENT_ID", "").strip().strip('"').strip("'")
PHONEPE_CLIENT_SECRET = os.environ.get("PHONEPE_CLIENT_SECRET", "").strip().strip('"').strip("'")
PHONEPE_CLIENT_VERSION = os.environ.get("PHONEPE_CLIENT_VERSION", "1").strip().strip('"').strip("'")
PHONEPE_ENV = os.environ.get("PHONEPE_ENV", "SANDBOX").strip().upper()

if PHONEPE_ENV == "PRODUCTION":
    PHONEPE_BASE_URL = "https://api.phonepe.com/apis/pg"
    PHONEPE_AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
else:
    PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"
    PHONEPE_AUTH_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token"

_token_lock = threading.Lock()
_token_cache = {"access_token": None, "expires_at": 0}


class PhonePeService:

    @staticmethod
    def _get_access_token() -> Tuple[Optional[str], Optional[str]]:
        """Returns (access_token, error_message). Either token is set OR error is set."""
        print("Phone pe client id", PHONEPE_CLIENT_ID)
        if not PHONEPE_CLIENT_ID or not PHONEPE_CLIENT_SECRET:
            return None, f"Missing env vars. CLIENT_ID set={bool(PHONEPE_CLIENT_ID)}, SECRET set={bool(PHONEPE_CLIENT_SECRET)}"

        now = int(time.time())
        with _token_lock:
            if _token_cache["access_token"] and now < (_token_cache["expires_at"] - 300):
                return _token_cache["access_token"], None

            try:
                payload = {
                    "client_id": PHONEPE_CLIENT_ID,
                    "client_secret": PHONEPE_CLIENT_SECRET,
                    "client_version": PHONEPE_CLIENT_VERSION,
                    "grant_type": "client_credentials",
                }
                headers = {"Content-Type": "application/x-www-form-urlencoded"}
                resp = requests.post(PHONEPE_AUTH_URL, data=payload, headers=headers, timeout=15)

                if resp.status_code != 200:
                    # Surface PhonePe's actual error
                    err = f"PhonePe OAuth {resp.status_code}: {resp.text[:300]}"
                    print(f"[PhonePe] {err}")
                    return None, err

                data = resp.json()
                access_token = data.get("access_token")
                if not access_token:
                    return None, f"No access_token in response: {data}"

                expires_at = data.get("expires_at") or (now + int(data.get("expires_in", 3600)))
                _token_cache.update({"access_token": access_token, "expires_at": int(expires_at)})
                return access_token, None

            except requests.exceptions.ConnectionError as e:
                return None, f"Network error reaching PhonePe (firewall/proxy?): {e}"
            except Exception as e:
                return None, f"OAuth exception: {type(e).__name__}: {e}"

    @staticmethod
    def create_payment_order(amount: float, merchant_order_id: str, redirect_url: str, merchant_user_id: str = "guest") -> Dict:
        token, err = PhonePeService._get_access_token()
        if not token:
            return {"success": False, "error": err or "Auth failed"}

        payload = {
            "merchantOrderId": merchant_order_id,
            "amount": int(round(amount * 100)),
            "expireAfter": 1200,
            "metaInfo": {"udf1": merchant_user_id},
            "paymentFlow": {
                "type": "PG_CHECKOUT",
                "message": "Order Payment",
                "merchantUrls": {"redirectUrl": redirect_url},
            },
        }
        headers = {"Content-Type": "application/json", "Authorization": f"O-Bearer {token}"}
        try:
            resp = requests.post(f"{PHONEPE_BASE_URL}/checkout/v2/pay", json=payload, headers=headers, timeout=20)
            data = resp.json()
            if resp.status_code == 200 and data.get("redirectUrl"):
                return {
                    "success": True,
                    "merchant_transaction_id": merchant_order_id,
                    "redirect_url": data["redirectUrl"],
                    "order_id": data.get("orderId"),
                    "state": data.get("state"),
                }
            return {"success": False, "error": f"PhonePe pay {resp.status_code}: {resp.text[:300]}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def check_payment_status(merchant_order_id: str) -> Dict:
        token, err = PhonePeService._get_access_token()
        if not token:
            return {"success": False, "error": err or "Auth failed"}

        headers = {"Authorization": f"O-Bearer {token}"}
        url = f"{PHONEPE_BASE_URL}/checkout/v2/order/{merchant_order_id}/status"
        try:
            resp = requests.get(url, headers=headers, params={"details": "false"}, timeout=15)
            data = resp.json()
            state = data.get("state", "UNKNOWN")
            pi = (data.get("paymentDetails") or [{}])[0]
            return {
                "success": (state == "COMPLETED"),
                "state": state,
                "amount": data.get("amount"),
                "transaction_id": pi.get("transactionId"),
                "payment_mode": pi.get("paymentMode") or pi.get("instrumentType"),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}