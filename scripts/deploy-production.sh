#!/bin/bash
# Demiurge Production Deployment Script
# Run on Monad (51.210.209.112) to deploy the full stack
#
# Usage: ./scripts/deploy-production.sh

set -e

PROJECT_DIR="/data/Demiurge-Blockchain"
DOCKER_COMPOSE="$PROJECT_DIR/docker/docker-compose.production.yml"

echo "=========================================="
echo "  Demiurge Production Deployment"
echo "=========================================="

# Step 1: Pull latest code
echo ""
echo "Step 1: Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# Step 2: Check secrets exist
echo ""
echo "Step 2: Verifying secrets..."
SECRETS_DIR="$PROJECT_DIR/config/production/secrets"
if [ ! -f "$SECRETS_DIR/postgres_password" ]; then
    echo "ERROR: postgres_password not found in $SECRETS_DIR"
    echo "Please create the secrets first. See $SECRETS_DIR/README.md"
    exit 1
fi
echo "Secrets verified."

# Step 3: Build and deploy with Docker Compose
echo ""
echo "Step 3: Building containers..."
docker compose -f "$DOCKER_COMPOSE" build

echo ""
echo "Step 4: Deploying containers..."
docker compose -f "$DOCKER_COMPOSE" up -d

# Step 5: Wait for services to be healthy
echo ""
echo "Step 5: Waiting for services to be healthy..."
sleep 10

# Step 6: Check service status
echo ""
echo "Step 6: Checking service status..."
docker compose -f "$DOCKER_COMPOSE" ps

# Step 7: Check nginx config
echo ""
echo "Step 7: Testing nginx configuration..."
docker exec demiurge-nginx nginx -t

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  - nginx (reverse proxy): ports 80, 443"
echo "  - hub (Next.js): internal port 3000"
echo "  - qor-auth (Rust): internal port 8080"
echo "  - postgres: internal port 5432"
echo "  - redis: internal port 6379"
echo ""
echo "To view logs:"
echo "  docker compose -f $DOCKER_COMPOSE logs -f"
echo ""
echo "To restart a service:"
echo "  docker compose -f $DOCKER_COMPOSE restart <service>"
echo ""
