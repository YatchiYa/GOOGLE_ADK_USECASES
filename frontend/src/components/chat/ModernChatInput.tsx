import React, { useState, useRef, useEffect } from "react";

interface ModernChatInputProps {
  onSendMessage: (message: string, useStreaming: boolean, attachments?: File[]) => void;
  isLoading: boolean;
  isStreaming: boolean;
  onStopStreaming: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ModernChatInput: React.FC<ModernChatInputProps> = ({
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
  const [isFocused, setIsFocused] = useState(false);
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-blue-600">📎</span>
                <span className="text-blue-800 font-medium truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-blue-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Container */}
        <div className={`relative bg-white rounded-2xl border-2 transition-all duration-200 ${
          isFocused 
            ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 pr-32 bg-transparent border-0 resize-none focus:outline-none placeholder-gray-400 text-gray-900 min-h-[52px] max-h-[120px]"
            rows={1}
          />

          {/* Right Side Controls */}
          <div className="absolute right-2 bottom-2 flex items-center space-x-2">
            
            {/* Streaming Toggle */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setUseStreaming(!useStreaming)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  useStreaming 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                    : "bg-gray-300"
                }`}
                disabled={disabled || isLoading}
                title={useStreaming ? "Streaming mode" : "Full response mode"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    useStreaming ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-gray-600">
                {useStreaming ? "🚀" : "📄"}
              </span>
            </div>

            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              disabled={disabled || isLoading}
              title="Attach files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Stop/Send Button */}
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                title="Stop streaming"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || disabled}
                className={`p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                  !message.trim() || disabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : useStreaming
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    : "bg-gray-700 hover:bg-gray-800 text-white"
                }`}
                title={useStreaming ? "Send with streaming" : "Send full response"}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Character Counter */}
          <div className="absolute bottom-1 left-4 text-xs text-gray-400">
            {message.length > 1800 && (
              <span className={message.length > 2000 ? "text-red-500" : "text-orange-500"}>
                {message.length}/2000
              </span>
            )}
          </div>
        </div>

        {/* Bottom Hints */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">Enter</kbd> to send</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">Shift+Enter</kbd> for new line</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
            <span>{isStreaming ? 'Streaming' : 'Ready'}</span>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv"
        />
      </div>
    </div>
  );
};
