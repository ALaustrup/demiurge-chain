#!/bin/bash
# Deploy custom runtime Docker image to server

set -e

echo "🚀 Deploying custom runtime build..."

# Deploy build script
echo "📦 Copying build script to server..."
scp scripts/build-on-server.sh pleroma:/root/demiurge/scripts/

# Make executable
ssh pleroma "chmod +x /root/demiurge/scripts/build-on-server.sh"

# Run build on server
echo "🔨 Starting build on server (this will take 30-60 minutes)..."
ssh pleroma "bash /root/demiurge/scripts/build-on-server.sh"

echo "✅ Build complete!"
echo ""
echo "Next: Deploy custom image to validator node"
