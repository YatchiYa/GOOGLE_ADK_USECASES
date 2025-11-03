"""
Pydantic models for API requests and responses
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

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

class GmailTokenResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    last_activity: str
    message_count: int

class UserSessionsResponse(BaseModel):
    user_id: str
    active_sessions: Dict[str, SessionInfo]

class SessionEndResponse(BaseModel):
    message: str
    session_id: str

class MemorySearchRequest(BaseModel):
    query: str
    user_id: str = "default_user"
    app_name: str = "adk_app"

class MemoryResult(BaseModel):
    content: str
    metadata: Dict[str, Any]
    relevance_score: float = 0.0

class MemorySearchResponse(BaseModel):
    query: str
    results: List[MemoryResult]

class StreamingStatsResponse(BaseModel):
    active_sessions: int
    total_sessions: int
    total_events_sent: int
    total_tokens_processed: int
    update_interval_ms: float
    batch_size: int
    buffer_timeout_ms: float

class AgentListResponse(BaseModel):
    agents: List[str]
    count: int

class ToolInfo(BaseModel):
    name: str
    description: str = ""
    parameters: Dict[str, Any] = {}

class AgentDetailResponse(BaseModel):
    agent_id: str
    name: str
    model: str
    description: str = ""
    instruction: str = ""
    tools: List[ToolInfo] = []
    capabilities: List[str] = []
    status: str = "active"

class HealthResponse(BaseModel):
    message: str
    status: str = "healthy"
    timestamp: str
