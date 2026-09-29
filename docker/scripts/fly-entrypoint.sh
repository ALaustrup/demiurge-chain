#!/bin/bash
#
# Demiurge-Cloud node entrypoint for Fly.io.
#
# Replaces docker/scripts/node-entrypoint.sh, which passed Substrate flags
# (--base-path, --rpc-port, --validator, --node-key) that this node does not
# accept. The real CLI is --data-dir / --rpc-addr / --p2p-addr / --genesis /
# --validator-key.
#
# Key material never lives in the image or in git. The validator key and
# genesis arrive as Fly secrets and are written to the mounted volume at boot,
# readable only by the node user.

set -euo pipefail

DATA_DIR="${DATA_DIR:-/data}"
RPC_ADDR="${RPC_ADDR:-0.0.0.0:9944}"
P2P_ADDR="${P2P_ADDR:-0.0.0.0:30333}"
BLOCK_TIME="${BLOCK_TIME:-2000}"

VALIDATOR_KEY_FILE="${DATA_DIR}/validator.json"
GENESIS_FILE="${DATA_DIR}/genesis.json"

echo "=============================================="
echo "  Demiurge-Cloud node"
echo "  region:     ${FLY_REGION:-unknown}"
echo "  machine:    ${FLY_MACHINE_ID:-unknown}"
echo "  data dir:   ${DATA_DIR}"
echo "  rpc:        ${RPC_ADDR}"
echo "  p2p:        ${P2P_ADDR}"
echo "  block time: ${BLOCK_TIME}ms"
echo "=============================================="

if [ ! -w "${DATA_DIR}" ]; then
    echo "FATAL: ${DATA_DIR} is not writable. Is the volume mounted?" >&2
    exit 1
fi

ARGS=(
    --data-dir "${DATA_DIR}"
    --rpc-addr "${RPC_ADDR}"
    --p2p-addr "${P2P_ADDR}"
    --block-time "${BLOCK_TIME}"
)

# Genesis. Written once; on later boots the existing chain state governs, so we
# keep the file for reference but do not rewrite it.
if [ -n "${GENESIS_JSON:-}" ]; then
    if [ ! -f "${GENESIS_FILE}" ]; then
        printf '%s' "${GENESIS_JSON}" > "${GENESIS_FILE}"
        chmod 0600 "${GENESIS_FILE}"
        echo "Genesis written to ${GENESIS_FILE}"
    fi
fi
if [ -f "${GENESIS_FILE}" ]; then
    ARGS+=(--genesis "${GENESIS_FILE}")
else
    echo "WARNING: no genesis provided; the node will start with an empty chain." >&2
fi

# Validator key. Its absence is not fatal: the node then runs as a
# non-validating full node, which is a legitimate configuration.
if [ -n "${VALIDATOR_KEY_JSON:-}" ]; then
    printf '%s' "${VALIDATOR_KEY_JSON}" > "${VALIDATOR_KEY_FILE}"
    chmod 0600 "${VALIDATOR_KEY_FILE}"
fi
if [ -f "${VALIDATOR_KEY_FILE}" ]; then
    ARGS+=(--validator-key "${VALIDATOR_KEY_FILE}")
    echo "Validator mode: enabled"
else
    echo "Validator mode: disabled (no key supplied) - running as a full node"
fi

# Peers to dial on startup, as comma-separated multiaddrs.
if [ -n "${BOOTSTRAP_PEERS:-}" ]; then
    ARGS+=(--bootstrap-peers "${BOOTSTRAP_PEERS}")
    echo "Bootstrap peers: ${BOOTSTRAP_PEERS}"
fi

echo "Starting: demiurge-node-legacy ${ARGS[*]}"
exec demiurge-node-legacy "${ARGS[@]}"
