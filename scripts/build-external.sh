#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🔨 EXTERNAL BUILD SCRIPT - Demiurge-Cloud Node
# ═══════════════════════════════════════════════════════════════════════════════
# 
# This script builds the Demiurge node EXTERNALLY to avoid Cursor crashes.
# Run this in a separate terminal or CI/CD pipeline.
#
# Usage:
#   ./scripts/build-external.sh [--clean] [--docker] [--check]
#
# Options:
#   --clean    Clean build cache before building
#   --docker   Build using Docker instead of local Rust
#   --check    Only check compilation, don't build binary
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"
BUILD_MODE="local"
CLEAN_BUILD=false
CHECK_ONLY=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --docker)
            BUILD_MODE="docker"
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        *)
            echo -e "${YELLOW}Unknown option: $arg${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "    🔨 EXTERNAL BUILD - Demiurge-Cloud Node"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo -e "Build mode: ${CYAN}$BUILD_MODE${NC}"
echo -e "Clean build: ${CYAN}$CLEAN_BUILD${NC}"
echo -e "Check only: ${CYAN}$CHECK_ONLY${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# DOCKER BUILD
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$BUILD_MODE" = "docker" ]; then
    echo -e "${YELLOW}▶ Building with Docker...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found. Install Docker or use --local mode.${NC}"
        exit 1
    fi
    
    cd "$BLOCKCHAIN_DIR"
    
    # Build Docker image
    docker build -t demiurge-node:latest .
    
    echo -e "${GREEN}✓ Docker build complete${NC}"
    echo ""
    echo "To run the container:"
    echo "  docker run -it --rm demiurge-node:latest --dev"
    exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# LOCAL BUILD
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Checking prerequisites...${NC}"

# Check Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}✗ Rust not found. Install from https://rustup.rs/${NC}"
    exit 1
fi

RUST_VERSION=$(rustc --version | awk '{print $2}')
echo -e "  → Rust version: ${CYAN}$RUST_VERSION${NC}"

# Check Cargo
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}✗ Cargo not found${NC}"
    exit 1
fi

# Check WASM target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo -e "${YELLOW}  → Adding WASM target...${NC}"
    rustup target add wasm32-unknown-unknown
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Navigate to blockchain directory
cd "$BLOCKCHAIN_DIR"

# Clean if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "${YELLOW}▶ Cleaning build cache...${NC}"
    cargo clean
    echo -e "${GREEN}✓ Clean complete${NC}"
    echo ""
fi

# Build
if [ "$CHECK_ONLY" = true ]; then
    echo -e "${YELLOW}▶ Checking compilation...${NC}"
    cargo check --release
else
    echo -e "${YELLOW}▶ Building release binary...${NC}"
    echo -e "  This may take 30-60 minutes on first build${NC}"
    echo -e "  Using $(nproc) CPU cores${NC}"
    echo ""
    
    BUILD_START=$(date +%s)
    cargo build --release
    BUILD_END=$(date +%s)
    BUILD_DURATION=$((BUILD_END - BUILD_START))
    
    echo ""
    echo -e "${GREEN}✓ Build complete!${NC}"
    echo -e "  Duration: ${CYAN}$(date -u -d @$BUILD_DURATION +%H:%M:%S)${NC}"
fi

# Verify binary
BINARY_PATH="$BLOCKCHAIN_DIR/target/release/demiurge-node"
if [ -f "$BINARY_PATH" ]; then
    BINARY_SIZE=$(du -h "$BINARY_PATH" | awk '{print $1}')
    echo ""
    echo -e "${GREEN}✓ Binary verified${NC}"
    echo -e "  Path: ${CYAN}$BINARY_PATH${NC}"
    echo -e "  Size: ${CYAN}$BINARY_SIZE${NC}"
    
    # Test version
    "$BINARY_PATH" --version || true
else
    echo -e "${YELLOW}⚠ Binary not found (check-only mode?)${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build process complete!${NC}"
echo ""
