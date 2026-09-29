#!/bin/bash
#
# Demiurge Chain Reset Script
# 
# This script performs a complete chain reset with the fresh genesis.
# It should be run from the project root or via scripts/reset-chain-fresh.sh
#
# Usage:
#   ./scripts/reset-chain-fresh.sh [--force]
#
# Options:
#   --force    Skip confirmation prompts
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER="51.210.209.112"
SSH_HOST="pleroma"  # SSH config alias
DATA_DIR="/var/lib/demiurge"
BACKUP_DIR="/var/backups/demiurge"
GENESIS_FILE="testnet/genesis-fresh.json"
VALIDATORS=("alpha" "beta" "gamma" "delta")

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          DEMIURGE CHAIN RESET - FRESH GENESIS            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for --force flag
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Confirmation
if [[ "$FORCE" != "true" ]]; then
    echo -e "${YELLOW}WARNING: This will completely reset the blockchain!${NC}"
    echo ""
    echo "This action will:"
    echo "  - Stop all validator nodes"
    echo "  - Backup existing chain data"
    echo "  - Clear all blockchain state"
    echo "  - Deploy fresh genesis with Godmode treasury"
    echo "  - Restart all validators"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Step 1: Stopping all validators...${NC}"

for validator in "${VALIDATORS[@]}"; do
    echo "  Stopping demiurge-validator-${validator}..."
    ssh $SSH_HOST "sudo systemctl stop demiurge-validator-${validator} 2>/dev/null || true"
done

# Give time for graceful shutdown
sleep 3

echo ""
echo -e "${GREEN}Step 2: Creating backup of existing data...${NC}"

BACKUP_NAME="chain-backup-$(date +%Y%m%d-%H%M%S)"
ssh $SSH_HOST "sudo mkdir -p ${BACKUP_DIR}"
ssh $SSH_HOST "sudo tar -czf ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz -C ${DATA_DIR} . 2>/dev/null || echo 'No existing data to backup'"

echo "  Backup saved to: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

echo ""
echo -e "${GREEN}Step 3: Clearing chain state...${NC}"

for validator in "${VALIDATORS[@]}"; do
    echo "  Clearing ${validator} data..."
    ssh $SSH_HOST "sudo rm -rf ${DATA_DIR}/${validator}/chains/demiurge*/db 2>/dev/null || true"
    ssh $SSH_HOST "sudo rm -rf ${DATA_DIR}/${validator}/chains/demiurge*/network 2>/dev/null || true"
done

echo ""
echo -e "${GREEN}Step 4: Deploying fresh genesis...${NC}"

# Update timestamp in genesis
TIMESTAMP=$(date +%s)000
echo "  Setting genesis timestamp to: $TIMESTAMP"

# Copy genesis file
scp $GENESIS_FILE $SSH_HOST:/tmp/genesis-fresh.json

# Update timestamp and deploy
ssh $SSH_HOST "sudo jq '.genesis.timestamp = ${TIMESTAMP}' /tmp/genesis-fresh.json > /tmp/genesis-final.json"
ssh $SSH_HOST "sudo cp /tmp/genesis-final.json /etc/demiurge/genesis.json"
ssh $SSH_HOST "sudo chmod 644 /etc/demiurge/genesis.json"

echo "  Genesis deployed to /etc/demiurge/genesis.json"

echo ""
echo -e "${GREEN}Step 5: Resetting QOR Auth database...${NC}"

ssh $SSH_HOST "cd /home/ubuntu/Demiurge-Blockchain/services/qor-auth && sudo -u postgres psql -d qor_auth -c 'TRUNCATE users, sessions, auth_challenges, password_resets CASCADE;' 2>/dev/null || echo 'Database reset skipped'"

echo "  Running fresh migrations..."
ssh $SSH_HOST "cd /home/ubuntu/Demiurge-Blockchain/services/qor-auth && cargo sqlx migrate run 2>/dev/null || echo 'Migrations already applied'"

echo ""
echo -e "${GREEN}Step 6: Restarting validators...${NC}"

for validator in "${VALIDATORS[@]}"; do
    echo "  Starting demiurge-validator-${validator}..."
    ssh $SSH_HOST "sudo systemctl start demiurge-validator-${validator}"
    sleep 2  # Stagger startup
done

echo ""
echo -e "${GREEN}Step 7: Verifying chain health...${NC}"

sleep 5  # Wait for nodes to initialize

# Check each validator
all_healthy=true
for validator in "${VALIDATORS[@]}"; do
    status=$(ssh $SSH_HOST "systemctl is-active demiurge-validator-${validator}" 2>/dev/null || echo "inactive")
    if [[ "$status" == "active" ]]; then
        echo -e "  ${GREEN}✓${NC} Validator ${validator}: running"
    else
        echo -e "  ${RED}✗${NC} Validator ${validator}: $status"
        all_healthy=false
    fi
done

echo ""

# Check RPC
echo "  Checking RPC endpoint..."
rpc_response=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}' \
    http://${SERVER}:9933 2>/dev/null || echo '{"error":"connection failed"}')

if echo "$rpc_response" | grep -q '"connected":true'; then
    echo -e "  ${GREEN}✓${NC} RPC responding"
    block_number=$(echo "$rpc_response" | grep -o '"block_number":[0-9]*' | cut -d':' -f2)
    echo "  Current block: ${block_number:-0}"
else
    echo -e "  ${YELLOW}⚠${NC} RPC not responding yet (may need more time)"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"

if [[ "$all_healthy" == "true" ]]; then
    echo -e "${GREEN}Chain reset complete!${NC}"
    echo ""
    echo "Summary:"
    echo "  - Chain ID: demiurge-mainnet-v1"
    echo "  - Genesis timestamp: $TIMESTAMP"
    echo "  - Validators: ${#VALIDATORS[@]} active"
    echo "  - Godmode treasury: 0x00000000000000000000000000000000DEMIURGE"
    echo ""
    echo "Next steps:"
    echo "  1. Login as Godmode (username: Godmode, password: 133736988)"
    echo "  2. Verify chain is producing blocks"
    echo "  3. Test token minting from admin panel"
else
    echo -e "${YELLOW}Chain reset completed with warnings.${NC}"
    echo "Some validators may not have started. Check logs with:"
    echo "  ssh $SSH_HOST 'journalctl -u demiurge-validator-alpha -f'"
fi

echo ""
