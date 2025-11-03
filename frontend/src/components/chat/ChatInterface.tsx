import React, { useEffect, useRef } from "react";
import { useAgentChat } from "@/src/hooks/useAgentChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ToolCallVisualization } from "@/src/components/tools/ToolCallVisualization";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";

interface ChatInterfaceProps {
  agentId: string;
  title?: string;
  description?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agentId,
  title = "Academic Research Agent",
  description = "Get research advice, find related literature, and explore new research directions",
}) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    toolCalls,
    sendMessage,
    stopStreaming,
    clearConversation,
  } = useAgentChat(agentId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>

            <div className="flex items-center space-x-3">
              {messages.length > 0 && (
                <Button
                  onClick={clearConversation}
                  variant="ghost"
                  size="sm"
                  icon="🗑️"
                >
                  Clear Chat
                </Button>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isStreaming ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`}
                ></div>
                <span>{isStreaming ? "Streaming" : "Ready"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>👋</span>
                  <span>Welcome to Academic Research Assistant</span>
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-gray-600 mb-4">I can help you with:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center space-x-2">
                    <span>📚</span>
                    <span>Analyzing seminal papers and research documents</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Finding related literature and current research</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>💡</span>
                    <span>Suggesting new research directions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>🌐</span>
                    <span>Accessing web resources for knowledge</span>
                  </li>
                </ul>
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <div className="p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <span>❌</span>
                  <strong>Error:</strong>
                  <span>{error}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Tool Calls Visualization */}
          {toolCalls.length > 0 && (
            <ToolCallVisualization toolCalls={toolCalls} />
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}
          </div>

          {/* Loading Indicator */}
          {isLoading && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 text-gray-600">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Initializing conversation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
};
