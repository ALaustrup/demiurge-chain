#!/bin/bash
# Demiurge Testnet Monitoring Script
# Monitors all 4 validators and displays real-time status

REFRESH_INTERVAL=5
RPC_PORTS=(9944 9945 9946 9947)
VALIDATOR_NAMES=("Alpha" "Beta" "Gamma" "Delta")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to make RPC call
rpc_call() {
    local port=$1
    local method=$2
    local params=$3
    
    curl -s -X POST "http://localhost:$port" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}" \
        | jq -r '.result // "N/A"' 2>/dev/null || echo "N/A"
}

# Function to check service status
check_service() {
    local service=$1
    systemctl is-active --quiet "$service" && echo "running" || echo "stopped"
}

# Function to get service uptime
get_uptime() {
    local service=$1
    systemctl show "$service" --property=ActiveEnterTimestamp --value 2>/dev/null | \
        xargs -I {} date -d "{}" +%s 2>/dev/null || echo "0"
}

# Function to display validator status
display_validator() {
    local index=$1
    local name=${VALIDATOR_NAMES[$index]}
    local port=${RPC_PORTS[$index]}
    local service="demiurge-validator-${name,,}"
    
    local status=$(check_service "$service")
    local status_color=$RED
    [ "$status" == "running" ] && status_color=$GREEN
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}Validator $name${NC} (Port: $port)"
    echo -e "Status: ${status_color}${status}${NC}"
    
    if [ "$status" == "running" ]; then
        # Get block number
        local block=$(rpc_call "$port" "chain_getBlockNumber" "[]")
        echo -e "Block:  ${GREEN}$block${NC}"
        
        # Get peer count
        local health=$(rpc_call "$port" "system_health" "[]")
        local peers=$(echo "$health" | jq -r '.peers // "0"' 2>/dev/null)
        echo -e "Peers:  ${BLUE}$peers${NC}"
        
        # Get node info
        local node_info=$(rpc_call "$port" "system_nodeInfo" "[]")
        local version=$(echo "$node_info" | jq -r '.version // "N/A"' 2>/dev/null)
        echo -e "Version: $version"
        
        # Service uptime
        local start_time=$(get_uptime "$service")
        if [ "$start_time" != "0" ]; then
            local current_time=$(date +%s)
            local uptime=$((current_time - start_time))
            local hours=$((uptime / 3600))
            local minutes=$(((uptime % 3600) / 60))
            echo -e "Uptime: ${YELLOW}${hours}h ${minutes}m${NC}"
        fi
    else
        echo -e "${RED}⚠️  Service is not running${NC}"
    fi
}

# Function to display network stats
display_network_stats() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}Network Statistics${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Get stats from Alpha (primary node)
    local block=$(rpc_call "9944" "chain_getBlockNumber" "[]")
    local validators=$(rpc_call "9944" "staking_getValidators" "[true]" | jq -r 'length // 0' 2>/dev/null)
    
    echo -e "Current Block:    ${GREEN}$block${NC}"
    echo -e "Active Validators: ${GREEN}$validators${NC}"
    
    # Count running validators
    local running=0
    for service in demiurge-validator-{alpha,beta,gamma,delta}; do
        if systemctl is-active --quiet "$service"; then
            ((running++))
        fi
    done
    echo -e "Running Nodes:    ${GREEN}$running${NC}/4"
    
    # Check if we have consensus
    if [ "$running" -ge 3 ]; then
        echo -e "Consensus:        ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Consensus:        ${RED}✗ Insufficient nodes${NC}"
    fi
}

# Main monitoring loop
echo -e "${PURPLE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   Demiurge Testnet Monitor               ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Press Ctrl+C to exit"
echo ""

while true; do
    clear
    echo -e "${PURPLE}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║   Demiurge Testnet Monitor               ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    
    # Display each validator
    for i in {0..3}; do
        display_validator $i
        echo ""
    done
    
    # Display network stats
    display_network_stats
    
    echo ""
    echo -e "${CYAN}Last update: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "Refreshing in ${REFRESH_INTERVAL}s... (Ctrl+C to exit)"
    
    sleep $REFRESH_INTERVAL
done
