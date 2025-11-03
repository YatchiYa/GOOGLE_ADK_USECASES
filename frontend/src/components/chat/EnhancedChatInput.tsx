import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/Button";

interface EnhancedChatInputProps {
  onSendMessage: (message: string, useStreaming: boolean, attachments?: File[]) => void;
  isLoading: boolean;
  isStreaming: boolean;
  onStopStreaming: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  onSendMessage,
  isLoading,
  isStreaming,
  onStopStreaming,
  placeholder = "Type your message here...",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message, useStreaming, attachments);
    setMessage("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-gray-600">📎</span>
                <span className="text-gray-800 truncate max-w-[200px]">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-500 hover:text-red-500 ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-3">
          {/* Left Side Controls */}
          <div className="flex flex-col space-y-2">
            {/* Streaming Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseStreaming(!useStreaming)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useStreaming ? "bg-blue-600" : "bg-gray-300"
                }`}
                disabled={disabled || isLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useStreaming ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">
                {useStreaming ? "🚀 Stream" : "📄 Full"}
              </span>
            </div>

            {/* File Upload Button */}
            <Button
              onClick={openFileDialog}
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              disabled={disabled || isLoading}
              title="Attach files"
            >
              📎
            </Button>
          </div>

          {/* Message Input Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[200px] disabled:bg-gray-100"
              rows={1}
            />
            
            {/* Character count */}
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {message.length}/2000
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex space-x-2">
            {/* Stop Button (when streaming) */}
            {isStreaming && (
              <Button
                onClick={onStopStreaming}
                variant="danger"
                size="sm"
                className="px-3 py-2"
              >
                ⏹️
              </Button>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              loading={isLoading}
              className="px-4 py-2"
              title={useStreaming ? "Send with streaming" : "Send full response"}
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "➤"
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line • Toggle streaming mode with switch
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />
      </div>
    </div>
  );
};
