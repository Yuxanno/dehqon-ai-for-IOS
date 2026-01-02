from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Diagnosis(BaseModel):
    name: str
    probability: int  # 0-100
    description: str
    recommendations: list[str] = []


class ChatMessage(BaseModel):
    id: str
    conversation_id: str
    role: MessageRole
    content: str
    image_url: Optional[str] = None
    diagnosis: Optional[list[Diagnosis]] = None
    suggestions: Optional[list[str]] = None
    created_at: datetime


class ChatHistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    image_url: Optional[str] = None
    history: Optional[list[ChatHistoryMessage]] = None  # История сообщений


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    suggestions: list[str] = []
    diagnosis: Optional[list[Diagnosis]] = None
    warning: Optional[str] = None


class ImageAnalysisRequest(BaseModel):
    conversation_id: str


class ImageAnalysisResponse(BaseModel):
    analysis: str
    diagnosis: list[Diagnosis]
    recommendations: list[str]
    confidence: float  # 0-1
