# Demiurge-Cloud node image.
#
# Build context is the repository root; the Rust workspace lives in framework/.
#
# Replaces docker/Dockerfile.node, which could not build: it pinned Rust 1.75
# (several dependencies now require 1.86+) and copied a root Cargo.toml that
# does not exist in this repo.

# ---------- Stage 1: build ----------
FROM rust:1-bookworm AS builder

# rocksdb needs a C++ toolchain and libclang for its bindgen step; libp2p and
# secp256k1 pull in the rest.
RUN apt-get update && apt-get install -y --no-install-recommends \
        cmake \
        pkg-config \
        libssl-dev \
        clang \
        libclang-dev \
        llvm-dev \
        protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# The workspace and its committed lockfile.
COPY framework/ ./framework/

WORKDIR /build/framework

# --locked builds the exact 494 dependency versions that pass CI. Without it a
# fresh resolve can pull crates the pinned toolchain cannot compile.
#
# -j2 caps link-time memory. Linking this workspace at full parallelism peaks
# high enough to OOM a small builder.
RUN cargo build --release --locked -j2 --package demiurge-node-legacy \
    && strip target/release/demiurge-node-legacy

# ---------- Stage 2: runtime ----------
FROM debian:bookworm-slim

LABEL org.opencontainers.image.source="https://github.com/ALaustrup/demiurge-cloud"
LABEL org.opencontainers.image.description="Demiurge-Cloud blockchain node"
LABEL org.opencontainers.image.licenses="MIT"

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 -U demiurge

COPY --from=builder /build/framework/target/release/demiurge-node-legacy /usr/local/bin/demiurge-node-legacy
COPY --chmod=0755 docker/scripts/fly-entrypoint.sh /usr/local/bin/fly-entrypoint.sh

# Chain data lives on the mounted volume.
RUN mkdir -p /data && chown -R demiurge:demiurge /data

USER demiurge
WORKDIR /home/demiurge

ENV DATA_DIR=/data \
    RPC_ADDR=0.0.0.0:9944 \
    P2P_ADDR=0.0.0.0:30333 \
    BLOCK_TIME=2000

EXPOSE 9944 30333

ENTRYPOINT ["/usr/local/bin/fly-entrypoint.sh"]
