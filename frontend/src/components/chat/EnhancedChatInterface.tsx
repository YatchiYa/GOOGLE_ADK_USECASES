import React, { useEffect, useRef, useState } from "react";
import { useAgentChat } from "@/src/hooks/useAgentChat";
import { ChatMessage } from "./ChatMessage";
import { ModernChatInput } from "./ModernChatInput";
import { ImprovedFloatingToolPanel } from "./ImprovedFloatingToolPanel";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";

interface EnhancedChatInterfaceProps {
  agentId: string;
  title?: string;
  description?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  agentId,
  title = "Expert Web Searcher",
  description = "Get web search advice, find related web resources, and explore new web directions",
}) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    toolCalls,
    streamingEvents,
    sendMessage,
    stopStreaming,
    clearConversation,
  } = useAgentChat(agentId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Handle scroll detection
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (!isAtBottom && !userHasScrolled) {
      setUserHasScrolled(true);
      setAutoScroll(false);
    } else if (isAtBottom && userHasScrolled) {
      setUserHasScrolled(false);
      setAutoScroll(true);
    }
  };

  // Auto-scroll to bottom when new messages arrive (only if auto-scroll is enabled)
  useEffect(() => {
    if (autoScroll && !userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, autoScroll, userHasScrolled]);

  // Reset auto-scroll when starting new conversation
  useEffect(() => {
    if (isLoading && messages.length === 1) {
      setAutoScroll(true);
      setUserHasScrolled(false);
    }
  }, [isLoading, messages.length]);

  const handleSendMessage = (
    content: string,
    useStreaming: boolean,
    attachments?: File[]
  ) => {
    // Reset scroll behavior for new messages
    setAutoScroll(true);
    setUserHasScrolled(false);

    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      // TODO: Implement file upload handling
      console.log("Attachments:", attachments);
    }

    sendMessage(content, useStreaming);
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    setUserHasScrolled(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                {/* <h1 className="text-3xl font-bold text-gray-800">{title}</h1> */}
                {/* <p className="text-gray-600 mt-1">{description}</p> */}
                <h1 className="text-3xl font-bold text-gray-800">Agent test</h1>
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

                {!autoScroll && (
                  <Button
                    onClick={scrollToBottom}
                    variant="ghost"
                    size="sm"
                    icon="⬇️"
                  >
                    Scroll to Bottom
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
        <div
          className="flex-1 overflow-y-auto"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          <div className="max-w-7xl mx-auto px-2 py-8">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>👋</span>
                    <span>Welcome to {title}</span>
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <p className="text-gray-600 mb-4">I can help you with:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <span>🔍</span>
                      <span>Advanced web searches and research</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>🧮</span>
                      <span>Mathematical calculations and computations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>📊</span>
                      <span>Data analysis and insights</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>🌐</span>
                      <span>Real-time information gathering</span>
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

        {/* Modern Input Area */}
        <div className="flex-shrink-0">
          <ModernChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            disabled={false}
          />
        </div>
      </div>

      {/* Improved Floating Tool Execution Panel */}
      <ImprovedFloatingToolPanel
        toolCalls={toolCalls}
        streamingEvents={streamingEvents}
        isStreaming={isStreaming}
      />
    </div>
  );
};
