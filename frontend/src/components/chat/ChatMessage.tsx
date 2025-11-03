import React from "react";
import { ChatMessage as ChatMessageType } from "@/src/types/agent";
import { Card } from "@/src/components/ui/Card";
import { ResponseRenderer } from "@/src/components/response/ResponseRenderer";
import { StreamingIndicator } from "@/src/components/streaming/StreamingIndicator";
import { ClickableEventsDisplay } from "./ClickableEventsDisplay";

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLatest = false,
}) => {
  const isUser = message.type === "user";
  const isAssistant = message.type === "assistant";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`max-w-[85%] ${isUser ? "ml-auto" : "mr-auto"}`}>
        {/* User Message */}
        {isUser && (
          <div className="flex items-start space-x-3 justify-end">
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-md">
              <div className="text-sm opacity-90 mb-1 text-right font-medium">
                You
              </div>
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>
              <div className="text-xs opacity-75 mt-2 text-right">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                👤
              </div>
            </div>
          </div>
        )}

        {/* Assistant Message */}
        {isAssistant && (
          <div className="flex items-start space-x-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                🤖
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-800">
                  AI Assistant
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {message.streaming && <StreamingIndicator />}
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Response Content */}
                <ResponseRenderer
                  content={message.content}
                  isStreaming={message.streaming || false}
                  metadata={message.metadata}
                />

                {/* Message Footer */}
                {!message.streaming && (
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 relative">
                    <div className="flex items-center space-x-3">
                      {message.events && message.events.length > 0 && (
                        <ClickableEventsDisplay
                          events={message.events}
                          eventCount={message.events.length}
                        />
                      )}
                      {message.metadata?.wordCount && (
                        <span className="flex items-center space-x-1">
                          <span>📝</span>
                          <span>{message.metadata.wordCount} words</span>
                        </span>
                      )}
                      {message.metadata?.readingTimeMinutes && (
                        <span className="flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>
                            {message.metadata.readingTimeMinutes}min read
                          </span>
                        </span>
                      )}
                    </div>
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Message */}
        {message.type === "system" && (
          <div className="text-center">
            <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              {message.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
