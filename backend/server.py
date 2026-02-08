from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

from controllers.auth_controller import get_auth_router
from controllers.category_controller import get_category_router
from controllers.product_controller import get_product_router
from controllers.order_controller import get_order_router
from controllers.review_controller import get_review_router
from controllers.admin_controller import get_admin_router
from controllers.banner_controller import get_banner_router
from controllers.upload_controller import get_upload_router
from controllers.wishlist_controller import get_wishlist_router
from controllers.product_image_controller import get_product_image_router
from controllers.product_variant_controller import get_product_variant_router
from controllers.frequently_bought_controller import get_frequently_bought_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Mfrida Fragrance API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check route
@api_router.get("/")
async def root():
    return {"message": "Mfrida Fragrance API is running"}

# Include all routers
api_router.include_router(get_auth_router(db))
api_router.include_router(get_category_router(db))
api_router.include_router(get_product_router(db))
api_router.include_router(get_order_router(db))
api_router.include_router(get_review_router(db))
api_router.include_router(get_admin_router(db))
api_router.include_router(get_banner_router(db))
api_router.include_router(get_upload_router())
api_router.include_router(get_wishlist_router(db))
api_router.include_router(get_product_image_router(db))
api_router.include_router(get_product_variant_router(db))
api_router.include_router(get_frequently_bought_router(db))


# Include the router in the main app
app.include_router(api_router)

# Serve uploaded files (Windows + Linux safe)
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

app.mount(
    "/api/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
