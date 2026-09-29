#!/bin/bash
# Deploy Demiurge Multi-Node Testnet - Distributed across multiple servers
# SSH-based deployment with cross-server P2P mesh
#
# Usage:
#   ./deploy-distributed.sh hosts.json
#   ./deploy-distributed.sh --config hosts.json --dry-run
#
# hosts.json format:
#   {
#     "servers": [
#       { "host": "51.210.209.112", "user": "root", "node": "alpha", "rpc_port": 9944, "p2p_port": 30333 },
#       { "host": "server2.example.com", "user": "ubuntu", "node": "beta", "rpc_port": 9944, "p2p_port": 30333 }
#     ]
#   }

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTNET_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TESTNET_DIR")"

DRY_RUN=false
CONFIG_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      if [[ -z "$CONFIG_FILE" && -f "$1" ]]; then
        CONFIG_FILE="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$CONFIG_FILE" || ! -f "$CONFIG_FILE" ]]; then
  echo "Usage: $0 [--config hosts.json] [--dry-run]"
  echo ""
  echo "Creates hosts.json from template:"
  echo '  {"servers":[{"host":"51.210.209.112","user":"root","node":"alpha","rpc_port":9944,"p2p_port":30333}]}'
  exit 1
fi

echo "🚀 Demiurge Distributed Testnet Deployment"
echo "=========================================="
echo "Config: $CONFIG_FILE"
[[ "$DRY_RUN" == "true" ]] && echo "DRY RUN - no changes will be made"
echo ""

# Parse servers from JSON (requires jq)
if ! command -v jq &> /dev/null; then
  echo "❌ jq is required. Install with: apt install jq / brew install jq"
  exit 1
fi

SERVERS=$(jq -c '.servers[]' "$CONFIG_FILE")
BOOTNODE_PEER=""

# Phase 1: Build and prepare
echo "📦 Phase 1: Building node binary..."
cd "$PROJECT_ROOT"
if [[ -f "Cargo.toml" ]]; then
  cargo build --release --features=runtime 2>/dev/null || true
  NODE_BINARY="target/release/demiurge-node-legacy"
  if [[ ! -f "$NODE_BINARY" ]]; then
    echo "⚠️  Node binary not found. Ensure cargo build --release succeeds."
  fi
fi

# Phase 2: Deploy to each server
SERVER_INDEX=0
while IFS= read -r server; do
  HOST=$(echo "$server" | jq -r '.host')
  USER=$(echo "$server" | jq -r '.user // "root"')
  NODE_NAME=$(echo "$server" | jq -r '.node // "node"')
  RPC_PORT=$(echo "$server" | jq -r '.rpc_port // 9944')
  P2P_PORT=$(echo "$server" | jq -r '.p2p_port // 30333')

  echo ""
  echo "📤 Deploying to $HOST ($NODE_NAME)..."

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would SSH to $USER@$HOST"
    echo "  [DRY RUN] Would create /opt/demiurge, copy binary, install systemd"
    ((SERVER_INDEX++)) || true
    continue
  fi

  # Create remote directories
  ssh "$USER@$HOST" "mkdir -p /opt/demiurge /etc/demiurge /var/lib/demiurge/validator-$NODE_NAME /var/log/demiurge"

  # Copy binary
  if [[ -f "$NODE_BINARY" ]]; then
    scp "$NODE_BINARY" "$USER@$HOST:/opt/demiurge/demiurge-node-legacy"
  fi

  # Copy config
  scp "$TESTNET_DIR/configs/validator-$NODE_NAME.toml" "$USER@$HOST:/etc/demiurge/" 2>/dev/null || \
    scp "$TESTNET_DIR/configs/node1.toml" "$USER@$HOST:/etc/demiurge/validator-$NODE_NAME.toml" 2>/dev/null || true

  # Generate key if first node
  if [[ $SERVER_INDEX -eq 0 ]]; then
    ssh "$USER@$HOST" "cd /opt/demiurge && ./demiurge-node-legacy key generate --output /tmp/validator-key.json 2>/dev/null || true"
    echo "  ⚠️  Generate validator key on $HOST: cd /opt/demiurge && ./demiurge-node-legacy key generate --output /var/lib/demiurge/validator-$NODE_NAME/key.json"
  fi

  # Configure firewall
  ssh "$USER@$HOST" "ufw allow $P2P_PORT/tcp comment 'Demiurge $NODE_NAME P2P' 2>/dev/null; ufw allow from 127.0.0.1 to any port $RPC_PORT proto tcp 2>/dev/null; ufw reload 2>/dev/null || true"

  # Create systemd service
  ssh "$USER@$HOST" "cat > /etc/systemd/system/demiurge-validator-$NODE_NAME.service << 'SVCEOF'
[Unit]
Description=Demiurge Validator $NODE_NAME
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/demiurge/demiurge-node-legacy --data-dir /var/lib/demiurge/validator-$NODE_NAME --rpc-addr 0.0.0.0:$RPC_PORT --p2p-addr 0.0.0.0:$P2P_PORT
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF
systemctl daemon-reload"
  echo "  ✓ Service installed"

  ((SERVER_INDEX++)) || true
done <<< "$SERVERS"

echo ""
echo "✅ Distributed deployment complete"

if [[ "$DRY_RUN" == "false" ]]; then
  echo ""
  echo "📝 Next steps:"
  echo "  1. Generate validator keys on each server"
  echo "  2. Update genesis with validator addresses"
  echo "  3. Configure BOOTNODES=/ip4/<first-server>/tcp/30333/p2p/<peer-id>"
  echo "  4. Start: systemctl start demiurge-validator-{alpha,beta,...}"
  echo "  5. Verify: curl -X POST http://<host>:9944 -d '{\"jsonrpc\":\"2.0\",\"method\":\"system_health\",\"params\":[],\"id\":1}'"
  echo ""
  echo "  P2P mesh: Connect each node to bootstrap peer from first server"
fi
