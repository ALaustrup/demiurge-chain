#!/bin/bash
#
# RUST INSTALLATION SCRIPT FOR MONAD
# Run AFTER UE5 build completes to avoid CPU contention
#
# Usage: ssh monad 'bash -s' < scripts/install-rust-monad.sh

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  🦀 Installing Rust Toolchain on Monad (Pleroma)"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "═══════════════════════════════════════════════════════════════════"

# Check if UE5 build is still running
if pgrep -f "make.*UnrealEditor" > /dev/null; then
    echo "⚠️  WARNING: UE5 build appears to still be running!"
    echo "   Consider waiting for completion to avoid resource contention."
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Install Rust via rustup
echo ""
echo "📦 [1/5] Installing Rust via rustup..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable

# Source cargo environment
source "$HOME/.cargo/env"

# Verify installation
echo ""
echo "📦 [2/5] Verifying installation..."
rustc --version
cargo --version

# Add WASM target for Substrate runtime
echo ""
echo "📦 [3/5] Adding WASM target..."
rustup target add wasm32-unknown-unknown

# Add rust-src for IDE support
echo ""
echo "📦 [4/5] Adding rust-src component..."
rustup component add rust-src

# Install additional tools
echo ""
echo "📦 [5/5] Installing additional tools..."
cargo install cargo-watch cargo-audit

# Setup for Demiurge project
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Rust Installation Complete!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Installed versions:"
rustc --version
cargo --version
echo ""
echo "WASM target:"
rustup target list --installed | grep wasm
echo ""
echo "Next steps:"
echo "  1. cd /data/Demiurge-Blockchain"
echo "  2. git pull origin genesis/engine-setup"
echo "  3. cd blockchain"
echo "  4. cargo build --release"
echo ""
echo "Build output will be at:"
echo "  /data/Demiurge-Blockchain/blockchain/target/release/demiurge-node"
echo ""
