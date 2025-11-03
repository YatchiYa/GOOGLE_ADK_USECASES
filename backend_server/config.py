"""
Configuration settings for the Agent API Server
"""

from datetime import timedelta
from typing import Dict, Any

# Server Configuration
SERVER_TITLE = "Agent API Server"
SERVER_VERSION = "1.0.0"
CORS_ORIGINS = ["http://localhost:3000"]  # Next.js default port

# Session Configuration
SESSION_TIMEOUT = timedelta(hours=2)  # Sessions expire after 2 hours
DEFAULT_APP_NAME = "adk_app"
DEFAULT_USER_ID = "default_user"

# Agent Registry Configuration
AGENT_REGISTRY_CONFIG = {
    "academic_coordinator": "agent_academic_coordinator.agent",
    "expert_web_searcher": "agent_web_searcher.agent", 
    "brevo_expert": "agent_brevo.agent",
    "gmail_expert": "agent_gmail.agent",
    "story_expert": "agent_story.agent"
}

# Streaming Configuration
STREAMING_CONFIG = {
    "update_interval_ms": 8,  # 120fps for smoother streaming
    "batch_size": 1,          # Send each chunk immediately
}

# Memory Configuration
MEMORY_THRESHOLD_EVENTS = 2  # Minimum events to add session to memory

# API Configuration
API_PREFIX = "/api/v1"
