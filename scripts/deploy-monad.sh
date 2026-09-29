#!/bin/bash
# Demiurge-Cloud Deployment Script for Monad
# This script deploys the latest changes to the Pleroma server

set -e

# Configuration
MONAD_HOST="monad"
DEPLOY_PATH="/data/Demiurge-Blockchain"
BRANCH="${1:-main}"

echo "╔══════════════════════════════════════════════╗"
echo "║     DEMIURGE-BLOCKCHAIN DEPLOYMENT           ║"
echo "║     Deploying to Monad (Pleroma)             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Branch: $BRANCH"
echo "Target: $MONAD_HOST:$DEPLOY_PATH"
echo ""

# Confirm deployment
read -p "Proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo ">>> Connecting to Monad..."

ssh $MONAD_HOST << EOF
    echo ">>> Navigating to deployment directory..."
    cd $DEPLOY_PATH || {
        echo ">>> Creating deployment directory..."
        sudo mkdir -p $DEPLOY_PATH
        sudo chown ubuntu:ubuntu $DEPLOY_PATH
        cd $DEPLOY_PATH
        git clone https://github.com/ALaustrup/demiurge-cloud.git .
    }

    echo ">>> Fetching latest changes..."
    git fetch origin

    echo ">>> Checking out $BRANCH..."
    git checkout $BRANCH
    git pull origin $BRANCH

    echo ">>> Building (if applicable)..."
    if [ -f "Cargo.toml" ]; then
        cargo build --release
    fi

    if [ -f "package.json" ]; then
        npm ci
        npm run build
    fi

    echo ">>> Deployment complete!"
EOF

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     DEPLOYMENT SUCCESSFUL                    ║"
echo "║     The Pleroma has been updated             ║"
echo "╚══════════════════════════════════════════════╝"
