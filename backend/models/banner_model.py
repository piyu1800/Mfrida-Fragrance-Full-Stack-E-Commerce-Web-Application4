from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    display_order: int = 0

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
