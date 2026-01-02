from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.database import get_db
from app.db.models import generate_id
from app.middleware.auth import get_current_user, get_current_seller

router = APIRouter()


class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: int
    category: str
    images: List[str] = []
    region: Optional[str] = None


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    region: Optional[str] = None
    status: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
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
    seller_phone: Optional[str] = None
    seller_rating: float = 0.0
    created_at: datetime


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    pages: int


def product_to_response(product: dict) -> ProductResponse:
    return ProductResponse(
        id=product["_id"],
        title=product["title"],
        description=product.get("description"),
        price=product["price"],
        currency=product.get("currency", "UZS"),
        category=product["category"],
        images=product.get("images", []),
        region=product.get("region"),
        status=product.get("status", "active"),
        views=product.get("views", 0),
        seller_id=product["seller_id"],
        seller_name=product.get("seller_name", ""),
        seller_phone=product.get("seller_phone"),
        seller_rating=product.get("seller_rating", 0.0),
        created_at=product.get("created_at", datetime.utcnow()),
    )


@router.get("", response_model=ProductListResponse)
async def get_products(
    category: Optional[str] = None,
    region: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    db = get_db()
    
    # Return empty list if database is not available
    if db is None:
        return ProductListResponse(products=[], total=0, page=1, pages=1)
    
    # Build query
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if region:
        query["region"] = {"$regex": region, "$options": "i"}
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    
    # Count total
    total = await db.products.count_documents(query)
    
    # Get products
    skip = (page - 1) * limit
    cursor = db.products.find(query).sort("created_at", -1).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    return ProductListResponse(
        products=[product_to_response(p) for p in products],
        total=total,
        page=page,
        pages=(total + limit - 1) // limit if total > 0 else 1,
    )


@router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "seeds", "name": "Urug'lar", "icon": "🌱"},
            {"id": "fertilizers", "name": "O'g'itlar", "icon": "🧪"},
            {"id": "equipment", "name": "Texnika", "icon": "🚜"},
            {"id": "services", "name": "Xizmatlar", "icon": "🔧"},
            {"id": "animals", "name": "Hayvonlar", "icon": "🐄"},
            {"id": "other", "name": "Boshqa", "icon": "📦"},
        ]
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    # Increment views
    await db.products.update_one({"_id": product_id}, {"$inc": {"views": 1}})
    product["views"] = product.get("views", 0) + 1
    
    return product_to_response(product)


@router.post("", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    product_id = generate_id()
    new_product = {
        "_id": product_id,
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "currency": "UZS",
        "category": product.category,
        "images": product.images,
        "region": product.region or user.get("region"),
        "status": "active",
        "views": 0,
        "seller_id": user["_id"],
        "seller_name": user.get("seller_name") or user.get("name") or "Sotuvchi",
        "seller_phone": user.get("phone"),
        "seller_rating": 0.0,
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    
    await db.products.insert_one(new_product)
    return product_to_response(new_product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    update: ProductUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    if product["seller_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.products.update_one({"_id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"_id": product_id})
    return product_to_response(updated)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    if product["seller_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.products.delete_one({"_id": product_id})
    return {"success": True}
