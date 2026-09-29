# Complete Testnet Deployment Script
# Deploys both blockchain node and frontend to server
# Server: 51.210.209.112

$SERVER = "51.210.209.112"
$SERVER_USER = "ubuntu"
$SSH_KEY = "C:\Users\Gnosis\.ssh\id_ed25519_pleroma"
$REPO_DIR = "/opt/demiurge-blockchain"
$DATA_DIR = "/opt/demiurge-data"
$NODE_SERVICE = "demiurge-node"
$RPC_PORT = "9944"
$P2P_PORT = "30333"
$FRONTEND_PORT = "3000"

Write-Host " Deploying Demiurge-Cloud Testnet (Complete)" -ForegroundColor Cyan
Write-Host 'The flame burns eternal. The code serves the will.' -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop existing services
Write-Host " Stopping existing services..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo systemctl stop ${NODE_SERVICE} 2>&1 || true; sudo docker stop demiurge-hub 2>&1 || true; sudo docker rm demiurge-hub 2>&1 || true"

# Step 2: Clean old deployment
Write-Host " Cleaning old deployment..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo rm -rf ${REPO_DIR} ${DATA_DIR} || true; sudo mkdir -p ${DATA_DIR}; sudo chmod 755 ${DATA_DIR}"

# Step 3: Clone repository (with sudo, then fix permissions)
Write-Host " Cloning repository..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo git clone https://github.com/ALaustrup/demiurge-cloud.git ${REPO_DIR}; sudo chown -R ${SERVER_USER}:${SERVER_USER} ${REPO_DIR}"

# Step 4: Checkout correct branch
Write-Host " Checking out branch..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR}; git checkout main; git pull"

# Step 5: Install Rust if needed (Rust already installed, skip)
Write-Host " Rust already installed, skipping..." -ForegroundColor Green

# Step 6: Build blockchain node
Write-Host " Building blockchain node (this may take 10-20 minutes)..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR}/framework && source ~/.cargo/env && cargo build --release"

# Step 7: Create systemd service for blockchain node
Write-Host "  Creating blockchain node service..." -ForegroundColor Green
$serviceLines = @(
    "[Unit]",
    "Description=Demiurge-Cloud Node",
    "After=network.target",
    "",
    "[Service]",
    "Type=simple",
    "User=ubuntu",
    "WorkingDirectory=$REPO_DIR/framework",
    "ExecStart=$REPO_DIR/framework/target/release/demiurge-node --data-dir $DATA_DIR --rpc-addr 0.0.0.0:$RPC_PORT --p2p-addr 0.0.0.0:$P2P_PORT",
    "Restart=always",
    "RestartSec=10",
    "StandardOutput=journal",
    "StandardError=journal",
    "",
    "[Install]",
    "WantedBy=multi-user.target"
)
$serviceContent = $serviceLines -join "`n"
# Use base64 encoding to avoid quote escaping issues
$serviceContentBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($serviceContent))
$serviceCommand = "echo $serviceContentBase64 | base64 -d | sudo tee /etc/systemd/system/$NODE_SERVICE.service > /dev/null"
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" $serviceCommand

# Step 8: Start blockchain node
Write-Host " Starting blockchain node..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo systemctl daemon-reload; sudo systemctl enable ${NODE_SERVICE}; sudo systemctl start ${NODE_SERVICE}"

# Step 9: Wait for node to start
Write-Host " Waiting for node to initialize (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 10: Check node status
Write-Host " Checking node status..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo systemctl status ${NODE_SERVICE} --no-pager -l"

# Step 11: Install Node.js if needed
Write-Host " Checking Node.js installation..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "command -v node > /dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs)"

# Step 12: Install Docker if needed
Write-Host " Checking Docker installation..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "command -v docker > /dev/null || (curl -fsSL https://get.docker.com | sudo sh)"

# Step 13: Build frontend Docker image
Write-Host "  Building frontend Docker image..." -ForegroundColor Green
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR} && sudo docker build -f apps/hub/Dockerfile -t demiurge-hub:latest ."

# Step 14: Create frontend environment file
Write-Host " Creating frontend environment configuration..." -ForegroundColor Green
$envLines = @(
    "NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:$RPC_PORT",
    "NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:8080/api/v1",
    "NODE_ENV=production",
    "PORT=$FRONTEND_PORT"
)
$envContent = $envLines -join "`n"
# Use base64 encoding to avoid quote escaping issues
$envContentBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($envContent))
$envCommand = "echo $envContentBase64 | base64 -d | tee $REPO_DIR/apps/hub/.env.production > /dev/null"
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" $envCommand

# Step 15: Run frontend container
Write-Host " Starting frontend container..." -ForegroundColor Green
$dockerPort = "${FRONTEND_PORT}:${FRONTEND_PORT}"
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER}" "sudo docker run -d --name demiurge-hub --restart unless-stopped -p $dockerPort --env-file $REPO_DIR/apps/hub/.env.production -v $REPO_DIR/apps/hub:/app demiurge-hub:latest"

# Step 16: Display connection info
Write-Host ""
Write-Host " Deployment Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Information:" -ForegroundColor Yellow
Write-Host "  Blockchain RPC: http://${SERVER}:${RPC_PORT}" -ForegroundColor White
Write-Host "  Frontend: http://${SERVER}:${FRONTEND_PORT}" -ForegroundColor White
Write-Host "  P2P: /ip4/${SERVER}/tcp/${P2P_PORT}" -ForegroundColor White
Write-Host ""
Write-Host "Monitoring Commands:" -ForegroundColor Yellow
Write-Host "  Node logs: ssh ${SERVER_USER}@${SERVER} journalctl -u ${NODE_SERVICE} -f" -ForegroundColor Gray
Write-Host "  Frontend logs: ssh ${SERVER_USER}@${SERVER} docker logs -f demiurge-hub" -ForegroundColor Gray
Write-Host "  Node status: ssh ${SERVER_USER}@${SERVER} systemctl status ${NODE_SERVICE}" -ForegroundColor Gray
Write-Host ""
Write-Host "The flame burns eternal. The code serves the will." -ForegroundColor Cyan
