#!/bin/bash

echo "🚀 Starting Web Scraper Pro..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongod"
    echo "   or"
    echo "   mongod"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Start server in background
echo "🔧 Starting server..."
cd Server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Start client
echo "🌐 Starting client..."
cd Client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ Web Scraper Pro is starting up!"
echo "📱 Client will be available at: http://localhost:5173"
echo "🔌 Server will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait