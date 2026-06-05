from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from app.core.rag_agent import RAGAgent
from app.config import get_settings

router = APIRouter(prefix="/api/guest", tags=["Guest"])
settings = get_settings()

# Create a separate RAG agent for guest (no database persistence)
guest_rag_agent = RAGAgent(settings.DATABASE_URL)

class GuestMessage(BaseModel):
    message: str

@router.post("/chat")
async def guest_chat(msg: GuestMessage):
    """Guest chat endpoint - no authentication required"""
    # Use a temporary thread_id for guest sessions
    import uuid
    guest_thread_id = f"guest_{uuid.uuid4().hex[:8]}"
    
    async def generate_stream():
        try:
            async for event in guest_rag_agent.stream_chat(guest_thread_id, msg.message):
                if event:
                    yield f"data: {json.dumps({'token': event, 'done': False})}\n\n"
                    await asyncio.sleep(0.01)
            
            yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            yield f"data: {json.dumps({'token': error_msg, 'done': True, 'error': True})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")
