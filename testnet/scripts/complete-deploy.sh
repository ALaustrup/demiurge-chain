#!/bin/bash
# Complete testnet deployment - build and start

set -e

echo "🔨 Building Demiurge node binary (this will take 15-20 minutes)..."
cd ~/Demiurge-Blockchain

# Source cargo environment
source ~/.cargo/env

# Build the node
echo "Starting build..."
cargo build --release 2>&1 | tail -20

# Copy binary
echo "📦 Installing binary..."
sudo cp target/release/demiurge-node-legacy /opt/demiurge/

# Check if binary exists
if [ ! -f /opt/demiurge/demiurge-node-legacy ]; then
    echo "❌ Binary not found. Build may have failed."
    echo "Check: cargo build --release"
    exit 1
fi

echo "✓ Binary installed"

# Reload systemd
sudo systemctl daemon-reload

# Start validators
echo "🎬 Starting validators..."
echo "Starting Alpha (Bootstrap)..."
sudo systemctl start demiurge-validator-alpha
sleep 5

echo "Starting Beta..."
sudo systemctl start demiurge-validator-beta
sleep 2

echo "Starting Gamma..."
sudo systemctl start demiurge-validator-gamma
sleep 2

echo "Starting Delta..."
sudo systemctl start demiurge-validator-delta
sleep 2

echo ""
echo "✅ Testnet deployment complete!"
echo ""
echo "📊 Check status:"
echo "   cd Demiurge-Cloud/testnet"
echo "   ./scripts/manage.sh status"
echo ""
echo "📈 Monitor:"
echo "   ./scripts/monitor.sh"
echo ""
echo "📋 View logs:"
echo "   journalctl -u demiurge-validator-alpha -f"
