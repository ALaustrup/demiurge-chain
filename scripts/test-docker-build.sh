#!/bin/bash
# Test Docker Build for Blockchain Node
# This tests if Docker build resolves dependency conflicts differently
# Run on server: bash scripts/test-docker-build.sh

set -e

echo "🐳 Testing Docker Build for Demiurge-Cloud Node"
echo "===================================================="
echo ""

cd "$(dirname "$0")/.." || exit 1

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "📦 Building blockchain node in Docker..."
echo "   This may take 10-30 minutes depending on system resources"
echo ""

# Build in Docker with timeout
if timeout 3600 docker build -t demiurge-node:test-build -f blockchain/Dockerfile blockchain 2>&1 | tee /tmp/docker-build.log; then
    echo ""
    echo "✅ Docker build completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the image: docker run --rm demiurge-node:test-build --version"
    echo "   2. If successful, update docker-compose.production.yml"
    echo "   3. Deploy: docker compose -f docker/docker-compose.production.yml up -d demiurge-node"
    echo ""
    exit 0
else
    BUILD_ERROR=$(grep -i "librocksdb\|error\|failed" /tmp/docker-build.log | tail -20)
    echo ""
    echo "❌ Docker build failed"
    echo ""
    echo "Error details:"
    echo "$BUILD_ERROR"
    echo ""
    echo "📋 Full log saved to: /tmp/docker-build.log"
    echo ""
    exit 1
fi
