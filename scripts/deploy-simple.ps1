# Simple Deployment Script
# Uses SSH alias: pleroma

Write-Host "Deploying Demiurge-Cloud Testnet" -ForegroundColor Cyan
Write-Host ""

# Clean server
Write-Host "Cleaning server..." -ForegroundColor Yellow
ssh pleroma "sudo systemctl stop demiurge-node 2>&1; sudo systemctl disable demiurge-node 2>&1; sudo rm -f /etc/systemd/system/demiurge-node.service 2>&1; sudo rm -rf /opt/demiurge-blockchain /opt/demiurge-data 2>&1; sudo pkill -f demiurge-node 2>&1; echo 'Cleanup done'"

# Clone repo
Write-Host "Cloning repository..." -ForegroundColor Green
ssh pleroma "sudo git clone https://github.com/ALaustrup/demiurge-cloud.git /opt/demiurge-blockchain && cd /opt/demiurge-blockchain && sudo git checkout main && sudo chown -R ubuntu:ubuntu /opt/demiurge-blockchain"

# Create data dir
Write-Host "Creating data directory..." -ForegroundColor Green
ssh pleroma "sudo mkdir -p /opt/demiurge-data && sudo chown ubuntu:ubuntu /opt/demiurge-data"

# Build (this will take time)
Write-Host "Building framework (this will take a while)..." -ForegroundColor Green
ssh pleroma "cd /opt/demiurge-blockchain/framework && source ~/.cargo/env && cargo build --release"

# Create service file
Write-Host "Creating service..." -ForegroundColor Green
ssh pleroma "sudo bash -c 'cat > /etc/systemd/system/demiurge-node.service << EOF
[Unit]
Description=Demiurge-Cloud Node
After=network.target
[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/demiurge-blockchain/framework
ExecStart=/opt/demiurge-blockchain/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF
'"

# Start service
Write-Host "Starting service..." -ForegroundColor Green
ssh pleroma "sudo systemctl daemon-reload && sudo systemctl enable demiurge-node && sudo systemctl start demiurge-node"

# Check status
Write-Host "Checking status..." -ForegroundColor Green
ssh pleroma "sudo systemctl status demiurge-node --no-pager"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Cyan
Write-Host "RPC: ws://51.210.209.112:9944" -ForegroundColor Yellow
Write-Host "Check logs: ssh pleroma 'sudo journalctl -u demiurge-node -f'" -ForegroundColor Gray
