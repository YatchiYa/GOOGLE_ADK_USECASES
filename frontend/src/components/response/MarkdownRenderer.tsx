import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  // Simple markdown parsing - you can replace with a library like react-markdown
  const parseMarkdown = (text: string) => {
    return (
      text
        // Headers
        .replace(
          /^### (.*$)/gim,
          '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
        )
        .replace(
          /^## (.*$)/gim,
          '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>'
        )
        .replace(
          /^# (.*$)/gim,
          '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>'
        )

        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
        )

        // Lists
        .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
        .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')

        // Line breaks
        .replace(/\n/g, "<br>")
    );
  };

  return (
    <div
      className="  max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};
