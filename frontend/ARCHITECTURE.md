# 🏗️ Frontend Architecture Guide

## 📋 **Overview**

This frontend uses a **modular, component-based architecture** designed for extensibility, maintainability, and excellent user experience. The architecture supports real-time streaming, tool call visualization, and pluggable response parsers.

## 🎯 **Key Features**

- ✅ **Modular Components** - Reusable, composable UI components
- 🔄 **Real-time Streaming** - Live response updates with SSE
- 🔧 **Tool Call Visualization** - Visual tracking of agent tool executions
- 📝 **Smart Response Parsing** - Automatic content formatting and rendering
- 🎨 **Modern UI/UX** - Clean, responsive design with Tailwind CSS
- 🔌 **Extensible Architecture** - Easy to add new parsers, components, and features

## 📁 **Directory Structure**

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI primitives
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   ├── chat/           # Chat interface components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── response/       # Response rendering components
│   │   │   ├── ResponseRenderer.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── CodeBlockRenderer.tsx
│   │   │   └── CitationRenderer.tsx
│   │   ├── streaming/      # Streaming-related components
│   │   │   ├── StreamingIndicator.tsx
│   │   │   └── EventsLog.tsx
│   │   └── tools/          # Tool call visualization
│   │       └── ToolCallVisualization.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useAgentChat.ts
│   ├── services/           # API services
│   │   ├── AgentService.ts
│   │   └── StreamingService.ts
│   ├── types/              # TypeScript type definitions
│   │   └── agent.ts
│   └── utils/              # Utility functions
│       └── ResponseParser.ts
└── app/
    └── page.tsx            # Main application entry
```

## 🧩 **Component Architecture**

### **1. Core Components**

#### `ChatInterface` - Main chat container
- Manages conversation state
- Handles user input and agent responses
- Coordinates streaming and tool call visualization

#### `ChatMessage` - Individual message renderer
- Supports user and assistant messages
- Integrates response parsing and streaming indicators
- Shows tool execution logs

#### `ChatInput` - Input interface
- Dual-mode buttons (streaming vs. full response)
- Auto-resizing textarea
- Keyboard shortcuts support

### **2. Response Rendering System**

#### `ResponseRenderer` - Smart content parser
- Automatically detects content types
- Routes to appropriate renderers
- Handles streaming vs. final content

#### `MarkdownRenderer` - Markdown formatting
- Headers, lists, links, emphasis
- Extensible for custom markdown extensions

#### `CodeBlockRenderer` - Code display
- Syntax highlighting support
- Copy-to-clipboard functionality
- Language detection and labeling

#### `CitationRenderer` - Academic citations
- Structured citation display
- Link to external sources
- APA/MLA formatting support

### **3. Streaming Components**

#### `StreamingIndicator` - Live status indicator
- Animated streaming dots
- Connection status display

#### `EventsLog` - Streaming events viewer
- Expandable event timeline
- Color-coded event types
- Real-time event tracking

### **4. Tool Visualization**

#### `ToolCallVisualization` - Tool execution tracker
- Visual tool call pipeline
- Status indicators (pending/running/completed/error)
- Expandable arguments and results
- Execution timing information

## 🔧 **Services Layer**

### **AgentService** - Agent API interactions
```typescript
class AgentService {
  async callAgent(agentId: string, message: string): Promise<AgentResponse>
  async listAgents(): Promise<Agent[]>
  async getStreamingStats(): Promise<StreamingStats>
}
```

### **StreamingService** - Real-time streaming
```typescript
class StreamingService {
  async streamAgent(
    agentId: string,
    message: string,
    onEvent: (event: StreamingEvent) => void
  ): Promise<void>
}
```

## 🎣 **Custom Hooks**

### **useAgentChat** - Chat state management
```typescript
const {
  messages,           // Chat message history
  isLoading,          // Loading state
  isStreaming,        // Streaming state
  error,              // Error state
  toolCalls,          // Tool execution tracking
  sendMessage,        // Send message function
  stopStreaming,      // Cancel streaming
  clearConversation   // Reset chat
} = useAgentChat(agentId);
```

## 🔍 **Response Parsing System**

### **ResponseParser** - Content analysis
- Detects code blocks, citations, research suggestions
- Extracts metadata (word count, reading time)
- Supports multiple content types:
  - `markdown` - General text content
  - `code` - Code blocks with syntax highlighting
  - `citation` - Academic references
  - `research_suggestion` - Research recommendations
  - `literature_review` - Literature analysis

### **Adding New Parsers**

1. **Extend ParsedSection type**:
```typescript
type ParsedSection = {
  type: 'markdown' | 'code' | 'citation' | 'your_new_type';
  // ... other properties
}
```

2. **Add parser logic**:
```typescript
// In ResponseParser.parse()
const yourNewTypeMatch = content.match(/your-pattern/);
if (yourNewTypeMatch) {
  sections.push({
    type: 'your_new_type',
    content: yourNewTypeMatch[1]
  });
}
```

3. **Create renderer component**:
```typescript
// YourNewTypeRenderer.tsx
export const YourNewTypeRenderer: React.FC<{content: string}> = ({content}) => {
  return <div className="your-styling">{content}</div>;
};
```

4. **Add to ResponseRenderer**:
```typescript
{section.type === 'your_new_type' && (
  <YourNewTypeRenderer content={section.content} />
)}
```

## 🎨 **Styling System**

### **Tailwind CSS Classes**
- **Cards**: `bg-white rounded-lg shadow-lg p-6`
- **Buttons**: `bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md`
- **Status Colors**:
  - Success: `text-green-600 bg-green-50`
  - Warning: `text-yellow-600 bg-yellow-50`
  - Error: `text-red-600 bg-red-50`
  - Info: `text-blue-600 bg-blue-50`

### **Component Variants**
```typescript
// Button variants
<Button variant="primary" size="md" loading={isLoading}>
<Button variant="secondary" size="sm" icon="🔧">
<Button variant="danger" size="lg">

// Card layouts
<Card padding="md" className="mb-4">
<CardHeader><CardTitle>Title</CardTitle></CardHeader>
<CardContent>Content</CardContent>
```

## 🔌 **Extension Points**

### **1. Adding New Agent Types**
```typescript
// Update AgentConfig type
interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  custom_features?: string[];
}

// Use in ChatInterface
<ChatInterface 
  agentId="your_new_agent"
  title="Your Agent Name"
  description="Agent description"
/>
```

### **2. Custom Event Handlers**
```typescript
// In useAgentChat hook
const handleCustomEvent = (event: StreamingEvent) => {
  if (event.type === 'your_custom_event') {
    // Handle your custom logic
  }
};
```

### **3. Response Formatters**
```typescript
// Create custom formatter
export class CustomResponseFormatter {
  format(content: string): FormattedContent {
    // Your formatting logic
  }
}

// Use in ResponseRenderer
const formatter = new CustomResponseFormatter();
const formatted = formatter.format(content);
```

## 🚀 **Performance Optimizations**

### **1. Component Memoization**
```typescript
export const ChatMessage = React.memo<ChatMessageProps>(({ message }) => {
  // Component implementation
});
```

### **2. Streaming Optimizations**
- **Debounced Updates**: Batch streaming events for smooth rendering
- **Virtual Scrolling**: Handle large conversation histories
- **Event Cleanup**: Proper cleanup of streaming connections

### **3. Code Splitting**
```typescript
// Lazy load heavy components
const ToolCallVisualization = lazy(() => import('./ToolCallVisualization'));
```

## 🧪 **Testing Strategy**

### **Component Tests**
```typescript
// ChatMessage.test.tsx
test('renders user message correctly', () => {
  render(<ChatMessage message={userMessage} />);
  expect(screen.getByText('User message')).toBeInTheDocument();
});
```

### **Hook Tests**
```typescript
// useAgentChat.test.ts
test('sends message and updates state', async () => {
  const { result } = renderHook(() => useAgentChat('test-agent'));
  await act(() => result.current.sendMessage('test message'));
  expect(result.current.messages).toHaveLength(2);
});
```

## 📚 **Usage Examples**

### **Basic Chat Interface**
```typescript
export default function MyAgentPage() {
  return (
    <ChatInterface 
      agentId="my_agent"
      title="My Custom Agent"
      description="Specialized agent for specific tasks"
    />
  );
}
```

### **Custom Response Handler**
```typescript
const MyCustomChat = () => {
  const chat = useAgentChat('my_agent');
  
  const handleResponse = useCallback((message: ChatMessage) => {
    if (message.metadata?.special_type) {
      // Handle special response type
    }
  }, []);
  
  return <ChatInterface {...chat} onResponse={handleResponse} />;
};
```

## 🔄 **Migration from Monolithic**

The new architecture replaces the 300+ line monolithic component with:

1. **Separated Concerns**: UI, state, services, and types are in separate files
2. **Reusable Components**: Can be used across different agent interfaces
3. **Testable Code**: Each component and hook can be tested independently
4. **Extensible Design**: Easy to add new features without modifying existing code
5. **Better Performance**: Optimized rendering and state management

## 🎯 **Next Steps**

1. **Add More Parsers**: PDF, LaTeX, mathematical equations
2. **Enhanced Visualizations**: Interactive tool call graphs
3. **Collaboration Features**: Multi-user conversations
4. **Accessibility**: Screen reader support, keyboard navigation
5. **Internationalization**: Multi-language support

This architecture provides a solid foundation for building sophisticated AI agent interfaces with excellent user experience and developer productivity.
