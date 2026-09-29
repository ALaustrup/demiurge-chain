#!/bin/bash
set -e

# Demiurge Node Entrypoint Script
# Configures and starts a Demiurge blockchain node

echo "================================================"
echo "  Demiurge-Cloud Node"
echo "  Node: ${NODE_NAME:-Unnamed}"
echo "================================================"

# Build command line arguments
ARGS="--base-path ${DATA_DIR:-/data}"
ARGS="$ARGS --name ${NODE_NAME:-demiurge-node-legacy}"
ARGS="$ARGS --rpc-port ${RPC_PORT:-9944}"
ARGS="$ARGS --port ${P2P_PORT:-30333}"

# RPC configuration
if [ "$RPC_CORS" ]; then
    ARGS="$ARGS --rpc-cors $RPC_CORS"
fi

if [ "$RPC_METHODS" ]; then
    ARGS="$ARGS --rpc-methods $RPC_METHODS"
fi

ARGS="$ARGS --rpc-external"

# Node key for deterministic peer ID
if [ "$NODE_KEY" ]; then
    ARGS="$ARGS --node-key $NODE_KEY"
fi

# Validator mode
if [ "$VALIDATOR_ENABLED" = "true" ]; then
    ARGS="$ARGS --validator"
    echo "Running as VALIDATOR"
fi

# Boot nodes
if [ "$BOOTNODES" ]; then
    ARGS="$ARGS --bootnodes $BOOTNODES"
fi

# Chain specification
if [ -f "/config/chain-spec.json" ]; then
    ARGS="$ARGS --chain /config/chain-spec.json"
elif [ "$CHAIN_SPEC" ]; then
    ARGS="$ARGS --chain $CHAIN_SPEC"
fi

# Prometheus metrics
if [ "$PROMETHEUS_ENABLED" = "true" ]; then
    ARGS="$ARGS --prometheus-external"
    ARGS="$ARGS --prometheus-port ${METRICS_PORT:-9615}"
fi

# Logging
if [ "$LOG_LEVEL" ]; then
    ARGS="$ARGS --log $LOG_LEVEL"
fi

# Telemetry
if [ "$TELEMETRY_URL" ]; then
    ARGS="$ARGS --telemetry-url '$TELEMETRY_URL 1'"
fi

echo "Starting node with arguments:"
echo "$ARGS"
echo "------------------------------------------------"

# Execute node
exec demiurge-node-legacy $ARGS
