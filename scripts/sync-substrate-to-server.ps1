# Sync Substrate directory to server for Docker builds
# Usage: .\scripts\sync-substrate-to-server.ps1

$ErrorActionPreference = "Stop"

$server = "pleroma"
$serverPath = "/opt/demiurge-blockchain"
$localSubstrate = "substrate"

if (-not (Test-Path $localSubstrate)) {
    Write-Host "❌ Error: Substrate directory not found at $localSubstrate" -ForegroundColor Red
    Write-Host "   Please ensure the substrate folder exists in the repo root"
    exit 1
}

Write-Host "🔄 Syncing Substrate directory to server..." -ForegroundColor Cyan
Write-Host "   Source: $localSubstrate"
Write-Host "   Destination: ${server}:${serverPath}/substrate"
Write-Host ""

# Use rsync via SSH (requires rsync on Windows or WSL)
# Alternative: use scp -r for simpler copy
Write-Host "📦 Copying substrate directory..."
ssh $server "mkdir -p $serverPath/substrate"

# Use tar + ssh for efficient transfer
Write-Host "   Compressing and transferring..."
tar czf - --exclude='target' --exclude='.git' --exclude='*.lock' --exclude='Cargo.lock' $localSubstrate | ssh $server "cd $serverPath && tar xzf -"

Write-Host ""
Write-Host "✅ Substrate directory synced successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Build blockchain node: cd docker && docker compose build demiurge-node"
Write-Host "  2. Or start all services: docker compose up -d"
