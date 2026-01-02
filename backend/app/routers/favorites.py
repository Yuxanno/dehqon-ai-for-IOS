from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import generate_id
from app.middleware.auth import get_current_user

router = APIRouter()


class AddFavoriteRequest(BaseModel):
    product_id: str


class ProductInFavorite(BaseModel):
    id: str
    title: str
    price: int
    images: List[str]
    region: str


class FavoriteListResponse(BaseModel):
    favorites: List[ProductInFavorite]
    total: int


class MessageResponse(BaseModel):
    success: bool
    message: str


@router.get("", response_model=FavoriteListResponse)
async def get_favorites(user: dict = Depends(get_current_user)):
    db = get_db()
    
    if db is None:
        return FavoriteListResponse(favorites=[], total=0)
    
    # Get user's favorites
    cursor = db.favorites.find({"user_id": user["_id"]}).sort("created_at", -1)
    favorites = await cursor.to_list(length=100)
    
    # Get product details
    product_ids = [f["product_id"] for f in favorites]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(length=100)
    products_map = {p["_id"]: p for p in products}
    
    result = []
    for fav in favorites:
        product = products_map.get(fav["product_id"])
        if product:
            result.append(ProductInFavorite(
                id=product["_id"],
                title=product["title"],
                price=product["price"],
                images=product.get("images", []),
                region=product.get("region", ""),
            ))
    
    return FavoriteListResponse(
        favorites=result,
        total=len(result),
    )


@router.post("", response_model=MessageResponse)
async def add_favorite(
    request: AddFavoriteRequest,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check if product exists
    product = await db.products.find_one({"_id": request.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    # Check if already in favorites
    existing = await db.favorites.find_one({
        "user_id": user["_id"],
        "product_id": request.product_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Товар уже в избранном")
    
    # Add to favorites
    await db.favorites.insert_one({
        "_id": generate_id(),
        "user_id": user["_id"],
        "product_id": request.product_id,
        "created_at": datetime.utcnow(),
    })
    
    return MessageResponse(success=True, message="Добавлено в избранное")


@router.delete("/{product_id}", response_model=MessageResponse)
async def remove_favorite(
    product_id: str,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    result = await db.favorites.delete_one({
        "user_id": user["_id"],
        "product_id": product_id,
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Товар не найден в избранном")
    
    return MessageResponse(success=True, message="Удалено из избранного")


@router.get("/check/{product_id}")
async def check_favorite(
    product_id: str,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    
    if db is None:
        return {"is_favorite": False}
    
    existing = await db.favorites.find_one({
        "user_id": user["_id"],
        "product_id": product_id,
    })
    
    return {"is_favorite": existing is not None}
