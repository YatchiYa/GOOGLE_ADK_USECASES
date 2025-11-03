#!/bin/bash

# Start the Academic Research Agent System

echo "🚀 Starting Academic Research Agent System..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check ports
echo "📡 Checking ports..."
if ! check_port 8000; then
    echo "❌ Backend port 8000 is busy. Please stop the existing service."
    exit 1
fi

if ! check_port 3000; then
    echo "❌ Frontend port 3000 is busy. Please stop the existing service."
    exit 1
fi

echo "✅ Ports are available"

# Start backend server
echo "🔧 Starting FastAPI backend server..."
cd backend_server
python -m pip install -r requirements.txt
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting Next.js frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🎉 Servers started successfully!"
echo "📊 Backend API: http://localhost:8000"
echo "🌐 Frontend UI: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
