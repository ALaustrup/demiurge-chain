# Clean Server and Deploy Testnet
# Server: 51.210.209.112

$SERVER = "51.210.209.112"
$SERVER_USER = "root"
$REPO_DIR = "/opt/demiurge-blockchain"
$DATA_DIR = "/opt/demiurge-data"
$SERVICE_NAME = "demiurge-node"

Write-Host "🔥 Cleaning Server and Deploying Testnet" -ForegroundColor Cyan
Write-Host "The flame burns eternal. The code serves the will." -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop and remove old service
Write-Host "🛑 Stopping old service..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl stop ${SERVICE_NAME} 2>&1 | Out-Null; sudo systemctl disable ${SERVICE_NAME} 2>&1 | Out-Null; sudo rm -f /etc/systemd/system/${SERVICE_NAME}.service 2>&1 | Out-Null; sudo systemctl daemon-reload 2>&1 | Out-Null"

# Step 2: Remove old repository and data
Write-Host "🗑️  Removing old installations..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER}" "rm -rf ${REPO_DIR} 2>&1 | Out-Null; rm -rf ${DATA_DIR} 2>&1 | Out-Null; rm -rf /tmp/demiurge-* 2>&1 | Out-Null"

# Step 3: Remove old blockchain processes
Write-Host "🔍 Checking for old processes..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER}" "pkill -f demiurge-node 2>&1 | Out-Null; pkill -f substrate-node 2>&1 | Out-Null"

# Step 4: Clean up old Rust build artifacts (optional, saves space)
Write-Host "🧹 Cleaning old build artifacts..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER}" "rm -rf ~/.cargo/registry/cache 2>&1 | Out-Null"

# Step 5: Clone fresh repository
Write-Host "📥 Cloning fresh repository..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "git clone https://github.com/ALaustrup/demiurge-cloud.git ${REPO_DIR}"

# Step 6: Checkout main branch
Write-Host "🔀 Checking out main branch..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR} && git checkout main && git pull"

# Step 7: Install Rust if needed
Write-Host "🦀 Checking Rust installation..." -ForegroundColor Green
$rustCheck = ssh "${SERVER_USER}@${SERVER}" "command -v rustc 2>/dev/null"
if (-not $rustCheck) {
    Write-Host "   Installing Rust..." -ForegroundColor Yellow
    ssh "${SERVER_USER}@${SERVER}" "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
} else {
    Write-Host "   Rust already installed" -ForegroundColor Gray
}

# Step 8: Create data directory
Write-Host "📁 Creating data directory..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "mkdir -p ${DATA_DIR}"

# Step 9: Build framework
Write-Host "🔨 Building framework (this may take a while)..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR}/framework && source ~/.cargo/env && cargo build --release"

# Step 10: Verify binary exists
Write-Host "✅ Verifying binary..." -ForegroundColor Green
$binaryCheck = ssh "${SERVER_USER}@${SERVER}" "test -f ${REPO_DIR}/framework/target/release/demiurge-node && echo 'OK' || echo 'FAIL'"
if ($binaryCheck -ne "OK") {
    Write-Host "❌ Binary not found! Build may have failed." -ForegroundColor Red
    exit 1
}

# Step 11: Create systemd service
Write-Host "⚙️  Creating systemd service..." -ForegroundColor Green
$serviceContent = @"
[Unit]
Description=Demiurge-Cloud Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REPO_DIR}/framework
ExecStart=${REPO_DIR}/framework/target/release/demiurge-node --data-dir ${DATA_DIR} --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"@

ssh "${SERVER_USER}@${SERVER}" "echo '$serviceContent' | sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null"

# Step 12: Enable and start service
Write-Host "🚀 Starting service..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl daemon-reload"
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl enable ${SERVICE_NAME}"
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl start ${SERVICE_NAME}"

# Step 13: Wait a moment for service to start
Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 14: Check status
Write-Host "✅ Checking service status..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl status ${SERVICE_NAME} --no-pager -l"

# Step 15: Show logs
Write-Host ""
Write-Host "📋 Recent logs:" -ForegroundColor Cyan
ssh "${SERVER_USER}@${SERVER}" "sudo journalctl -u ${SERVICE_NAME} -n 20 --no-pager"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Cyan
Write-Host "RPC Endpoint: ws://$SERVER:9944" -ForegroundColor Yellow
Write-Host "P2P Address: /ip4/$SERVER/tcp/30333" -ForegroundColor Yellow
Write-Host "Data Directory: $DATA_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Gray
Write-Host "  Check status: ssh root@$SERVER 'sudo systemctl status demiurge-node'" -ForegroundColor Gray
Write-Host "  View logs: ssh root@$SERVER 'sudo journalctl -u demiurge-node -f'" -ForegroundColor Gray
Write-Host "  Restart: ssh root@$SERVER 'sudo systemctl restart demiurge-node'" -ForegroundColor Gray
