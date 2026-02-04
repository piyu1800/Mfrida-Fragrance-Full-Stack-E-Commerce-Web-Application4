from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"

class Address(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    phone: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.CUSTOMER
    addresses: List[Address] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    wishlist: List[str] = []

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    email: EmailStr
    name: str
    role: UserRole
    addresses: List[Address] = []
    created_at: datetime
