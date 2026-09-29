#!/bin/bash
# Remote build script - runs on server to build custom Demiurge runtime
# This avoids Windows line-ending and symlink issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="${REGISTRY:-localhost:5000}"
IMAGE_NAME="${IMAGE_NAME:-demiurge-node}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Demiurge Custom Runtime Build Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Verify Rust installation
echo -e "${YELLOW}[1/6]${NC} Verifying Rust installation..."
RUST_VERSION=$(~/.cargo/bin/cargo --version)
echo "  ✅ $RUST_VERSION"
RUSTC_VERSION=$(~/.cargo/bin/rustc --version)
echo "  ✅ $RUSTC_VERSION"

# Step 2: Navigate to blockchain directory
echo -e "${YELLOW}[2/6]${NC} Navigating to blockchain directory..."
cd ~/demiurge/blockchain || { echo "❌ Failed to navigate to blockchain"; exit 1; }
echo "  ✅ In: $(pwd)"

# Step 3: Apply sc-network patches
echo -e "${YELLOW}[3/6]${NC} Applying sc-network enum patches..."
for version in 0.38.0 0.39.0 0.40.0 0.41.0; do
    file="~/.cargo/registry/src/github.com-*/sc-network-$version/src/protocol/message.rs"
    # Expand tilde for globbing
    expanded_file=$(ls $file 2>/dev/null | head -1)
    if [ -n "$expanded_file" ]; then
        echo "  Patching sc-network $version..."
        # Apply patches (all continue on error)
        sed -i 's/Status(Status<Hash, Number>),/#[codec(index = 0)]\n        Status(Status<Hash, Number>),/' "$expanded_file" || true
        sed -i 's/BlockRequest(BlockRequest<Hash, Number>),/#[codec(index = 1)]\n        BlockRequest(BlockRequest<Hash, Number>),/' "$expanded_file" || true
        sed -i 's/BlockResponse(BlockResponse<Header, Hash, Extrinsic>),/#[codec(index = 2)]\n        BlockResponse(BlockResponse<Header, Hash, Extrinsic>),/' "$expanded_file" || true
        sed -i 's/BlockAnnounce(BlockAnnounce<Header>),/#[codec(index = 3)]\n        BlockAnnounce(BlockAnnounce<Header>),/' "$expanded_file" || true
        sed -i 's/#\[codec(index = 6)\]/#[codec(index = 5)]/' "$expanded_file" || true
        sed -i 's/RemoteCallRequest(RemoteCallRequest<Hash>),/#[codec(index = 7)]\n        RemoteCallRequest(RemoteCallRequest<Hash>),/' "$expanded_file" || true
        sed -i 's/RemoteCallResponse(RemoteCallResponse),/#[codec(index = 8)]\n        RemoteCallResponse(RemoteCallResponse),/' "$expanded_file" || true
        sed -i 's/RemoteReadRequest(RemoteReadRequest<Hash>),/#[codec(index = 9)]\n        RemoteReadRequest(RemoteReadRequest<Hash>),/' "$expanded_file" || true
        sed -i 's/RemoteReadResponse(RemoteReadResponse),/#[codec(index = 10)]\n        RemoteReadResponse(RemoteReadResponse),/' "$expanded_file" || true
        sed -i 's/RemoteHeaderRequest(RemoteHeaderRequest<Number>),/#[codec(index = 11)]\n        RemoteHeaderRequest(RemoteHeaderRequest<Number>),/' "$expanded_file" || true
        sed -i 's/RemoteHeaderResponse(RemoteHeaderResponse<Header>),/#[codec(index = 12)]\n        RemoteHeaderResponse(RemoteHeaderResponse<Header>),/' "$expanded_file" || true
        sed -i 's/RemoteChangesRequest(RemoteChangesRequest<Hash>),/#[codec(index = 13)]\n        RemoteChangesRequest(RemoteChangesRequest<Hash>),/' "$expanded_file" || true
        sed -i 's/RemoteChangesResponse(RemoteChangesResponse<Number, Hash>),/#[codec(index = 14)]\n        RemoteChangesResponse(RemoteChangesResponse<Number, Hash>),/' "$expanded_file" || true
        sed -i 's/RemoteReadChildRequest(RemoteReadChildRequest<Hash>),/#[codec(index = 15)]\n        RemoteReadChildRequest(RemoteReadChildRequest<Hash>),/' "$expanded_file" || true
        echo "    ✅ Patched sc-network $version"
    fi
done
echo "  ✅ sc-network patches applied"

# Step 4: Clean and build
echo -e "${YELLOW}[4/6]${NC} Building Demiurge node (this may take 30-60 minutes)..."
echo "  Starting cargo build..."
rm -rf target/release || true

~/.cargo/bin/cargo build --release --bin demiurge-node 2>&1 | tee /tmp/build.log

if [ ! -f "target/release/demiurge-node" ]; then
    echo -e "${RED}❌ Build failed: binary not found${NC}"
    echo "Last 50 lines of build log:"
    tail -50 /tmp/build.log
    exit 1
fi

BINARY_SIZE=$(du -h target/release/demiurge-node | cut -f1)
echo -e "  ✅ Binary built successfully: ${GREEN}$BINARY_SIZE${NC}"

# Step 5: Export genesis WASM
echo -e "${YELLOW}[5/6]${NC} Exporting genesis WASM..."
mkdir -p /tmp/demiurge-build
cd ~/demiurge/blockchain
./target/release/demiurge-node export-genesis-wasm \
    --chain dev \
    > /tmp/demiurge-build/genesis.wasm 2>/dev/null || true

if [ -f "/tmp/demiurge-build/genesis.wasm" ]; then
    WASM_SIZE=$(du -h /tmp/demiurge-build/genesis.wasm | cut -f1)
    # Convert to hex
    hexdump -v -e '/1 "%02x"' /tmp/demiurge-build/genesis.wasm > /tmp/demiurge-build/genesis.hex
    echo -e "  ✅ Genesis WASM exported: ${GREEN}$WASM_SIZE${NC}"
    echo -e "     Hex file: $(wc -c < /tmp/demiurge-build/genesis.hex) bytes"
    # Copy back to demiurge directory
    cp /tmp/demiurge-build/genesis.hex ~/demiurge/genesis.hex
else
    echo -e "  ⚠️  WASM export not available in this build (may require runtime integration)"
fi

# Step 6: Create Docker image
echo -e "${YELLOW}[6/6]${NC} Creating Docker image..."
cd ~/demiurge/blockchain

cat > Dockerfile.custom << 'EOF'
FROM ubuntu:22.04 as runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /

COPY target/release/demiurge-node /usr/local/bin/

EXPOSE 9933 9944 30333 9615

ENTRYPOINT ["/usr/local/bin/demiurge-node"]
CMD ["--chain", "dev", "--validator", "--unsafe-rpc-external", "--rpc-methods=unsafe", "--prometheus-external"]
EOF

docker build -f Dockerfile.custom \
    -t "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" \
    -t "${REGISTRY}/${IMAGE_NAME}:$(date +%Y%m%d-%H%M%S)" \
    . 2>&1 | tail -30

IMAGE_ID=$(docker images --quiet "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" | head -1)
if [ -z "$IMAGE_ID" ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "  ✅ Docker image created: ${GREEN}${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}${NC}"

# Step 7: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ BUILD COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo "Binary: target/release/demiurge-node (${BINARY_SIZE})"
if [ -f "/root/demiurge/genesis.hex" ]; then
    echo "Genesis WASM (hex): /root/demiurge/genesis.hex"
fi
echo ""
echo "Next steps:"
echo "  1. Deploy new image: update docker-compose.substrate-node.yml"
echo "  2. Restart container: docker compose down && docker compose up -d"
echo "  3. Verify node: docker logs demiurge-blockchain-node"
echo ""
