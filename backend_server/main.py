from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
import sys
import os
import uuid
import asyncio

from agent_web.agent import root_agent as academic_coordinator
from agent_web_searcher.agent import root_agent as expert_web_searcher
from streaming_handler import StreamingHandler

app = FastAPI(title="Agent API Server", version="1.0.0")

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent registry
AGENT_REGISTRY = {
    "academic_coordinator": academic_coordinator,
    "expert_web_searcher": expert_web_searcher,
}

# Initialize streaming handler
streaming_handler = StreamingHandler()

class AgentRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    response: str
    agent_id: str
    status: str

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
        session_id = str(uuid.uuid4())
        user_id = "default_user"
        
        # Return streaming response
        return StreamingResponse(
            streaming_handler.stream_to_sse(
                session_id=session_id,
                agent_id=agent_id,
                user_id=user_id,
                agent=agent,
                message=request.message
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)