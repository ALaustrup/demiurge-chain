#!/bin/bash
# Comprehensive Monad Server Setup for Blockchain Operations
# Server: 51.210.209.112 (Pleroma)
# OS: Ubuntu 24.04 LTS

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MONAD SERVER SETUP - BLOCKCHAIN OPERATIONS          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check disk layout and set up /data
echo -e "${BLUE}[1/8] Checking disk layout...${NC}"
lsblk
echo ""

# Check if /data exists
if [ -d "/data" ] && mountpoint -q /data 2>/dev/null; then
    echo -e "${GREEN}✓${NC} /data is already mounted"
    df -h /data
else
    echo -e "${YELLOW}⚠${NC}  /data not mounted. Setting up RAID 0..."
    
    # Check available disks
    NVME_DISKS=$(lsblk -d -n -o NAME | grep nvme || echo "")
    if [ -z "$NVME_DISKS" ]; then
        echo -e "${RED}✗${NC} No NVMe disks found. Using single disk setup."
        # Create /data on root partition (temporary)
        sudo mkdir -p /data
        sudo chown $USER:$USER /data
    else
        echo "Found NVMe disks: $NVME_DISKS"
        # For now, create /data on available space
        # Full RAID 0 setup can be done manually if needed
        sudo mkdir -p /data
        sudo chown $USER:$USER /data
        echo -e "${YELLOW}⚠${NC}  /data created. RAID 0 setup recommended for production."
    fi
fi

# Step 2: Update system
echo ""
echo -e "${BLUE}[2/8] Updating system packages...${NC}"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Step 3: Install essential tools
echo ""
echo -e "${BLUE}[3/8] Installing essential tools...${NC}"
sudo apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    htop \
    tmux \
    vim \
    net-tools \
    iproute2

# Step 4: Install Rust toolchain
echo ""
echo -e "${BLUE}[4/8] Installing Rust toolchain...${NC}"
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo -e "${GREEN}✓${NC} Rust already installed: $RUST_VERSION"
else
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
    source $HOME/.cargo/env
    rustup target add wasm32-unknown-unknown
    echo -e "${GREEN}✓${NC} Rust installed"
fi

# Step 5: Clone repository
echo ""
echo -e "${BLUE}[5/8] Setting up repository...${NC}"
REPO_DIR="/data/Demiurge-Blockchain"
if [ -d "$REPO_DIR/.git" ]; then
    echo -e "${GREEN}✓${NC} Repository already exists at $REPO_DIR"
    cd $REPO_DIR
    git fetch origin
    git pull origin main || git pull origin master || true
else
    echo "Cloning repository to $REPO_DIR..."
    sudo mkdir -p /data
    sudo chown $USER:$USER /data
    cd /data
    git clone https://github.com/ALaustrup/demiurge-cloud.git || {
        echo -e "${YELLOW}⚠${NC}  Clone failed, creating directory structure..."
        mkdir -p $REPO_DIR
    }
fi

# Step 6: System optimizations
echo ""
echo -e "${BLUE}[6/8] Applying system optimizations...${NC}"

# Kernel parameters
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# DEMIURGE-BLOCKCHAIN Kernel Tuning
# Increase max file descriptors
fs.file-max = 2097152

# Increase inotify watches for file monitoring
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 1024

# Memory optimizations for large builds
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50

# Network tuning for Substrate P2P
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
EOF

sudo sysctl -p > /dev/null
echo -e "${GREEN}✓${NC} Kernel optimizations applied"

# Step 7: Set up Docker environment
echo ""
echo -e "${BLUE}[7/8] Configuring Docker environment...${NC}"

# Create Docker network if it doesn't exist
docker network inspect demiurge-network > /dev/null 2>&1 || {
    docker network create demiurge-network
    echo -e "${GREEN}✓${NC} Created Docker network: demiurge-network"
}

# Ensure user is in docker group
if ! groups | grep -q docker; then
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠${NC}  Added user to docker group. Logout/login required."
fi

# Step 8: Set hostname
echo ""
echo -e "${BLUE}[8/8] Configuring hostname...${NC}"
if [ "$(hostname)" != "pleroma" ]; then
    sudo hostnamectl set-hostname pleroma
    echo -e "${GREEN}✓${NC} Hostname set to: pleroma"
else
    echo -e "${GREEN}✓${NC} Hostname already set to: pleroma"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   SETUP COMPLETE                                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} System updated"
echo -e "${GREEN}✓${NC} Essential tools installed"
echo -e "${GREEN}✓${NC} Rust toolchain ready"
echo -e "${GREEN}✓${NC} Repository configured"
echo -e "${GREEN}✓${NC} System optimizations applied"
echo -e "${GREEN}✓${NC} Docker configured"
echo ""
echo "Next steps:"
echo "  1. cd /data/Demiurge-Blockchain"
echo "  2. Review docker-compose.production.yml"
echo "  3. Set up environment variables"
echo "  4. Start services: docker compose -f docker-compose.production.yml up -d"
echo ""
