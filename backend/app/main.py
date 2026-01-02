from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.config import get_settings
from app.db.database import connect_db, close_db
from app.routers import chat, products, upload, auth, favorites, geocode, conversations


settings = get_settings()

# Создаём папку uploads если её нет
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Dehqonjon API starting...")
    await connect_db()
    yield
    await close_db()
    print("Dehqonjon API shutting down...")


app = FastAPI(
    title="Dehqonjon API",
    description="API для маркетплейса и ИИ-консультанта для фермеров",
    version="1.0.0",
    lifespan=lifespan,
)

origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["Favorites"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(geocode.router, prefix="/api/geocode", tags=["Geocode"])

# Статические файлы для загруженных изображений
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {"message": "Dehqonjon API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
