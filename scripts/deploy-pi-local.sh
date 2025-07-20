#!/bin/bash

# Raspberry Pi 4 local deployment script (without Docker)
# Based on the working dev-local.sh pattern

set -e

echo "🍓 Deploying Veridian OS to Raspberry Pi 4 (Local Mode)..."

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

echo "📋 Node.js version: $(node --version)"
echo "📋 Architecture: $(uname -m)"

# Install dependencies
echo "📦 Installing/updating dependencies..."
npm install

# Create data directory if it doesn't exist
mkdir -p ./data

echo "🚀 Starting production servers locally..."
echo "📡 Serial reader will connect to Arduino if available"
echo "🌐 Client: http://localhost:3000"
echo "🔌 Server: http://localhost:3001"
echo "📊 To stop: Press Ctrl+C"
echo ""

# Set production environment
export NODE_ENV=production

# Start the production servers (similar to dev but in production mode)
npm run dev:local:concurrent

