export interface ParsedSection {
  type: 'markdown' | 'code' | 'citation' | 'research_suggestion' | 'literature_review';
  content: string;
  language?: string;
  filename?: string;
  citations?: Citation[];
}

export interface Citation {
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  url?: string;
}

export interface ParsedResponse {
  sections: ParsedSection[];
  metadata: Record<string, any>;
}

export class ResponseParser {
  parse(content: string): ParsedResponse {
    const sections: ParsedSection[] = [];
    let currentContent = content;

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, code] = match;
      
      // Add content before code block
      const beforeCode = currentContent.substring(0, currentContent.indexOf(fullMatch));
      if (beforeCode.trim()) {
        sections.push({
          type: 'markdown',
          content: beforeCode.trim()
        });
      }
      
      // Add code block
      sections.push({
        type: 'code',
        content: code.trim(),
        language: language || 'text'
      });
      
      // Update current content
      currentContent = currentContent.substring(currentContent.indexOf(fullMatch) + fullMatch.length);
    }

    // Add remaining content
    if (currentContent.trim()) {
      // Check for special sections
      const researchSuggestionMatch = currentContent.match(/## Research Suggestions?\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
      const literatureReviewMatch = currentContent.match(/## Literature Review\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
      
      if (researchSuggestionMatch) {
        sections.push({
          type: 'research_suggestion',
          content: researchSuggestionMatch[1].trim()
        });
        currentContent = currentContent.replace(researchSuggestionMatch[0], '');
      }
      
      if (literatureReviewMatch) {
        sections.push({
          type: 'literature_review',
          content: literatureReviewMatch[1].trim()
        });
        currentContent = currentContent.replace(literatureReviewMatch[0], '');
      }
      
      // Add remaining as markdown
      if (currentContent.trim()) {
        sections.push({
          type: 'markdown',
          content: currentContent.trim()
        });
      }
    }

    // If no sections were created, add the entire content as markdown
    if (sections.length === 0 && content.trim()) {
      sections.push({
        type: 'markdown',
        content: content.trim()
      });
    }

    return {
      sections,
      metadata: this.extractMetadata(content)
    };
  }

  private extractMetadata(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract citations
    const citationRegex = /\[(\d+)\]\s*([^[]+?)(?=\[\d+\]|$)/g;
    const citations: Citation[] = [];
    let citationMatch;
    
    while ((citationMatch = citationRegex.exec(content)) !== null) {
      const [, id, citationText] = citationMatch;
      
      // Parse citation text (basic parsing)
      const authorMatch = citationText.match(/^([^.]+)\./);
      const yearMatch = citationText.match(/\((\d{4})\)/);
      const titleMatch = citationText.match(/"([^"]+)"/);
      
      citations.push({
        title: titleMatch?.[1] || citationText.substring(0, 50) + '...',
        authors: authorMatch?.[1] ? [authorMatch[1].trim()] : [],
        year: yearMatch?.[1] ? parseInt(yearMatch[1]) : new Date().getFullYear(),
        journal: undefined,
        url: undefined
      });
    }
    
    if (citations.length > 0) {
      metadata.citations = citations;
    }
    
    // Extract word count
    metadata.wordCount = content.split(/\s+/).length;
    
    // Extract reading time (average 200 words per minute)
    metadata.readingTimeMinutes = Math.ceil(metadata.wordCount / 200);
    
    return metadata;
  }
}
