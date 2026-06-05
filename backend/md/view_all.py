"""
Combined script to view all database data
Usage: python view_all.py [--users] [--messages] [--documents]
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
import app.models
from app.models.user import User
from app.models.message import Message, MessageRole
from app.models.session import Session as ChatSession
from app.models.document import Document

def format_size(bytes):
    """Convert bytes to human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} TB"

def view_users_summary(db):
    """Display users summary"""
    users = db.query(User).all()
    
    print("\n" + "="*100)
    print("👥 USERS SUMMARY")
    print("="*100)
    
    if not users:
        print("📭 No users found.\n")
        return
    
    for user in users[:10]:  # Show first 10
        admin_badge = "✅ ADMIN" if user.is_admin else "👤 USER"
        print(f"  {user.id}. {user.username:20} | {user.email:30} | {admin_badge}")
    
    if len(users) > 10:
        print(f"  ... and {len(users) - 10} more users")
    
    print(f"\n📊 Total Users: {len(users)}")
    print(f"   - Admins: {sum(1 for u in users if u.is_admin)}")
    print(f"   - Active: {sum(1 for u in users if u.is_active)}")

def view_messages_summary(db):
    """Display messages summary"""
    messages = db.query(Message).order_by(Message.created_at.desc()).limit(10).all()
    total_messages = db.query(Message).count()
    
    print("\n" + "="*100)
    print("💬 MESSAGES SUMMARY (Latest 10)")
    print("="*100)
    
    if not messages:
        print("📭 No messages found.\n")
        return
    
    for msg in messages:
        role_icon = "👤" if msg.role == MessageRole.USER else "🤖"
        content_preview = msg.content[:60] + "..." if len(msg.content) > 60 else msg.content
        time_str = msg.created_at.strftime('%Y-%m-%d %H:%M') if msg.created_at else 'N/A'
        print(f"  {role_icon} [{time_str}] {content_preview}")
    
    print(f"\n📊 Total Messages: {total_messages}")
    user_msgs = db.query(Message).filter(Message.role == MessageRole.USER).count()
    assistant_msgs = db.query(Message).filter(Message.role == MessageRole.ASSISTANT).count()
    print(f"   - User: {user_msgs}")
    print(f"   - Assistant: {assistant_msgs}")

def view_sessions_summary(db):
    """Display sessions summary"""
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(10).all()
    total_sessions = db.query(ChatSession).count()
    
    print("\n" + "="*100)
    print("💭 CHAT SESSIONS SUMMARY (Latest 10)")
    print("="*100)
    
    if not sessions:
        print("📭 No sessions found.\n")
        return
    
    for session in sessions:
        user = db.query(User).filter(User.id == session.user_id).first()
        msg_count = db.query(Message).filter(Message.session_id == session.id).count()
        time_str = session.updated_at.strftime('%Y-%m-%d %H:%M') if session.updated_at else 'N/A'
        username = user.username if user else "Unknown"
        print(f"  {session.id}. {session.title:40} | User: {username:15} | Messages: {msg_count:3} | {time_str}")
    
    print(f"\n📊 Total Sessions: {total_sessions}")

def view_documents_summary(db):
    """Display documents summary"""
    documents = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    
    print("\n" + "="*100)
    print("📄 DOCUMENTS SUMMARY")
    print("="*100)
    
    if not documents:
        print("📭 No documents found.\n")
        return
    
    total_size = 0
    for doc in documents[:10]:  # Show first 10
        status = "✅" if doc.processed == "completed" else "❌" if doc.processed == "failed" else "⏳"
        size_str = format_size(doc.file_size) if doc.file_size else "N/A"
        time_str = doc.uploaded_at.strftime('%Y-%m-%d %H:%M') if doc.uploaded_at else 'N/A'
        total_size += doc.file_size if doc.file_size else 0
        print(f"  {status} {doc.original_filename:50} | {size_str:10} | {time_str}")
    
    if len(documents) > 10:
        print(f"  ... and {len(documents) - 10} more documents")
    
    print(f"\n📊 Total Documents: {len(documents)}")
    print(f"💾 Total Size: {format_size(sum(d.file_size for d in documents if d.file_size))}")
    print(f"   - Completed: {sum(1 for d in documents if d.processed == 'completed')}")
    print(f"   - Failed: {sum(1 for d in documents if d.processed == 'failed')}")

def view_all_data():
    """Display all database data"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("\n" + "="*100)
        print("🔍 MEDICAL ASSISTANT DATABASE - COMPLETE VIEW")
        print("="*100)
        
        # Show all summaries
        view_users_summary(db)
        view_sessions_summary(db)
        view_messages_summary(db)
        view_documents_summary(db)
        
        # Overall statistics
        print("\n" + "="*100)
        print("📈 OVERALL STATISTICS")
        print("="*100)
        print(f"  Total Users:          {db.query(User).count()}")
        print(f"  Total Chat Sessions:  {db.query(ChatSession).count()}")
        print(f"  Total Messages:       {db.query(Message).count()}")
        print(f"  Total Documents:      {db.query(Document).count()}")
        print("="*100 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*100)
    print("🗄️  DATABASE VIEWER - Medical Assistant App")
    print("="*100)
    
    if len(sys.argv) > 1:
        settings = get_settings()
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            if "--users" in sys.argv:
                view_users_summary(db)
            if "--messages" in sys.argv:
                view_messages_summary(db)
            if "--documents" in sys.argv:
                view_documents_summary(db)
        finally:
            db.close()
    else:
        view_all_data()
    
    print("\n💡 Usage:")
    print("  python view_all.py                    # View everything")
    print("  python view_all.py --users            # View only users")
    print("  python view_all.py --messages         # View only messages")
    print("  python view_all.py --documents        # View only documents")
    print()

