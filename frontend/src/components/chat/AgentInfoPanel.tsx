import React, { useState, useEffect } from "react";
import {
  AgentInfoService,
  AgentDetails,
} from "@/src/services/AgentInfoService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { ChevronDown, ChevronUp, Info, Cpu, Wrench, Zap } from "lucide-react";
import { MarkdownRenderer } from "../response/MarkdownRenderer";

interface AgentInfoPanelProps {
  agentId: string;
  className?: string;
}

export const AgentInfoPanel: React.FC<AgentInfoPanelProps> = ({
  agentId,
  className = "",
}) => {
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const agentInfoService = new AgentInfoService();

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!agentId) return;

      setLoading(true);
      setError(null);

      try {
        const details = await agentInfoService.getAgentDetails(agentId);
        setAgentDetails(details);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load agent details"
        );
        console.error("Error fetching agent details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <Info className="h-4 w-4" />
            <span className="text-sm">Failed to load agent details</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agentDetails) {
    return null;
  }

  return (
    <Card
      className={`${className} border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {agentDetails.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {agentDetails.model}
                </Badge>
                <Badge
                  variant={
                    agentDetails.status === "active" ? "default" : "secondary"
                  }
                  className="text-xs shrink-0"
                >
                  {agentDetails.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {agentDetails.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-1 shrink-0 ml-2"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Capabilities - Always visible */}
        {/* <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium text-sm text-gray-900">
              Capabilities ({agentDetails.capabilities.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {agentDetails.capabilities.map((capability, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-gray-700 bg-white rounded-md p-2.5 border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <span className="flex-1 leading-tight">{capability}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 border-t pt-4">
            {/* System Instruction */}
            {agentDetails.instruction && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-sm text-gray-900">
                    System Instruction
                  </h4>
                </div>
                <div className="bg-white rounded-md p-3 border border-gray-200">
                  <p className="text-xs text-gray-700 font-mono leading-relaxed">
                    <MarkdownRenderer content={agentDetails.instruction} />
                  </p>
                </div>
              </div>
            )}
            {/* Tools */}
            {agentDetails.tools.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Wrench className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-sm text-gray-900">
                    Available Tools ({agentDetails.tools.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {agentDetails.tools.map((tool, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-md p-3 border border-gray-200"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {tool.name}
                        </Badge>
                      </div>
                      {tool.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          <MarkdownRenderer content={tool.description} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
