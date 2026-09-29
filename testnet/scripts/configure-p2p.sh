#!/bin/bash
# Configure P2P Networking for Multi-Node Testnet
# This script sets up bootstrap peers for validator mesh networking

set -e

echo "🌐 Configuring P2P Mesh Network"
echo "================================="
echo ""

# Step 1: Start Alpha (bootstrap node) if not running
echo "1. Ensuring Alpha validator is running..."
if ! systemctl is-active --quiet demiurge-validator-alpha; then
    echo "   Starting Alpha..."
    sudo systemctl start demiurge-validator-alpha
    sleep 5
fi

# Step 2: Get Alpha's Peer ID from logs
echo ""
echo "2. Extracting Alpha's Peer ID..."
ALPHA_PEER_ID=$(journalctl -u demiurge-validator-alpha -n 100 --no-pager | grep "Local peer ID:" | tail -1 | awk '{print $NF}')

if [ -z "$ALPHA_PEER_ID" ]; then
    echo "   ⚠️ Could not find Alpha's Peer ID in logs"
    echo "   Checking for alternative log format..."
    ALPHA_PEER_ID=$(journalctl -u demiurge-validator-alpha -n 100 --no-pager | grep "Local Peer ID:" | tail -1 | awk '{print $NF}')
fi

if [ -z "$ALPHA_PEER_ID" ]; then
    echo "   ❌ Failed to extract Peer ID"
    echo "   Make sure Alpha validator is running with P2P enabled"
    exit 1
fi

echo "   ✅ Alpha Peer ID: $ALPHA_PEER_ID"

# Step 3: Build bootstrap multiaddr for Alpha
ALPHA_BOOTSTRAP="/ip4/127.0.0.1/tcp/30337/p2p/$ALPHA_PEER_ID"
echo ""
echo "3. Alpha bootstrap address:"
echo "   $ALPHA_BOOTSTRAP"

# Step 4: Update systemd services with bootstrap peers
echo ""
echo "4. Updating systemd services with bootstrap configuration..."

# Update Beta
echo "   Updating Beta..."
sudo sed -i "s|--validator-key /var/lib/demiurge/validator-beta/validator.key|--validator-key /var/lib/demiurge/validator-beta/validator.key --bootstrap-peers \"$ALPHA_BOOTSTRAP\"|" \
    /etc/systemd/system/demiurge-validator-beta.service

# Update Gamma
echo "   Updating Gamma..."
sudo sed -i "s|--validator-key /var/lib/demiurge/validator-gamma/validator.key|--validator-key /var/lib/demiurge/validator-gamma/validator.key --bootstrap-peers \"$ALPHA_BOOTSTRAP\"|" \
    /etc/systemd/system/demiurge-validator-gamma.service

# Update Delta
echo "   Updating Delta..."
sudo sed -i "s|--validator-key /var/lib/demiurge/validator-delta/validator.key|--validator-key /var/lib/demiurge/validator-delta/validator.key --bootstrap-peers \"$ALPHA_BOOTSTRAP\"|" \
    /etc/systemd/system/demiurge-validator-delta.service

echo "   ✅ Services updated"

# Step 5: Reload systemd
echo ""
echo "5. Reloading systemd..."
sudo systemctl daemon-reload
echo "   ✅ Systemd reloaded"

# Step 6: Restart validators to apply P2P configuration
echo ""
echo "6. Restarting validators with P2P mesh..."
echo "   Keeping Alpha running as bootstrap..."
echo "   Restarting Beta..."
sudo systemctl restart demiurge-validator-beta
sleep 2

echo "   Restarting Gamma..."
sudo systemctl restart demiurge-validator-gamma
sleep 2

echo "   Restarting Delta..."
sudo systemctl restart demiurge-validator-delta
sleep 3

echo ""
echo "✅ P2P mesh configuration complete!"
echo ""
echo "📊 Verify connectivity:"
echo "   Check logs: journalctl -u demiurge-validator-beta -f | grep -E 'Peer|Connected'"
echo "   Monitor: cd ~/Demiurge-Blockchain/testnet && ./scripts/monitor.sh"
echo ""
echo "Expected: Each validator should connect to Alpha and discover peers"
