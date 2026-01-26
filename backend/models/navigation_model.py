from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class NavigationItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    label: str
    link: str
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NavigationItemCreate(BaseModel):
    label: str
    link: str
    display_order: int = 0

class NavigationItemUpdate(BaseModel):
    label: Optional[str] = None
    link: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
