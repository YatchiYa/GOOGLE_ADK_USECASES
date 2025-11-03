import { StreamingEvent } from '@/src/types/agent';

export class StreamingService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async streamAgent(
    agentId: string,
    message: string,
    onEvent: (event: StreamingEvent) => void,
    signal?: AbortSignal,
    context: Record<string, any> = {}
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/agent/${agentId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context
      }),
      signal
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || `Failed to stream agent: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const event: StreamingEvent = JSON.parse(data);
              // Process events immediately without batching
              onEvent(event);
            } catch (parseError) {
              console.warn('Failed to parse streaming event:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
