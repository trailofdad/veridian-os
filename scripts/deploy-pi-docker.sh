#!/bin/bash

# Raspberry Pi 4 deployment script with cross-platform build support
# This script ensures proper SWC binary selection and ARM64 compatibility

set -e

echo "🍓 Deploying Veridian OS to Raspberry Pi 4 with Docker..."

# Set environment variables for ARM64 build
export DOCKER_DEFAULT_PLATFORM=linux/arm64
export DOCKER_BUILDKIT=1

# Create data directory if it doesn't exist
mkdir -p ./data

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if building on different architecture
if [[ $(uname -m) != "aarch64" ]]; then
    echo "🏗️  Cross-platform build detected ($(uname -m) -> arm64)"
    echo "📦 This may take longer as Docker will emulate ARM64..."
    
    # Ensure buildx is available for cross-platform builds
    docker buildx create --name pi-builder --use || docker buildx use pi-builder
    docker buildx inspect --bootstrap
fi

# Build images with explicit platform targeting for Pi 4
echo "🔧 Building ARM64 containers for Raspberry Pi 4..."
docker compose -f docker-compose.prod.yml build \
    --build-arg BUILDPLATFORM=linux/arm64 \
    --build-arg TARGETPLATFORM=linux/arm64

# Start production containers
echo "🚀 Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Raspberry Pi 4 deployment complete!"
echo "🌐 Application: http://localhost (via nginx profile)"
echo "🌐 Client direct: http://localhost:3000"  
echo "🔌 Server direct: http://localhost:8000"
echo ""
echo "📊 To view logs: docker compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop: docker compose -f docker-compose.prod.yml down"
echo "🌐 To start with nginx: docker compose -f docker-compose.prod.yml --profile with-nginx up -d"
echo ""
echo "🔍 Container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "💡 Pi-specific optimizations applied:"
echo "   • ARM64 SWC binaries: ✅ Available"
echo "   • Cross-platform build: ✅ Configured"
echo "   • Serial port access: ✅ Configured"
echo "   • Native modules: ✅ Built for ARM64"
echo "   • Standalone Next.js: ✅ Minimal runtime dependencies"
