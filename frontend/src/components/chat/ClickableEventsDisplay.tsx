import React, { useState } from "react";
import { StreamingEvent } from "@/src/types/agent";

interface ClickableEventsDisplayProps {
  events: StreamingEvent[];
  eventCount: number;
}

export const ClickableEventsDisplay: React.FC<ClickableEventsDisplayProps> = ({
  events,
  eventCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      start: "🚀",
      content: "📝",
      tool_call: "🔧",
      tool_response: "✅",
      thinking: "🤔",
      error: "❌",
      complete: "🏁",
      metadata: "📊",
    };
    return icons[type] || "📄";
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      start: "text-green-600 bg-green-50",
      content: "text-blue-600 bg-blue-50",
      tool_call: "text-orange-600 bg-orange-50",
      tool_response: "text-green-600 bg-green-50",
      thinking: "text-purple-600 bg-purple-50",
      error: "text-red-600 bg-red-50",
      complete: "text-green-600 bg-green-50",
      metadata: "text-gray-600 bg-gray-50",
    };
    return colors[type] || "text-gray-600 bg-gray-50";
  };

  const formatEventContent = (event: StreamingEvent) => {
    switch (event.type) {
      case "content":
        return `+${event.content.length} chars`;
      case "tool_call":
        return `${event.metadata.tool_name || "Unknown tool"}`;
      case "tool_response":
        return `${event.metadata.tool_name || "Tool"} completed`;
      default:
        return (
          event.content.slice(0, 50) + (event.content.length > 50 ? "..." : "")
        );
    }
  };

  if (eventCount === 0) return null;

  return (
    <div className="inline-block">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
      >
        <span>📊</span>
        <span>{eventCount} events</span>
        <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-100 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            Streaming Events Timeline
          </div>

          <div className="space-y-2">
            {events.slice(-10).map((event, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 p-2 rounded-lg ${getEventColor(
                  event.type
                )}`}
              >
                <span className="flex-shrink-0 text-sm">
                  {getEventIcon(event.type)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 mt-1 break-words">
                    {formatEventContent(event)}
                  </div>

                  {Object.keys(event.metadata).length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                        Metadata
                      </summary>
                      <pre className="mt-1 text-xs bg-white/80 p-1 rounded overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}

            {events.length > 10 && (
              <div className="text-center text-xs text-gray-500 py-1">
                ... and {events.length - 10} more events
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
