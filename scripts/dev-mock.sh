#!/bin/bash

# Development Docker setup script with mock Arduino service

set -e

echo "🚀 Starting Veridian OS Development Environment (with Mock Arduino)..."

# Create data directory if it doesn't exist
mkdir -p ./data

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start development containers with mock Arduino
echo "🔧 Building and starting development containers with mock Arduino..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment started!"
echo "🌐 Client: http://localhost:3000"
echo "🔌 Server: http://localhost:8000"
echo "🤖 Mock Arduino: Sending sensor data every 3 seconds"
echo "📊 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
