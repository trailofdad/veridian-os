#!/bin/bash

# Development Docker setup script

set -e

echo "🚀 Starting Veridian OS Development Environment..."

# Create data directory if it doesn't exist
mkdir -p ./data

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start development containers
echo "🔧 Building and starting development containers..."
docker-compose -f docker-compose.yml up --build

echo "✅ Development environment started!"
echo "🌐 Client: http://localhost:3000"
echo "🔌 Server: http://localhost:8000"
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
