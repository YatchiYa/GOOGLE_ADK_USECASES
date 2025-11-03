import React, { useState } from "react";
import { Button } from "@/src/components/ui/Button";

interface CodeBlockRendererProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({
  code,
  language = "text",
  filename,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-1000",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      bash: "bg-gray-100 text-gray-800",
      json: "bg-purple-100 text-purple-800",
      css: "bg-pink-100 text-pink-800",
      html: "bg-orange-100 text-orange-800",
    };
    return colors[lang.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <div className="flex items-center space-x-3">
          {filename && (
            <span className="text-gray-300 text-sm font-mono">{filename}</span>
          )}
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getLanguageColor(
              language
            )}`}
          >
            {language}
          </span>
        </div>

        <Button
          onClick={copyToClipboard}
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </Button>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-gray-100 text-sm font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
