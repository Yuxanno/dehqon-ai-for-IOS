from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class Category(str, Enum):
    SEEDS = "seeds"
    FERTILIZERS = "fertilizers"
    EQUIPMENT = "equipment"
    SERVICES = "services"
    ANIMALS = "animals"
    OTHER = "other"


class ProductStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    HIDDEN = "hidden"


class SellerPreview(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None
    rating: float
    reviews_count: int


class Product(BaseModel):
    id: str
    title: str
    description: str
    price: int
    currency: str = "RUB"
    category: Category
    images: list[str] = []
    region: str
    seller_id: str
    seller: SellerPreview
    created_at: datetime
    updated_at: datetime
    views: int = 0
    status: ProductStatus = ProductStatus.ACTIVE


class ProductCreate(BaseModel):
    title: str
    description: str
    price: int
    category: Category
    images: list[str] = []
    region: str


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    category: Optional[Category] = None
    images: Optional[list[str]] = None
    region: Optional[str] = None
    status: Optional[ProductStatus] = None


class ProductFilters(BaseModel):
    category: Optional[Category] = None
    region: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20


class ProductListResponse(BaseModel):
    products: list[Product]
    total: int
    page: int
    pages: int
