import React, { useState, useEffect } from "react";
import { ToolCall, StreamingEvent } from "@/src/types/agent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/Card";

interface ImprovedFloatingToolPanelProps {
  toolCalls: ToolCall[];
  streamingEvents: StreamingEvent[];
  isStreaming: boolean;
}

interface ProcessedToolExecution {
  id: string;
  name: string;
  args: Record<string, any>;
  status: "pending" | "running" | "completed" | "error";
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  events: StreamingEvent[];
}

export const ImprovedFloatingToolPanel: React.FC<
  ImprovedFloatingToolPanelProps
> = ({ toolCalls, streamingEvents, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [processedExecutions, setProcessedExecutions] = useState<
    ProcessedToolExecution[]
  >([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(
    null
  );

  // Process streaming events and tool calls into unified executions
  useEffect(() => {
    const executionMap = new Map<string, ProcessedToolExecution>();

    // Process streaming events first to capture all tool interactions
    streamingEvents.forEach((event) => {
      if (event.type === "tool_call") {
        const callId =
          event.metadata.call_id ||
          `${event.metadata.tool_name}_${event.timestamp}`;

        if (!executionMap.has(callId)) {
          executionMap.set(callId, {
            id: callId,
            name: event.metadata.tool_name || "Unknown Tool",
            args: event.metadata.tool_args || {},
            status: "running",
            startTime: new Date(event.timestamp * 1000),
            events: [event],
          });
        }
      } else if (event.type === "tool_response") {
        const responseId = event.metadata.response_id;
        if (responseId && executionMap.has(responseId)) {
          const execution = executionMap.get(responseId)!;
          execution.status = "completed";
          execution.endTime = new Date(event.timestamp * 1000);
          execution.result =
            event.metadata.raw_response || event.metadata.tool_result;
          execution.events.push(event);

          if (execution.startTime) {
            execution.duration =
              execution.endTime.getTime() - execution.startTime.getTime();
          }
        }
      }
    });

    // Add any tool calls that weren't captured in streaming events
    toolCalls.forEach((toolCall) => {
      if (
        !Array.from(executionMap.values()).some(
          (exec) => exec.name === toolCall.name
        )
      ) {
        executionMap.set(toolCall.id, {
          id: toolCall.id,
          name: toolCall.name,
          args: toolCall.args,
          status: toolCall.status,
          startTime: toolCall.timestamp,
          duration: toolCall.duration,
          result: toolCall.result,
          error: toolCall.error,
          events: [],
        });
      }
    });

    setProcessedExecutions(
      Array.from(executionMap.values()).sort(
        (a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0)
      )
    );
  }, [toolCalls, streamingEvents]);

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-yellow-400 bg-yellow-50";
      case "running":
        return "border-l-blue-400 bg-blue-50";
      case "completed":
        return "border-l-green-400 bg-green-50";
      case "error":
        return "border-l-red-400 bg-red-50";
      default:
        return "border-l-gray-400 bg-gray-50";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatResult = (result: any) => {
    if (!result) return "No result";
    if (typeof result === "string") return result;
    if (result.result) return result.result;
    return JSON.stringify(result, null, 2);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-4 top-20 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="Show tool executions"
      >
        🔧
      </button>
    );
  }

  if (processedExecutions.length === 0 && !isStreaming) return null;

  return (
    <div
      className={`fixed right-4 top-20 bottom-4 z-50 transition-all duration-300 ${
        isMinimized ? "w-16" : "w-100"
      }`}
    >
      <Card className="h-full flex flex-col shadow-xl border-2 bg-white/95 backdrop-blur-sm">
        {/* Header with Controls */}
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <span>🔧</span>
              {!isMinimized && (
                <>
                  <span>Tool Executions ({processedExecutions.length})</span>
                  {isStreaming && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </CardTitle>

            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title={isMinimized ? "Expand panel" : "Minimize panel"}
              >
                {isMinimized ? "📖" : "📕"}
              </button>

              <button
                onClick={() => setIsVisible(false)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                title="Close panel"
              >
                ✕
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        {!isMinimized && isExpanded && (
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {processedExecutions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-2xl mb-2">🔧</div>
                <div className="text-sm">No tool executions yet</div>
                {isStreaming && (
                  <div className="text-xs mt-1 text-blue-600 animate-pulse">
                    Waiting for tools...
                  </div>
                )}
              </div>
            ) : (
              processedExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className={`border-l-4 rounded-r-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor(
                    execution.status
                  )} ${
                    selectedExecution === execution.id
                      ? "ring-2 ring-blue-300"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedExecution(
                      selectedExecution === execution.id ? null : execution.id
                    )
                  }
                >
                  {/* Execution Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getStatusIcon(execution.status)}
                      </span>
                      <div>
                        <div className="font-medium text-sm text-gray-800">
                          {execution.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {execution.startTime?.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {execution.duration && (
                        <span className="text-xs bg-white/80 rounded px-2 py-1 font-mono">
                          {formatDuration(execution.duration)}
                        </span>
                      )}

                      {execution.events.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExecution(
                              selectedExecution === execution.id
                                ? null
                                : execution.id
                            );
                          }}
                          className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 hover:bg-blue-200 transition-colors"
                        >
                          {execution.events.length} events
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedExecution === execution.id && (
                    <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                      {/* Arguments */}
                      {Object.keys(execution.args).length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            Arguments:
                          </div>
                          <div className="bg-white/80 rounded p-2 text-xs font-mono overflow-x-auto">
                            <pre>{JSON.stringify(execution.args, null, 2)}</pre>
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      {execution.result && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            Result:
                          </div>
                          <div className="bg-white/80 rounded p-2 text-xs overflow-x-auto">
                            <div className="whitespace-pre-wrap">
                              {formatResult(execution.result)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {execution.error && (
                        <div>
                          <div className="text-xs font-semibold text-red-700 mb-1">
                            Error:
                          </div>
                          <div className="bg-red-100 border border-red-200 rounded p-2 text-xs text-red-700">
                            {execution.error}
                          </div>
                        </div>
                      )}

                      {/* Streaming Events */}
                      {execution.events.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            Streaming Events ({execution.events.length}):
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {execution.events.map((event, idx) => (
                              <div
                                key={idx}
                                className="bg-white/80 rounded p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-blue-600 font-semibold">
                                    {event.type}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(
                                      event.timestamp * 1000
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                {event.content && (
                                  <div className="text-gray-700 break-words">
                                    {event.content}
                                  </div>
                                )}
                                {Object.keys(event.metadata).length > 0 && (
                                  <details className="mt-1">
                                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                      Metadata
                                    </summary>
                                    <pre className="mt-1 text-xs bg-gray-50 p-1 rounded overflow-x-auto">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-2">
            {processedExecutions.slice(-3).map((execution, idx) => (
              <div
                key={execution.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                  execution.status === "completed"
                    ? "bg-green-100 text-green-600"
                    : execution.status === "running"
                    ? "bg-blue-100 text-blue-600"
                    : execution.status === "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
                title={`${execution.name} - ${execution.status}`}
              >
                {getStatusIcon(execution.status)}
              </div>
            ))}
            {processedExecutions.length > 3 && (
              <div className="text-xs text-gray-500">
                +{processedExecutions.length - 3}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
