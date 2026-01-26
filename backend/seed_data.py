import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

load_dotenv(Path(__file__).parent / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    print("Starting database seeding...")
    
    # Create admin user if not exists
    admin_email = "piyushakagale672@gmail.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin User",
            "role": "admin",
            "password_hash": pwd_context.hash("piyu@1800"),
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print(f"✅ Created admin user: {admin_email}")
    else:
        print(f"✅ Admin user already exists: {admin_email}")
    
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.navigation_items.delete_many({})
    await db.homepage_config.delete_many({})
    
    now = datetime.now(timezone.utc).isoformat()
    
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": "Attar",
            "slug": "attar",
            "description": "Traditional Arabian attars crafted from natural ingredients",
            "image_url": "https://images.pexels.com/photos/30981935/pexels-photo-30981935.jpeg",
            "is_active": True,
            "display_order": 1,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Perfume Spray",
            "slug": "perfume-spray",
            "description": "Luxury perfume sprays for every occasion",
            "image_url": "https://images.unsplash.com/photo-1545936761-c64b78657cb1",
            "is_active": True,
            "display_order": 2,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bakhoor",
            "slug": "bakhoor",
            "description": "Premium bakhoor incense for a luxurious ambiance",
            "image_url": "https://images.pexels.com/photos/7986711/pexels-photo-7986711.jpeg",
            "is_active": True,
            "display_order": 3,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Incense Sticks",
            "slug": "incense-sticks",
            "description": "Aromatic incense sticks for meditation and relaxation",
            "image_url": "https://images.pexels.com/photos/14381803/pexels-photo-14381803.jpeg",
            "is_active": True,
            "display_order": 4,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Body Spray",
            "slug": "body-spray",
            "description": "Fresh and long-lasting body sprays",
            "image_url": "https://images.unsplash.com/photo-1619007556336-4d99b008471e",
            "is_active": True,
            "display_order": 5,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    await db.categories.insert_many(categories)
    print(f"Seeded {len(categories)} categories")
    
    attar_cat = categories[0]["id"]
    perfume_cat = categories[1]["id"]
    bakhoor_cat = categories[2]["id"]
    incense_cat = categories[3]["id"]
    body_spray_cat = categories[4]["id"]
    
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Royal Oud Attar",
            "slug": "royal-oud-attar",
            "brand": "Mfrida",
            "category_id": attar_cat,
            "price": 599.0,
            "discount": 10,
            "final_price": 539.1,
            "images": ["https://images.pexels.com/photos/30981935/pexels-photo-30981935.jpeg"],
            "stock": 50,
            "description": "A rich, woody fragrance with deep oud notes. Perfect for special occasions.",
            "fragrance_notes": "Top: Oud, Middle: Sandalwood, Base: Amber",
            "is_featured": True,
            "is_best_selling": True,
            "is_new_arrival": False,
            "related_products": [],
            "average_rating": 4.5,
            "total_reviews": 12,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rose Garden Attar",
            "slug": "rose-garden-attar",
            "brand": "Mfrida",
            "category_id": attar_cat,
            "price": 449.0,
            "discount": 15,
            "final_price": 381.65,
            "images": ["https://images.pexels.com/photos/14381803/pexels-photo-14381803.jpeg"],
            "stock": 45,
            "description": "Delicate rose attar capturing the essence of a blooming garden.",
            "fragrance_notes": "Top: Rose, Middle: Jasmine, Base: Musk",
            "is_featured": True,
            "is_best_selling": False,
            "is_new_arrival": True,
            "related_products": [],
            "average_rating": 4.8,
            "total_reviews": 20,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Velvet Musk Attar",
            "slug": "velvet-musk-attar",
            "brand": "Mfrida",
            "category_id": attar_cat,
            "price": 499.0,
            "discount": 0,
            "final_price": 499.0,
            "images": ["https://images.unsplash.com/photo-1619007556336-4d99b008471e"],
            "stock": 30,
            "description": "Sensual musk attar with velvety smooth finish.",
            "fragrance_notes": "Top: White Musk, Middle: Vanilla, Base: Tonka Bean",
            "is_featured": False,
            "is_best_selling": True,
            "is_new_arrival": False,
            "related_products": [],
            "average_rating": 4.6,
            "total_reviews": 15,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ocean Breeze Perfume",
            "slug": "ocean-breeze-perfume",
            "brand": "Mfrida",
            "category_id": perfume_cat,
            "price": 899.0,
            "discount": 20,
            "final_price": 719.2,
            "images": ["https://images.unsplash.com/photo-1558038785-4fe65c791c99"],
            "stock": 60,
            "description": "Fresh aquatic fragrance inspired by ocean waves.",
            "fragrance_notes": "Top: Sea Salt, Middle: Driftwood, Base: Amber",
            "is_featured": True,
            "is_best_selling": False,
            "is_new_arrival": True,
            "related_products": [],
            "average_rating": 4.7,
            "total_reviews": 25,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Midnight Noir Perfume",
            "slug": "midnight-noir-perfume",
            "brand": "Mfrida",
            "category_id": perfume_cat,
            "price": 1299.0,
            "discount": 10,
            "final_price": 1169.1,
            "images": ["https://images.unsplash.com/photo-1545936761-c64b78657cb1"],
            "stock": 40,
            "description": "Mysterious and seductive evening fragrance.",
            "fragrance_notes": "Top: Bergamot, Middle: Black Pepper, Base: Leather",
            "is_featured": True,
            "is_best_selling": True,
            "is_new_arrival": False,
            "related_products": [],
            "average_rating": 4.9,
            "total_reviews": 35,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Citrus Bloom Perfume",
            "slug": "citrus-bloom-perfume",
            "brand": "Mfrida",
            "category_id": perfume_cat,
            "price": 799.0,
            "discount": 15,
            "final_price": 679.15,
            "images": ["https://images.unsplash.com/photo-1763987300634-7b0822cbf390"],
            "stock": 55,
            "description": "Vibrant citrus fragrance for everyday freshness.",
            "fragrance_notes": "Top: Lemon, Middle: Orange Blossom, Base: Cedarwood",
            "is_featured": False,
            "is_best_selling": False,
            "is_new_arrival": True,
            "related_products": [],
            "average_rating": 4.4,
            "total_reviews": 18,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Royal Oud Bakhoor",
            "slug": "royal-oud-bakhoor",
            "brand": "Mfrida",
            "category_id": bakhoor_cat,
            "price": 349.0,
            "discount": 0,
            "final_price": 349.0,
            "images": ["https://images.pexels.com/photos/7986711/pexels-photo-7986711.jpeg"],
            "stock": 70,
            "description": "Premium oud bakhoor for luxurious home fragrance.",
            "fragrance_notes": "Oud, Sandalwood, Amber",
            "is_featured": True,
            "is_best_selling": True,
            "is_new_arrival": False,
            "related_products": [],
            "average_rating": 4.8,
            "total_reviews": 30,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Jasmine Dreams Incense",
            "slug": "jasmine-dreams-incense",
            "brand": "Mfrida",
            "category_id": incense_cat,
            "price": 199.0,
            "discount": 10,
            "final_price": 179.1,
            "images": ["https://images.pexels.com/photos/14381803/pexels-photo-14381803.jpeg"],
            "stock": 100,
            "description": "Calming jasmine incense sticks for meditation.",
            "fragrance_notes": "Jasmine, Lavender",
            "is_featured": False,
            "is_best_selling": True,
            "is_new_arrival": False,
            "related_products": [],
            "average_rating": 4.5,
            "total_reviews": 22,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Fresh Morning Body Spray",
            "slug": "fresh-morning-body-spray",
            "brand": "Mfrida",
            "category_id": body_spray_cat,
            "price": 299.0,
            "discount": 20,
            "final_price": 239.2,
            "images": ["https://images.unsplash.com/photo-1619007556336-4d99b008471e"],
            "stock": 80,
            "description": "Refreshing body spray for all-day confidence.",
            "fragrance_notes": "Mint, Citrus, Aqua",
            "is_featured": False,
            "is_best_selling": False,
            "is_new_arrival": True,
            "related_products": [],
            "average_rating": 4.3,
            "total_reviews": 14,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunset Amber Attar",
            "slug": "sunset-amber-attar",
            "brand": "Mfrida",
            "category_id": attar_cat,
            "price": 549.0,
            "discount": 12,
            "final_price": 483.12,
            "images": ["https://images.unsplash.com/photo-1617943539287-d6fe110ac7ad"],
            "stock": 35,
            "description": "Warm amber attar reminiscent of golden sunsets.",
            "fragrance_notes": "Top: Amber, Middle: Patchouli, Base: Vanilla",
            "is_featured": True,
            "is_best_selling": False,
            "is_new_arrival": True,
            "related_products": [],
            "average_rating": 4.7,
            "total_reviews": 16,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    await db.products.insert_many(products)
    print(f"Seeded {len(products)} products")
    
    nav_items = [
        {
            "id": str(uuid.uuid4()),
            "label": "Get 3 Attars at ₹899",
            "link": "/deals/attars-899",
            "display_order": 1,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "label": "Get 3 Perfumes at ₹899",
            "link": "/deals/perfumes-899",
            "display_order": 2,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "label": "Attar",
            "link": "/products?category=attar",
            "display_order": 3,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "label": "Perfume Spray",
            "link": "/products?category=perfume-spray",
            "display_order": 4,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "label": "New Launch",
            "link": "/products?new=true",
            "display_order": 5,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "label": "Trending",
            "link": "/products?trending=true",
            "display_order": 6,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    await db.navigation_items.insert_many(nav_items)
    print(f"Seeded {len(nav_items)} navigation items")
    
    homepage_config = {
        "id": "homepage_config",
        "hero_banners": [
            {
                "title": "Mfrida Fragrance",
                "subtitle": "Luxury Attars & Perfumes",
                "image_url": "https://images.unsplash.com/photo-1619007556336-4d99b008471e",
                "cta_text": "Explore Collection",
                "cta_link": "/products"
            }
        ],
        "featured_sections": [
            {
                "title": "Best Selling",
                "subtitle": "Our most loved fragrances",
                "product_ids": [p["id"] for p in products if p["is_best_selling"]][:4]
            },
            {
                "title": "New Arrivals",
                "subtitle": "Fresh scents just for you",
                "product_ids": [p["id"] for p in products if p["is_new_arrival"]][:4]
            }
        ],
        "updated_at": now
    }
    
    await db.homepage_config.insert_one(homepage_config)
    print("Seeded homepage configuration")
    
    print("Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())
