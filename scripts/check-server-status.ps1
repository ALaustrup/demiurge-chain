# Check Server Status - QOR Auth Deployment Readiness
# This script checks what's installed on the server and provides recommendations

$SERVER_HOST = "pleroma"  # Uses SSH config

Write-Host "🔍 Checking server status for QOR Auth deployment..." -ForegroundColor Cyan
Write-Host ""

# Check Rust installation
Write-Host "📦 Checking Rust installation..." -ForegroundColor Yellow
$rustCheck = ssh $SERVER_HOST 'bash -c "command -v rustc >/dev/null 2>&1 && rustc --version || echo NOT_INSTALLED; command -v cargo >/dev/null 2>&1 && cargo --version || echo NOT_INSTALLED"' 2>&1
if ($rustCheck -match "rustc version" -or $rustCheck -match "cargo version") {
    Write-Host "✅ Rust is installed" -ForegroundColor Green
    $rustInstalled = $true
} else {
    Write-Host "❌ Rust is NOT installed" -ForegroundColor Red
    $rustInstalled = $false
}

# Check PostgreSQL
Write-Host ""
Write-Host "🐘 Checking PostgreSQL..." -ForegroundColor Yellow
$pgCheck = ssh $SERVER_HOST 'bash -c "command -v psql >/dev/null 2>&1 && psql --version || echo NOT_INSTALLED; sudo systemctl is-active postgresql 2>/dev/null || echo NOT_RUNNING"' 2>&1
if ($pgCheck -match "psql.*version") {
    Write-Host "✅ PostgreSQL is installed" -ForegroundColor Green
    if ($pgCheck -match "active") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
        $pgInstalled = $true
        $pgRunning = $true
    } else {
        Write-Host "⚠️  PostgreSQL is installed but not running" -ForegroundColor Yellow
        $pgInstalled = $true
        $pgRunning = $false
    }
} else {
    Write-Host "❌ PostgreSQL is NOT installed" -ForegroundColor Red
    $pgInstalled = $false
    $pgRunning = $false
}

# Check Redis
Write-Host ""
Write-Host "🔴 Checking Redis..." -ForegroundColor Yellow
$redisCmd = 'bash -c "command -v redis-cli >/dev/null 2>&1 `&`& redis-cli --version || echo NOT_INSTALLED; sudo systemctl is-active redis 2>/dev/null || echo NOT_RUNNING"'
$redisCheck = ssh $SERVER_HOST $redisCmd 2>&1
if ($redisCheck -match "redis-cli") {
    Write-Host "✅ Redis is installed" -ForegroundColor Green
    if ($redisCheck -match "active") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
        $redisInstalled = $true
        $redisRunning = $true
    } else {
        Write-Host "⚠️  Redis is installed but not running" -ForegroundColor Yellow
        $redisInstalled = $true
        $redisRunning = $false
    }
} else {
    Write-Host "❌ Redis is NOT installed" -ForegroundColor Red
    $redisInstalled = $false
    $redisRunning = $false
}

# Check if QOR Auth service is already installed
Write-Host ""
Write-Host "🔐 Checking QOR Auth service..." -ForegroundColor Yellow
$serviceCheck = ssh $SERVER_HOST 'bash -c "sudo systemctl list-units --type=service --all 2>/dev/null | grep qor-auth || echo NOT_INSTALLED; test -f /opt/demiurge/qor-auth/qor-auth && echo BINARY_EXISTS || echo NO_BINARY"' 2>&1
if ($serviceCheck -match "qor-auth.service") {
    Write-Host "✅ QOR Auth service is installed" -ForegroundColor Green
    $serviceInstalled = $true
} else {
    Write-Host "❌ QOR Auth service is NOT installed" -ForegroundColor Red
    $serviceInstalled = $false
}

if ($serviceCheck -match "BINARY_EXISTS") {
    Write-Host "✅ QOR Auth binary exists" -ForegroundColor Green
    $binaryExists = $true
} else {
    Write-Host "❌ QOR Auth binary does NOT exist" -ForegroundColor Red
    $binaryExists = $false
}

# Check port 8080
Write-Host ""
Write-Host "🌐 Checking port 8080..." -ForegroundColor Yellow
$portCheck = ssh $SERVER_HOST 'bash -c "sudo netstat -tlnp 2>/dev/null | grep :8080 || sudo ss -tlnp 2>/dev/null | grep :8080 || echo PORT_FREE"' 2>&1
if ($portCheck -match ":8080") {
    Write-Host "⚠️  Port 8080 is already in use" -ForegroundColor Yellow
    Write-Host "   $portCheck" -ForegroundColor Gray
    $portFree = $false
} else {
    Write-Host "✅ Port 8080 is available" -ForegroundColor Green
    $portFree = $true
}

# Summary and Recommendations
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 SERVER STATUS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$recommendations = @()

if (-not $rustInstalled) {
    Write-Host "⚠️  Rust: NOT INSTALLED" -ForegroundColor Yellow
    Write-Host "   → Recommendation: Build locally and deploy binary (recommended)" -ForegroundColor Gray
    Write-Host "   → OR install Rust on server: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" -ForegroundColor Gray
    $recommendations += "Build locally and deploy"
} else {
    Write-Host "✅ Rust: INSTALLED" -ForegroundColor Green
    $recommendations += "Can build on server OR locally"
}

if (-not $pgInstalled) {
    Write-Host "❌ PostgreSQL: NOT INSTALLED" -ForegroundColor Red
    $recommendations += "Install PostgreSQL"
} elseif (-not $pgRunning) {
    Write-Host "⚠️  PostgreSQL: INSTALLED but NOT RUNNING" -ForegroundColor Yellow
    $recommendations += "Start PostgreSQL"
} else {
    Write-Host "✅ PostgreSQL: INSTALLED and RUNNING" -ForegroundColor Green
}

if (-not $redisInstalled) {
    Write-Host "❌ Redis: NOT INSTALLED" -ForegroundColor Red
    $recommendations += "Install Redis"
} elseif (-not $redisRunning) {
    Write-Host "⚠️  Redis: INSTALLED but NOT RUNNING" -ForegroundColor Yellow
    $recommendations += "Start Redis"
} else {
    Write-Host "✅ Redis: INSTALLED and RUNNING" -ForegroundColor Green
}

if (-not $serviceInstalled) {
    Write-Host "❌ QOR Auth Service: NOT INSTALLED" -ForegroundColor Red
    $recommendations += "Deploy QOR Auth service"
} else {
    Write-Host "✅ QOR Auth Service: INSTALLED" -ForegroundColor Green
}

if (-not $binaryExists) {
    Write-Host "❌ QOR Auth Binary: NOT FOUND" -ForegroundColor Red
    $recommendations += "Build and deploy binary"
} else {
    Write-Host "✅ QOR Auth Binary: EXISTS" -ForegroundColor Green
}

if (-not $portFree) {
    Write-Host "⚠️  Port 8080: IN USE" -ForegroundColor Yellow
    $recommendations += "Check what's using port 8080"
} else {
    Write-Host "✅ Port 8080: AVAILABLE" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 RECOMMENDED NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($recommendations.Count -eq 0) {
    Write-Host "✅ Everything looks good! You can start the service:" -ForegroundColor Green
    Write-Host "   ssh $SERVER_HOST 'sudo systemctl start qor-auth'" -ForegroundColor Cyan
} else {
    Write-Host "Recommended action plan:" -ForegroundColor Yellow
    $step = 1
    
    if ($recommendations -contains "Install PostgreSQL") {
        Write-Host "   $step. Install PostgreSQL:" -ForegroundColor White
        Write-Host "      ssh $SERVER_HOST 'sudo apt update; sudo apt install postgresql postgresql-contrib -y'" -ForegroundColor Cyan
        Write-Host "      ssh $SERVER_HOST 'sudo systemctl start postgresql; sudo systemctl enable postgresql'" -ForegroundColor Cyan
        Write-Host "      ssh $SERVER_HOST 'sudo -u postgres createuser -s qor_auth'" -ForegroundColor Cyan
        Write-Host "      ssh $SERVER_HOST 'sudo -u postgres createdb qor_auth'" -ForegroundColor Cyan
        $step++
    }
    
    if ($recommendations -contains "Start PostgreSQL") {
        Write-Host "   $step. Start PostgreSQL:" -ForegroundColor White
        Write-Host "      ssh $SERVER_HOST 'sudo systemctl start postgresql'" -ForegroundColor Cyan
        $step++
    }
    
    if ($recommendations -contains "Install Redis") {
        Write-Host "   $step. Install Redis:" -ForegroundColor White
        Write-Host "      ssh $SERVER_HOST 'sudo apt update; sudo apt install redis-server -y'" -ForegroundColor Cyan
        Write-Host "      ssh $SERVER_HOST 'sudo systemctl start redis; sudo systemctl enable redis'" -ForegroundColor Cyan
        $step++
    }
    
    if ($recommendations -contains "Start Redis") {
        Write-Host "   $step. Start Redis:" -ForegroundColor White
        Write-Host "      ssh $SERVER_HOST 'sudo systemctl start redis'" -ForegroundColor Cyan
        $step++
    }
    
    if ($recommendations -contains "Build locally and deploy") {
        Write-Host "   $step. Build and deploy QOR Auth (RECOMMENDED):" -ForegroundColor White
        Write-Host "      cd scripts" -ForegroundColor Cyan
        Write-Host "      .\deploy-qor-auth.ps1" -ForegroundColor Cyan
        $step++
    }
    
    if ($recommendations -contains "Deploy QOR Auth service") {
        Write-Host "   $step. Configure and start QOR Auth:" -ForegroundColor White
        Write-Host "      ssh $SERVER_HOST" -ForegroundColor Cyan
        Write-Host "      sudo nano /opt/demiurge/qor-auth/.env  # Configure environment" -ForegroundColor Cyan
        Write-Host "      sudo systemctl start qor-auth" -ForegroundColor Cyan
        Write-Host "      sudo systemctl enable qor-auth" -ForegroundColor Cyan
        $step++
    }
}

Write-Host ""
Write-Host "💡 Tip: Run this script again after completing steps to verify status" -ForegroundColor Gray
