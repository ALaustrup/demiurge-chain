# Test Blockchain Connection Script
# Tests connection to Demiurge Substrate node

Write-Host "🔗 Testing Demiurge-Cloud Connection..." -ForegroundColor Cyan

$wsUrl = if ($env:NEXT_PUBLIC_BLOCKCHAIN_WS_URL) {
    $env:NEXT_PUBLIC_BLOCKCHAIN_WS_URL
} else {
    "ws://localhost:9944"
}

Write-Host "`nTarget: $wsUrl" -ForegroundColor Yellow

# Test WebSocket connection
try {
    Write-Host "`n📡 Testing WebSocket connection..." -ForegroundColor Cyan
    
    # Use Node.js to test WebSocket connection
    $testScript = @"
const WebSocket = require('ws');
const ws = new WebSocket('$wsUrl');

ws.on('open', () => {
    console.log('✅ WebSocket connection successful!');
    ws.close();
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket connection failed:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ Connection timeout');
    process.exit(1);
}, 5000);
"@
    
    $testScript | node
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Blockchain node is reachable!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Blockchain node is not reachable" -ForegroundColor Red
        Write-Host "`nMake sure the Substrate node is running:" -ForegroundColor Yellow
        Write-Host "  cd blockchain/node" -ForegroundColor Gray
        Write-Host "  ./target/release/demiurge-node --dev" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "`n❌ Error testing connection: $_" -ForegroundColor Red
    Write-Host "`nNote: This script requires Node.js and 'ws' package" -ForegroundColor Yellow
    Write-Host "Install with: npm install -g ws" -ForegroundColor Gray
    exit 1
}

# Test RPC endpoint
Write-Host "`n🔍 Testing RPC endpoint..." -ForegroundColor Cyan
try {
    $rpcUrl = $wsUrl -replace '^ws://', 'http://' -replace '^wss://', 'https://'
    $rpcUrl = $rpcUrl -replace ':9944', ':9944'
    
    $rpcBody = @{
        id = 1
        jsonrpc = "2.0"
        method = "system_health"
        params = @()
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $rpcUrl -Method Post -Body $rpcBody -ContentType "application/json" -ErrorAction Stop
    
    if ($response.result) {
        Write-Host "✅ RPC endpoint is responding!" -ForegroundColor Green
        Write-Host "`nNode Health:" -ForegroundColor Cyan
        $response.result | ConvertTo-Json -Depth 3 | Write-Host
    }
} catch {
    Write-Host "⚠️  RPC endpoint test failed (this is OK if node uses WebSocket-only RPC)" -ForegroundColor Yellow
}

Write-Host "`n✨ Connection test complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Start the hub app: cd apps/hub && npm run dev" -ForegroundColor Gray
Write-Host "  2. Navigate to http://localhost:3000/wallet" -ForegroundColor Gray
Write-Host "  3. Check blockchain connection status" -ForegroundColor Gray
