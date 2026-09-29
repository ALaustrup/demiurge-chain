#!/bin/bash
# Docker Installation Script for Monad (Pleroma)
# Server: 51.210.209.112
# OS: Ubuntu Server 25.10 "Questing Quokka"
#
# Usage:
#   ssh ubuntu@51.210.209.112 'bash -s' < scripts/install-docker-monad.sh
#   or on server: sudo bash scripts/install-docker-monad.sh

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   DOCKER INSTALLATION - MONAD (PLEROMA)               ║"
echo "║   Server: 51.210.209.112                              ║"
echo "║   OS: Ubuntu 25.10 (Wily Werewolf)                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠${NC}  This script requires sudo privileges."
    echo "Please run with: sudo bash $0"
    exit 1
fi

# Detect current user (for adding to docker group)
CURRENT_USER=${SUDO_USER:-$USER}
if [ -z "$CURRENT_USER" ] || [ "$CURRENT_USER" = "root" ]; then
    # Try to get the actual user from SSH session
    CURRENT_USER=$(who am i | awk '{print $1}' || echo "ubuntu")
fi

echo -e "${BLUE}📋 Installation Plan:${NC}"
echo "  1. Update system packages"
echo "  2. Install prerequisites"
echo "  3. Add Docker's official GPG key"
echo "  4. Add Docker repository"
echo "  5. Install Docker Engine"
echo "  6. Install Docker Compose Plugin"
echo "  7. Add user '$CURRENT_USER' to docker group"
echo "  8. Start and enable Docker service"
echo "  9. Verify installation"
echo ""

read -p "Continue with Docker installation? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Step 1/9: Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

echo ""
echo -e "${BLUE}📦 Step 2/9: Installing prerequisites...${NC}"
apt-get install -y -qq \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    apt-transport-https

echo ""
echo -e "${BLUE}📦 Step 3/9: Adding Docker's official GPG key...${NC}"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo ""
echo -e "${BLUE}📦 Step 4/9: Adding Docker repository...${NC}"
# Detect Ubuntu version codename
UBUNTU_CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
echo "   Detected Ubuntu codename: $UBUNTU_CODENAME"

# For Ubuntu 25.10 (Wily), use Noble (24.04) repository as fallback
# Docker may not have official support for 25.10 yet
if [ "$UBUNTU_CODENAME" = "wily" ]; then
    echo -e "${YELLOW}⚠${NC}  Ubuntu 25.10 detected. Using Noble (24.04) repository for compatibility."
    DOCKER_CODENAME="noble"
else
    DOCKER_CODENAME="$UBUNTU_CODENAME"
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $DOCKER_CODENAME stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq

echo ""
echo -e "${BLUE}📦 Step 5/9: Installing Docker Engine...${NC}"
apt-get install -y -qq \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

echo ""
echo -e "${BLUE}📦 Step 6/9: Docker Compose Plugin already installed (included above)${NC}"

echo ""
echo -e "${BLUE}📦 Step 7/9: Adding user '$CURRENT_USER' to docker group...${NC}"
usermod -aG docker "$CURRENT_USER" || {
    echo -e "${YELLOW}⚠${NC}  Could not add user to docker group. You may need to run:"
    echo "   sudo usermod -aG docker $CURRENT_USER"
}

echo ""
echo -e "${BLUE}📦 Step 8/9: Starting and enabling Docker service...${NC}"
systemctl enable docker
systemctl start docker

echo ""
echo -e "${BLUE}📦 Step 9/9: Verifying installation...${NC}"
sleep 2

# Check Docker version
if docker --version > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker installation failed!"
    exit 1
fi

# Check Docker Compose version
if docker compose version > /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version)
    echo -e "${GREEN}✓${NC} Docker Compose installed: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose installation failed!"
    exit 1
fi

# Test Docker daemon
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
else
    echo -e "${YELLOW}⚠${NC}  Docker daemon check failed (may need logout/login for group changes)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   DOCKER INSTALLATION COMPLETE                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} Docker Engine installed"
echo -e "${GREEN}✓${NC} Docker Compose Plugin installed"
echo -e "${GREEN}✓${NC} User '$CURRENT_USER' added to docker group"
echo ""
echo -e "${YELLOW}⚠${NC}  IMPORTANT: Log out and log back in (or run 'newgrp docker')"
echo "   for group changes to take effect."
echo ""
echo "Next steps:"
echo "  1. Log out and log back in to SSH"
echo "  2. Verify: docker ps"
echo "  3. Verify: docker compose version"
echo "  4. Deploy: cd /data/Demiurge-Blockchain/docker"
echo "  5. Start: docker compose -f docker-compose.production.yml up -d"
echo ""
