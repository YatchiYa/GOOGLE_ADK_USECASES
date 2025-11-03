import React, { useEffect, useRef, useState } from "react";
import { useAgentChat } from "@/src/hooks/useAgentChat";
import { ChatMessage } from "./ChatMessage";
import { ModernChatInput } from "./ModernChatInput";
import { ImprovedFloatingToolPanel } from "./ImprovedFloatingToolPanel";
import { AgentSelector } from "./AgentSelector";
import { GmailAuthPanel } from "./GmailAuthPanel";
import { AgentInfoPanel } from "./AgentInfoPanel";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";

interface MultiAgentChatInterfaceProps {
  initialAgentId?: string;
  title?: string;
  description?: string;
}

export const MultiAgentChatInterface: React.FC<
  MultiAgentChatInterfaceProps
> = ({
  initialAgentId = "expert_web_searcher",
  title = "AI Assistant Hub",
  description = "Choose your AI assistant and start chatting",
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId);
  const [agentTitle, setAgentTitle] = useState(title);
  const [agentDescription, setAgentDescription] = useState(description);

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
  } = useAgentChat(selectedAgentId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Update title and description based on selected agent
  useEffect(() => {
    const agentConfigs: Record<string, { title: string; description: string }> =
      {
        academic_coordinator: {
          title: "Academic Research Agent",
          description:
            "Get research advice, find related literature, and explore new research directions",
        },
        expert_web_searcher: {
          title: "Expert Web Searcher",
          description:
            "Advanced web search, data analysis, and comprehensive report generation",
        },
        brevo_expert: {
          title: "Brevo Expert",
          description:
            "Contact management, email operations, and comprehensive Brevo API integration",
        },
        gmail_expert: {
          title: "Gmail & Calendar Expert",
          description:
            "Gmail email management, Google Calendar events, and comprehensive productivity tools",
        },
      };

    const config = agentConfigs[selectedAgentId];
    if (config) {
      setAgentTitle(config.title);
      setAgentDescription(config.description);
    } else {
      setAgentTitle(
        selectedAgentId
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      );
      setAgentDescription("AI Assistant for various tasks");
    }
  }, [selectedAgentId]);

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

  const handleAgentChange = (newAgentId: string) => {
    if (newAgentId !== selectedAgentId) {
      setSelectedAgentId(newAgentId);
      // Clear conversation when switching agents
      clearConversation();
    }
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
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {agentTitle}
                  </h1>
                  <p className="text-gray-600 mt-1">{agentDescription}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Agent Selector */}
                <AgentSelector
                  selectedAgentId={selectedAgentId}
                  onAgentChange={handleAgentChange}
                />

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
              <div className="space-y-6">
                {/* Agent Information Panel */}
                <AgentInfoPanel 
                  agentId={selectedAgentId}
                  className="mb-4"
                />
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>👋</span>
                      <span>Welcome to {agentTitle}</span>
                    </CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 mb-4">I can help you with:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {selectedAgentId === "academic_coordinator" ? (
                      <>
                        <li className="flex items-center space-x-2">
                          <span>📚</span>
                          <span>Literature reviews and research guidance</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🔍</span>
                          <span>Finding relevant academic papers</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>📊</span>
                          <span>Research methodology and analysis</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>✍️</span>
                          <span>Academic writing and citations</span>
                        </li>
                      </>
                    ) : selectedAgentId === "brevo_expert" ? (
                      <>
                        <li className="flex items-center space-x-2">
                          <span>📧</span>
                          <span>Contact creation, updates, and management</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>📊</span>
                          <span>Bulk contact operations and data import</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>✉️</span>
                          <span>Transactional email sending and templates</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🔧</span>
                          <span>Brevo API integration and troubleshooting</span>
                        </li>
                      </>
                    ) : selectedAgentId === "gmail_expert" ? (
                      <>
                        <li className="flex items-center space-x-2">
                          <span>📧</span>
                          <span>Read and manage Gmail emails with advanced filtering</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>📤</span>
                          <span>Send emails with attachments and rich content</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>📅</span>
                          <span>Manage Google Calendar events and scheduling</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🔍</span>
                          <span>Advanced search for emails and calendar events</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🔐</span>
                          <span>Secure OAuth authentication for Gmail & Calendar</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center space-x-2">
                          <span>🔍</span>
                          <span>Advanced web searches and research</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🧮</span>
                          <span>
                            Mathematical calculations and computations
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>📊</span>
                          <span>Data analysis and comprehensive reports</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>🌐</span>
                          <span>Real-time information gathering</span>
                        </li>
                      </>
                    )}
                  </ul>
                  
                  {/* Gmail Authentication Panel */}
                  {selectedAgentId === "gmail_expert" && (
                    <div className="mt-4">
                      <GmailAuthPanel onAuthSuccess={() => {
                        // Optionally refresh or show success message
                        console.log('Gmail authentication successful');
                      }} />
                    </div>
                  )}
                </div>
              </Card>
              </div>
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
            <div className="space-y-6">
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
            placeholder={`Ask ${agentTitle.toLowerCase()} anything...`}
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
