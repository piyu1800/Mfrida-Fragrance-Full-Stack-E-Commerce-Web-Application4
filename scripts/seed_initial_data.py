#!/usr/bin/env python3
import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "mfrida_fragrance"

async def seed_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🌱 Starting database seeding...")
    
    # Create Categories
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": "Women's Perfumes",
            "slug": "women",
            "description": "Elegant fragrances for women",
            "image_url": "https://images.unsplash.com/photo-1588405748880-12d1d2a59926?w=800",
            "is_active": True,
            "display_order": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Men's Perfumes",
            "slug": "men",
            "description": "Bold fragrances for men",
            "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
            "is_active": True,
            "display_order": 2,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Unisex",
            "slug": "unisex",
            "description": "Fragrances for everyone",
            "image_url": "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800",
            "is_active": True,
            "display_order": 3,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Oud Collection",
            "slug": "oud",
            "description": "Luxurious oud fragrances",
            "image_url": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800",
            "is_active": True,
            "display_order": 4,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Attar",
            "slug": "attar",
            "description": "Traditional attars",
            "image_url": "https://images.unsplash.com/photo-1587556930116-0c8c0fc82c0b?w=800",
            "is_active": True,
            "display_order": 5,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.categories.delete_many({})
    await db.categories.insert_many(categories)
    print(f"✅ Created {len(categories)} categories")
    
    # Create sample products
    products = []
    product_data = [
        {
            "name": "Mystic Rose",
            "brand": "Mfrida",
            "description": "A captivating blend of roses and musk, perfect for evening wear",
            "fragrance_notes": "Top: Rose, Middle: Jasmine, Base: Musk",
            "price": 2999,
            "discount": 15,
            "stock": 50,
            "is_featured": True,
            "is_best_selling": True,
            "category_slug": "women"
        },
        {
            "name": "Oud Royale",
            "brand": "Mfrida",
            "description": "Luxurious oud fragrance with woody undertones",
            "fragrance_notes": "Top: Oud, Middle: Sandalwood, Base: Amber",
            "price": 4999,
            "discount": 20,
            "stock": 30,
            "is_featured": True,
            "category_slug": "oud"
        },
        {
            "name": "Urban Legend",
            "brand": "Mfrida",
            "description": "Fresh and sporty fragrance for the modern man",
            "fragrance_notes": "Top: Citrus, Middle: Lavender, Base: Cedarwood",
            "price": 2499,
            "discount": 10,
            "stock": 60,
            "is_new_arrival": True,
            "category_slug": "men"
        },
        {
            "name": "Eternal Elegance",
            "brand": "Mfrida",
            "description": "Timeless floral fragrance with a hint of vanilla",
            "fragrance_notes": "Top: Peony, Middle: Lily, Base: Vanilla",
            "price": 3499,
            "discount": 0,
            "stock": 45,
            "is_best_selling": True,
            "category_slug": "women"
        },
        {
            "name": "Velvet Touch",
            "brand": "Mfrida",
            "description": "Soft and sensual unisex fragrance",
            "fragrance_notes": "Top: Bergamot, Middle: Iris, Base: Patchouli",
            "price": 3999,
            "discount": 25,
            "stock": 40,
            "is_featured": True,
            "category_slug": "unisex"
        },
        {
            "name": "Desert Bloom",
            "brand": "Mfrida",
            "description": "Traditional attar with modern appeal",
            "fragrance_notes": "Top: Saffron, Middle: Rose, Base: Agarwood",
            "price": 1999,
            "discount": 0,
            "stock": 70,
            "is_new_arrival": True,
            "category_slug": "attar"
        }
    ]
    
    for prod_data in product_data:
        category = next((c for c in categories if c['slug'] == prod_data['category_slug']), None)
        if category:
            final_price = prod_data['price'] * (1 - prod_data['discount'] / 100)
            product = {
                "id": str(uuid.uuid4()),
                "name": prod_data['name'],
                "slug": prod_data['name'].lower().replace(' ', '-'),
                "brand": prod_data['brand'],
                "category_id": category['id'],
                "description": prod_data['description'],
                "fragrance_notes": prod_data['fragrance_notes'],
                "price": prod_data['price'],
                "discount": prod_data['discount'],
                "final_price": final_price,
                "stock": prod_data['stock'],
                "images": [
                    "https://images.unsplash.com/photo-1588405748880-12d1d2a59926?w=800",
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800"
                ],
                "is_featured": prod_data.get('is_featured', False),
                "is_best_selling": prod_data.get('is_best_selling', False),
                "is_new_arrival": prod_data.get('is_new_arrival', False),
                "related_products": [],
                "average_rating": 4.5,
                "total_reviews": 12,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            products.append(product)
    
    await db.products.delete_many({})
    await db.products.insert_many(products)
    print(f"✅ Created {len(products)} products")
    
    # Create Navigation Items
    navigation_items = []
    for cat in categories[:3]:  # Only first 3 categories
        nav_item = {
            "id": str(uuid.uuid4()),
            "label": cat['name'],
            "link": f"/products?category={cat['slug']}",
            "display_order": cat['display_order'],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        navigation_items.append(nav_item)
    
    await db.navigation_items.delete_many({})
    await db.navigation_items.insert_many(navigation_items)
    print(f"✅ Created {len(navigation_items)} navigation items")
    
    # Create sample banners
    banners = [
        {
            "id": str(uuid.uuid4()),
            "title": "New Arrivals",
            "subtitle": "Discover our latest fragrances",
            "image_url": "https://images.unsplash.com/photo-1588405748880-12d1d2a59926?w=1200",
            "cta_text": "Shop Now",
            "cta_link": "/products?new=true",
            "display_order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Oud Collection",
            "subtitle": "Luxurious and timeless",
            "image_url": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200",
            "cta_text": "Explore",
            "cta_link": "/products?category=oud",
            "display_order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Best Sellers",
            "subtitle": "Customer favorites",
            "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200",
            "cta_text": "View All",
            "cta_link": "/products?bestselling=true",
            "display_order": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.banners.delete_many({})
    await db.banners.insert_many(banners)
    print(f"✅ Created {len(banners)} banners")
    
    # Create admin user
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@mfrida.com",
        "password_hash": pwd_context.hash("admin123"),
        "name": "Admin User",
        "phone": "+911234567890",
        "role": "admin",
        "is_active": True,
        "email_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_admin = await db.users.find_one({"email": "admin@mfrida.com"})
    if not existing_admin:
        await db.users.insert_one(admin_user)
        print("✅ Created admin user (email: admin@mfrida.com, password: admin123)")
    else:
        print("ℹ️  Admin user already exists")
    
    # Create homepage config
    homepage_config = {
        "id": "homepage_config",
        "hero_banners": [
            {
                "title": "Luxury Fragrances",
                "subtitle": "Experience the essence of elegance",
                "image_url": "https://images.unsplash.com/photo-1588405748880-12d1d2a59926?w=1920",
                "cta_text": "Discover Now",
                "cta_link": "/products"
            }
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.homepage_config.delete_many({})
    await db.homepage_config.insert_one(homepage_config)
    print("✅ Created homepage configuration")
    
    print("\n🎉 Database seeding completed successfully!")
    print("\n📋 Summary:")
    print(f"   - Categories: {len(categories)}")
    print(f"   - Products: {len(products)}")
    print(f"   - Navigation Items: {len(navigation_items)}")
    print(f"   - Banners: {len(banners)}")
    print(f"   - Admin User: admin@mfrida.com / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
