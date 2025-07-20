#!/bin/bash

# Raspberry Pi 4 production deployment script (without Docker)
# Builds and runs in production mode

set -e

echo "🍓 Deploying Veridian OS to Raspberry Pi 4 (Production Mode)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Clean previous installations to avoid compatibility issues
echo "🧹 Cleaning previous installations..."
echo "  - Removing root node_modules and package-lock.json"
rm -rf node_modules package-lock.json

echo "  - Removing client node_modules and package-lock.json"
rm -rf client/node_modules client/package-lock.json

echo "  - Removing server node_modules and package-lock.json"
rm -rf server/node_modules server/package-lock.json

# Install dependencies
echo "📦 Installing/updating dependencies..."
npm install

# Create data directory
mkdir -p ./data

# Set production environment
export NODE_ENV=production

# Build server
echo "🔧 Building server..."
npm run build --workspace=server

# Try to build client (but don't fail if it doesn't work)
echo "🔧 Attempting to build client..."
if npm run build --workspace=client; then
    echo "✅ Client built successfully"
    CLIENT_MODE="production"
else
    echo "⚠️ Client build failed, falling back to development mode"
    CLIENT_MODE="development"
fi

echo ""
echo "🚀 Starting Veridian OS in production mode..."
echo "📡 Serial reader will connect to Arduino if available"
echo "🌐 Client: http://localhost:3000"
echo "🔌 Server: http://localhost:3001"
echo "📊 To stop: Press Ctrl+C"
echo ""

# Start server in production mode
cd server
npm start &
SERVER_PID=$!

# Start client based on build success
cd ../client
if [ "$CLIENT_MODE" = "production" ]; then
    echo "🌐 Starting client in production mode..."
    node .next/standalone/client/server.js &
else
    echo "🌐 Starting client in development mode..."
    npm run dev &
fi
CLIENT_PID=$!

# Return to root
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait

