#!/bin/bash
# Demiurge Server Quick Reference
# Copy and paste commands below to manage the deployment

# ============================================================================
# MONITOR BLOCKCHAIN BUILD
# ============================================================================

# Check if build is complete
check_build() {
  ssh pleroma "docker images | grep demiurge-node-legacy && echo '✅ Image ready' || echo '⏳ Still building...'"
}

# Watch build in real-time (Ctrl+C to stop)
watch_build() {
  ssh pleroma "cd ~/demiurge && docker build -t demiurge-node-legacy:latest -f blockchain/Dockerfile . 2>&1 | tail -f" &
  PID=$!
  echo "Build is running (PID: $PID). Press Ctrl+C to detach (build continues on server)."
  wait $PID || true
  echo "Monitoring stopped. Build may still be running on server."
}

# ============================================================================
# START SERVICES (after build completes)
# ============================================================================

# Start all services (postgres, redis, blockchain node)
start_all() {
  ssh pleroma "cd ~/demiurge/docker && docker compose -f docker-compose.yml -f docker-compose.node.yml up -d"
}

# Start only blockchain node
start_node() {
  ssh pleroma "cd ~/demiurge/docker && docker compose -f docker-compose.node.yml up -d demiurge-node-legacy"
}

# Start core services without node
start_core() {
  ssh pleroma "cd ~/demiurge/docker && docker compose up -d postgres redis hub qor-auth"
}

# ============================================================================
# VERIFY SERVICES
# ============================================================================

# Check all container status
check_status() {
  echo "=== CONTAINERS ===" && \
  ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml ps" && \
  echo "" && echo "=== NODE STATUS ===" && \
  ssh pleroma "docker ps | grep demiurge-node-legacy || echo 'Node not running'"
}

# Check blockchain node health
check_node() {
  echo "Container status:" && \
  ssh pleroma "docker ps | grep demiurge-node-legacy" && \
  echo "" && echo "Node logs (last 30 lines):" && \
  ssh pleroma "docker logs demiurge-node-legacy | tail -30"
}

# Test RPC endpoints
test_rpc() {
  echo "Testing HTTP RPC..." && \
  ssh pleroma 'curl -s -X POST http://localhost:9933 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"system_chain\",\"params\":[],\"id\":1}" | jq .' && \
  echo "" && echo "Testing WebSocket..." && \
  ssh pleroma 'curl -s -w "\n" -d "{\"jsonrpc\":\"2.0\",\"method\":\"system_chain\",\"params\":[],\"id\":1}" http://localhost:9933 | jq .' 
}

# ============================================================================
# VIEW LOGS
# ============================================================================

# Node logs
node_logs() {
  ssh pleroma "docker logs -f demiurge-node-legacy"
}

# QOR Auth logs
qor_logs() {
  ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml logs -f qor-auth"
}

# Hub logs
hub_logs() {
  ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml logs -f hub"
}

# All logs
all_logs() {
  ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml logs -f"
}

# ============================================================================
# STOP & CLEANUP
# ============================================================================

# Stop all services
stop_all() {
  ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml down"
}

# Stop and remove volumes (⚠️ DELETES DATA)
stop_all_clean() {
  echo "⚠️  This will DELETE all data in postgres, redis, and node volumes!"
  read -p "Are you sure? (yes/no) " confirm
  if [ "$confirm" = "yes" ]; then
    ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml down -v"
  fi
}

# ============================================================================
# DATABASE ACCESS
# ============================================================================

# Connect to PostgreSQL CLI
psql_connect() {
  ssh pleroma "docker exec -it demiurge-postgres psql -U qor_auth -d qor_auth"
}

# Query PostgreSQL
psql_query() {
  local sql=$1
  ssh pleroma "docker exec demiurge-postgres psql -U qor_auth -d qor_auth -c \"$sql\""
}

# Connect to Redis CLI
redis_cli() {
  ssh pleroma "docker exec -it demiurge-redis redis-cli"
}

# ============================================================================
# DEPLOYMENT
# ============================================================================

# Re-deploy (pull latest, rebuild, restart)
redeploy() {
  echo "🔄 Pulling latest code..." && \
  ssh pleroma "cd ~/demiurge && git fetch origin && git reset --hard origin/main" && \
  echo "🔨 Rebuilding Docker image..." && \
  ssh pleroma "docker build -t demiurge-node-legacy:latest -f ~/demiurge/blockchain/Dockerfile ~/demiurge" && \
  echo "🚀 Restarting services..." && \
  ssh pleroma "cd ~/demiurge/docker && docker compose restart" && \
  echo "✅ Redeployed!"
}

# ============================================================================
# USAGE
# ============================================================================

if [ -z "$1" ]; then
  echo "Demiurge Server Management Commands"
  echo ""
  echo "MONITORING:"
  echo "  ./demiurge-server.sh check_build   - Check if blockchain build is done"
  echo "  ./demiurge-server.sh watch_build   - Watch build in real-time"
  echo ""
  echo "START SERVICES:"
  echo "  ./demiurge-server.sh start_all     - Start all services"
  echo "  ./demiurge-server.sh start_node    - Start only blockchain node"
  echo "  ./demiurge-server.sh start_core    - Start only core services"
  echo ""
  echo "VERIFY:"
  echo "  ./demiurge-server.sh check_status  - Check all container status"
  echo "  ./demiurge-server.sh check_node    - Check node health & logs"
  echo "  ./demiurge-server.sh test_rpc      - Test blockchain RPC"
  echo ""
  echo "LOGS:"
  echo "  ./demiurge-server.sh node_logs     - Stream node logs"
  echo "  ./demiurge-server.sh qor_logs      - Stream QOR Auth logs"
  echo "  ./demiurge-server.sh hub_logs      - Stream Hub logs"
  echo "  ./demiurge-server.sh all_logs      - Stream all logs"
  echo ""
  echo "DATABASE:"
  echo "  ./demiurge-server.sh psql_connect  - Connect to PostgreSQL CLI"
  echo "  ./demiurge-server.sh redis_cli     - Connect to Redis CLI"
  echo "  ./demiurge-server.sh psql_query \"SELECT ...\" - Run SQL query"
  echo ""
  echo "STOP:"
  echo "  ./demiurge-server.sh stop_all      - Stop all services"
  echo "  ./demiurge-server.sh stop_all_clean - Stop & delete all data (⚠️)"
  echo ""
  echo "DEPLOY:"
  echo "  ./demiurge-server.sh redeploy      - Rebuild & restart everything"
  echo ""
else
  $1
fi
