from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import os
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.session import Session as ChatSession
from app.models.message import Message, MessageRole
from app.schemas.document import DocumentResponse
from app.schemas.user import UserResponse
from app.schemas.session import SessionResponse
from app.schemas.message import MessageResponse
from app.core.security import get_current_admin_user
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStoreManager
from app.config import get_settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Admin"])
settings = get_settings()

document_processor = DocumentProcessor()
vector_store_manager = VectorStoreManager()

# Schemas for admin responses
class UserDetailResponse(BaseModel):
    user: UserResponse
    total_sessions: int
    total_messages: int
    recent_activity: Optional[str]
    
    class Config:
        from_attributes = True

class UserWithStats(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: str
    total_sessions: int
    total_messages: int
    last_activity: Optional[str]
    
    class Config:
        from_attributes = True

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Upload and process a document (Admin only)"""
    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    try:
        # Save file
        file_path, unique_filename = await document_processor.save_file(file_content, file.filename)
        
        # Create document record
        document = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type,
            processed="processing"
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process document in background (for production, use Celery or similar)
        try:
            chunks = document_processor.process_document(file_path, file.filename)
            vector_store_manager.add_documents(chunks)
            
            document.processed = "completed"
            db.commit()
        except Exception as e:
            document.processed = "failed"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Document processing failed: {str(e)}"
            )
        
        return document
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all uploaded documents (Admin only)"""
    documents = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return documents

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a document (Admin only)"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# ==================== USER MANAGEMENT ENDPOINTS ====================

@router.get("/users", response_model=List[UserWithStats])
def list_all_users(
    search: Optional[str] = Query(None, description="Search by username or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all users with statistics (Admin only)"""
    # Base query
    query = db.query(User)
    
    # Apply search filter if provided
    if search:
        search_filter = or_(
            User.username.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    users = query.order_by(User.created_at.desc()).all()
    
    # Get statistics for each user
    result = []
    for user in users:
        # Count sessions and messages
        total_sessions = db.query(ChatSession).filter(ChatSession.user_id == user.id).count()
        total_messages = db.query(Message).join(ChatSession).filter(ChatSession.user_id == user.id).count()
        
        # Get last activity
        last_session = db.query(ChatSession).filter(
            ChatSession.user_id == user.id
        ).order_by(ChatSession.updated_at.desc()).first()
        
        last_activity = last_session.updated_at.isoformat() if last_session and last_session.updated_at else None
        
        result.append(UserWithStats(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at.isoformat() if user.created_at else "",
            total_sessions=total_sessions,
            total_messages=total_messages,
            last_activity=last_activity
        ))
    
    return result

@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get detailed information about a specific user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get statistics
    total_sessions = db.query(ChatSession).filter(ChatSession.user_id == user.id).count()
    total_messages = db.query(Message).join(ChatSession).filter(ChatSession.user_id == user.id).count()
    
    # Get recent activity
    last_session = db.query(ChatSession).filter(
        ChatSession.user_id == user.id
    ).order_by(ChatSession.updated_at.desc()).first()
    
    recent_activity = last_session.updated_at.isoformat() if last_session and last_session.updated_at else None
    
    return UserDetailResponse(
        user=user,
        total_sessions=total_sessions,
        total_messages=total_messages,
        recent_activity=recent_activity
    )

@router.get("/users/{user_id}/sessions", response_model=List[SessionResponse])
def get_user_sessions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all sessions for a specific user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user_id
    ).order_by(ChatSession.updated_at.desc()).all()
    
    return sessions

@router.get("/users/{user_id}/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_user_session_messages(
    user_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all messages from a specific user's session (Admin only)"""
    # Verify the session belongs to the user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at).all()
    
    return messages

@router.patch("/users/{user_id}/toggle-admin")
def toggle_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Toggle admin status for a user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from removing their own admin status
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own admin status"
        )
    
    user.is_admin = not user.is_admin
    db.commit()
    
    return {
        "message": f"User {'promoted to' if user.is_admin else 'demoted from'} admin",
        "is_admin": user.is_admin
    }

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Toggle active status for a user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deactivating themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own active status"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'}",
        "is_active": user.is_active
    }

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get overall system statistics (Admin only)"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()
    total_sessions = db.query(ChatSession).count()
    total_messages = db.query(Message).count()
    total_documents = db.query(Document).count()
    
    # User messages vs assistant messages
    user_messages = db.query(Message).filter(Message.role == MessageRole.USER).count()
    assistant_messages = db.query(Message).filter(Message.role == MessageRole.ASSISTANT).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admin_users
        },
        "sessions": total_sessions,
        "messages": {
            "total": total_messages,
            "user": user_messages,
            "assistant": assistant_messages
        },
        "documents": total_documents
    }
