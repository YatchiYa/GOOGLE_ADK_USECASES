import React, { useState, useEffect } from "react";
import { ToolCall, StreamingEvent } from "@/src/types/agent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/Card";

interface FloatingToolPanelProps {
  toolCalls: ToolCall[];
  streamingEvents: StreamingEvent[];
  isStreaming: boolean;
}

interface EnhancedToolCall extends ToolCall {
  startTime?: Date;
  endTime?: Date;
  events: StreamingEvent[];
}

export const FloatingToolPanel: React.FC<FloatingToolPanelProps> = ({
  toolCalls,
  streamingEvents,
  isStreaming,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [enhancedToolCalls, setEnhancedToolCalls] = useState<
    EnhancedToolCall[]
  >([]);

  // Process streaming events to enhance tool calls
  useEffect(() => {
    const toolCallMap = new Map<string, EnhancedToolCall>();

    // Initialize with existing tool calls
    toolCalls.forEach((toolCall) => {
      toolCallMap.set(toolCall.id, {
        ...toolCall,
        events: [],
      });
    });

    // Process streaming events
    streamingEvents.forEach((event) => {
      if (event.type === "tool_call") {
        const callId = event.metadata.call_id;
        if (callId) {
          const existingCall = toolCallMap.get(callId);
          if (existingCall) {
            existingCall.events.push(event);
            existingCall.startTime = new Date(event.timestamp * 1000);
          } else {
            // Create new tool call from streaming event
            const newToolCall: EnhancedToolCall = {
              id: callId,
              name: event.metadata.tool_name || "Unknown Tool",
              args: event.metadata.tool_args || {},
              timestamp: new Date(event.timestamp * 1000),
              status: "running",
              startTime: new Date(event.timestamp * 1000),
              events: [event],
            };
            toolCallMap.set(callId, newToolCall);
          }
        }
      } else if (event.type === "tool_response") {
        const responseId = event.metadata.response_id;
        if (responseId) {
          const toolCall = toolCallMap.get(responseId);
          if (toolCall) {
            toolCall.events.push(event);
            toolCall.status = "completed";
            toolCall.result = event.metadata.raw_response;
            toolCall.endTime = new Date(event.timestamp * 1000);
            if (toolCall.startTime) {
              toolCall.duration =
                toolCall.endTime.getTime() - toolCall.startTime.getTime();
            }
          }
        }
      }
    });

    setEnhancedToolCalls(Array.from(toolCallMap.values()));
  }, [toolCalls, streamingEvents]);

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
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "running":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatToolResult = (result: any) => {
    if (!result) return "No result";
    if (typeof result === "string") return result;
    if (result.result) return result.result;
    return JSON.stringify(result, null, 2);
  };

  if (enhancedToolCalls.length === 0 && !isStreaming) return null;

  return (
    <div className="fixed right-4 top-20 bottom-4 w-100 z-50">
      <Card className="h-full flex flex-col shadow-xl border-2">
        <CardHeader
          className="cursor-pointer flex-shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span>🔧</span>
              <span>Tool Executions ({enhancedToolCalls.length})</span>
              {isStreaming && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
          </CardTitle>
        </CardHeader>

        {isExpanded && (
          <CardContent className="flex-1 overflow-y-auto p-3">
            {enhancedToolCalls.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-2xl mb-2">🔧</div>
                <div className="text-sm">No tool executions yet</div>
                {isStreaming && (
                  <div className="text-xs mt-1 text-blue-600">
                    Waiting for tools...
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {enhancedToolCalls.map((toolCall) => (
                  <div
                    key={toolCall.id}
                    className={`border rounded-lg p-3 ${getStatusColor(
                      toolCall.status
                    )}`}
                  >
                    {/* Tool Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getStatusIcon(toolCall.status)}
                        </span>
                        <div>
                          <div className="font-medium text-sm">
                            {toolCall.name}
                          </div>
                          <div className="text-xs opacity-75">
                            {toolCall.startTime?.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {toolCall.duration && (
                        <div className="text-xs bg-white rounded px-2 py-1">
                          {formatDuration(toolCall.duration)}
                        </div>
                      )}
                    </div>

                    {/* Tool Arguments */}
                    {Object.keys(toolCall.args).length > 0 && (
                      <details className="mb-2">
                        <summary className="cursor-pointer text-xs font-medium mb-1">
                          Arguments
                        </summary>
                        <div className="bg-white rounded p-2 text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
                        </div>
                      </details>
                    )}

                    {/* Tool Result */}
                    {toolCall.result && (
                      <details className="mb-2">
                        <summary className="cursor-pointer text-xs font-medium mb-1">
                          Result
                        </summary>
                        <div className="bg-white rounded p-2 text-xs overflow-x-auto">
                          <div className="whitespace-pre-wrap">
                            {formatToolResult(toolCall.result)}
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Error */}
                    {toolCall.error && (
                      <div className="bg-red-100 border border-red-300 rounded p-2 text-xs text-red-700">
                        <strong>Error:</strong> {toolCall.error}
                      </div>
                    )}

                    {/* Streaming Events */}
                    {toolCall.events.length > 0 && (
                      <details>
                        <summary className="cursor-pointer text-xs font-medium mb-1">
                          Events ({toolCall.events.length})
                        </summary>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {toolCall.events.map((event, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded p-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-blue-600">
                                  {event.type}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(
                                    event.timestamp * 1000
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              {event.content && (
                                <div className="text-gray-700 mt-1 truncate">
                                  {event.content}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
