from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    is_approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class ReviewUpdate(BaseModel):
    is_approved: Optional[bool] = None
