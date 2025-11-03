import React from "react";
import { ResponseParser } from "@/src/utils/ResponseParser";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CodeBlockRenderer } from "./CodeBlockRenderer";
import { CitationRenderer } from "./CitationRenderer";

interface ResponseRendererProps {
  content: string;
  isStreaming?: boolean;
  metadata?: Record<string, any>;
}

export const ResponseRenderer: React.FC<ResponseRendererProps> = ({
  content,
  isStreaming = false,
  metadata,
}) => {
  const parser = new ResponseParser();
  const parsedContent = parser.parse(content);

  return (
    <div className="response-content">
      {/* Streaming content with cursor */}
      {isStreaming && content && (
        <div className="space-y-4">
          <MarkdownRenderer content={content} />
          <div className="flex items-center space-x-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="animate-pulse text-blue-500 font-mono">▋</span>
          </div>
        </div>
      )}

      {/* Loading state when streaming but no content yet */}
      {isStreaming && !content && (
        <div className="flex items-center space-x-2">
          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Generating response...</span>
        </div>
      )}

      {/* Final rendered content */}
      {!isStreaming && content && (
        <div className="space-y-4">
          {parsedContent.sections.map((section, index) => (
            <div key={index} className="section">
              {section.type === "markdown" && (
                <MarkdownRenderer content={section.content} />
              )}

              {section.type === "code" && (
                <CodeBlockRenderer
                  code={section.content}
                  language={section.language}
                  filename={section.filename}
                />
              )}

              {section.type === "citation" && (
                <CitationRenderer citations={section.citations} />
              )}

              {section.type === "research_suggestion" && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-600 mr-2">💡</span>
                    <h4 className="font-semibold text-blue-800">
                      Research Suggestion
                    </h4>
                  </div>
                  <MarkdownRenderer content={section.content} />
                </div>
              )}

              {section.type === "literature_review" && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 mr-2">📚</span>
                    <h4 className="font-semibold text-green-800">
                      Literature Review
                    </h4>
                  </div>
                  <MarkdownRenderer content={section.content} />
                </div>
              )}
            </div>
          ))}

          {/* Metadata display */}
          {metadata && Object.keys(metadata).length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                📊 Response Metadata
              </summary>
              <div className="mt-2 bg-gray-50 rounded p-3 text-xs font-mono">
                <pre>{JSON.stringify(metadata, null, 2)}</pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
