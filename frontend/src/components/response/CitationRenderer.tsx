import React from "react";
import { Citation } from "@/src/utils/ResponseParser";

interface CitationRendererProps {
  citations: Citation[];
}

export const CitationRenderer: React.FC<CitationRendererProps> = ({
  citations,
}) => {
  if (citations.length === 0) return null;

  return (
    <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-md">
      <div className="flex items-center mb-3">
        <span className="text-gray-600 mr-2">📖</span>
        <h4 className="font-semibold text-gray-800">References</h4>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => (
          <div key={index} className="text-sm">
            <div className="font-medium text-gray-800">
              [{index + 1}] {citation.title}
            </div>
            <div className="text-gray-600">
              {citation.authors.join(", ")} ({citation.year})
              {citation.journal && (
                <span className="italic"> {citation.journal}</span>
              )}
            </div>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                View Source
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
