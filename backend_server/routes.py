"""
API Routes for the Agent Server
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from models import *
from controllers import AgentController, SessionController, MemoryController, GmailController, SystemController

def create_routes(
    agent_controller: AgentController,
    session_controller: SessionController, 
    memory_controller: MemoryController,
    gmail_controller: GmailController,
    system_controller: SystemController
) -> APIRouter:
    """Create and configure all API routes"""
    
    router = APIRouter()

    # Health and System Routes
    @router.get("/", response_model=HealthResponse)
    async def root():
        """Health check endpoint"""
        return system_controller.get_health()

    @router.get("/health", response_model=HealthResponse)
    async def health_check():
        """Detailed health check"""
        return system_controller.get_health()

    @router.get("/stats")
    async def get_system_stats():
        """Get comprehensive system statistics"""
        return system_controller.get_system_stats()

    # Agent Routes
    @router.get("/agents", response_model=AgentListResponse)
    async def list_agents():
        """List all available agents"""
        return agent_controller.list_agents()

    @router.get("/agent/{agent_id}/details", response_model=AgentDetailResponse)
    async def get_agent_details(agent_id: str):
        """Get detailed information about a specific agent"""
        return agent_controller.get_agent_details(agent_id)

    @router.post("/agent/{agent_id}", response_model=AgentResponse)
    async def call_agent(agent_id: str, request: AgentRequest):
        """Call a specific agent by ID (non-streaming)"""
        return await agent_controller.call_agent_sync(agent_id, request)

    @router.post("/agent/{agent_id}/stream")
    async def stream_agent(agent_id: str, request: AgentRequest):
        """Call a specific agent by ID with streaming response"""
        stream_generator = await agent_controller.stream_agent(agent_id, request)
        
        return StreamingResponse(
            stream_generator,
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    # Session Management Routes
    @router.get("/sessions", response_model=UserSessionsResponse)
    async def get_user_sessions(user_id: str = Query(default="default_user")):
        """Get active sessions for a user"""
        return session_controller.get_user_sessions(user_id)

    @router.delete("/sessions/{agent_id}", response_model=SessionEndResponse)
    async def end_session(agent_id: str, user_id: str = Query(default="default_user")):
        """End a specific session and add to memory if meaningful"""
        return await session_controller.end_session(agent_id, user_id)

    # Memory Routes
    @router.post("/memory/search", response_model=MemorySearchResponse)
    async def search_memory(request: MemorySearchRequest):
        """Search memory for past conversations"""
        return await memory_controller.search_memory(request)

    # Streaming Routes
    @router.get("/streaming/stats", response_model=StreamingStatsResponse)
    async def get_streaming_stats():
        """Get streaming statistics"""
        return system_controller.get_streaming_stats()

    # Gmail Routes
    @router.post("/gmail/tokens", response_model=GmailTokenResponse)
    async def set_gmail_tokens(token_request: GmailTokenRequest):
        """Set Gmail OAuth tokens for dynamic authentication"""
        return await gmail_controller.set_gmail_tokens(token_request)

    @router.get("/gmail/status")
    async def get_gmail_status():
        """Get Gmail authentication status"""
        return await gmail_controller.get_gmail_status()

    return router
