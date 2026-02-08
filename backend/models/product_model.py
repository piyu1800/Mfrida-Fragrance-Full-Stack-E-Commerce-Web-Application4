from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    slug: str
    brand: str
    category_id: str
    price: float
    discount: float = 0
    final_price: float
    images: List[str] = []
    stock: int = 0
    description: str
    fragrance_notes: Optional[str] = None
    
    # NEW: Variant fields
    variant_group: Optional[str] = None  # All products with same variant_group are variants of each other
    variant_name: Optional[str] = None   # e.g., \"5 ML\", \"8 ML\", \"12 ML\"
    
    # NEW: Specifications field
    specifications: Optional[Dict[str, Any]] = None  # {\"Fragrance Type\": \"Eau de Parfum\", \"Volume\": \"50 ML\", ...}
    
    is_featured: bool = False
    is_best_selling: bool = False
    is_new_arrival: bool = False
    related_products: List[str] = []
    average_rating: float = 0
    total_reviews: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    slug: str
    brand: str
    category_id: str
    price: float
    discount: float = 0
    images: List[str] = []
    stock: int = 0
    description: str
    fragrance_notes: Optional[str] = None
    
    # NEW: Variant fields
    variant_group: Optional[str] = None
    variant_name: Optional[str] = None
    
    # NEW: Specifications field
    specifications: Optional[Dict[str, Any]] = None
    
    is_featured: bool = False
    is_best_selling: bool = False
    is_new_arrival: bool = False
    related_products: List[str] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    images: Optional[List[str]] = None
    stock: Optional[int] = None
    description: Optional[str] = None
    fragrance_notes: Optional[str] = None
    
    # NEW: Variant fields
    variant_group: Optional[str] = None
    variant_name: Optional[str] = None
    
    # NEW: Specifications field
    specifications: Optional[Dict[str, Any]] = None
    
    is_featured: Optional[bool] = None
    is_best_selling: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    related_products: Optional[List[str]] = None
