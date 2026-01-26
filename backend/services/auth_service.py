from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user_model import UserCreate, UserResponse, Address
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.users
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        existing_user = await self.collection.find_one({"email": user_data.email}, {"_id": 0})
        if existing_user:
            raise ValueError("Email already registered")
        
        user_dict = user_data.model_dump()
        hashed_password = self.hash_password(user_dict.pop("password"))
        
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        doc = {
            "id": user_id,
            "email": user_dict["email"],
            "name": user_dict["name"],
            "role": user_dict["role"],
            "password_hash": hashed_password,
            "addresses": [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await self.collection.insert_one(doc)
        
        return UserResponse(
            id=user_id,
            email=doc["email"],
            name=doc["name"],
            role=doc["role"],
            addresses=[],
            created_at=now
        )
    
    async def authenticate_user(self, email: str, password: str):
        user = await self.collection.find_one({"email": email}, {"_id": 0})
        if not user:
            return None
        
        if not self.verify_password(password, user["password_hash"]):
            return None
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> dict:
        user = await self.collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        return user
    
    async def add_address(self, user_id: str, address: Address):
        await self.collection.update_one(
            {"id": user_id},
            {"$push": {"addresses": address.model_dump()}}
        )
        return await self.get_user_by_id(user_id)
