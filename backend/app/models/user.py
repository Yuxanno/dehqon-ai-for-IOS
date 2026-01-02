from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: str
    phone: str
    name: str
    avatar_url: Optional[str] = None
    region: str
    rating: float = 0.0
    reviews_count: int = 0
    products_count: int = 0
    created_at: datetime


class UserCreate(BaseModel):
    phone: str
    name: str
    region: str


class UserLogin(BaseModel):
    phone: str
    code: str


class SendCodeRequest(BaseModel):
    phone: str


class SendCodeResponse(BaseModel):
    success: bool
    message: str


class AuthResponse(BaseModel):
    user: User
    token: str
