"""
Controllers for handling business logic
"""

from typing import Dict, Any
from fastapi import HTTPException
from models import *
from memory_handler import MemoryHandler
from streaming_handler import StreamingHandler
from agent_gmail.tools.gmail.gmail_reader_tool import update_gmail_tokens
import uuid
from datetime import datetime

class AgentController:
    """Controller for agent-related operations"""
    
    def __init__(self, agent_registry: Dict[str, Any], streaming_handler: StreamingHandler, memory_handler: MemoryHandler):
        self.agent_registry = agent_registry
        self.streaming_handler = streaming_handler
        self.memory_handler = memory_handler

    async def call_agent_sync(self, agent_id: str, request: AgentRequest) -> AgentResponse:
        """Call agent synchronously and return complete response"""
        if agent_id not in self.agent_registry:
            raise HTTPException(
                status_code=404, 
                detail=f"Agent '{agent_id}' not found. Available agents: {list(self.agent_registry.keys())}"
            )
        
        try:
            agent = self.agent_registry[agent_id]
            
            # Use the streaming handler to get the complete response
            session_id = str(uuid.uuid4())
            user_id = "default_user"
            
            # Collect all streaming events
            full_response = ""
            async for event in self.streaming_handler.start_streaming_session(
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

    async def stream_agent(self, agent_id: str, request: AgentRequest):
        """Stream agent response"""
        if agent_id not in self.agent_registry:
            raise HTTPException(
                status_code=404, 
                detail=f"Agent '{agent_id}' not found. Available agents: {list(self.agent_registry.keys())}"
            )
        
        try:
            agent = self.agent_registry[agent_id]
            user_id = request.context.get("user_id", "default_user")
            
            # Get or create session for this user-agent combination
            session_id, adk_session = await self.memory_handler.get_or_create_session(user_id, agent_id)
            
            # Update session activity
            await self.memory_handler.update_session_activity(user_id, agent_id)
            
            # Return streaming generator
            return self.streaming_handler.stream_to_sse(
                session_id=session_id,
                agent_id=agent_id,
                user_id=user_id,
                agent=agent,
                message=request.message,
                adk_session=adk_session
            )
        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error streaming agent '{agent_id}': {str(e)}"
            )

    def list_agents(self) -> AgentListResponse:
        """List all available agents"""
        return AgentListResponse(
            agents=list(self.agent_registry.keys()),
            count=len(self.agent_registry)
        )

class SessionController:
    """Controller for session management operations"""
    
    def __init__(self, memory_handler: MemoryHandler):
        self.memory_handler = memory_handler

    def get_user_sessions(self, user_id: str = "default_user") -> UserSessionsResponse:
        """Get active sessions for a user"""
        active_sessions_data = self.memory_handler.get_user_sessions(user_id)
        active_sessions = {
            agent_id: SessionInfo(**info) 
            for agent_id, info in active_sessions_data.items()
        }
        
        return UserSessionsResponse(
            user_id=user_id,
            active_sessions=active_sessions
        )

    async def end_session(self, agent_id: str, user_id: str = "default_user") -> SessionEndResponse:
        """End a specific session and add to memory if meaningful"""
        session_id = await self.memory_handler.end_session(user_id, agent_id)
        
        if session_id:
            return SessionEndResponse(
                message=f"Session ended for {agent_id}",
                session_id=session_id
            )
        else:
            raise HTTPException(status_code=404, detail="Session not found")

class MemoryController:
    """Controller for memory operations"""
    
    def __init__(self, memory_handler: MemoryHandler):
        self.memory_handler = memory_handler

    async def search_memory(self, request: MemorySearchRequest) -> MemorySearchResponse:
        """Search memory for past conversations"""
        try:
            results_data = await self.memory_handler.search_memory(
                query=request.query,
                user_id=request.user_id,
                app_name=request.app_name
            )
            
            results = [
                MemoryResult(**result) 
                for result in results_data["results"]
            ]
            
            return MemorySearchResponse(
                query=request.query,
                results=results
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

class GmailController:
    """Controller for Gmail-specific operations"""
    
    @staticmethod
    async def set_gmail_tokens(token_request: GmailTokenRequest) -> GmailTokenResponse:
        """Set Gmail OAuth tokens for dynamic authentication"""
        try:
            result = update_gmail_tokens(
                access_token=token_request.access_token,
                refresh_token=token_request.refresh_token,
                user_email=token_request.user_email,
                expires_in=token_request.expires_in
            )
            
            return GmailTokenResponse(
                success=True,
                message="Gmail tokens updated successfully",
                data=result if isinstance(result, dict) else {"status": "updated"}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update Gmail tokens: {str(e)}"
            )

    @staticmethod
    async def get_gmail_status() -> Dict[str, Any]:
        """Get Gmail authentication status"""
        try:
            # This would need to be implemented in the Gmail tools
            # For now, return a basic status
            return {
                "authenticated": False,
                "user_email": None,
                "message": "Gmail status check not implemented"
            }
        except Exception as e:
            return {
                "authenticated": False,
                "user_email": None,
                "error": str(e)
            }

class SystemController:
    """Controller for system operations"""
    
    def __init__(self, streaming_handler: StreamingHandler, memory_handler: MemoryHandler):
        self.streaming_handler = streaming_handler
        self.memory_handler = memory_handler

    def get_health(self) -> HealthResponse:
        """Get system health status"""
        return HealthResponse(
            message="Agent API Server is running",
            status="healthy",
            timestamp=datetime.now().isoformat()
        )

    def get_streaming_stats(self) -> StreamingStatsResponse:
        """Get streaming statistics"""
        stats = self.streaming_handler.get_streaming_stats()
        return StreamingStatsResponse(**stats)

    def get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        streaming_stats = self.streaming_handler.get_streaming_stats()
        session_stats = self.memory_handler.get_session_stats()
        
        return {
            "streaming": streaming_stats,
            "sessions": session_stats,
            "timestamp": datetime.now().isoformat()
        }
