# Simple Server Status Check - QOR Auth Deployment Readiness
# This script checks what's installed on the server

$SERVER_HOST = "pleroma"

Write-Host "🔍 Checking server status..." -ForegroundColor Cyan
Write-Host ""

# Check Rust
Write-Host "📦 Rust:" -ForegroundColor Yellow
$rust = ssh $SERVER_HOST "rustc --version 2>&1"
if ($rust -match "rustc") {
    Write-Host "   ✅ Installed: $rust" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT installed" -ForegroundColor Red
}

# Check PostgreSQL
Write-Host ""
Write-Host "🐘 PostgreSQL:" -ForegroundColor Yellow
$pg = ssh $SERVER_HOST "psql --version 2>&1"
if ($pg -match "psql") {
    Write-Host "   ✅ Installed: $pg" -ForegroundColor Green
    $pgRunning = ssh $SERVER_HOST "sudo systemctl is-active postgresql 2>&1"
    if ($pgRunning -match "active") {
        Write-Host "   ✅ Running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not running" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ NOT installed" -ForegroundColor Red
}

# Check Redis
Write-Host ""
Write-Host "🔴 Redis:" -ForegroundColor Yellow
$redis = ssh $SERVER_HOST "redis-cli --version 2>&1"
if ($redis -match "redis-cli") {
    Write-Host "   ✅ Installed: $redis" -ForegroundColor Green
    $redisRunning = ssh $SERVER_HOST "sudo systemctl is-active redis 2>&1"
    if ($redisRunning -match "active") {
        Write-Host "   ✅ Running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not running" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ NOT installed" -ForegroundColor Red
}

# Check QOR Auth
Write-Host ""
Write-Host "🔐 QOR Auth:" -ForegroundColor Yellow
$service = ssh $SERVER_HOST "sudo systemctl list-units --type=service --all 2>&1 | grep qor-auth"
if ($service) {
    Write-Host "   ✅ Service installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Service NOT installed" -ForegroundColor Red
}

$binary = ssh $SERVER_HOST "test -f /opt/demiurge/qor-auth/qor-auth && echo EXISTS || echo NOT_FOUND"
if ($binary -match "EXISTS") {
    Write-Host "   ✅ Binary exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Binary NOT found" -ForegroundColor Red
}

# Check port 8080
Write-Host ""
Write-Host "🌐 Port 8080:" -ForegroundColor Yellow
$port = ssh $SERVER_HOST "sudo ss -tlnp 2>&1 | grep :8080"
if ($port) {
    Write-Host "   ⚠️  In use: $port" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Available" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 RECOMMENDED NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install dependencies (if needed):" -ForegroundColor White
Write-Host "   ssh $SERVER_HOST 'sudo apt update; sudo apt install postgresql redis-server -y'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start services:" -ForegroundColor White
Write-Host "   ssh $SERVER_HOST 'sudo systemctl start postgresql redis; sudo systemctl enable postgresql redis'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Deploy QOR Auth:" -ForegroundColor White
Write-Host "   cd scripts" -ForegroundColor Cyan
Write-Host "   .\deploy-qor-auth.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Configure and start:" -ForegroundColor White
Write-Host "   ssh $SERVER_HOST" -ForegroundColor Cyan
Write-Host "   sudo nano /opt/demiurge/qor-auth/.env" -ForegroundColor Cyan
Write-Host "   sudo systemctl start qor-auth" -ForegroundColor Cyan
