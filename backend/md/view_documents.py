"""
Script to view all uploaded documents in the database
Usage: python view_documents.py
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
import app.models
from app.models.document import Document

def format_size(bytes):
    """Convert bytes to human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} TB"

def view_all_documents():
    """Display all documents in a formatted table"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        documents = db.query(Document).order_by(Document.uploaded_at.desc()).all()
        
        if not documents:
            print("\n📭 No documents found in database.\n")
            return
        
        print("\n" + "="*100)
        print("📄 ALL DOCUMENTS")
        print("="*100)
        
        total_size = 0
        
        for doc in documents:
            # Status badge
            if doc.processed == "completed":
                status_badge = "✅ Completed"
            elif doc.processed == "processing":
                status_badge = "⏳ Processing"
            elif doc.processed == "failed":
                status_badge = "❌ Failed"
            else:
                status_badge = "⚪ Unknown"
            
            size_str = format_size(doc.file_size) if doc.file_size else "N/A"
            total_size += doc.file_size if doc.file_size else 0
            
            print(f"\n{'─'*100}")
            print(f"  ID:               {doc.id}")
            print(f"  Original Name:    {doc.original_filename}")
            print(f"  Stored Name:      {doc.filename}")
            print(f"  File Path:        {doc.file_path}")
            print(f"  Size:             {size_str}")
            print(f"  Type:             {doc.mime_type or 'N/A'}")
            print(f"  Status:           {status_badge}")
            print(f"  Uploaded:         {doc.uploaded_at.strftime('%Y-%m-%d %H:%M:%S') if doc.uploaded_at else 'N/A'}")
            
            # Check if file exists
            if os.path.exists(doc.file_path):
                print(f"  File Exists:      ✅ Yes")
            else:
                print(f"  File Exists:      ❌ No (File deleted or moved)")
        
        print("\n" + "="*100)
        print(f"📊 Total Documents: {len(documents)}")
        print(f"💾 Total Size: {format_size(total_size)}")
        
        # Statistics
        completed = sum(1 for d in documents if d.processed == "completed")
        processing = sum(1 for d in documents if d.processed == "processing")
        failed = sum(1 for d in documents if d.processed == "failed")
        
        print(f"   - Completed: {completed}")
        print(f"   - Processing: {processing}")
        print(f"   - Failed: {failed}")
        print("="*100 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*100)
    print("🔍 DOCUMENT VIEWER - Medical Assistant App")
    print("="*100)
    
    view_all_documents()

