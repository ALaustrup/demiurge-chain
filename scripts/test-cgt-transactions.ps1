# Test CGT Transactions End-to-End
# Requires: Running blockchain node, QOR Auth, and Hub

$ErrorActionPreference = "Stop"

Write-Host "💰 Testing CGT Transactions End-to-End..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$HUB_URL = "http://localhost:3000"
$QOR_AUTH_URL = "http://51.210.209.112:8080"

# Check prerequisites
Write-Host "📋 Prerequisites Check..." -ForegroundColor Yellow

# 1. Check blockchain health
Write-Host "   1. Checking blockchain node..." -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$HUB_URL/api/blockchain/health" -Method GET -ErrorAction Stop
    if ($health.connected) {
        Write-Host "      ✅ Blockchain node is connected" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Blockchain node is not connected" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "      ❌ Cannot reach blockchain health endpoint" -ForegroundColor Red
    exit 1
}

# 2. Check QOR Auth
Write-Host "   2. Checking QOR Auth service..." -ForegroundColor Gray
try {
    $authHealth = Invoke-RestMethod -Uri "$QOR_AUTH_URL/health" -Method GET -ErrorAction Stop
    Write-Host "      ✅ QOR Auth service is healthy" -ForegroundColor Green
} catch {
    Write-Host "      ❌ QOR Auth service is not available" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Test Scenarios" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test CGT transactions, you need:" -ForegroundColor Gray
Write-Host "1. A valid QOR ID account" -ForegroundColor Gray
Write-Host "2. An on-chain wallet address linked to your QOR ID" -ForegroundColor Gray
Write-Host "3. Some CGT balance in your wallet" -ForegroundColor Gray
Write-Host ""
Write-Host "Test endpoints:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Balance Query:" -ForegroundColor Yellow
Write-Host "   POST $HUB_URL/api/blockchain/test" -ForegroundColor Gray
Write-Host "   Headers: Authorization: Bearer YOUR_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test CGT Reward:" -ForegroundColor Yellow
Write-Host "   POST $HUB_URL/api/games/reward" -ForegroundColor Gray
Write-Host "   Body: { `"gameId`": `"galaga-creator`", `"amount`": 10, `"reason`": `"test`" }" -ForegroundColor Gray
Write-Host "   Headers: Authorization: Bearer YOUR_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test CGT Spending:" -ForegroundColor Yellow
Write-Host "   POST $HUB_URL/api/games/spend" -ForegroundColor Gray
Write-Host "   Body: { `"amount`": 1, `"reason`": `"test_purchase`", `"walletPassword`": `"YOUR_PASSWORD`" }" -ForegroundColor Gray
Write-Host "   Headers: Authorization: Bearer YOUR_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test Game Data Storage:" -ForegroundColor Yellow
Write-Host "   POST $HUB_URL/api/games/data" -ForegroundColor Gray
Write-Host "   Body: { `"gameId`": `"galaga-creator`", `"score`": 1000, `"cgtEarned`": 50 }" -ForegroundColor Gray
Write-Host "   Headers: Authorization: Bearer YOUR_TOKEN" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Manual Testing Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start blockchain node:" -ForegroundColor Gray
Write-Host "   cd blockchain/node" -ForegroundColor DarkGray
Write-Host "   cargo run --release -- --dev" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Login to hub and get JWT token from browser DevTools" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Use the endpoints above with your token" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Test script ready!" -ForegroundColor Green
