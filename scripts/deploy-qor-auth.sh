#!/bin/bash
# Deploy QOR Auth Service to Production Server (51.210.209.112)
# This script builds and deploys the QOR Auth service to run continuously
# 
# For Windows users, use deploy-qor-auth.ps1 instead
# Or use Git Bash / WSL to run this script

set -e

SERVER_IP="51.210.209.112"
SERVER_USER="ubuntu"
SERVICE_NAME="qor-auth"
SERVICE_DIR="/opt/demiurge/qor-auth"
SERVICE_PORT=8080

echo "🚀 Deploying QOR Auth Service to $SERVER_IP..."

# Build the service locally
echo "📦 Building QOR Auth service..."
cd "$(dirname "$0")/../services/qor-auth"
cargo build --release

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="/tmp/qor-auth-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy binary
cp target/release/qor-auth "$DEPLOY_DIR/"
cp .env.example "$DEPLOY_DIR/.env.example"
cp Cargo.toml "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/" 2>/dev/null || true

# Create systemd service file
cat > "$DEPLOY_DIR/qor-auth.service" <<EOF
[Unit]
Description=QOR Auth Service - Demiurge-Cloud Authentication
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SERVICE_DIR
ExecStart=$SERVICE_DIR/qor-auth
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=qor-auth

# Environment variables
Environment="RUN_ENV=production"
Environment="QOR_AUTH__SERVER__HOST=0.0.0.0"
Environment="QOR_AUTH__SERVER__PORT=$SERVICE_PORT"

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Create deployment script
cat > "$DEPLOY_DIR/deploy.sh" <<'DEPLOYSCRIPT'
#!/bin/bash
set -e

SERVICE_NAME="qor-auth"
SERVICE_DIR="/opt/demiurge/qor-auth"
SERVICE_USER="ubuntu"

echo "📦 Installing QOR Auth service..."

# Create service directory
sudo mkdir -p "$SERVICE_DIR"
sudo chown $SERVICE_USER:$SERVICE_USER "$SERVICE_DIR"

# Copy files
cp qor-auth "$SERVICE_DIR/"
cp -r migrations "$SERVICE_DIR/" 2>/dev/null || true

# Set permissions
sudo chmod +x "$SERVICE_DIR/qor-auth"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$SERVICE_DIR"

# Install systemd service
sudo cp qor-auth.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

echo "✅ QOR Auth service installed!"
echo "📝 Next steps:"
echo "   1. Configure .env file at $SERVICE_DIR/.env"
echo "   2. Start service: sudo systemctl start $SERVICE_NAME"
echo "   3. Check status: sudo systemctl status $SERVICE_NAME"
echo "   4. View logs: sudo journalctl -u $SERVICE_NAME -f"
DEPLOYSCRIPT

chmod +x "$DEPLOY_DIR/deploy.sh"

# Create .env template for production
cat > "$DEPLOY_DIR/.env.production" <<ENVEOF
# QOR Auth Production Configuration
# Copy to $SERVICE_DIR/.env and update with actual values

RUN_ENV=production

# Server
QOR_AUTH__SERVER__HOST=0.0.0.0
QOR_AUTH__SERVER__PORT=$SERVICE_PORT

# Database (PostgreSQL)
QOR_AUTH__DATABASE__URL=postgres://qor_auth:CHANGE_ME@localhost:5432/qor_auth
QOR_AUTH__DATABASE__MAX_CONNECTIONS=20

# Redis
QOR_AUTH__REDIS__URL=redis://localhost:6379

# JWT Secrets (CHANGE THESE!)
QOR_AUTH__JWT__ACCESS_SECRET=CHANGE_ME_GENERATE_SECURE_RANDOM_STRING
QOR_AUTH__JWT__REFRESH_SECRET=CHANGE_ME_GENERATE_SECURE_RANDOM_STRING
QOR_AUTH__JWT__ACCESS_EXPIRY_SECS=900
QOR_AUTH__JWT__REFRESH_EXPIRY_SECS=2592000
QOR_AUTH__JWT__ISSUER=qor-auth

# Security
QOR_AUTH__SECURITY__MAX_LOGIN_ATTEMPTS=5
QOR_AUTH__SECURITY__LOCKOUT_DURATION_SECS=900
QOR_AUTH__SECURITY__MAX_SESSIONS=10
QOR_AUTH__SECURITY__PASSWORD_MIN_LENGTH=6

# Substrate RPC (for on-chain operations)
SUBSTRATE_RPC_URL=ws://localhost:9944
ENVEOF

# Create tarball
echo "📦 Creating deployment archive..."
cd /tmp
tar czf qor-auth-deploy.tar.gz -C "$DEPLOY_DIR" .

echo "📤 Uploading to server..."
scp qor-auth-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "🔧 Installing on server..."
ssh $SERVER_USER@$SERVER_IP <<REMOTESCRIPT
set -e
cd /tmp
rm -rf qor-auth-deploy
mkdir -p qor-auth-deploy
tar xzf qor-auth-deploy.tar.gz -C qor-auth-deploy
cd qor-auth-deploy
chmod +x deploy.sh
./deploy.sh
REMOTESCRIPT

echo "✅ Deployment complete!"
echo ""
echo "📝 To configure and start the service on the server:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo "   sudo nano /opt/demiurge/qor-auth/.env  # Configure environment"
echo "   sudo systemctl start qor-auth"
echo "   sudo systemctl status qor-auth"
