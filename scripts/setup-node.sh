#!/bin/bash
# Demiurge Node Setup Script
# Run on Monad (51.210.209.112) to set up a validator node
#
# Usage: ./scripts/setup-node.sh [--testnet|--mainnet]

set -e

# Configuration
CHAIN_DATA_DIR="/data/demiurge-chain"
PROJECT_DIR="/data/Demiurge-Blockchain"
NETWORK="${1:-testnet}"

echo "=========================================="
echo "  Demiurge Node Setup - ${NETWORK^^}"
echo "=========================================="

# Determine genesis file
if [ "$NETWORK" == "mainnet" ]; then
    GENESIS_FILE="$PROJECT_DIR/config/production/genesis.json"
else
    GENESIS_FILE="$PROJECT_DIR/config/production/genesis-testnet.json"
fi

echo "Using genesis file: $GENESIS_FILE"

# Step 1: Create data directory
echo ""
echo "Step 1: Creating data directory..."
sudo mkdir -p "$CHAIN_DATA_DIR"
sudo chown ubuntu:ubuntu "$CHAIN_DATA_DIR"

# Step 2: Build the node binary
echo ""
echo "Step 2: Building node binary (release mode)..."
cd "$PROJECT_DIR/framework"
cargo build --release

# Step 3: Generate validator key if not exists
VALIDATOR_KEY_FILE="$CHAIN_DATA_DIR/validator.key"
if [ ! -f "$VALIDATOR_KEY_FILE" ]; then
    echo ""
    echo "Step 3: Generating new validator key..."
    ./target/release/demiurge-node generate-key --output "$VALIDATOR_KEY_FILE"
    chmod 600 "$VALIDATOR_KEY_FILE"
    echo "Validator key saved to: $VALIDATOR_KEY_FILE"
    
    # Display the public key (address)
    echo ""
    echo "Validator Address:"
    ./target/release/demiurge-node show-key --file "$VALIDATOR_KEY_FILE"
else
    echo ""
    echo "Step 3: Validator key already exists at $VALIDATOR_KEY_FILE"
    ./target/release/demiurge-node show-key --file "$VALIDATOR_KEY_FILE"
fi

# Step 4: Copy genesis file
echo ""
echo "Step 4: Copying genesis configuration..."
cp "$GENESIS_FILE" "$CHAIN_DATA_DIR/genesis.json"
echo "Genesis file copied to: $CHAIN_DATA_DIR/genesis.json"

# Step 5: Install systemd service
echo ""
echo "Step 5: Installing systemd service..."
sudo cp "$PROJECT_DIR/config/production/demiurge-node.service" /etc/systemd/system/
sudo systemctl daemon-reload

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Validator key: $VALIDATOR_KEY_FILE"
echo "Genesis file:  $CHAIN_DATA_DIR/genesis.json"
echo "Data dir:      $CHAIN_DATA_DIR"
echo ""
echo "To start the node:"
echo "  sudo systemctl start demiurge-node"
echo "  sudo systemctl enable demiurge-node"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u demiurge-node -f"
echo ""
echo "To check status:"
echo "  sudo systemctl status demiurge-node"
echo ""

# Optional: Show public key for genesis configuration
echo "=========================================="
echo "  IMPORTANT: Validator Registration"
echo "=========================================="
echo ""
echo "Your validator address needs to be added to the genesis"
echo "configuration if this is a new validator."
echo ""
echo "Update genesis.json validators array with your address."
echo ""
