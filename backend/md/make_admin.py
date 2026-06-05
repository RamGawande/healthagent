"""
Script to make a user an admin
Usage: python make_admin.py <username_or_email>
"""
import sys
import os

# Set up path to import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

# Import all models to ensure they're registered
import app.models
from app.models.user import User

def make_admin(identifier: str):
    """Make a user an admin by username or email"""
    settings = get_settings()
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find the user by username OR email
        user = db.query(User).filter(
            or_(User.username == identifier, User.email == identifier)
        ).first()
        
        if not user:
            print(f"❌ Error: User '{identifier}' not found!")
            print("\n💡 Tip: You can use either username or email")
            print("\nAvailable users:")
            all_users = db.query(User).all()
            for u in all_users:
                admin_status = "✅ ADMIN" if u.is_admin else "👤 USER"
                print(f"  - {u.username} ({u.email}) - {admin_status}")
            return False
        
        # Check if already admin
        if user.is_admin:
            print(f"ℹ️  User '{user.username}' ({user.email}) is already an admin!")
            return True
        
        # Make admin
        user.is_admin = True
        db.commit()
        
        print(f"✅ Success! User is now an admin!")
        print(f"\nUser Details:")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Admin Status: {'✅ ADMIN' if user.is_admin else '👤 USER'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def list_all_users():
    """List all users in the database"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        if not users:
            print("No users found in database.")
            return
        
        print("\n" + "="*60)
        print("📋 ALL USERS:")
        print("="*60)
        
        for user in users:
            admin_badge = "✅ ADMIN" if user.is_admin else "👤 USER"
            print(f"\n  Username: {user.username}")
            print(f"  Email:    {user.email}")
            print(f"  Status:   {admin_badge}")
            print(f"  ID:       {user.id}")
        
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔧 MAKE USER ADMIN - Medical Assistant App")
    print("="*60)
    
    if len(sys.argv) < 2:
        print("\n📖 Usage: python make_admin.py <username_or_email>")
        print("\n💡 Examples:")
        print("  python make_admin.py john_doe")
        print("  python make_admin.py john@example.com")
        print("  python make_admin.py --list  (to see all users)")
        
        # Show available users
        list_all_users()
        sys.exit(1)
    
    if sys.argv[1] == "--list" or sys.argv[1] == "-l":
        list_all_users()
        sys.exit(0)
    
    identifier = sys.argv[1]
    
    # Detect if it's an email or username
    if "@" in identifier:
        print(f"\n🎯 Target User (by email): {identifier}")
    else:
        print(f"\n🎯 Target User (by username): {identifier}")
    print("-" * 60)
    
    success = make_admin(identifier)
    
    print("\n" + "="*60)
    
    if success:
        print("\n✅ Done! The user can now access the admin panel at:")
        print("   http://localhost:3001/admin")
    else:
        print("\n❌ Failed to make user admin. Please check the username.")
    
    print("\n" + "="*60 + "\n")
    
    sys.exit(0 if success else 1)

