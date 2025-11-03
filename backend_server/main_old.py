"""
Main FastAPI Application - Modular Architecture
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import configuration and services
from config import SERVER_TITLE, SERVER_VERSION, CORS_ORIGINS, STREAMING_CONFIG
from agent_registry import AgentRegistry
from memory_handler import MemoryHandler
from streaming_handler import StreamingHandler
from controllers import AgentController, SessionController, MemoryController, GmailController, SystemController
from routes import create_routes

# Import ADK services
from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    # Initialize FastAPI app
    app = FastAPI(title=SERVER_TITLE, version=SERVER_VERSION)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Initialize services
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()
    
    # Initialize handlers
    memory_handler = MemoryHandler(session_service, memory_service)
    streaming_handler = StreamingHandler(
        session_service=session_service,
        memory_service=memory_service,
        **STREAMING_CONFIG
    )
    
    # Initialize agent registry
    agent_registry = AgentRegistry()
    
    # Initialize controllers
    agent_controller = AgentController(
        agent_registry.get_all_agents(),
        streaming_handler,
        memory_handler
    )
    session_controller = SessionController(memory_handler)
    memory_controller = MemoryController(memory_handler)
    gmail_controller = GmailController()
    system_controller = SystemController(streaming_handler, memory_handler)
    
    # Create and include routes
    router = create_routes(
        agent_controller,
        session_controller,
        memory_controller,
        gmail_controller,
        system_controller
    )
    
    app.include_router(router)
    
    return app

# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
import json
from datetime import datetime, timedelta
import sys
import os
import asyncio

from agent_web.agent import root_agent as academic_coordinator
from agent_web_searcher.agent import root_agent as expert_web_searcher
from agent_brevo.agent import root_agent as brevo_expert
from agent_gmail.agent import root_agent as gmail_expert
from agent_story.agent import root_agent as story_expert
from agent_gmail.tools.gmail.gmail_reader_tool import update_gmail_tokens
from streaming_handler import StreamingHandler

# Agent registry
AGENT_REGISTRY = {
    "academic_coordinator": academic_coordinator,
    "expert_web_searcher": expert_web_searcher,
    "brevo_expert": brevo_expert,
    "gmail_expert": gmail_expert,
    "story_expert": story_expert,
}

# Session management
USER_SESSIONS: Dict[str, Dict[str, Any]] = {}  # user_id -> {agent_id -> session_info}
SESSION_TIMEOUT = timedelta(hours=2)  # Sessions expire after 2 hours

class AgentRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    response: str
    agent_id: str
    status: str

class GmailTokenRequest(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user_email: Optional[str] = None
    expires_in: Optional[int] = None

# Session management functions
async def get_or_create_session(user_id: str, agent_id: str, app_name: str = "adk_app"):
    """Get existing session or create new one for user-agent combination"""
    current_time = datetime.now()
    
    # Initialize user sessions if not exists
    if user_id not in USER_SESSIONS:
        USER_SESSIONS[user_id] = {}
    
    # Check if session exists and is not expired
    if agent_id in USER_SESSIONS[user_id]:
        session_info = USER_SESSIONS[user_id][agent_id]
        if current_time - session_info['created_at'] < SESSION_TIMEOUT:
            # Session is still valid, return existing session
            return session_info['session_id'], session_info['session']
        else:
            # Session expired, clean it up
            await cleanup_expired_session(user_id, agent_id, session_info)
    
    # Create new session
    session_id = f"{user_id}_{agent_id}_{int(current_time.timestamp())}"
    session = await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state={
            "user:agent_preference": agent_id,
            "session_start_time": current_time.isoformat(),
            "conversation_count": 0
        }
    )
    
    # Store session info
    USER_SESSIONS[user_id][agent_id] = {
        'session_id': session_id,
        'session': session,
        'created_at': current_time,
        'last_activity': current_time,
        'message_count': 0
    }
    
    return session_id, session

async def cleanup_expired_session(user_id: str, agent_id: str, session_info: Dict[str, Any]):
    """Clean up expired session and optionally add to memory"""
    try:
        # Get the session from service
        session = await session_service.get_session(
            app_name="adk_app",
            user_id=user_id,
            session_id=session_info['session_id']
        )
        
        # If session has meaningful content, add to memory
        if session and len(session.events) > 2:  # More than just start/end events
            await memory_service.add_session_to_memory(session)
            print(f"Added session {session_info['session_id']} to memory")
        
        # Delete session from service
        await session_service.delete_session(
            app_name="adk_app",
            user_id=user_id,
            session_id=session_info['session_id']
        )
        
    except Exception as e:
        print(f"Error cleaning up session: {e}")
    
    # Remove from tracking
    if user_id in USER_SESSIONS and agent_id in USER_SESSIONS[user_id]:
        del USER_SESSIONS[user_id][agent_id]

async def update_session_activity(user_id: str, agent_id: str):
    """Update last activity time for session"""
    if user_id in USER_SESSIONS and agent_id in USER_SESSIONS[user_id]:
        USER_SESSIONS[user_id][agent_id]['last_activity'] = datetime.now()
        USER_SESSIONS[user_id][agent_id]['message_count'] += 1

@app.get("/")
async def root():
    return {"message": "Agent API Server is running"}

@app.get("/agents")
async def list_agents():
    """List all available agents"""
    return {
        "agents": list(AGENT_REGISTRY.keys()),
        "count": len(AGENT_REGISTRY)
    }

@app.post("/agent/{agent_id}")
async def call_agent(agent_id: str, request: AgentRequest):
    """Call a specific agent by ID (non-streaming)"""
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404, 
            detail=f"Agent '{agent_id}' not found. Available agents: {list(AGENT_REGISTRY.keys())}"
        )
    
    try:
        agent = AGENT_REGISTRY[agent_id]
        
        # Use the streaming handler to get the complete response
        session_id = str(uuid.uuid4())
        user_id = "default_user"
        
        # Collect all streaming events
        full_response = ""
        async for event in streaming_handler.start_streaming_session(
            session_id=session_id,
            agent_id=agent_id,
            user_id=user_id,
            agent=agent,
            message=request.message
        ):
            if event.type.value == "content":
                full_response += event.content
        
        return AgentResponse(
            response=full_response,
            agent_id=agent_id,
            status="success"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling agent '{agent_id}': {str(e)}"
        )

@app.post("/agent/{agent_id}/stream")
async def stream_agent(agent_id: str, request: AgentRequest):
    """Call a specific agent by ID with streaming response"""
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404, 
            detail=f"Agent '{agent_id}' not found. Available agents: {list(AGENT_REGISTRY.keys())}"
        )
    
    try:
        agent = AGENT_REGISTRY[agent_id]
        user_id = request.context.get("user_id", "default_user")
        
        # Get or create session for this user-agent combination
        session_id, adk_session = await get_or_create_session(user_id, agent_id)
        
        # Update session activity
        await update_session_activity(user_id, agent_id)
        
        # Return streaming response with proper session management
        return StreamingResponse(
            streaming_handler.stream_to_sse(
                session_id=session_id,
                agent_id=agent_id,
                user_id=user_id,
                agent=agent,
                message=request.message,
                adk_session=adk_session
            ),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error streaming agent '{agent_id}': {str(e)}"
        )

@app.get("/streaming/stats")
async def get_streaming_stats():
    """Get streaming statistics"""
    return streaming_handler.get_streaming_stats()

@app.get("/sessions")
async def get_user_sessions(user_id: str = "default_user"):
    """Get active sessions for a user"""
    user_sessions = USER_SESSIONS.get(user_id, {})
    return {
        "user_id": user_id,
        "active_sessions": {
            agent_id: {
                "session_id": info["session_id"],
                "created_at": info["created_at"].isoformat(),
                "last_activity": info["last_activity"].isoformat(),
                "message_count": info["message_count"]
            }
            for agent_id, info in user_sessions.items()
        }
    }

@app.delete("/sessions/{agent_id}")
async def end_session(agent_id: str, user_id: str = "default_user"):
    """End a specific session and add to memory if meaningful"""
    if user_id in USER_SESSIONS and agent_id in USER_SESSIONS[user_id]:
        session_info = USER_SESSIONS[user_id][agent_id]
        await cleanup_expired_session(user_id, agent_id, session_info)
        return {"message": f"Session ended for {agent_id}", "session_id": session_info["session_id"]}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.post("/memory/search")
async def search_memory(query: str, user_id: str = "default_user", app_name: str = "adk_app"):
    """Search memory for past conversations"""
    try:
        results = await memory_service.search_memory(
            app_name=app_name,
            user_id=user_id,
            query=query
        )
        return {
            "query": query,
            "results": [
                {
                    "content": result.content,
                    "metadata": result.metadata,
                    "relevance_score": getattr(result, 'relevance_score', 0.0)
                }
                for result in results.memories
            ] if hasattr(results, 'memories') else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory search failed: {str(e)}")

@app.post("/gmail/tokens")
async def set_gmail_tokens(token_request: GmailTokenRequest):
    """
    Set Gmail OAuth tokens for dynamic authentication.
    This endpoint allows the frontend to provide Gmail tokens that will be used
    by the Gmail agent for API operations.
    """
    try:
        result = update_gmail_tokens(
            access_token=token_request.access_token,
            refresh_token=token_request.refresh_token,
            user_email=token_request.user_email,
            expires_in=token_request.expires_in
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Gmail tokens updated successfully",
                "data": {
                    "user_email": result.get("user_email"),
                    "expires_at": result.get("expires_at"),
                    "updated_at": result.get("updated_at")
                }
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to update Gmail tokens: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating Gmail tokens: {str(e)}"
        )

@app.get("/gmail/status")
async def get_gmail_status():
    """
    Get current Gmail authentication status.
    Returns information about active tokens and user email.
    """
    try:
        from agent_gmail.tools.gmail.gmail_reader_tool import get_active_tokens
        
        tokens = get_active_tokens()
        
        if tokens:
            return {
                "authenticated": True,
                "user_email": tokens.get("user_email"),
                "message": "Gmail tokens are active and valid"
            }
        else:
            return {
                "authenticated": False,
                "user_email": None,
                "message": "No valid Gmail tokens available. Please authenticate."
            }
            
    except Exception as e:
        return {
            "authenticated": False,
            "user_email": None,
            "error": str(e),
            "message": "Error checking Gmail authentication status"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)