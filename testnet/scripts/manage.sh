#!/bin/bash
# Demiurge Testnet Management Script
# Manage all validators with simple commands

set -e

VALIDATORS=("alpha" "beta" "gamma" "delta")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo "Demiurge Testnet Management"
    echo ""
    echo "Usage: $0 <command> [validator]"
    echo ""
    echo "Commands:"
    echo "  start    [validator]  - Start validator(s)"
    echo "  stop     [validator]  - Stop validator(s)"
    echo "  restart  [validator]  - Restart validator(s)"
    echo "  status   [validator]  - Show status"
    echo "  logs     [validator]  - Show logs (tail -f)"
    echo "  clean    [validator]  - Clean data directory"
    echo "  backup   [validator]  - Backup data directory"
    echo ""
    echo "Validators: alpha, beta, gamma, delta, or 'all'"
    echo ""
    echo "Examples:"
    echo "  $0 start all          - Start all validators"
    echo "  $0 stop beta          - Stop beta validator"
    echo "  $0 logs alpha         - Show alpha logs"
    echo "  $0 status             - Show status of all"
    exit 1
}

# Get validator list based on argument
get_validators() {
    local target=$1
    if [ -z "$target" ] || [ "$target" == "all" ]; then
        echo "${VALIDATORS[@]}"
    elif [[ " ${VALIDATORS[@]} " =~ " ${target} " ]]; then
        echo "$target"
    else
        echo -e "${RED}Invalid validator: $target${NC}" >&2
        echo "Valid options: alpha, beta, gamma, delta, all" >&2
        exit 1
    fi
}

# Start validators
cmd_start() {
    local validators=($(get_validators "$1"))
    for v in "${validators[@]}"; do
        echo -e "${GREEN}Starting validator-$v...${NC}"
        sudo systemctl start "demiurge-validator-$v"
        sleep 1
    done
    echo -e "${GREEN}✓ Done${NC}"
}

# Stop validators
cmd_stop() {
    local validators=($(get_validators "$1"))
    for v in "${validators[@]}"; do
        echo -e "${YELLOW}Stopping validator-$v...${NC}"
        sudo systemctl stop "demiurge-validator-$v"
    done
    echo -e "${GREEN}✓ Done${NC}"
}

# Restart validators
cmd_restart() {
    local validators=($(get_validators "$1"))
    for v in "${validators[@]}"; do
        echo -e "${YELLOW}Restarting validator-$v...${NC}"
        sudo systemctl restart "demiurge-validator-$v"
        sleep 1
    done
    echo -e "${GREEN}✓ Done${NC}"
}

# Show status
cmd_status() {
    local validators=($(get_validators "$1"))
    for v in "${validators[@]}"; do
        echo -e "\n${GREEN}Validator $v:${NC}"
        sudo systemctl status "demiurge-validator-$v" --no-pager -l | head -15
    done
}

# Show logs
cmd_logs() {
    local validator=$(get_validators "$1")
    if [ $(echo "$validator" | wc -w) -gt 1 ]; then
        echo -e "${RED}Please specify a single validator for logs${NC}"
        exit 1
    fi
    echo -e "${GREEN}Showing logs for validator-$validator (Ctrl+C to exit):${NC}"
    sudo journalctl -u "demiurge-validator-$validator" -f
}

# Clean data directory
cmd_clean() {
    local validators=($(get_validators "$1"))
    echo -e "${YELLOW}⚠️  This will delete all blockchain data!${NC}"
    read -p "Are you sure? (type 'yes' to confirm): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        exit 0
    fi
    
    for v in "${validators[@]}"; do
        echo -e "${YELLOW}Stopping and cleaning validator-$v...${NC}"
        sudo systemctl stop "demiurge-validator-$v" || true
        sudo rm -rf "/var/lib/demiurge/validator-$v"/*
        sudo mkdir -p "/var/lib/demiurge/validator-$v"
        sudo chown demiurge:demiurge "/var/lib/demiurge/validator-$v"
    done
    echo -e "${GREEN}✓ Cleaned. Restart validators to resync.${NC}"
}

# Backup data directory
cmd_backup() {
    local validators=($(get_validators "$1"))
    local backup_dir="/var/backups/demiurge/$(date +%Y%m%d_%H%M%S)"
    
    echo -e "${GREEN}Creating backup in $backup_dir${NC}"
    sudo mkdir -p "$backup_dir"
    
    for v in "${validators[@]}"; do
        echo -e "Backing up validator-$v..."
        sudo tar -czf "$backup_dir/validator-$v.tar.gz" \
            -C "/var/lib/demiurge" "validator-$v" 2>/dev/null || true
    done
    
    echo -e "${GREEN}✓ Backup complete: $backup_dir${NC}"
    du -sh "$backup_dir"
}

# Main
if [ $# -lt 1 ]; then
    usage
fi

COMMAND=$1
TARGET=${2:-all}

case "$COMMAND" in
    start)
        cmd_start "$TARGET"
        ;;
    stop)
        cmd_stop "$TARGET"
        ;;
    restart)
        cmd_restart "$TARGET"
        ;;
    status)
        cmd_status "$TARGET"
        ;;
    logs)
        cmd_logs "$TARGET"
        ;;
    clean)
        cmd_clean "$TARGET"
        ;;
    backup)
        cmd_backup "$TARGET"
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        usage
        ;;
esac
