#!/bin/bash
# Deploy Demiurge-Cloud Testnet to Server
# Server: 51.210.209.112

set -e

SERVER="51.210.209.112"
SERVER_USER="root"
REPO_DIR="/opt/demiurge-blockchain"
SERVICE_NAME="demiurge-node"

echo "🔥 Deploying Demiurge-Cloud Testnet"
echo "The flame burns eternal. The code serves the will."

# Step 1: Remove old repo if exists
echo "📦 Removing old repository..."
ssh ${SERVER_USER}@${SERVER} "rm -rf ${REPO_DIR} || true"

# Step 2: Clone fresh repo
echo "📥 Cloning fresh repository..."
ssh ${SERVER_USER}@${SERVER} "git clone https://github.com/ALaustrup/demiurge-cloud.git ${REPO_DIR} || true"

# Step 3: Checkout main branch
echo "🔀 Checking out main branch..."
ssh ${SERVER_USER}@${SERVER} "cd ${REPO_DIR} && git checkout main && git pull"

# Step 4: Install Rust if needed
echo "🦀 Checking Rust installation..."
ssh ${SERVER_USER}@${SERVER} "command -v rustc || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"

# Step 5: Build framework
echo "🔨 Building framework..."
ssh ${SERVER_USER}@${SERVER} "cd ${REPO_DIR}/framework && source ~/.cargo/env && cargo build --release"

# Step 6: Create systemd service
echo "⚙️  Creating systemd service..."
ssh ${SERVER_USER}@${SERVER} "cat > /etc/systemd/system/${SERVICE_NAME}.service << 'EOF'
[Unit]
Description=Demiurge-Cloud Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REPO_DIR}/framework
ExecStart=${REPO_DIR}/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
"

# Step 7: Enable and start service
echo "🚀 Starting service..."
ssh ${SERVER_USER}@${SERVER} "systemctl daemon-reload && systemctl enable ${SERVICE_NAME} && systemctl restart ${SERVICE_NAME}"

# Step 8: Check status
echo "✅ Checking service status..."
ssh ${SERVER_USER}@${SERVER} "systemctl status ${SERVICE_NAME} --no-pager"

echo ""
echo "🎉 Deployment complete!"
echo "RPC: ws://${SERVER}:9944"
echo "P2P: /ip4/${SERVER}/tcp/30333"
echo ""
echo "Check logs: ssh ${SERVER_USER}@${SERVER} 'journalctl -u ${SERVICE_NAME} -f'"
