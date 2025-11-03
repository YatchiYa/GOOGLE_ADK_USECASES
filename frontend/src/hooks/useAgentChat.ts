import { useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ChatMessage, StreamingEvent, ToolCall, ConversationState } from '@/src/types/agent';
import { AgentService } from '@/src/services/AgentService';
import { StreamingService } from '@/src/services/StreamingService';

export const useAgentChat = (agentId: string) => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    currentAgent: agentId,
    error: null,
    toolCalls: [],
    streamingEvents: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const agentService = new AgentService();
  const streamingService = new StreamingService();

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
    
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
  }, []);

  const addToolCall = useCallback((toolCall: Omit<ToolCall, 'id' | 'timestamp'>) => {
    const newToolCall: ToolCall = {
      ...toolCall,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      toolCalls: [...prev.toolCalls, newToolCall]
    }));
    
    return newToolCall.id;
  }, []);

  const updateToolCall = useCallback((toolCallId: string, updates: Partial<ToolCall>) => {
    setState(prev => ({
      ...prev,
      toolCalls: prev.toolCalls.map(call => 
        call.id === toolCallId ? { ...call, ...updates } : call
      )
    }));
  }, []);

  const sendMessage = useCallback(async (content: string, useStreaming = true) => {
    // Add user message
    const userMessageId = addMessage({ type: 'user', content });
    console.log('Added user message with ID:', userMessageId);
    
    // Reset states
    setState(prev => ({
      ...prev,
      isLoading: true,
      isStreaming: useStreaming,
      error: null,
      streamingEvents: []
    }));

    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      if (useStreaming) {
        await handleStreamingResponse(content);
      } else {
        await handleSyncResponse(content);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false
      }));
      abortControllerRef.current = null;
    }
  }, [agentId]);

  const handleSyncResponse = async (content: string) => {
    const response = await agentService.callAgent(
      agentId, 
      content, 
      abortControllerRef.current?.signal
    );
    
    addMessage({
      type: 'assistant',
      content: response.response,
      metadata: { agent_id: response.agent_id, status: response.status }
    });
  };

  const handleStreamingResponse = async (content: string) => {
    const assistantMessageId = addMessage({
      type: 'assistant',
      content: '',
      streaming: true,
      events: []
    });
    console.log('Added assistant message with ID:', assistantMessageId);

    let fullContent = '';
    const events: StreamingEvent[] = [];

    await streamingService.streamAgent(
      agentId,
      content,
      (event) => {
        events.push(event);
        
        setState(prev => ({
          ...prev,
          streamingEvents: [...prev.streamingEvents, event]
        }));

        // Handle different event types
        switch (event.type) {
          case 'content':
            fullContent += event.content;
            // Force immediate React update for smoother streaming
            flushSync(() => {
              updateMessage(assistantMessageId, { 
                content: fullContent,
                events: [...events]
              });
            });
            break;
            
          case 'tool_call':
            const callId = event.metadata.call_id || event.metadata.tool_name + '_' + Date.now();
            addToolCall({
              name: event.metadata.tool_name || 'unknown',
              args: event.metadata.tool_args || {},
              status: 'running'
            });
            break;
            
          case 'tool_response':
            // Find and update the corresponding tool call using response_id or tool_name
            const responseId = event.metadata.response_id;
            const toolName = event.metadata.tool_name;
            
            setState(prev => ({
              ...prev,
              toolCalls: prev.toolCalls.map(call => {
                // Match by tool name and running status (most recent)
                if (call.name === toolName && call.status === 'running') {
                  return { 
                    ...call, 
                    status: 'completed', 
                    result: event.metadata.raw_response || event.metadata.tool_result,
                    duration: Date.now() - call.timestamp.getTime()
                  };
                }
                return call;
              })
            }));
            break;
            
          case 'error':
            setState(prev => ({ 
              ...prev, 
              error: event.content,
              // Mark any running tool calls as errored
              toolCalls: prev.toolCalls.map(call => 
                call.status === 'running' 
                  ? { ...call, status: 'error', error: event.content }
                  : call
              )
            }));
            break;
            
          case 'complete':
            updateMessage(assistantMessageId, { 
              streaming: false,
              metadata: { 
                ...event.metadata,
                total_events: events.length 
              }
            });
            break;
        }
      },
      abortControllerRef.current?.signal
    );
  };

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      toolCalls: [],
      streamingEvents: [],
      error: null
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    stopStreaming,
    clearConversation,
    addMessage,
    updateMessage
  };
};
