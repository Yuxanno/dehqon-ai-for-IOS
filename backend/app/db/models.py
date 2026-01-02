from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


def generate_id():
    return str(uuid.uuid4())


class UserRole(str, Enum):
    USER = "user"
    SELLER = "seller"
    ADMIN = "admin"


# === User Models ===

class UserInDB(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    phone: str
    password_hash: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True
    seller_name: Optional[str] = None
    seller_type: Optional[str] = None
    is_verified_seller: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None
    role: str
    seller_name: Optional[str] = None
    seller_type: Optional[str] = None
    is_verified_seller: bool = False


# === Product Models ===

class ProductInDB(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    title: str
    description: Optional[str] = None
    price: int
    currency: str = "UZS"
    category: str
    images: List[str] = []
    region: Optional[str] = None
    status: str = "active"
    views: int = 0
    seller_id: str
    seller_name: str
    seller_rating: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# === Favorite Models ===

class FavoriteInDB(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    product_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# === Conversation Models ===

class ConversationInDB(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    title: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class ChatMessageInDB(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    conversation_id: str
    role: str  # user, assistant
    content: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
