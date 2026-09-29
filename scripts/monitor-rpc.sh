#!/bin/sh
# Monitor RPC endpoints for the Demiurge node

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HTTP_ENDPOINT="http://demiurge-node:9933"
WS_ENDPOINT="ws://demiurge-node:9944"

# Check HTTP RPC
HTTP_HEALTH=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_chain","params":[],"id":1}' \
  "$HTTP_ENDPOINT" 2>/dev/null)

if echo "$HTTP_HEALTH" | grep -q "Demiurge"; then
  echo "[$TIMESTAMP] ✅ HTTP RPC: HEALTHY"
else
  echo "[$TIMESTAMP] ❌ HTTP RPC: UNHEALTHY"
  echo "  Response: $HTTP_HEALTH"
fi

# Check node info
NODE_INFO=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_nodeMetadata","params":[],"id":2}' \
  "$HTTP_ENDPOINT" 2>/dev/null)

if echo "$NODE_INFO" | grep -q '"result"'; then
  echo "[$TIMESTAMP] ✅ Node metadata: Available"
else
  echo "[$TIMESTAMP] ⚠️  Node metadata: Unavailable"
fi

# Check block info
BLOCK_INFO=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getHeader","params":[],"id":3}' \
  "$HTTP_ENDPOINT" 2>/dev/null)

BLOCK_NUMBER=$(echo "$BLOCK_INFO" | grep -o '"number":"0x[0-9a-f]*"' | cut -d'"' -f4)
if [ -n "$BLOCK_NUMBER" ]; then
  echo "[$TIMESTAMP] ✅ Latest block: $BLOCK_NUMBER"
else
  echo "[$TIMESTAMP] ⚠️  Block info: Unavailable"
fi

echo ""
