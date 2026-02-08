from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class ProductImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    product_id: str
    image_url: str
    is_primary: bool = False
    sort_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductImageCreate(BaseModel):
    product_id: str
    image_url: str
    is_primary: bool = False
    sort_order: int = 0

class ProductImageUpdate(BaseModel):
    image_url: Optional[str] = None
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None