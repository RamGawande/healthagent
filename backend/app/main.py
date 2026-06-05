from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, chat, sessions, admin, guest
from app.config import get_settings
import os

# Disable ChromaDB telemetry to prevent startup issues
os.environ["ANONYMIZED_TELEMETRY"] = "False"

settings = get_settings()

# Validate API keys on startup
def validate_api_keys():
    """Check if API keys are configured"""
    warnings = []
    
    if settings.GROQ_API_KEY == "your-groq-api-key-here":
        warnings.append("⚠️  GROQ_API_KEY not configured - AI features will not work!")
    
    if settings.TAVILY_API_KEY == "your-tavily-api-key-here":
        warnings.append("⚠️  TAVILY_API_KEY not configured - Web search will not work!")
    
    if settings.SECRET_KEY == "default-secret-key-please-change-in-production-min-32-chars-required":
        warnings.append("⚠️  SECRET_KEY is using default value - Change this in production!")
    
    if warnings:
        print("\n" + "="*70)
        print("🔧 CONFIGURATION WARNINGS:")
        print("="*70)
        for warning in warnings:
            print(warning)
        print("\n💡 To fix: Edit backend/.env file with your actual API keys")
        print("📖 See SETUP_GUIDE.md for instructions")
        print("="*70 + "\n")
    else:
        print("\n✅ All API keys configured!\n")

validate_api_keys()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create upload and chroma directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    description="Medical Assistant API with RAG and LangGraph",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",  # Vite fallback port
        "http://localhost:3002",  # Vite fallback port
        "http://localhost:3003",  # Vite fallback port
        "http://localhost:3004",  # Vite fallback port
        "http://localhost",  # Docker production frontend
        "http://localhost:80",  # Docker production frontend
        "*",  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(guest.router)

@app.get("/")
def root():
    return {
        "message": "Medical Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8009, reload=True)
