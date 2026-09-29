# Test Blockchain Integration
# Tests the blockchain node connection and game integration

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Blockchain Integration..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$BLOCKCHAIN_WS = "ws://51.210.209.112:9944"
$BLOCKCHAIN_RPC = "http://51.210.209.112:9933"
$HUB_URL = "http://localhost:3000"
$QOR_AUTH_URL = "http://51.210.209.112:8080"

# Test 1: Blockchain Node Health
Write-Host "1️⃣ Testing Blockchain Node Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$HUB_URL/api/blockchain/health" -Method GET -ErrorAction Stop
    if ($response.connected) {
        Write-Host "   ✅ Blockchain node is connected" -ForegroundColor Green
        Write-Host "      Chain: $($response.chain)" -ForegroundColor Gray
        Write-Host "      Block: $($response.blockNumber)" -ForegroundColor Gray
        Write-Host "      Peers: $($response.peerCount)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Blockchain node is not connected" -ForegroundColor Yellow
        Write-Host "      Status: $($response.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed to check blockchain health: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: QOR Auth Service
Write-Host "2️⃣ Testing QOR Auth Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$QOR_AUTH_URL/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ QOR Auth service is healthy" -ForegroundColor Green
    Write-Host "      Service: $($response.service)" -ForegroundColor Gray
    Write-Host "      Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ QOR Auth service is not available: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Game Registry
Write-Host "3️⃣ Testing Game Registry..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$HUB_URL/api/games" -Method GET -ErrorAction Stop
    $gameCount = $response.games.Count
    Write-Host "   ✅ Game registry is accessible" -ForegroundColor Green
    Write-Host "      Registered games: $gameCount" -ForegroundColor Gray
    foreach ($game in $response.games) {
        Write-Host "      - $($game.title) ($($game.id))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed to access game registry: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Blockchain Test Endpoint (requires auth)
Write-Host "4️⃣ Testing Blockchain Integration (requires authentication)..." -ForegroundColor Yellow
Write-Host "   ⚠️  This test requires a valid JWT token" -ForegroundColor Yellow
Write-Host "   To test manually:" -ForegroundColor Gray
Write-Host "   curl -X POST $HUB_URL/api/blockchain/test -H 'Authorization: Bearer YOUR_TOKEN'" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "   Run these tests after:" -ForegroundColor Gray
Write-Host "   1. Starting blockchain node" -ForegroundColor Gray
Write-Host "   2. Starting QOR Auth service" -ForegroundColor Gray
Write-Host "   3. Starting Next.js Hub" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Integration test complete!" -ForegroundColor Green
