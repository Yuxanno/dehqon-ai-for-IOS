from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, field_validator
from typing import Optional, List
import re

from app.services.auth_service import (
    get_user_by_phone,
    create_user,
    authenticate_user,
    create_access_token,
    upgrade_to_seller,
    get_user_by_id,
    get_user_by_username,
    search_users,
)
from app.middleware.auth import get_current_user
from app.db.database import get_db

router = APIRouter()


class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: Optional[str] = None
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+998\d{9}$', cleaned):
            raise ValueError('Неверный формат номера')
        return cleaned
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 4:
            raise ValueError('Пароль минимум 4 символа')
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+998\d{9}$', cleaned):
            raise ValueError('Неверный формат номера')
        return cleaned


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    region: Optional[str] = None
    avatar_url: Optional[str] = None


class BecomeSellerRequest(BaseModel):
    seller_name: str
    region: str
    seller_type: str


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None
    role: str
    seller_name: Optional[str] = None
    seller_type: Optional[str] = None
    is_verified_seller: bool = False


class UserSearchResult(BaseModel):
    id: str
    name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserResponse
    token: str


class MessageResponse(BaseModel):
    success: bool
    message: str


def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["_id"],
        phone=user["phone"],
        name=user.get("name"),
        username=user.get("username"),
        avatar_url=user.get("avatar_url"),
        region=user.get("region"),
        role=user.get("role", "user"),
        seller_name=user.get("seller_name"),
        seller_type=user.get("seller_type"),
        is_verified_seller=user.get("is_verified_seller", False),
    )


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="База данных недоступна")
    
    existing = await get_user_by_phone(request.phone)
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    user = await create_user(phone=request.phone, password=request.password, name=request.name)
    token = create_access_token(user["_id"], user["role"])
    return AuthResponse(user=user_to_response(user), token=token)


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="База данных недоступна")
    
    user = await authenticate_user(request.phone, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный номер или пароль")
    
    token = create_access_token(user["_id"], user["role"])
    return AuthResponse(user=user_to_response(user), token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return user_to_response(user)


@router.put("/me", response_model=UserResponse)
async def update_profile(request: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="База данных недоступна")
    
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.region is not None:
        update_data["region"] = request.region
    if request.avatar_url is not None:
        update_data["avatar_url"] = request.avatar_url
    
    if request.username is not None:
        # Validate username
        if len(request.username) < 3 or len(request.username) > 20:
            raise HTTPException(status_code=400, detail="Username: 3-20 символов")
        if not re.match(r'^[a-zA-Z0-9_]+$', request.username):
            raise HTTPException(status_code=400, detail="Username: только буквы, цифры, _")
        
        existing = await get_user_by_username(request.username.lower())
        if existing and existing["_id"] != user["_id"]:
            raise HTTPException(status_code=400, detail="Username уже занят")
        update_data["username"] = request.username.lower()
    
    if update_data:
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    
    updated_user = await get_user_by_id(user["_id"])
    return user_to_response(updated_user)


@router.get("/users/search", response_model=List[UserSearchResult])
async def search_users_endpoint(q: str = Query(..., min_length=2), user: dict = Depends(get_current_user)):
    """Search users by username or name"""
    users = await search_users(q, limit=20)
    results = []
    for u in users:
        if u["_id"] != user["_id"]:
            results.append(UserSearchResult(
                id=u["_id"],
                name=u.get("name"),
                username=u.get("username"),
                avatar_url=u.get("avatar_url"),
                region=u.get("region"),
            ))
    return results


@router.post("/become-seller", response_model=UserResponse)
async def become_seller(request: BecomeSellerRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="База данных недоступна")
    
    if user.get("role") == "seller":
        raise HTTPException(status_code=400, detail="Вы уже продавец")
    
    updated_user = await upgrade_to_seller(
        user["_id"],
        seller_name=request.seller_name,
        region=request.region,
        seller_type=request.seller_type,
    )
    return user_to_response(updated_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(user: dict = Depends(get_current_user)):
    return MessageResponse(success=True, message="Вы вышли из аккаунта")
