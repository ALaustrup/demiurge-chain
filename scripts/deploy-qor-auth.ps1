# Deploy QOR Auth Service to Production Server (51.210.209.112)
# PowerShell version for Windows - Builds on server

$ErrorActionPreference = "Stop"

# Use SSH config hostname if available, otherwise use IP
$SERVER_HOST = "pleroma"  # Uses SSH config: ~/.ssh/config maps 'pleroma' to 51.210.209.112
$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$SERVICE_NAME = "qor-auth"
$SERVICE_DIR = "/opt/demiurge/qor-auth"
$SERVICE_PORT = 8080

Write-Host "Deploying QOR Auth Service to $SERVER_HOST ($SERVER_IP)..." -ForegroundColor Cyan

# Check SSH connection first
Write-Host "Checking SSH connection..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_HOST" "echo 'SSH OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Write-Host "SSH connection successful (using SSH config: $SERVER_HOST)" -ForegroundColor Green
} catch {
    Write-Host "SSH connection failed with config hostname, trying direct IP..." -ForegroundColor Yellow
    try {
        $sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "SSH connection failed"
        }
        Write-Host "SSH connection successful (using direct IP)" -ForegroundColor Green
        $SERVER_HOST = "$SERVER_USER@$SERVER_IP"
    } catch {
        Write-Host "SSH connection failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Your SSH key is: $env:USERPROFILE\.ssh\id_ed25519_pleroma.pub" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To add your public key to the server:" -ForegroundColor Yellow
        Write-Host "  type $env:USERPROFILE\.ssh\id_ed25519_pleroma.pub | ssh $SERVER_USER@$SERVER_IP 'mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'" -ForegroundColor Cyan
        exit 1
    }
}

# Prepare source code for upload
Write-Host "Preparing source code..." -ForegroundColor Yellow
$servicePath = Join-Path $PSScriptRoot "..\services\qor-auth"
$tempArchive = Join-Path $env:TEMP "qor-auth-src.tar.gz"

Set-Location $servicePath

# Create archive excluding build artifacts
Write-Host "Creating source archive..." -ForegroundColor Yellow
tar -czf $tempArchive --exclude='target' --exclude='.git' --exclude='*.exe' * 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "tar failed, trying alternative method..." -ForegroundColor Yellow
    # Fallback: use 7zip or create zip
    $tempArchive = Join-Path $env:TEMP "qor-auth-src.zip"
    Get-ChildItem -Path . -Exclude target,.git | Compress-Archive -DestinationPath $tempArchive -Force
    Write-Host "Created ZIP archive (will need manual extraction on server)" -ForegroundColor Yellow
}

# Upload and build on server
Write-Host "Uploading source code to server..." -ForegroundColor Yellow
scp $tempArchive "${SERVER_HOST}:/tmp/qor-auth-src.tar.gz"

Write-Host "Building on server (this may take a few minutes)..." -ForegroundColor Yellow
$buildCmd = "cd /tmp && rm -rf qor-auth-src qor-auth-build && mkdir -p qor-auth-build && tar xzf qor-auth-src.tar.gz -C qor-auth-build 2>/dev/null || (unzip -q qor-auth-src.tar.gz -d qor-auth-build 2>/dev/null || true) && cd qor-auth-build && if ! command -v cargo &> /dev/null || rustc --version | grep -q '1.85'; then echo 'Installing/updating Rust...' && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source ~/.cargo/env && rustup default stable && rustup update stable; fi && echo 'Building QOR Auth service...' && cargo build --release && sudo mkdir -p $SERVICE_DIR && sudo chown ubuntu:ubuntu $SERVICE_DIR && cp target/release/qor-auth $SERVICE_DIR/ && ([ -d migrations ] && cp -r migrations $SERVICE_DIR/ || true) && sudo chmod +x $SERVICE_DIR/qor-auth && sudo chown -R ubuntu:ubuntu $SERVICE_DIR"

ssh "$SERVER_HOST" $buildCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed on server!" -ForegroundColor Red
    exit 1
}

# Create and upload systemd service file
Write-Host "Configuring systemd service..." -ForegroundColor Yellow
$serviceFileContent = @"
[Unit]
Description=QOR Auth Service - Demiurge-Cloud Authentication
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=ubuntu
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
"@

$serviceFileContent | Out-File -FilePath (Join-Path $env:TEMP "qor-auth.service") -Encoding UTF8 -NoNewline
scp (Join-Path $env:TEMP "qor-auth.service") "${SERVER_HOST}:/tmp/"

# Install systemd service
Write-Host "Installing systemd service..." -ForegroundColor Yellow
ssh "$SERVER_HOST" "sudo cp /tmp/qor-auth.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable $SERVICE_NAME"

# Create .env production template
Write-Host "Creating .env template..." -ForegroundColor Yellow
$envTemplateContent = @"
# QOR Auth Production Configuration
RUN_ENV=production

# Server
QOR_AUTH__SERVER__HOST=0.0.0.0
QOR_AUTH__SERVER__PORT=$SERVICE_PORT

# Database (PostgreSQL)
QOR_AUTH__DATABASE__URL=postgres://qor_auth@localhost:5432/qor_auth
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
"@

$envTemplateContent | Out-File -FilePath (Join-Path $env:TEMP ".env.production") -Encoding UTF8 -NoNewline
scp (Join-Path $env:TEMP ".env.production") "${SERVER_HOST}:/tmp/"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. SSH to server: ssh $SERVER_HOST" -ForegroundColor White
Write-Host "  2. Configure environment:" -ForegroundColor White
Write-Host "     sudo cp /tmp/.env.production $SERVICE_DIR/.env" -ForegroundColor Yellow
Write-Host "     sudo nano $SERVICE_DIR/.env" -ForegroundColor Yellow
Write-Host "     (Update JWT secrets and database password)" -ForegroundColor Gray
Write-Host "  3. Run database migrations:" -ForegroundColor White
Write-Host "     cd $SERVICE_DIR && ./qor-auth migrate" -ForegroundColor Yellow
Write-Host "  4. Start service:" -ForegroundColor White
Write-Host "     sudo systemctl start $SERVICE_NAME" -ForegroundColor Yellow
Write-Host "  5. Check status:" -ForegroundColor White
Write-Host "     sudo systemctl status $SERVICE_NAME" -ForegroundColor Yellow
Write-Host "  6. View logs:" -ForegroundColor White
Write-Host "     sudo journalctl -u $SERVICE_NAME -f" -ForegroundColor Yellow
