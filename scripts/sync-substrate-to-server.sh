#!/bin/bash
# Sync Substrate directory to server for Docker builds
# Usage: ./scripts/sync-substrate-to-server.sh

set -e

SERVER="pleroma"
SERVER_PATH="/opt/demiurge-blockchain"
LOCAL_SUBSTRATE="substrate"

if [ ! -d "$LOCAL_SUBSTRATE" ]; then
    echo "❌ Error: Substrate directory not found at $LOCAL_SUBSTRATE"
    echo "   Please ensure the substrate folder exists in the repo root"
    exit 1
fi

echo "🔄 Syncing Substrate directory to server..."
echo "   Source: $LOCAL_SUBSTRATE"
echo "   Destination: $SERVER:$SERVER_PATH/substrate"
echo ""

# Use rsync to sync the directory (exclude target and git)
rsync -avz --progress \
    --exclude 'target/' \
    --exclude '.git/' \
    --exclude '*.lock' \
    --exclude 'Cargo.lock' \
    "$LOCAL_SUBSTRATE/" \
    "$SERVER:$SERVER_PATH/substrate/"

echo ""
echo "✅ Substrate directory synced successfully!"
echo ""
echo "Next steps:"
echo "  1. Build blockchain node: cd docker && docker compose build demiurge-node"
echo "  2. Or start all services: docker compose up -d"
