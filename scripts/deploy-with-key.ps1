# Deploy Testnet with SSH Key
# Server: 51.210.209.112
# SSH Key: C:\Users\Gnosis\.ssh

$SERVER = "51.210.209.112"
$SERVER_USER = "root"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
$REPO_DIR = "/opt/demiurge-blockchain"
$DATA_DIR = "/opt/demiurge-data"
$SERVICE_NAME = "demiurge-node"

Write-Host "🔥 Cleaning Server and Deploying Testnet" -ForegroundColor Cyan
Write-Host "The flame burns eternal. The code serves the will." -ForegroundColor Yellow
Write-Host ""

# Check SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ SSH key not found at: $SSH_KEY" -ForegroundColor Red
    Write-Host "Please ensure your SSH key is available." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Using SSH key: $SSH_KEY" -ForegroundColor Green
Write-Host ""

# Function to run SSH commands
function Invoke-SSH {
    param([string]$Command)
    ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" $Command
}

# Step 1: Stop and remove old service
Write-Host "🛑 Stopping old service..." -ForegroundColor Yellow
Invoke-SSH "sudo systemctl stop ${SERVICE_NAME} 2>&1; sudo systemctl disable ${SERVICE_NAME} 2>&1; sudo rm -f /etc/systemd/system/${SERVICE_NAME}.service 2>&1; sudo systemctl daemon-reload 2>&1"

# Step 2: Remove old repository and data
Write-Host "🗑️  Removing old installations..." -ForegroundColor Yellow
Invoke-SSH "rm -rf ${REPO_DIR} 2>&1; rm -rf ${DATA_DIR} 2>&1; rm -rf /tmp/demiurge-* 2>&1"

# Step 3: Remove old blockchain processes
Write-Host "🔍 Checking for old processes..." -ForegroundColor Yellow
Invoke-SSH "pkill -f demiurge-node 2>&1; pkill -f substrate-node 2>&1"

# Step 4: Clone fresh repository
Write-Host "📥 Cloning fresh repository..." -ForegroundColor Green
Invoke-SSH "git clone https://github.com/ALaustrup/demiurge-cloud.git ${REPO_DIR}"

# Step 5: Checkout main branch
Write-Host "🔀 Checking out main branch..." -ForegroundColor Green
Invoke-SSH "cd ${REPO_DIR} && git checkout main && git pull"

# Step 6: Install Rust if needed
Write-Host "🦀 Checking Rust installation..." -ForegroundColor Green
$rustCheck = Invoke-SSH "command -v rustc 2>/dev/null"
if (-not $rustCheck) {
    Write-Host "   Installing Rust..." -ForegroundColor Yellow
    Invoke-SSH "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
} else {
    Write-Host "   Rust already installed" -ForegroundColor Gray
}

# Step 7: Create data directory
Write-Host "📁 Creating data directory..." -ForegroundColor Green
Invoke-SSH "mkdir -p ${DATA_DIR}"

# Step 8: Build framework
Write-Host "🔨 Building framework (this may take a while)..." -ForegroundColor Green
Invoke-SSH "cd ${REPO_DIR}/framework && source ~/.cargo/env && cargo build --release"

# Step 9: Verify binary exists
Write-Host "✅ Verifying binary..." -ForegroundColor Green
$binaryCheck = Invoke-SSH "test -f ${REPO_DIR}/framework/target/release/demiurge-node && echo OK"
if ($binaryCheck -notmatch "OK") {
    Write-Host "❌ Binary not found! Build may have failed." -ForegroundColor Red
    exit 1
}

# Step 10: Create systemd service
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

Invoke-SSH "echo '$serviceContent' | sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null"

# Step 11: Enable and start service
Write-Host "🚀 Starting service..." -ForegroundColor Green
Invoke-SSH "sudo systemctl daemon-reload"
Invoke-SSH "sudo systemctl enable ${SERVICE_NAME}"
Invoke-SSH "sudo systemctl start ${SERVICE_NAME}"

# Step 12: Wait for service to start
Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 13: Check status
Write-Host "✅ Checking service status..." -ForegroundColor Green
Invoke-SSH "sudo systemctl status ${SERVICE_NAME} --no-pager -l"

# Step 14: Show logs
Write-Host ""
Write-Host "📋 Recent logs:" -ForegroundColor Cyan
Invoke-SSH "sudo journalctl -u ${SERVICE_NAME} -n 20 --no-pager"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Cyan
Write-Host "RPC Endpoint: ws://$SERVER:9944" -ForegroundColor Yellow
Write-Host "P2P Address: /ip4/$SERVER/tcp/30333" -ForegroundColor Yellow
Write-Host "Data Directory: $DATA_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Gray
Write-Host "  Check status: ssh -i $SSH_KEY root@$SERVER 'sudo systemctl status demiurge-node'" -ForegroundColor Gray
Write-Host "  View logs: ssh -i $SSH_KEY root@$SERVER 'sudo journalctl -u demiurge-node -f'" -ForegroundColor Gray
Write-Host "  Restart: ssh -i $SSH_KEY root@$SERVER 'sudo systemctl restart demiurge-node'" -ForegroundColor Gray
