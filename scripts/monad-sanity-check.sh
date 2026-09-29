#!/bin/bash
#
# MONAD SANITY CHECK - UE 5.7.1 Pre-Flight
# Server: Pleroma (51.210.209.112)
# Purpose: Verify toolchain and environment before UE5 build
#
# Usage: ssh monad 'bash -s' < scripts/monad-sanity-check.sh
#        or on Monad: ./scripts/monad-sanity-check.sh

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  🎭 MONAD SANITY CHECK - Demiurge-Cloud Genesis"
echo "  Hostname: $(hostname)"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "═══════════════════════════════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

FAILED=0

# ═══════════════════════════════════════════════════════════════════
# 1. COMPILER ALIGNMENT
# ═══════════════════════════════════════════════════════════════════
echo -e "\n📦 [1/6] Compiler Versions..."

# Clang 19
if command -v clang-19 &> /dev/null; then
    CLANG_VERSION=$(clang-19 --version | head -1)
    check_pass "Clang 19: $CLANG_VERSION"
else
    check_fail "Clang 19 not found. Install with: sudo apt install clang-19"
fi

# GCC 15
if command -v gcc-15 &> /dev/null; then
    GCC_VERSION=$(gcc-15 --version | head -1)
    check_pass "GCC 15: $GCC_VERSION"
elif command -v gcc &> /dev/null; then
    GCC_VERSION=$(gcc --version | head -1)
    check_warn "GCC (not 15): $GCC_VERSION"
else
    check_fail "GCC not found"
fi

# Rust
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    check_pass "Rust: $RUST_VERSION"
    
    # Check for wasm target
    if rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        check_pass "WASM target installed"
    else
        check_warn "WASM target missing. Install: rustup target add wasm32-unknown-unknown"
    fi
else
    check_fail "Rust not found. Install via rustup"
fi

# CMake
if command -v cmake &> /dev/null; then
    CMAKE_VERSION=$(cmake --version | head -1)
    check_pass "CMake: $CMAKE_VERSION"
else
    check_fail "CMake not found"
fi

# ═══════════════════════════════════════════════════════════════════
# 2. UE 5.7.1 SCRIPT INTEGRITY
# ═══════════════════════════════════════════════════════════════════
echo -e "\n📜 [2/6] UE 5.7.1 Shell Script Integrity..."

UE_SOURCE="/data/Demiurge-Blockchain/ue5-source"

if [ -d "$UE_SOURCE" ]; then
    check_pass "UE5 source directory exists"
    
    # Check Setup.sh
    if [ -f "$UE_SOURCE/Setup.sh" ]; then
        chmod +x "$UE_SOURCE/Setup.sh" 2>/dev/null || true
        check_pass "Setup.sh present and executable"
    else
        check_warn "Setup.sh not found (may not have cloned yet)"
    fi
    
    # Check GenerateProjectFiles.sh
    if [ -f "$UE_SOURCE/GenerateProjectFiles.sh" ]; then
        chmod +x "$UE_SOURCE/GenerateProjectFiles.sh" 2>/dev/null || true
        check_pass "GenerateProjectFiles.sh present and executable"
    else
        check_warn "GenerateProjectFiles.sh not found"
    fi
    
    # Check Linux batch files
    if [ -d "$UE_SOURCE/Engine/Build/BatchFiles/Linux" ]; then
        BATCH_COUNT=$(ls -1 "$UE_SOURCE/Engine/Build/BatchFiles/Linux/" 2>/dev/null | wc -l)
        check_pass "Linux BatchFiles directory: $BATCH_COUNT files"
    else
        check_warn "Linux BatchFiles directory not found"
    fi
else
    check_warn "UE5 source not found at $UE_SOURCE (clone pending)"
fi

# ═══════════════════════════════════════════════════════════════════
# 3. STORAGE & RAID 0 CHECK
# ═══════════════════════════════════════════════════════════════════
echo -e "\n💾 [3/6] RAID 0 Mount Verification..."

if mountpoint -q /data 2>/dev/null; then
    check_pass "/data is mounted"
    
    # Get mount info
    MOUNT_INFO=$(findmnt -n -o SOURCE,FSTYPE,OPTIONS /data 2>/dev/null || echo "unknown")
    echo "    Mount details: $MOUNT_INFO"
    
    # Check filesystem type
    FSTYPE=$(findmnt -n -o FSTYPE /data 2>/dev/null || echo "unknown")
    if [ "$FSTYPE" = "xfs" ]; then
        check_pass "XFS filesystem confirmed"
    else
        check_warn "Filesystem is $FSTYPE (expected XFS)"
    fi
    
    # Storage stats
    df -Th /data
    
    # Free space check (need at least 200GB for UE5 build)
    FREE_GB=$(df -BG /data | tail -1 | awk '{print $4}' | tr -d 'G')
    if [ "$FREE_GB" -gt 200 ]; then
        check_pass "Free space: ${FREE_GB}GB (>200GB required)"
    else
        check_fail "Free space: ${FREE_GB}GB (need >200GB)"
    fi
else
    check_fail "/data is not mounted"
fi

# ═══════════════════════════════════════════════════════════════════
# 4. MEMORY STATUS
# ═══════════════════════════════════════════════════════════════════
echo -e "\n🧠 [4/6] Memory Status..."

free -h

TOTAL_MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM_GB" -ge 32 ]; then
    check_pass "RAM: ${TOTAL_MEM_GB}GB (≥32GB for UE5 build)"
else
    check_warn "RAM: ${TOTAL_MEM_GB}GB (32GB+ recommended)"
fi

# Swap info
if swapon --show 2>/dev/null | grep -q .; then
    check_pass "Swap configured:"
    swapon --show
else
    check_warn "No swap configured (recommended for safety)"
fi

# ═══════════════════════════════════════════════════════════════════
# 5. CPU CONFIGURATION
# ═══════════════════════════════════════════════════════════════════
echo -e "\n⚡ [5/6] CPU Configuration..."

CORES=$(nproc)
echo "    Available cores: $CORES"

if [ "$CORES" -ge 16 ]; then
    check_pass "CPU cores: $CORES (optimal for -j16)"
else
    check_warn "CPU cores: $CORES (16+ recommended)"
fi

lscpu | grep -E "Model name|CPU\(s\)|Thread|Core" | head -5

# ═══════════════════════════════════════════════════════════════════
# 6. NETWORK & DEPENDENCIES
# ═══════════════════════════════════════════════════════════════════
echo -e "\n🌐 [6/6] Additional Checks..."

# Git LFS
if command -v git-lfs &> /dev/null; then
    GIT_LFS_VERSION=$(git lfs version 2>/dev/null | head -1)
    check_pass "Git LFS: $GIT_LFS_VERSION"
else
    check_fail "Git LFS not installed. Run: sudo apt install git-lfs && git lfs install"
fi

# Node.js (for UE5 web tools)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js: $NODE_VERSION"
else
    check_warn "Node.js not found (optional for UE5 web tools)"
fi

# Docker (for containerized builds)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker: $DOCKER_VERSION"
else
    check_warn "Docker not found (optional)"
fi

# PostgreSQL client (for qor-auth)
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    check_pass "PostgreSQL client: $PSQL_VERSION"
else
    check_warn "PostgreSQL client not found"
fi

# ═══════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
    echo -e "  ${GREEN}✅ SANITY CHECK PASSED${NC} - Ready for Genesis Build"
else
    echo -e "  ${YELLOW}⚠️  SANITY CHECK COMPLETED WITH WARNINGS${NC}"
    echo "     Review issues above before proceeding"
fi
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. cd /data/Demiurge-Blockchain/ue5-source"
echo "  2. ./Setup.sh  # Download dependencies (~20-50GB)"
echo "  3. ./GenerateProjectFiles.sh"
echo "  4. make -j16   # Full build"
echo ""
