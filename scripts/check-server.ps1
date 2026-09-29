# Simple Server Status Check
$SERVER_HOST = "pleroma"

Write-Host "🔍 Checking server status for QOR Auth deployment..." -ForegroundColor Cyan
Write-Host ""

# Check Rust
Write-Host "📦 Checking Rust..." -ForegroundColor Yellow
try {
    $rust = ssh $SERVER_HOST "rustc --version"
    if ($rust -match "rustc") {
        Write-Host "   ✅ Rust installed: $rust" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Rust NOT installed" -ForegroundColor Red
}

# Check PostgreSQL
Write-Host ""
Write-Host "🐘 Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pg = ssh $SERVER_HOST "psql --version"
    if ($pg -match "psql") {
        Write-Host "   ✅ PostgreSQL installed: $pg" -ForegroundColor Green
        $pgStatus = ssh $SERVER_HOST "sudo systemctl is-active postgresql"
        if ($pgStatus -match "active") {
            Write-Host "   ✅ PostgreSQL running" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  PostgreSQL not running" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ PostgreSQL NOT installed" -ForegroundColor Red
}

# Check Redis
Write-Host ""
Write-Host "🔴 Checking Redis..." -ForegroundColor Yellow
try {
    $redis = ssh $SERVER_HOST "redis-cli --version"
    if ($redis -match "redis-cli") {
        Write-Host "   ✅ Redis installed: $redis" -ForegroundColor Green
        $redisStatus = ssh $SERVER_HOST "sudo systemctl is-active redis"
        if ($redisStatus -match "active") {
            Write-Host "   ✅ Redis running" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Redis not running" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ Redis NOT installed" -ForegroundColor Red
}

# Check QOR Auth
Write-Host ""
Write-Host "🔐 Checking QOR Auth..." -ForegroundColor Yellow
$serviceCheck = ssh $SERVER_HOST "sudo systemctl list-units --type=service --all | grep qor-auth"
if ($serviceCheck) {
    Write-Host "   ✅ QOR Auth service installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ QOR Auth service NOT installed" -ForegroundColor Red
}

$binaryCheck = ssh $SERVER_HOST "ls /opt/demiurge/qor-auth/qor-auth 2>/dev/null"
if ($binaryCheck -match "qor-auth") {
    Write-Host "   ✅ QOR Auth binary exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ QOR Auth binary NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 RECOMMENDED NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Best approach: Build locally and deploy (no Rust needed on server)" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Install dependencies on server:" -ForegroundColor White
Write-Host "   ssh $SERVER_HOST" -ForegroundColor Cyan
Write-Host "   sudo apt update" -ForegroundColor Cyan
Write-Host "   sudo apt install postgresql postgresql-contrib redis-server -y" -ForegroundColor Cyan
Write-Host "   sudo systemctl start postgresql redis" -ForegroundColor Cyan
Write-Host "   sudo systemctl enable postgresql redis" -ForegroundColor Cyan
Write-Host "   sudo -u postgres createuser -s qor_auth" -ForegroundColor Cyan
Write-Host "   sudo -u postgres createdb qor_auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Deploy QOR Auth from Windows:" -ForegroundColor White
Write-Host "   cd scripts" -ForegroundColor Cyan
Write-Host "   .\deploy-qor-auth.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configure and start:" -ForegroundColor White
Write-Host "   ssh $SERVER_HOST" -ForegroundColor Cyan
Write-Host "   sudo nano /opt/demiurge/qor-auth/.env" -ForegroundColor Cyan
Write-Host "   sudo systemctl start qor-auth" -ForegroundColor Cyan
Write-Host "   sudo systemctl enable qor-auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "See docs/DEPLOYMENT_CHECKLIST.md for detailed instructions" -ForegroundColor Gray
