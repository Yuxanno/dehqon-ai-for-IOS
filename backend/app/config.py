from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AI APIs
    text_ai_provider: str = "groq"
    text_ai_api_key: str = ""
    text_ai_model: str = "openai/gpt-oss-20b"
    
    vision_ai_provider: str = "groq"
    vision_ai_api_key: str = ""
    vision_ai_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"

    # Auth
    jwt_secret: str = "change-me-in-production-very-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 168  # 7 days

    # App
    env: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:5173"

    # Web Search
    serper_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
