import { AgentResponse } from '@/src/types/agent';

export class AgentService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async callAgent(
    agentId: string, 
    message: string, 
    signal?: AbortSignal,
    context: Record<string, any> = {} 
  ): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/agent/${agentId}`, {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to call agent: ${response.statusText}`);
    }

    return response.json();
  }

  async listAgents(signal?: AbortSignal) {
    const response = await fetch(`${this.baseUrl}/agents`, { signal });
    
    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }

    return response.json();
  }

  async getStreamingStats(signal?: AbortSignal) {
    const response = await fetch(`${this.baseUrl}/streaming/stats`, { signal });
    
    if (!response.ok) {
      throw new Error(`Failed to get streaming stats: ${response.statusText}`);
    }

    return response.json();
  }
}
