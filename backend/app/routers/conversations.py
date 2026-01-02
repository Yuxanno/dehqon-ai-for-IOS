from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

from app.db.database import get_db
from app.db.models import generate_id
from app.middleware.auth import get_current_user

router = APIRouter()


class MessageCreate(BaseModel):
    content: str
    product_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    content: str
    product_id: Optional[str] = None
    created_at: datetime
    read: bool = False


class ConversationResponse(BaseModel):
    id: str
    participant_ids: List[str]
    participant_names: dict
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    product_id: Optional[str] = None
    product_title: Optional[str] = None
    unread_count: int = 0
    created_at: datetime


class ConversationDetailResponse(BaseModel):
    id: str
    participant_ids: List[str]
    participant_names: dict
    messages: List[MessageResponse]
    product_id: Optional[str] = None
    product_title: Optional[str] = None


class StartConversationRequest(BaseModel):
    recipient_id: str
    message: str
    product_id: Optional[str] = None


def get_unread_count_for_user(conv: dict, user_id: str) -> int:
    """Count unread messages for a specific user"""
    count = 0
    for msg in conv.get("messages", []):
        # Count messages from OTHER users that are not read
        if msg.get("sender_id") != user_id and not msg.get("read", False):
            count += 1
    return count


@router.post("/start", response_model=ConversationResponse)
async def start_conversation(
    request: StartConversationRequest,
    user: dict = Depends(get_current_user),
):
    """Start a new conversation or get existing one"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    sender_id = user["_id"]
    recipient_id = request.recipient_id
    
    if sender_id == recipient_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Check if recipient exists
    recipient = await db.users.find_one({"_id": recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing conversation between these users about same product
    existing_query = {
        "participant_ids": {"$all": [sender_id, recipient_id]},
    }
    if request.product_id:
        existing_query["product_id"] = request.product_id
    
    existing = await db.conversations.find_one(existing_query)
    
    now = datetime.utcnow()
    
    if existing:
        # Add message to existing conversation
        message_id = generate_id()
        message = {
            "id": message_id,
            "sender_id": sender_id,
            "content": request.message,
            "product_id": request.product_id,
            "created_at": now,
            "read": False,
        }
        
        await db.conversations.update_one(
            {"_id": existing["_id"]},
            {
                "$push": {"messages": message},
                "$set": {
                    "last_message": request.message,
                    "last_message_at": now,
                },
            }
        )
        
        conv = await db.conversations.find_one({"_id": existing["_id"]})
    else:
        # Create new conversation
        conv_id = generate_id()
        message_id = generate_id()
        
        # Get product info if provided
        product_title = None
        if request.product_id:
            product = await db.products.find_one({"_id": request.product_id})
            if product:
                product_title = product.get("title")
        
        message = {
            "id": message_id,
            "sender_id": sender_id,
            "content": request.message,
            "product_id": request.product_id,
            "created_at": now,
            "read": False,
        }
        
        conv = {
            "_id": conv_id,
            "participant_ids": [sender_id, recipient_id],
            "participant_names": {
                sender_id: user.get("name") or user.get("username") or "User",
                recipient_id: recipient.get("name") or recipient.get("username") or "User",
            },
            "messages": [message],
            "last_message": request.message,
            "last_message_at": now,
            "product_id": request.product_id,
            "product_title": product_title,
            "created_at": now,
        }
        
        await db.conversations.insert_one(conv)
    
    return ConversationResponse(
        id=conv["_id"],
        participant_ids=conv["participant_ids"],
        participant_names=conv["participant_names"],
        last_message=conv.get("last_message"),
        last_message_at=conv.get("last_message_at"),
        product_id=conv.get("product_id"),
        product_title=conv.get("product_title"),
        unread_count=get_unread_count_for_user(conv, sender_id),
        created_at=conv["created_at"],
    )


@router.get("", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get all conversations for current user"""
    db = get_db()
    if db is None:
        return []
    
    user_id = user["_id"]
    cursor = db.conversations.find(
        {"participant_ids": user_id}
    ).sort("last_message_at", -1)
    
    conversations = await cursor.to_list(length=50)
    
    return [
        ConversationResponse(
            id=c["_id"],
            participant_ids=c["participant_ids"],
            participant_names=c.get("participant_names", {}),
            last_message=c.get("last_message"),
            last_message_at=c.get("last_message_at"),
            product_id=c.get("product_id"),
            product_title=c.get("product_title"),
            unread_count=get_unread_count_for_user(c, user_id),
            created_at=c["created_at"],
        )
        for c in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user),
):
    """Get conversation with messages and mark as read"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user_id = user["_id"]
    
    conv = await db.conversations.find_one({
        "_id": conversation_id,
        "participant_ids": user_id,
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Mark messages from OTHER users as read
    await db.conversations.update_one(
        {"_id": conversation_id},
        {
            "$set": {"messages.$[elem].read": True}
        },
        array_filters=[{"elem.sender_id": {"$ne": user_id}}]
    )
    
    # Get updated conversation
    conv = await db.conversations.find_one({"_id": conversation_id})
    
    messages = [
        MessageResponse(
            id=m["id"],
            sender_id=m["sender_id"],
            content=m["content"],
            product_id=m.get("product_id"),
            created_at=m["created_at"],
            read=m.get("read", False),
        )
        for m in conv.get("messages", [])
    ]
    
    return ConversationDetailResponse(
        id=conv["_id"],
        participant_ids=conv["participant_ids"],
        participant_names=conv.get("participant_names", {}),
        messages=messages,
        product_id=conv.get("product_id"),
        product_title=conv.get("product_title"),
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    request: MessageCreate,
    user: dict = Depends(get_current_user),
):
    """Send a message in conversation"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user_id = user["_id"]
    
    conv = await db.conversations.find_one({
        "_id": conversation_id,
        "participant_ids": user_id,
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    now = datetime.utcnow()
    message_id = generate_id()
    
    message = {
        "id": message_id,
        "sender_id": user_id,
        "content": request.content,
        "product_id": request.product_id,
        "created_at": now,
        "read": False,
    }
    
    await db.conversations.update_one(
        {"_id": conversation_id},
        {
            "$push": {"messages": message},
            "$set": {
                "last_message": request.content,
                "last_message_at": now,
            },
        }
    )
    
    return MessageResponse(
        id=message_id,
        sender_id=user_id,
        content=request.content,
        product_id=request.product_id,
        created_at=now,
        read=False,
    )
