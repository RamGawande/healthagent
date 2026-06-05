# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from typing import List
# from app.database import get_db
# from app.models.user import User
# from app.models.session import Session as ChatSession
# from app.models.message import Message, MessageRole
# from app.schemas.message import MessageCreate, MessageResponse
# from app.core.security import get_current_active_user
# from app.core.rag_agent import RAGAgent
# from app.config import get_settings
# from datetime import datetime
# import json
# import asyncio
# from fastapi.responses import StreamingResponse
# router = APIRouter(prefix="/api/chat", tags=["Chat"])
# settings = get_settings()

# # Initialize RAG agent
# rag_agent = RAGAgent(settings.DATABASE_URL)

# @router.get("/{session_id}/stream-sse")
# async def stream_message_sse(
#     session_id: int,
#     message: str,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """SSE endpoint for EventSource (GET request)"""
#     session = db.query(ChatSession).filter(
#         ChatSession.id == session_id,
#         ChatSession.user_id == current_user.id
#     ).first()
    
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     # Save user message
#     user_message = Message(
#         session_id=session_id,
#         role=MessageRole.USER,
#         content=message
#     )
#     db.add(user_message)
#     db.commit()
    
#     async def generate_stream():
#         try:
#             full_response = ""
#             async for event in rag_agent.stream_chat(session.thread_id, message):
#                 if event:
#                     full_response += event
#                     yield f"data: {json.dumps({'token': event, 'done': False})}\n\n"
#                     await asyncio.sleep(0.01)
            
#             yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
            
#             # Save assistant message
#             assistant_message = Message(
#                 session_id=session_id,
#                 role=MessageRole.ASSISTANT,
#                 content=full_response
#             )
#             db.add(assistant_message)
#             session.updated_at = datetime.utcnow()
#             db.commit()
            
#         except Exception as e:
#             yield f"data: {json.dumps({'token': str(e), 'done': True, 'error': True})}\n\n"
    
#     return StreamingResponse(generate_stream(), media_type="text/event-stream")

# @router.post("/{session_id}/stream")
# async def stream_message(
#     session_id: int,
#     message: MessageCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Stream message response in real-time (like ChatGPT)"""
#     # Verify session belongs to user
#     session = db.query(ChatSession).filter(
#         ChatSession.id == session_id,
#         ChatSession.user_id == current_user.id
#     ).first()
    
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     # Save user message
#     user_message = Message(
#         session_id=session_id,
#         role=MessageRole.USER,
#         content=message.content
#     )
#     db.add(user_message)
#     db.commit()
    
#     # Streaming function
#     async def generate_stream():
#         try:
#             full_response = ""
            
#             # Stream the response
#             async for event in rag_agent.stream_chat(session.thread_id, message.content):
#                 if event:
#                     full_response += event
#                     # Send each token to frontend
#                     yield f"data: {json.dumps({'token': event, 'done': False})}\n\n"
#                     await asyncio.sleep(0.01)  # Small delay for smooth streaming
            
#             # Send completion signal
#             yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
            
#             # Save assistant message to database after streaming is complete
#             assistant_message = Message(
#                 session_id=session_id,
#                 role=MessageRole.ASSISTANT,
#                 content=full_response
#             )
#             db.add(assistant_message)
#             session.updated_at = datetime.utcnow()
#             db.commit()
            
#         except Exception as e:
#             error_msg = f"Error: {str(e)}"
#             yield f"data: {json.dumps({'token': error_msg, 'done': True, 'error': True})}\n\n"
    
#     return StreamingResponse(generate_stream(), media_type="text/event-stream")


# @router.post("/{session_id}/message", response_model=MessageResponse)
# async def send_message(
#     session_id: int,
#     message: MessageCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Send a message and get agent response"""
#     # Verify session belongs to user
#     session = db.query(ChatSession).filter(
#         ChatSession.id == session_id,
#         ChatSession.user_id == current_user.id
#     ).first()
    
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     # Save user message
#     user_message = Message(
#         session_id=session_id,
#         role=MessageRole.USER,
#         content=message.content
#     )
#     db.add(user_message)
#     db.commit()
    
#     # Get agent response
#     agent_response = await rag_agent.chat(session.thread_id, message.content)
    
#     # Save agent message
#     assistant_message = Message(
#         session_id=session_id,
#         role=MessageRole.ASSISTANT,
#         content=agent_response
#     )
#     db.add(assistant_message)
    
#     # Update session timestamp
#     session.updated_at = datetime.utcnow()
    
#     db.commit()
#     db.refresh(assistant_message)
    
#     return assistant_message

# @router.get("/{session_id}/messages", response_model=List[MessageResponse])
# def get_messages(
#     session_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Get all messages for a session"""
#     # Verify session belongs to user
#     session = db.query(ChatSession).filter(
#         ChatSession.id == session_id,
#         ChatSession.user_id == current_user.id
#     ).first()
    
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     messages = db.query(Message).filter(
#         Message.session_id == session_id
#     ).order_by(Message.created_at).all()
    
#     return messages
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import asyncio
import base64
from io import BytesIO
from PIL import Image
from app.database import get_db
from app.models.user import User
from app.models.session import Session as ChatSession
from app.models.message import Message, MessageRole
from app.schemas.message import MessageCreate, MessageResponse
from app.core.security import get_current_active_user
from app.core.rag_agent import RAGAgent
from app.config import get_settings
from datetime import datetime
from langchain_core.messages import AIMessage

router = APIRouter(prefix="/api/chat", tags=["Chat"])
settings = get_settings()
rag_agent = RAGAgent(settings.DATABASE_URL)
@router.post("/{session_id}/stream")
async def stream_message(
    session_id: int,
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Stream message response with optional image support"""
    # Verify session
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get thread_id before closing session
    thread_id = session.thread_id
    
    # Process image if provided
    image_data = None
    if image and image.filename:
        try:
            # Read image bytes
            image_bytes = await image.read()
            
            # Validate file type
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (10MB max)
            if len(image_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image size must be less than 10MB")
            
            # Resize image if too large (max 2048px on longest side)
            try:
                img = Image.open(BytesIO(image_bytes))
                # Convert RGBA to RGB if necessary
                if img.mode == 'RGBA':
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[3])
                    img = rgb_img
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if needed
                max_size = 2048
                if max(img.size) > max_size:
                    ratio = max_size / max(img.size)
                    new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Convert to base64
                buffer = BytesIO()
                img.save(buffer, format='JPEG', quality=85, optimize=True)
                image_bytes = buffer.getvalue()
            except Exception as e:
                print(f"Image processing error: {str(e)}")
                # Continue with original image if processing fails
            
            # Convert to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Determine mime type
            mime_type = image.content_type.split('/')[-1] if image.content_type else 'jpeg'
            if mime_type == 'jpeg':
                mime_type = 'jpg'
            
            image_data = {
                "base64": image_base64,
                "filename": image.filename,
                "mime_type": mime_type
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Image processing error: {str(e)}")
            # Continue without image if processing fails
    
    # Save user message
    message_content = content
    if image and image.filename:
        message_content += f"\n[Image: {image.filename}]"
    
    user_message = Message(
        session_id=session_id,
        role=MessageRole.USER,
        content=message_content
    )
    db.add(user_message)
    db.commit()
    
    # Close the original db session
    db.close()
    
    # Streaming generator
    async def generate_stream():
        full_response = ""
        try:
            # Stream the response with image data if available
            async for event in rag_agent.stream_chat(thread_id, content, image_data):
                if event:
                    full_response += event
                    yield f"data: {json.dumps({'token': event, 'done': False})}\n\n"
                    await asyncio.sleep(0.01)
            
            # Send completion
            yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"Stream error: {error_msg}")
            yield f"data: {json.dumps({'token': error_msg, 'done': True, 'error': True})}\n\n"
            return
        
        # Save assistant message with a NEW database session
        try:
            from app.database import SessionLocal
            new_db = SessionLocal()
            
            assistant_message = Message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=full_response
            )
            new_db.add(assistant_message)
            
            # Update session timestamp
            session_obj = new_db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session_obj:
                session_obj.updated_at = datetime.utcnow()
            
            new_db.commit()
            new_db.close()
        except Exception as e:
            print(f"Failed to save assistant message: {str(e)}")
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")

# @router.post("/{session_id}/stream")
# async def stream_message(
#     session_id: int,
#     content: str = Form(...),  # ✅ Use Form parameter
#     image: Optional[UploadFile] = File(None),  # ✅ Optional image
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Stream message response with optional image support"""
#     # Verify session
#     session = db.query(ChatSession).filter(
#         ChatSession.id == session_id,
#         ChatSession.user_id == current_user.id
#     ).first()
    
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     # Process image if provided
#     image_data = None
#     if image and image.filename:
#         try:
#             from app.services.image_processor import ImageProcessor
#             image_processor = ImageProcessor()
            
#             image_bytes = await image.read()
#             is_valid, message = image_processor.validate_image(image_bytes, image.filename)
            
#             if not is_valid:
#                 raise HTTPException(status_code=400, detail=message)
            
#             resized_image = image_processor.resize_image(image_bytes)
#             image_base64 = image_processor.image_to_base64(resized_image)
#             image_data = {"base64": image_base64, "filename": image.filename}
#         except Exception as e:
#             print(f"Image processing error: {str(e)}")
#             # Continue without image
    
#     # Save user message
#     message_content = content
#     if image and image.filename:
#         message_content += f"\n[Image: {image.filename}]"
    
#     user_message = Message(
#         session_id=session_id,
#         role=MessageRole.USER,
#         content=message_content
#     )
#     db.add(user_message)
#     db.commit()
    
#     # Streaming generator
#     async def generate_stream():
#         try:
#             full_response = ""
            
#             # Stream the response
#             async for event in rag_agent.stream_chat(session.thread_id, content, image_data):
#                 if event:
#                     full_response += event
#                     yield f"data: {json.dumps({'token': event, 'done': False})}\n\n"
#                     await asyncio.sleep(0.01)
            
#             # Send completion
#             yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
            
#             # Save assistant message
#             assistant_message = Message(
#                 session_id=session_id,
#                 role=MessageRole.ASSISTANT,
#                 content=full_response
#             )
#             db.add(assistant_message)
#             session.updated_at = datetime.utcnow()
#             db.commit()
            
#         except Exception as e:
#             error_msg = f"Error: {str(e)}"
#             print(f"Stream error: {error_msg}")
#             yield f"data: {json.dumps({'token': error_msg, 'done': True, 'error': True})}\n\n"
    
#     return StreamingResponse(generate_stream(), media_type="text/event-stream")

# Keep your existing /message endpoint for non-streaming
@router.post("/{session_id}/message", response_model=MessageResponse)
async def send_message(
    session_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get agent response (non-streaming)"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_message = Message(
        session_id=session_id,
        role=MessageRole.USER,
        content=message.content
    )
    db.add(user_message)
    db.commit()
    
    agent_response = await rag_agent.chat(session.thread_id, message.content, None)
    
    assistant_message = Message(
        session_id=session_id,
        role=MessageRole.ASSISTANT,
        content=agent_response
    )
    db.add(assistant_message)
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_message)
    
    return assistant_message

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all messages for a session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at).all()
    
    return messages
