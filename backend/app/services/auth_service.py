from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import bcrypt
import random
import string
from app.config import get_settings
from app.db.database import get_db
from app.db.models import UserInDB, UserRole, generate_id

settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def generate_username(phone: str) -> str:
    """Generate unique username from phone number"""
    # Take last 4 digits of phone + random suffix
    last_digits = phone[-4:]
    random_suffix = ''.join(random.choices(string.ascii_lowercase, k=3))
    return f"user_{last_digits}{random_suffix}"


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


async def get_user_by_phone(phone: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    user = await db.users.find_one({"phone": phone})
    return user


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    user = await db.users.find_one({"_id": user_id})
    return user


async def get_user_by_username(username: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    user = await db.users.find_one({"username": username})
    return user


async def search_users(query: str, limit: int = 20) -> list:
    """Search users by username or name"""
    db = get_db()
    if db is None:
        return []
    
    # Search by username or name (case-insensitive)
    cursor = db.users.find({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"name": {"$regex": query, "$options": "i"}}
        ]
    }).limit(limit)
    
    users = await cursor.to_list(length=limit)
    return users


async def create_user(phone: str, password: str, name: str = None) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise Exception("Database unavailable")
    
    user_id = generate_id()
    username = generate_username(phone)
    
    # Ensure username is unique
    while await get_user_by_username(username):
        username = generate_username(phone)
    
    user = {
        "_id": user_id,
        "phone": phone,
        "password_hash": hash_password(password),
        "name": name,
        "username": username,
        "avatar_url": None,
        "region": None,
        "role": UserRole.USER.value,
        "is_active": True,
        "seller_name": None,
        "seller_type": None,
        "is_verified_seller": False,
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    await db.users.insert_one(user)
    return user


async def authenticate_user(phone: str, password: str) -> Optional[dict]:
    user = await get_user_by_phone(phone)
    if not user:
        return None
    if not user.get("password_hash"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


async def upgrade_to_seller(user_id: str, seller_name: str, region: str, seller_type: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise Exception("Database unavailable")
    
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "role": UserRole.SELLER.value,
                "seller_name": seller_name,
                "region": region,
                "seller_type": seller_type,
                "updated_at": datetime.utcnow(),
            }
        }
    )
    return await get_user_by_id(user_id)
