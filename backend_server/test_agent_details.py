#!/usr/bin/env python3
"""
Test script for agent details functionality
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from models import AgentDetailResponse, ToolInfo
    from controllers import AgentController
    from memory_handler import MemoryHandler
    from streaming_handler import StreamingHandler
    from agent_registry import AgentRegistry
    
    print("✅ All imports successful")
    
    # Test agent registry
    registry = AgentRegistry()
    agents = registry.get_all_agents()
    print(f"✅ Agent registry loaded: {list(agents.keys())}")
    
    # Test memory handler
    memory_handler = MemoryHandler()
    print("✅ Memory handler initialized")
    
    # Test streaming handler
    streaming_handler = StreamingHandler()
    print("✅ Streaming handler initialized")
    
    # Test agent controller
    agent_controller = AgentController(agents, streaming_handler, memory_handler)
    print("✅ Agent controller initialized")
    
    # Test getting agent details for each agent
    for agent_id in agents.keys():
        try:
            details = agent_controller.get_agent_details(agent_id)
            print(f"✅ Agent details for {agent_id}:")
            print(f"   Name: {details.name}")
            print(f"   Model: {details.model}")
            print(f"   Tools: {len(details.tools)}")
            print(f"   Capabilities: {len(details.capabilities)}")
        except Exception as e:
            print(f"❌ Error getting details for {agent_id}: {e}")
    
    print("\n🎉 All tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
