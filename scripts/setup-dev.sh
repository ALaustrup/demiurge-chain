#!/bin/bash
# Demiurge-Cloud Development Environment Setup
# Run this script to prepare your development environment

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║     DEMIURGE-BLOCKCHAIN DEV SETUP            ║"
echo "║     Preparing the development environment    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM=Windows;;
    *)          PLATFORM="Unknown";;
esac

echo "Detected platform: $PLATFORM"
echo ""

# Check for Rust
echo ">>> Checking Rust installation..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✓ Rust installed: $RUST_VERSION"
else
    echo "✗ Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Add WASM target
echo ">>> Adding WASM target..."
rustup target add wasm32-unknown-unknown

# Check for Node.js
echo ">>> Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "✗ Node.js not found. Please install Node.js 20+ LTS"
    echo "  Visit: https://nodejs.org/"
fi

# Install Substrate dependencies (Linux only)
if [ "$PLATFORM" = "Linux" ]; then
    echo ">>> Installing Substrate dependencies..."
    sudo apt-get update
    sudo apt-get install -y \
        cmake \
        pkg-config \
        libssl-dev \
        git \
        clang \
        libclang-dev \
        protobuf-compiler
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     SETUP COMPLETE                           ║"
echo "║     You are ready to build the Pleroma       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. cargo build        # Build the project"
echo "  2. cargo test         # Run tests"
echo "  3. cargo run          # Run the node"
