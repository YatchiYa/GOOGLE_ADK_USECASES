import React, { useState } from "react";
import { StreamingEvent } from "@/src/types/agent";
import { Card } from "@/src/components/ui/Card";

interface EventsLogProps {
  events: StreamingEvent[];
  isLatest?: boolean;
}

export const EventsLog: React.FC<EventsLogProps> = ({
  events,
  isLatest = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isLatest);

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
      start: "text-green-600",
      content: "text-blue-600",
      tool_call: "text-orange-600",
      tool_response: "text-green-600",
      thinking: "text-purple-600",
      error: "text-red-600",
      complete: "text-green-600",
      metadata: "text-gray-600",
    };
    return colors[type] || "text-gray-600";
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

  if (events.length === 0) return null;

  return (
    <Card padding="sm" className="bg-gray-50">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            📊 Streaming Events ({events.length})
          </span>
          {isLatest && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Live
            </span>
          )}
        </div>
        <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
          {events.slice(-20).map((event, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-xs font-mono bg-white rounded px-2 py-1"
            >
              <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
              <span
                className={`flex-shrink-0 w-16 ${getEventColor(event.type)}`}
              >
                {event.type}
              </span>
              <span className="flex-1 text-gray-700 truncate">
                {formatEventContent(event)}
              </span>
              <span className="flex-shrink-0 text-gray-400">
                {new Date(event.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
          ))}

          {events.length > 20 && (
            <div className="text-center text-xs text-gray-500 py-1">
              ... and {events.length - 20} more events
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
