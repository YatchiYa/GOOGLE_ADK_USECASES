# Academic Research Agent System

A full-stack application that provides an interface to interact with your academic research coordinator agent.

## 🏗️ Architecture

- **Backend**: FastAPI server with agent registry
- **Frontend**: Next.js React application with Tailwind CSS
- **Agent**: Google ADK academic coordinator agent

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
./start_servers.sh
```

### Option 2: Manual startup

#### Backend Server
```bash
cd backend_server
pip install -r requirements.txt
python main.py
```

#### Frontend Server
```bash
cd frontend
npm run dev
```

## 📡 API Endpoints

- `GET /` - Health check
- `GET /agents` - List all available agents
- `POST /agent/{agent_id}` - Call a specific agent (non-streaming)
- `POST /agent/{agent_id}/stream` - Call a specific agent with streaming response
- `GET /streaming/stats` - Get streaming statistics

### Example API Calls

#### Non-streaming (Traditional)
```bash
curl -X POST "http://localhost:8000/agent/academic_coordinator" \
     -H "Content-Type: application/json" \
     -d '{"message": "I need help analyzing this research paper about machine learning..."}'
```

#### Streaming (Real-time)
```bash
curl -X POST "http://localhost:8000/agent/academic_coordinator/stream" \
     -H "Content-Type: application/json" \
     -d '{"message": "I need help analyzing this research paper about machine learning..."}'
```

## 🌐 Access Points

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Agent Configuration

Your agent is registered in the backend with ID `academic_coordinator`. It includes:
- Web search capabilities
- New research direction suggestions
- Literature analysis
- Research advice

## 📝 Usage

1. Open the frontend at http://localhost:3000
2. Enter your research query or seminal paper details
3. Choose your interaction mode:
   - **🚀 Stream Response**: Real-time streaming with live updates
   - **📄 Get Full Response**: Traditional request-response
4. View the detailed response with research recommendations

### 🔄 Streaming Features
- **Real-time updates**: See responses as they're generated
- **Tool execution tracking**: Monitor sub-agent and tool calls
- **Event logging**: Detailed streaming event information
- **Cancellation support**: Stop streaming at any time

## 🛠️ Development

### Adding New Agents
Edit `backend_server/main.py` and add your agent to the `AGENT_REGISTRY`:

```python
AGENT_REGISTRY = {
    "academic_coordinator": root_agent,
    "your_new_agent": your_agent_instance
}
```

### Frontend Customization
The frontend is built with:
- React 19.2.0
- Next.js 16.0.1
- Tailwind CSS 4
- TypeScript

## 🐛 Troubleshooting

- **Port conflicts**: Use `lsof -i :8000` and `lsof -i :3000` to check for conflicts
- **Agent import errors**: Ensure the agent_web directory is properly structured
- **CORS issues**: The backend is configured to allow requests from localhost:3000
