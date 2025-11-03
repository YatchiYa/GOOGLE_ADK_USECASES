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

    def get_agent_details(self, agent_id: str) -> AgentDetailResponse:
        """Get detailed information about a specific agent"""
        if agent_id not in self.agent_registry:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' not found. Available agents: {list(self.agent_registry.keys())}"
            )
        
        agent = self.agent_registry[agent_id]
        
        # Extract agent information
        agent_name = getattr(agent, 'name', agent_id)
        agent_model = getattr(agent, 'model', 'unknown')
        agent_instruction = getattr(agent, 'instruction', '')
        print("agent_instruction >> ", agent_instruction)
        
        # Extract tools information
        tools = []
        if hasattr(agent, 'tools') and agent.tools:
            for tool in agent.tools:
                tool_info = ToolInfo(
                    name=getattr(tool, 'name', getattr(tool, '__name__', 'unknown')),
                    description=getattr(tool, 'description', getattr(tool, '__doc__', '')),
                    parameters=getattr(tool, 'parameters', {})
                )
                tools.append(tool_info)
        
        # Define capabilities based on agent type and tools
        capabilities = self._extract_agent_capabilities(agent_id, agent, tools)
        
        # Create description based on agent type
        description = self._get_agent_description(agent_id, agent_name)
        
        return AgentDetailResponse(
            agent_id=agent_id,
            name=agent_name,
            model=agent_model,
            description=description,
            instruction=agent_instruction,
            tools=tools,
            capabilities=capabilities,
            status="active"
        )

    def _extract_agent_capabilities(self, agent_id: str, agent, tools: List[ToolInfo]) -> List[str]:
        """Extract capabilities based on agent type and tools"""
        capabilities = []
        
        # Tool-based capabilities
        tool_names = [tool.name.lower() for tool in tools]
        
        if any('gmail' in name or 'email' in name for name in tool_names):
            capabilities.extend([
                "📧 Email reading and management",
                "📤 Email sending with attachments",
                "🔍 Advanced email search and filtering"
            ])
        
        if any('calendar' in name for name in tool_names):
            capabilities.extend([
                "📅 Calendar event management",
                "⏰ Meeting scheduling and reminders",
                "🗓️ Calendar search and organization"
            ])
        
        if any('search' in name or 'web' in name for name in tool_names):
            capabilities.extend([
                "🔍 Advanced web search",
                "🌐 Real-time information retrieval",
                "📊 Data analysis and research"
            ])
        
        if any('brevo' in name for name in tool_names):
            capabilities.extend([
                "📬 Transactional email management",
                "👥 Contact list management",
                "📊 Email campaign analytics"
            ])
        
        # Agent-specific capabilities
        if agent_id == "academic_coordinator":
            capabilities.extend([
                "🎓 Academic research guidance",
                "📚 Literature review assistance",
                "🔬 Research methodology advice"
            ])
        elif agent_id == "expert_web_searcher":
            capabilities.extend([
                "🧮 Mathematical calculations",
                "📈 Data visualization",
                "📋 Comprehensive reporting"
            ])
        elif agent_id == "story_expert":
            capabilities.extend([
                "✍️ Creative story writing",
                "📖 Narrative development",
                "🎭 Character creation"
            ])
        
        # Default capabilities if none found
        if not capabilities:
            capabilities = [
                "💬 Natural language conversation",
                "🤖 AI-powered assistance",
                "📝 Text generation and analysis"
            ]
        
        return capabilities

    def _get_agent_description(self, agent_id: str, agent_name: str) -> str:
        """Get agent description based on agent type"""
        descriptions = {
            "academic_coordinator": "Specialized in academic research, literature review, and research methodology guidance",
            "expert_web_searcher": "Advanced web search capabilities with data analysis and comprehensive reporting",
            "brevo_expert": "Complete Brevo email platform integration for transactional emails and contact management",
            "gmail_expert": "Full Gmail and Google Calendar integration for email management and scheduling",
            "story_expert": "Creative writing assistant specialized in story development and narrative creation"
        }
        
        return descriptions.get(agent_id, f"AI assistant powered by {agent_name} for various tasks")

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
