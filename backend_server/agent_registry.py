"""
Agent Registry - Centralized agent management
"""

from typing import Dict, Any
import importlib
from config import AGENT_REGISTRY_CONFIG

class AgentRegistry:
    """Manages agent registration and loading"""
    
    def __init__(self):
        self._agents: Dict[str, Any] = {}
        self._load_agents()
    
    def _load_agents(self):
        """Load all agents from configuration"""
        for agent_id, module_path in AGENT_REGISTRY_CONFIG.items():
            try:
                # Import the module and get the root_agent
                module = importlib.import_module(module_path)
                agent = getattr(module, 'root_agent')
                self._agents[agent_id] = agent
                print(f"✅ Loaded agent: {agent_id}")
            except Exception as e:
                print(f"❌ Failed to load agent {agent_id}: {e}")
    
    def get_agent(self, agent_id: str) -> Any:
        """Get agent by ID"""
        return self._agents.get(agent_id)
    
    def get_all_agents(self) -> Dict[str, Any]:
        """Get all registered agents"""
        return self._agents.copy()
    
    def list_agent_ids(self) -> list:
        """Get list of all agent IDs"""
        return list(self._agents.keys())
    
    def register_agent(self, agent_id: str, agent: Any):
        """Register a new agent"""
        self._agents[agent_id] = agent
        print(f"✅ Registered agent: {agent_id}")
    
    def unregister_agent(self, agent_id: str):
        """Unregister an agent"""
        if agent_id in self._agents:
            del self._agents[agent_id]
            print(f"🗑️ Unregistered agent: {agent_id}")
    
    def reload_agent(self, agent_id: str):
        """Reload a specific agent"""
        if agent_id in AGENT_REGISTRY_CONFIG:
            try:
                module_path = AGENT_REGISTRY_CONFIG[agent_id]
                # Reload the module
                module = importlib.reload(importlib.import_module(module_path))
                agent = getattr(module, 'root_agent')
                self._agents[agent_id] = agent
                print(f"🔄 Reloaded agent: {agent_id}")
            except Exception as e:
                print(f"❌ Failed to reload agent {agent_id}: {e}")
    
    def get_agent_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all agents"""
        info = {}
        for agent_id, agent in self._agents.items():
            info[agent_id] = {
                "name": getattr(agent, 'name', agent_id),
                "model": getattr(agent, 'model', 'unknown'),
                "loaded": True,
                "type": type(agent).__name__
            }
        return info
