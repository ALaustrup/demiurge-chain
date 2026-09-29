#!/bin/bash
# Demiurge Testnet Launcher - The Syzygy Protocol
# Starts a 3-node testnet for testing LibP2P networking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NODE_BINARY="$PROJECT_ROOT/framework/target/release/demiurge-node"
KEY_DIR="/data/testnet/keys"
DATA_DIR="/data/testnet"
LOG_DIR="/data/testnet/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DEMIURGE TESTNET - THE SYZYGY PROTOCOL               ║"
echo "║                    The Heart Awakens                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node binary exists
if [ ! -f "$NODE_BINARY" ]; then
    echo -e "${RED}Error: Node binary not found at $NODE_BINARY${NC}"
    echo "Please build with: cargo build --release -p demiurge-node"
    exit 1
fi

# Create directories
mkdir -p "$LOG_DIR" "$KEY_DIR" "$DATA_DIR/node1" "$DATA_DIR/node2" "$DATA_DIR/node3"

# Generate validator keys if they don't exist
echo -e "${CYAN}Checking validator keys...${NC}"
for i in 1 2 3; do
    if [ ! -f "$KEY_DIR/validator$i.json" ]; then
        echo -e "  ${YELLOW}Generating key for validator $i...${NC}"
        $NODE_BINARY generate-key --output "$KEY_DIR/validator$i.json"
    else
        echo -e "  ${GREEN}✓ Validator $i key exists${NC}"
    fi
done

# Stop any existing nodes
echo -e "${CYAN}Stopping any existing nodes...${NC}"
pkill -f "demiurge-node" 2>/dev/null || true
sleep 2

# Common settings
BLOCK_TIME=6000

# Start Node 1 (Boot Node)
echo -e "${GREEN}Starting Node 1 (archon-alpha) - Boot Node...${NC}"
$NODE_BINARY \
    --data-dir "$DATA_DIR/node1" \
    --p2p-addr "0.0.0.0:30333" \
    --rpc-addr "127.0.0.1:9933" \
    --block-time $BLOCK_TIME \
    --validator-key "$KEY_DIR/validator1.json" \
    > "$LOG_DIR/node1.log" 2>&1 &
NODE1_PID=$!
echo "  PID: $NODE1_PID"
sleep 3

# Start Node 2 (connects to Node 1)
echo -e "${GREEN}Starting Node 2 (archon-beta)...${NC}"
$NODE_BINARY \
    --data-dir "$DATA_DIR/node2" \
    --p2p-addr "0.0.0.0:30334" \
    --rpc-addr "127.0.0.1:9934" \
    --block-time $BLOCK_TIME \
    --validator-key "$KEY_DIR/validator2.json" \
    > "$LOG_DIR/node2.log" 2>&1 &
NODE2_PID=$!
echo "  PID: $NODE2_PID"
sleep 2

# Start Node 3 (connects to Node 1 and 2)
echo -e "${GREEN}Starting Node 3 (archon-gamma)...${NC}"
$NODE_BINARY \
    --data-dir "$DATA_DIR/node3" \
    --p2p-addr "0.0.0.0:30335" \
    --rpc-addr "127.0.0.1:9935" \
    --block-time $BLOCK_TIME \
    --validator-key "$KEY_DIR/validator3.json" \
    > "$LOG_DIR/node3.log" 2>&1 &
NODE3_PID=$!
echo "  PID: $NODE3_PID"
sleep 2

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    TESTNET STATUS                              ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
printf "${CYAN}║  Node 1 (archon-alpha):  P2P 30333  RPC 9933  PID: %-10s  ║${NC}\n" "$NODE1_PID"
printf "${CYAN}║  Node 2 (archon-beta):   P2P 30334  RPC 9934  PID: %-10s  ║${NC}\n" "$NODE2_PID"
printf "${CYAN}║  Node 3 (archon-gamma):  P2P 30335  RPC 9935  PID: %-10s  ║${NC}\n" "$NODE3_PID"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Logs: /data/testnet/logs                                      ║${NC}"
echo -e "${CYAN}║  Keys: /data/testnet/keys                                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait a moment for nodes to initialize
sleep 5

# Check if nodes are running
echo -e "${CYAN}Checking node status...${NC}"
if ps -p $NODE1_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 1 is running${NC}"
else
    echo -e "  ${RED}✗ Node 1 failed to start${NC}"
    echo "  Last 10 lines of log:"
    tail -10 "$LOG_DIR/node1.log" 2>/dev/null || echo "  (no log available)"
fi

if ps -p $NODE2_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 2 is running${NC}"
else
    echo -e "  ${RED}✗ Node 2 failed to start${NC}"
    echo "  Last 10 lines of log:"
    tail -10 "$LOG_DIR/node2.log" 2>/dev/null || echo "  (no log available)"
fi

if ps -p $NODE3_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 3 is running${NC}"
else
    echo -e "  ${RED}✗ Node 3 failed to start${NC}"
    echo "  Last 10 lines of log:"
    tail -10 "$LOG_DIR/node3.log" 2>/dev/null || echo "  (no log available)"
fi

echo ""
echo -e "${GREEN}The Heart is beating. The Nervous System is alive.${NC}"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/node1.log"
echo "  tail -f $LOG_DIR/node2.log"
echo "  tail -f $LOG_DIR/node3.log"
echo ""
echo "To stop the testnet:"
echo "  pkill -f demiurge-node"
