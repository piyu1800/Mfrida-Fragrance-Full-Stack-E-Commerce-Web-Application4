from pydantic import BaseModel, Field, ConfigDict
from typing import List
from datetime import datetime, timezone

class FrequentlyBought(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    product_id: str
    related_product_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FrequentlyBoughtCreate(BaseModel):
    product_id: str
    related_product_ids: List[str] = []

class FrequentlyBoughtUpdate(BaseModel):
    related_product_ids: List[str] = []