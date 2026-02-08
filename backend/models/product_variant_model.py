from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone

class ProductVariant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    parent_product_id: str
    variant_product_id: str
    label: str  # e.g., "5ml", "8ml", "20ml"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductVariantCreate(BaseModel):
    parent_product_id: str
    variant_product_id: str
    label: str