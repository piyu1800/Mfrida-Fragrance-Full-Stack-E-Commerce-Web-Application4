from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

class HeroBanner(BaseModel):
    title: str
    subtitle: str
    image_url: str
    cta_text: str
    cta_link: str

class FeaturedSection(BaseModel):
    title: str
    subtitle: Optional[str] = None
    product_ids: List[str] = []

class HomepageConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "homepage_config"
    hero_banners: List[HeroBanner] = []
    featured_sections: List[FeaturedSection] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomepageConfigUpdate(BaseModel):
    hero_banners: Optional[List[HeroBanner]] = None
    featured_sections: Optional[List[FeaturedSection]] = None
