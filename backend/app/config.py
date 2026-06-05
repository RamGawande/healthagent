from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Medical Assistant API"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./medical_assistant.db"
    
    # Security
    SECRET_KEY: str = "default-secret-key-please-change-in-production-min-32-chars-required"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API Keys (with defaults for better error messages)
    GOOGLE_API_KEY: str = "your-google-api-key-here"
    TAVILY_API_KEY: str = "your-tavily-api-key-here"
    GROQ_API_KEY: str = "your-groq-api-key-here"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # ChromaDB
    CHROMA_DB_DIR: str = "chroma_db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
