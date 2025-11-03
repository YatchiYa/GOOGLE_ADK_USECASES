// Core types for the agent system
export interface AgentResponse {
  response: string;
  agent_id: string;
  status: string;
}

export interface StreamingEvent {
  type: StreamingEventType;
  content: string;
  metadata: StreamingMetadata;
  timestamp: number;
  session_id?: string;
  agent_id?: string;
}

export type StreamingEventType = 
  | 'start'
  | 'content' 
  | 'tool_call'
  | 'tool_response'
  | 'tool_result'
  | 'thinking'
  | 'error'
  | 'complete'
  | 'metadata';

export interface StreamingMetadata {
  event_count?: number;
  chunk_size?: number;
  chunk_id?: string;
  part_index?: number;
  accumulated_size?: number;
  is_streaming?: boolean;
  is_partial?: boolean;
  is_final_response?: boolean;
  adk_event_id?: string;
  sub_agent_name?: string;
  is_sub_agent?: boolean;
  is_sub_agent_tool?: boolean;
  tool_name?: string;
  tool_args?: Record<string, any>;
  call_id?: string;
  response_id?: string;
  tool_result?: any;
  raw_response?: any;
  error_type?: string;
  total_events?: number;
  duration_seconds?: number;
  completed_at?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  streaming?: boolean;
  events?: StreamingEvent[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  streaming_supported: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export interface ConversationState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentAgent: string;
  error: string | null;
  toolCalls: ToolCall[];
  streamingEvents: StreamingEvent[];
}
