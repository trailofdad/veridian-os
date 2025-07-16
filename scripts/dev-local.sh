#!/bin/bash

# Local development script without Docker

set -e

echo "🚀 Starting Veridian OS Local Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create data directory if it doesn't exist
mkdir -p ./data

echo "🔧 Starting local development servers..."
echo "📡 Serial reader will automatically fallback to mock data if no Arduino is connected"
echo "🌐 Client: http://localhost:3000"
echo "🔌 Server: http://localhost:3001"
echo "📊 To stop: Press Ctrl+C"
echo ""

# Start the development servers
npm run dev:local:concurrent
