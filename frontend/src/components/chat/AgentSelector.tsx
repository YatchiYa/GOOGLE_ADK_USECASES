import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/Button";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onAgentChange,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Predefined agent configurations
  const agentConfigs: Record<string, Omit<Agent, 'id'>> = {
    academic_coordinator: {
      name: "Academic Research Agent",
      description: "Research advice, literature review, and academic guidance",
      icon: "🎓"
    },
    expert_web_searcher: {
      name: "Expert Web Searcher",
      description: "Advanced web search, data analysis, and report generation",
      icon: "🔍"
    },
    brevo_expert: {
      name: "Brevo Expert",
      description: "Contact management, email operations, and Brevo API integration",
      icon: "📧"
    },
    gmail_expert: {
      name: "Gmail & Calendar Expert",
      description: "Gmail email management, Google Calendar events, and productivity tools",
      icon: "📅"
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("http://localhost:8000/agents");
      const data = await response.json();
      
      const formattedAgents: Agent[] = data.agents.map((agentId: string) => ({
        id: agentId,
        ...agentConfigs[agentId] || {
          name: agentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: "AI Assistant",
          icon: "🤖"
        }
      }));
      
      setAgents(formattedAgents);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      // Fallback to default agents
      setAgents([
        {
          id: "academic_coordinator",
          ...agentConfigs.academic_coordinator
        },
        {
          id: "expert_web_searcher", 
          ...agentConfigs.expert_web_searcher
        },
        {
          id: "brevo_expert",
          ...agentConfigs.brevo_expert
        },
        {
          id: "gmail_expert",
          ...agentConfigs.gmail_expert
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span>Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        <span className="text-lg">{selectedAgent?.icon || "🤖"}</span>
        <div className="text-left">
          <div className="font-medium text-gray-800">{selectedAgent?.name || "Select Agent"}</div>
          <div className="text-xs text-gray-500 truncate max-w-[200px]">
            {selectedAgent?.description || "Choose an AI assistant"}
          </div>
        </div>
        <span className="text-gray-400 ml-2">{isOpen ? "▼" : "▶"}</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-800">Select AI Assistant</div>
            <div className="text-xs text-gray-500">Choose the best agent for your task</div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  onAgentChange(agent.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-l-4 ${
                  agent.id === selectedAgentId
                    ? "border-l-blue-500 bg-blue-50"
                    : "border-l-transparent"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 mb-1">{agent.name}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {agent.description}
                    </div>
                    {agent.id === selectedAgentId && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        ✓ Currently selected
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {agents.length} agents available
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
