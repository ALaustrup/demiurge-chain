#!/bin/bash
# Deploy Demiurge Multi-Node Testnet
# This script sets up 4 validator nodes on the same server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTNET_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TESTNET_DIR")"

echo "🚀 Demiurge Multi-Node Testnet Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Step 1: Create demiurge user if not exists
echo "📝 Creating demiurge user..."
if ! id -u demiurge > /dev/null 2>&1; then
    useradd -r -s /bin/bash -d /opt/demiurge demiurge
    echo "✓ User created"
else
    echo "✓ User already exists"
fi

# Step 2: Create directories
echo "📁 Creating directories..."
mkdir -p /opt/demiurge
mkdir -p /etc/demiurge
mkdir -p /var/lib/demiurge/validator-alpha
mkdir -p /var/lib/demiurge/validator-beta
mkdir -p /var/lib/demiurge/validator-gamma
mkdir -p /var/lib/demiurge/validator-delta
mkdir -p /var/log/demiurge

chown -R demiurge:demiurge /opt/demiurge
chown -R demiurge:demiurge /var/lib/demiurge
chown -R demiurge:demiurge /var/log/demiurge

echo "✓ Directories created"

# Step 3: Build the node binary
echo "🔨 Building node binary..."
cd "$PROJECT_ROOT"
if [ -f "Cargo.toml" ]; then
    cargo build --release --features=runtime
    cp target/release/demiurge-node-legacy /opt/demiurge/demiurge-node-legacy || true
    echo "✓ Binary built and copied"
else
    echo "⚠️  Cargo.toml not found, skipping build"
    echo "   Make sure to manually copy the binary to /opt/demiurge/demiurge-node-legacy"
fi

# Step 4: Copy configuration files
echo "📋 Copying configuration files..."
cp "$TESTNET_DIR/genesis.json" /etc/demiurge/
cp "$TESTNET_DIR/configs/validator-alpha.toml" /etc/demiurge/
cp "$TESTNET_DIR/configs/validator-beta.toml" /etc/demiurge/
cp "$TESTNET_DIR/configs/validator-gamma.toml" /etc/demiurge/
cp "$TESTNET_DIR/configs/validator-delta.toml" /etc/demiurge/

chown demiurge:demiurge /etc/demiurge/*
echo "✓ Configuration files copied"

# Step 5: Install systemd services
echo "🔧 Installing systemd services..."
cp "$TESTNET_DIR/systemd/"*.service /etc/systemd/system/
systemctl daemon-reload
echo "✓ Services installed"

# Step 6: Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    # Allow P2P ports
    ufw allow 30333/tcp comment 'Demiurge Alpha P2P'
    ufw allow 30334/tcp comment 'Demiurge Beta P2P'
    ufw allow 30335/tcp comment 'Demiurge Gamma P2P'
    ufw allow 30336/tcp comment 'Demiurge Delta P2P'
    
    # Allow RPC ports (internal only for monitoring)
    ufw allow from 127.0.0.1 to any port 9944:9947 proto tcp
    
    # Reload firewall
    ufw reload || true
    echo "✓ Firewall configured"
else
    echo "⚠️  UFW not found, skipping firewall configuration"
fi

# Step 7: Generate validator keys
echo "🔑 Generating validator keys..."
echo "⚠️  This step requires manual key generation"
echo "   Run the following commands to generate keys for each validator:"
echo ""
echo "   /opt/demiurge/demiurge-node-legacy key generate --scheme sr25519 > /tmp/alpha-key.txt"
echo "   /opt/demiurge/demiurge-node-legacy key generate --scheme sr25519 > /tmp/beta-key.txt"
echo "   /opt/demiurge/demiurge-node-legacy key generate --scheme sr25519 > /tmp/gamma-key.txt"
echo "   /opt/demiurge/demiurge-node-legacy key generate --scheme sr25519 > /tmp/delta-key.txt"
echo ""
echo "   Then insert keys into keystores or update genesis.json"
echo ""

# Step 8: Enable and start services
echo "🎬 Starting services..."
read -p "Do you want to start the validators now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Validator Alpha (Bootstrap)..."
    systemctl enable demiurge-validator-alpha
    systemctl start demiurge-validator-alpha
    sleep 5
    
    echo "Starting Validator Beta..."
    systemctl enable demiurge-validator-beta
    systemctl start demiurge-validator-beta
    sleep 2
    
    echo "Starting Validator Gamma..."
    systemctl enable demiurge-validator-gamma
    systemctl start demiurge-validator-gamma
    sleep 2
    
    echo "Starting Validator Delta..."
    systemctl enable demiurge-validator-delta
    systemctl start demiurge-validator-delta
    
    echo "✓ All services started"
    echo ""
    echo "📊 Service Status:"
    systemctl status demiurge-validator-alpha --no-pager -l | head -10
    systemctl status demiurge-validator-beta --no-pager -l | head -10
    systemctl status demiurge-validator-gamma --no-pager -l | head -10
    systemctl status demiurge-validator-delta --no-pager -l | head -10
else
    echo "ℹ️  Services not started. Enable them manually with:"
    echo "   systemctl enable demiurge-validator-{alpha,beta,gamma,delta}"
    echo "   systemctl start demiurge-validator-{alpha,beta,gamma,delta}"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check logs: journalctl -u demiurge-validator-alpha -f"
echo "  2. Monitor testnet: $TESTNET_DIR/scripts/monitor.sh"
echo "  3. Check RPC: curl -X POST http://localhost:9944 -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"system_health\",\"params\":[],\"id\":1}'"
echo ""
