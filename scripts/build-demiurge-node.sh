#!/bin/bash
# Build script for custom Demiurge blockchain node

set -e

echo "🔨 Building custom Demiurge node..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REGISTRY="${REGISTRY:-localhost:5000}"
IMAGE_NAME="${IMAGE_NAME:-demiurge-node}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
RUST_VERSION="1.92.0"
TARGET_DIR="target/release"
BINARY_NAME="demiurge-node"

# Step 1: Patch sc-network enum issues
echo -e "${YELLOW}[1/4]${NC} Patching sc-network enum variant collisions..."
patch_sc_network() {
    local version=$1
    local file="$HOME/.cargo/registry/src/index.crates.io-*/sc-network-$version/src/protocol/message.rs"
    
    if ls $file 1> /dev/null 2>&1; then
        echo "  Patching sc-network $version..."
        # Assign explicit codec indices to prevent auto-numbering conflicts
        sed -i 's/Status(Status<Hash, Number>),/#[codec(index = 0)]\n        Status(Status<Hash, Number>),/' $file
        sed -i 's/BlockRequest(BlockRequest<Hash, Number>),/#[codec(index = 1)]\n        BlockRequest(BlockRequest<Hash, Number>),/' $file
        sed -i 's/BlockResponse(BlockResponse<Header, Hash, Extrinsic>),/#[codec(index = 2)]\n        BlockResponse(BlockResponse<Header, Hash, Extrinsic>),/' $file
        sed -i 's/BlockAnnounce(BlockAnnounce<Header>),/#[codec(index = 3)]\n        BlockAnnounce(BlockAnnounce<Header>),/' $file
        sed -i 's/#\[codec(index = 6)\]/#[codec(index = 5)]/' $file
        sed -i 's/RemoteCallRequest(RemoteCallRequest<Hash>),/#[codec(index = 7)]\n        RemoteCallRequest(RemoteCallRequest<Hash>),/' $file
        sed -i 's/RemoteCallResponse(RemoteCallResponse),/#[codec(index = 8)]\n        RemoteCallResponse(RemoteCallResponse),/' $file
        sed -i 's/RemoteReadRequest(RemoteReadRequest<Hash>),/#[codec(index = 9)]\n        RemoteReadRequest(RemoteReadRequest<Hash>),/' $file
        sed -i 's/RemoteReadResponse(RemoteReadResponse),/#[codec(index = 10)]\n        RemoteReadResponse(RemoteReadResponse),/' $file
        sed -i 's/RemoteHeaderRequest(RemoteHeaderRequest<Number>),/#[codec(index = 11)]\n        RemoteHeaderRequest(RemoteHeaderRequest<Number>),/' $file
        sed -i 's/RemoteHeaderResponse(RemoteHeaderResponse<Header>),/#[codec(index = 12)]\n        RemoteHeaderResponse(RemoteHeaderResponse<Header>),/' $file
        sed -i 's/RemoteChangesRequest(RemoteChangesRequest<Hash>),/#[codec(index = 13)]\n        RemoteChangesRequest(RemoteChangesRequest<Hash>),/' $file
        sed -i 's/RemoteChangesResponse(RemoteChangesResponse<Number, Hash>),/#[codec(index = 14)]\n        RemoteChangesResponse(RemoteChangesResponse<Number, Hash>),/' $file
        sed -i 's/RemoteReadChildRequest(RemoteReadChildRequest<Hash>),/#[codec(index = 15)]\n        RemoteReadChildRequest(RemoteReadChildRequest<Hash>),/' $file
        echo "    ✅ Patched sc-network $version"
    fi
}

for version in 0.38.0 0.39.0 0.40.0 0.41.0; do
    patch_sc_network $version
done

# Step 2: Build the Rust binary
echo -e "${YELLOW}[2/4]${NC} Compiling Demiurge node (this may take 30-60 minutes)..."
cd blockchain
rm -rf target
~/.cargo/bin/cargo build --release --bin $BINARY_NAME 2>&1 | tail -20

if [ ! -f "$TARGET_DIR/$BINARY_NAME" ]; then
    echo -e "${RED}❌ Build failed: binary not found at $TARGET_DIR/$BINARY_NAME${NC}"
    exit 1
fi

BINARY_SIZE=$(du -h "$TARGET_DIR/$BINARY_NAME" | cut -f1)
echo -e "  ✅ Binary built: $BINARY_SIZE"

# Step 3: Create Docker image
echo -e "${YELLOW}[3/4]${NC} Creating Docker image..."

# Create multi-stage Dockerfile
cat > Dockerfile.release << 'EOF'
FROM ubuntu:22.04 as runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /

COPY target/release/demiurge-node /usr/local/bin/

EXPOSE 9933 9944 30333 9615

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:9933/health || exit 1

ENTRYPOINT ["/usr/local/bin/demiurge-node"]
EOF

docker build -f Dockerfile.release -t "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" . \
    --build-arg BUILDKIT_INLINE_CACHE=1

IMAGE_ID=$(docker images --quiet "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
if [ -z "$IMAGE_ID" ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "  ✅ Image created: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Step 4: Push image (optional)
echo -e "${YELLOW}[4/4]${NC} Image build complete"

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo "Size: $(docker images --format='{{.Size}}' ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG})"
echo ""
echo "To use this image, update docker-compose.substrate-node.yml:"
echo "  image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "Then deploy:"
echo "  docker compose -f docker-compose.substrate-node.yml up -d"
