import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/Button";

interface ChatInputProps {
  onSendMessage: (message: string, useStreaming?: boolean) => void;
  isLoading: boolean;
  isStreaming: boolean;
  onStopStreaming: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  isStreaming,
  onStopStreaming,
  placeholder = "Enter your research query or question...",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (useStreaming = true) => {
    if (!message.trim() || disabled) return;

    onSendMessage(message, useStreaming);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(true);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[60px] max-h-[200px] disabled:bg-gray-100"
              rows={2}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={!message.trim() || disabled}
              loading={isStreaming}
              className="flex-1"
              icon="🚀"
            >
              {isStreaming ? "Streaming..." : "Stream Response"}
            </Button>

            <Button
              onClick={() => handleSubmit(false)}
              disabled={!message.trim() || disabled}
              loading={isLoading && !isStreaming}
              variant="secondary"
              className="flex-1"
              icon="📄"
            >
              {isLoading && !isStreaming
                ? "Processing..."
                : "Get Full Response"}
            </Button>

            {isStreaming && (
              <Button onClick={onStopStreaming} variant="danger" icon="⏹️">
                Stop
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
