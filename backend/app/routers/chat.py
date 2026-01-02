from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.models.chat import (
    ChatRequest,
    ChatResponse,
    Diagnosis,
    ImageAnalysisResponse,
)
from app.services.ai_service import AIService
from app.middleware.auth import get_current_user, get_optional_user
from app.db.database import get_db
from app.db.models import generate_id

router = APIRouter()
ai_service = AIService()


# Models for chat persistence
class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    image_url: Optional[str] = None
    created_at: str


class ChatSessionCreate(BaseModel):
    title: str = "Yangi chat"


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    messages: List[ChatMessage]
    created_at: str
    updated_at: str


class SaveMessageRequest(BaseModel):
    session_id: str
    message: ChatMessage


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, user: Optional[dict] = Depends(get_optional_user)):
    """Отправить сообщение ИИ-консультанту"""
    try:
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Преобразуем историю в список словарей
        history = None
        if request.history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.history]
        
        # Получаем ответ от ИИ
        response = await ai_service.get_response(
            message=request.message,
            conversation_id=conversation_id,
            image_url=request.image_url,
            history=history,
        )
        
        return ChatResponse(
            response=response["text"],
            conversation_id=conversation_id,
            suggestions=response.get("suggestions", []),
            diagnosis=response.get("diagnosis"),
            warning="Это предварительная оценка ИИ. Для точного диагноза обратитесь к специалисту.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-image", response_model=ImageAnalysisResponse)
async def upload_and_analyze_image(
    image: UploadFile = File(...),
    conversation_id: str = Form(...),
):
    """Загрузить и проанализировать изображение растения"""
    try:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Файл должен быть изображением")
        
        image_data = await image.read()
        
        analysis = await ai_service.analyze_image(
            image_data=image_data,
            conversation_id=conversation_id,
        )
        
        return ImageAnalysisResponse(
            analysis=analysis["text"],
            diagnosis=analysis["diagnosis"],
            recommendations=analysis["recommendations"],
            confidence=analysis["confidence"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Chat Session Persistence =====

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreate,
    user: dict = Depends(get_current_user),
):
    """Создать новую сессию чата"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    session_id = generate_id()
    now = datetime.utcnow().isoformat()
    
    session = {
        "_id": session_id,
        "user_id": user["_id"],
        "title": request.title,
        "messages": [],
        "created_at": now,
        "updated_at": now,
    }
    
    await db.chat_sessions.insert_one(session)
    
    return ChatSessionResponse(
        id=session_id,
        user_id=user["_id"],
        title=request.title,
        messages=[],
        created_at=now,
        updated_at=now,
    )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(user: dict = Depends(get_current_user)):
    """Получить все сессии чата пользователя"""
    db = get_db()
    if db is None:
        return []
    
    cursor = db.chat_sessions.find({"user_id": user["_id"]}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=100)
    
    return [
        ChatSessionResponse(
            id=s["_id"],
            user_id=s["user_id"],
            title=s["title"],
            messages=[ChatMessage(**m) for m in s.get("messages", [])],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str, user: dict = Depends(get_current_user)):
    """Получить конкретную сессию чата"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    session = await db.chat_sessions.find_one({"_id": session_id, "user_id": user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ChatSessionResponse(
        id=session["_id"],
        user_id=session["user_id"],
        title=session["title"],
        messages=[ChatMessage(**m) for m in session.get("messages", [])],
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )


@router.post("/sessions/{session_id}/messages")
async def add_message_to_session(
    session_id: str,
    message: ChatMessage,
    user: dict = Depends(get_current_user),
):
    """Добавить сообщение в сессию"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    session = await db.chat_sessions.find_one({"_id": session_id, "user_id": user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    now = datetime.utcnow().isoformat()
    
    # Update title if first user message
    update_data = {
        "$push": {"messages": message.dict()},
        "$set": {"updated_at": now}
    }
    
    if message.role == "user" and len(session.get("messages", [])) == 0:
        title = message.content[:30] + ("..." if len(message.content) > 30 else "")
        update_data["$set"]["title"] = title
    
    await db.chat_sessions.update_one({"_id": session_id}, update_data)
    
    return {"success": True}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str, user: dict = Depends(get_current_user)):
    """Удалить сессию чата"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    result = await db.chat_sessions.delete_one({"_id": session_id, "user_id": user["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True}


@router.get("/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    """Получить историю чатов пользователя (legacy endpoint)"""
    db = get_db()
    if db is None:
        return {"conversations": []}
    
    cursor = db.chat_sessions.find({"user_id": user["_id"]}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=100)
    
    return {"conversations": [{"id": s["_id"], "title": s["title"]} for s in sessions]}


@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    """Получить сообщения конкретного чата (legacy endpoint)"""
    db = get_db()
    if db is None:
        return {"messages": []}
    
    session = await db.chat_sessions.find_one({"_id": conversation_id, "user_id": user["_id"]})
    if not session:
        return {"messages": []}
    
    return {"messages": session.get("messages", [])}
