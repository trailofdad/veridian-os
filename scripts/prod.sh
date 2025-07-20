#!/bin/bash

# Production Docker setup script for Pi 4

set -e

echo "🚀 Starting Veridian OS Production Environment..."

# Create data directory if it doesn't exist
mkdir -p ./data

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if nginx config exists
if [ ! -f "./nginx.conf" ]; then
    echo "❌ nginx.conf not found. Please ensure nginx.conf is in the root directory."
    exit 1
fi

# Build and start production containers
echo "🔧 Building and starting production containers..."
docker compose -f docker compose.prod.yml up --build -d

echo "✅ Production environment started!"
echo "🌐 Application: http://localhost (via nginx)"
echo "🌐 Client direct: http://localhost:3000"  
echo "🔌 Server direct: http://localhost:8000"
echo "📊 To view logs: docker compose -f docker compose.prod.yml logs -f"
echo "🛑 To stop: docker compose -f docker compose.prod.yml down"
echo ""
echo "🔍 Container status:"
docker compose -f docker compose.prod.yml ps
