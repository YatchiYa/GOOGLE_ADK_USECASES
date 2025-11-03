"""
Memory and Session Management Handler
"""

from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from google.adk.sessions import InMemorySessionService, Session
from google.adk.memory import InMemoryMemoryService
from config import SESSION_TIMEOUT, DEFAULT_APP_NAME, MEMORY_THRESHOLD_EVENTS
import asyncio

class MemoryHandler:
    """Handles session lifecycle and memory management"""
    
    def __init__(self, session_service=None, memory_service=None):
        self.session_service = session_service or InMemorySessionService()
        self.memory_service = memory_service or InMemoryMemoryService()
        self.user_sessions: Dict[str, Dict[str, Any]] = {}
        
    async def get_or_create_session(self, user_id: str, agent_id: str, app_name: str = DEFAULT_APP_NAME) -> Tuple[str, Session]:
        """Get existing session or create new one for user-agent combination"""
        current_time = datetime.now()
        
        # Initialize user sessions if not exists
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {}
        
        # Check if session exists and is not expired
        if agent_id in self.user_sessions[user_id]:
            session_info = self.user_sessions[user_id][agent_id]
            if current_time - session_info['created_at'] < SESSION_TIMEOUT:
                # Session is still valid, return existing session
                return session_info['session_id'], session_info['session']
            else:
                # Session expired, clean it up
                await self._cleanup_expired_session(user_id, agent_id, session_info)
        
        # Create new session
        session_id = f"{user_id}_{agent_id}_{int(current_time.timestamp())}"
        session = await self.session_service.create_session(
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
        self.user_sessions[user_id][agent_id] = {
            'session_id': session_id,
            'session': session,
            'created_at': current_time,
            'last_activity': current_time,
            'message_count': 0
        }
        
        return session_id, session

    async def _cleanup_expired_session(self, user_id: str, agent_id: str, session_info: Dict[str, Any]):
        """Clean up expired session and optionally add to memory"""
        try:
            # Get the session from service
            session = await self.session_service.get_session(
                app_name=DEFAULT_APP_NAME,
                user_id=user_id,
                session_id=session_info['session_id']
            )
            
            # If session has meaningful content, add to memory
            if session and len(session.events) > MEMORY_THRESHOLD_EVENTS:
                await self.memory_service.add_session_to_memory(session)
                print(f"Added session {session_info['session_id']} to memory")
            
            # Delete session from service
            await self.session_service.delete_session(
                app_name=DEFAULT_APP_NAME,
                user_id=user_id,
                session_id=session_info['session_id']
            )
            
        except Exception as e:
            print(f"Error cleaning up session: {e}")
        
        # Remove from tracking
        if user_id in self.user_sessions and agent_id in self.user_sessions[user_id]:
            del self.user_sessions[user_id][agent_id]

    async def update_session_activity(self, user_id: str, agent_id: str):
        """Update last activity time for session"""
        if user_id in self.user_sessions and agent_id in self.user_sessions[user_id]:
            self.user_sessions[user_id][agent_id]['last_activity'] = datetime.now()
            self.user_sessions[user_id][agent_id]['message_count'] += 1

    async def end_session(self, user_id: str, agent_id: str) -> Optional[str]:
        """End a specific session and add to memory if meaningful"""
        if user_id in self.user_sessions and agent_id in self.user_sessions[user_id]:
            session_info = self.user_sessions[user_id][agent_id]
            await self._cleanup_expired_session(user_id, agent_id, session_info)
            return session_info["session_id"]
        return None

    def get_user_sessions(self, user_id: str) -> Dict[str, Any]:
        """Get active sessions for a user"""
        user_sessions = self.user_sessions.get(user_id, {})
        return {
            agent_id: {
                "session_id": info["session_id"],
                "created_at": info["created_at"].isoformat(),
                "last_activity": info["last_activity"].isoformat(),
                "message_count": info["message_count"]
            }
            for agent_id, info in user_sessions.items()
        }

    async def search_memory(self, query: str, user_id: str = "default_user", app_name: str = DEFAULT_APP_NAME):
        """Search memory for past conversations"""
        try:
            results = await self.memory_service.search_memory(
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
            raise Exception(f"Memory search failed: {str(e)}")

    async def cleanup_expired_sessions(self):
        """Cleanup all expired sessions (can be called periodically)"""
        current_time = datetime.now()
        expired_sessions = []
        
        for user_id, user_sessions in self.user_sessions.items():
            for agent_id, session_info in user_sessions.items():
                if current_time - session_info['created_at'] >= SESSION_TIMEOUT:
                    expired_sessions.append((user_id, agent_id, session_info))
        
        for user_id, agent_id, session_info in expired_sessions:
            await self._cleanup_expired_session(user_id, agent_id, session_info)
        
        return len(expired_sessions)

    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics"""
        total_sessions = sum(len(user_sessions) for user_sessions in self.user_sessions.values())
        total_messages = sum(
            session_info['message_count'] 
            for user_sessions in self.user_sessions.values()
            for session_info in user_sessions.values()
        )
        
        return {
            "total_users": len(self.user_sessions),
            "total_active_sessions": total_sessions,
            "total_messages": total_messages,
            "session_timeout_hours": SESSION_TIMEOUT.total_seconds() / 3600
        }
