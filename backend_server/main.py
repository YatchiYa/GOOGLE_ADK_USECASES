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
