import React from "react";
import { ToolCall } from "@/src/types/agent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/Card";

interface ToolCallVisualizationProps {
  toolCalls: ToolCall[];
}

export const ToolCallVisualization: React.FC<ToolCallVisualizationProps> = ({
  toolCalls,
}) => {
  if (toolCalls.length === 0) return null;

  const getStatusIcon = (status: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      case "completed":
        return "text-green-600 bg-green-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔧</span>
          <span>Tool Executions ({toolCalls.length})</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {toolCalls.map((toolCall) => (
            <div
              key={toolCall.id}
              className={`border rounded-lg p-3 ${getStatusColor(
                toolCall.status
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(toolCall.status)}</span>
                  <span className="font-medium">{toolCall.name}</span>
                  <span className="text-xs px-2 py-1 bg-white rounded-full">
                    {toolCall.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  {toolCall.timestamp.toLocaleTimeString()}
                  {toolCall.duration && (
                    <span className="ml-2">({toolCall.duration}ms)</span>
                  )}
                </div>
              </div>

              {/* Tool Arguments */}
              {Object.keys(toolCall.args).length > 0 && (
                <details className="mb-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Arguments
                  </summary>
                  <div className="mt-1 bg-white rounded p-2 text-xs font-mono">
                    <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
                  </div>
                </details>
              )}

              {/* Tool Result */}
              {toolCall.result && (
                <details className="mb-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Result
                  </summary>
                  <div className="mt-1 bg-white rounded p-2 text-xs">
                    {typeof toolCall.result === "string" ? (
                      <div className="whitespace-pre-wrap">
                        {toolCall.result}
                      </div>
                    ) : (
                      <pre className="font-mono">
                        {JSON.stringify(toolCall.result, null, 2)}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Error */}
              {toolCall.error && (
                <div className="bg-red-100 border border-red-300 rounded p-2 text-sm text-red-700">
                  <strong>Error:</strong> {toolCall.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
