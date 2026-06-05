"""
Script to view all users in the database
Usage: python view_users.py
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

def view_all_users():
    """Display all users in a formatted table"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        users = db.query(User).order_by(User.id).all()
        
        if not users:
            print("\n📭 No users found in database.\n")
            return
        
        print("\n" + "="*100)
        print("👥 ALL USERS")
        print("="*100)
        
        for user in users:
            admin_badge = "✅ ADMIN" if user.is_admin else "👤 USER"
            active_badge = "🟢 Active" if user.is_active else "🔴 Inactive"
            
            print(f"\n{'─'*100}")
            print(f"  ID:           {user.id}")
            print(f"  Username:     {user.username}")
            print(f"  Email:        {user.email}")
            print(f"  Role:         {admin_badge}")
            print(f"  Status:       {active_badge}")
            print(f"  Created:      {user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'N/A'}")
        
        print("\n" + "="*100)
        print(f"📊 Total Users: {len(users)}")
        
        # Statistics
        admin_count = sum(1 for u in users if u.is_admin)
        active_count = sum(1 for u in users if u.is_active)
        
        print(f"   - Admins: {admin_count}")
        print(f"   - Regular Users: {len(users) - admin_count}")
        print(f"   - Active: {active_count}")
        print(f"   - Inactive: {len(users) - active_count}")
        print("="*100 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*100)
    print("🔍 USER VIEWER - Medical Assistant App")
    print("="*100)
    
    view_all_users()

