"""
Script to view all messages in the database
Usage: python view_messages.py [--limit N] [--session SESSION_ID] [--user USER_ID]
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
import app.models
from app.models.message import Message, MessageRole
from app.models.session import Session as ChatSession
from app.models.user import User

def view_all_messages(limit=None, session_id=None, user_id=None):
    """Display all messages in a formatted view"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Build query
        query = db.query(Message).join(ChatSession).join(User)
        
        if session_id:
            query = query.filter(Message.session_id == session_id)
        
        if user_id:
            query = query.filter(ChatSession.user_id == user_id)
        
        query = query.order_by(Message.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        messages = query.all()
        
        if not messages:
            print("\n📭 No messages found.\n")
            return
        
        print("\n" + "="*100)
        print("💬 ALL MESSAGES")
        if session_id:
            print(f"   Filtered by Session ID: {session_id}")
        if user_id:
            print(f"   Filtered by User ID: {user_id}")
        if limit:
            print(f"   Showing latest {limit} messages")
        print("="*100)
        
        for msg in messages:
            role_icon = "👤" if msg.role == MessageRole.USER else "🤖"
            role_name = "USER" if msg.role == MessageRole.USER else "ASSISTANT"
            
            # Get session and user info
            session = db.query(ChatSession).filter(ChatSession.id == msg.session_id).first()
            user = db.query(User).filter(User.id == session.user_id).first() if session else None
            
            print(f"\n{'─'*100}")
            print(f"  Message ID:   {msg.id}")
            print(f"  Role:         {role_icon} {role_name}")
            print(f"  Session ID:   {msg.session_id}")
            if session:
                print(f"  Session:      {session.title}")
            if user:
                print(f"  User:         {user.username} ({user.email})")
            print(f"  Created:      {msg.created_at.strftime('%Y-%m-%d %H:%M:%S') if msg.created_at else 'N/A'}")
            print(f"  Content:      {msg.content[:200]}..." if len(msg.content) > 200 else f"  Content:      {msg.content}")
        
        print("\n" + "="*100)
        print(f"📊 Total Messages: {len(messages)}")
        
        # Statistics
        user_msgs = sum(1 for m in messages if m.role == MessageRole.USER)
        assistant_msgs = sum(1 for m in messages if m.role == MessageRole.ASSISTANT)
        
        print(f"   - User Messages: {user_msgs}")
        print(f"   - Assistant Messages: {assistant_msgs}")
        print("="*100 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*100)
    print("🔍 MESSAGE VIEWER - Medical Assistant App")
    print("="*100)
    
    limit = None
    session_id = None
    user_id = None
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        for i in range(1, len(sys.argv)):
            if sys.argv[i] == "--limit" and i + 1 < len(sys.argv):
                limit = int(sys.argv[i + 1])
            elif sys.argv[i] == "--session" and i + 1 < len(sys.argv):
                session_id = int(sys.argv[i + 1])
            elif sys.argv[i] == "--user" and i + 1 < len(sys.argv):
                user_id = int(sys.argv[i + 1])
    
    view_all_messages(limit=limit, session_id=session_id, user_id=user_id)

