/**
 * Service for fetching agent information and details
 */

export interface ToolInfo {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentDetails {
  agent_id: string;
  name: string;
  model: string;
  description: string;
  instruction: string;
  tools: ToolInfo[];
  capabilities: string[];
  status: string;
}

export class AgentInfoService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get detailed information about a specific agent
   */
  async getAgentDetails(agentId: string): Promise<AgentDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/${agentId}/details`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent details: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching agent details:', error);
      throw error;
    }
  }

  /**
   * Get list of all available agents
   */
  async getAgentList(): Promise<{ agents: string[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent list: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching agent list:', error);
      throw error;
    }
  }
}
