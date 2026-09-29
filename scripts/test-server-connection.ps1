# Test Server Connection - Check if Monad server is accessible
# Usage: .\scripts\test-server-connection.ps1

$SERVER_IP = "51.210.209.112"
$SERVER_PORT = 22

Write-Host "Testing connection to Monad server..." -ForegroundColor Cyan
Write-Host "Server: $SERVER_IP" -ForegroundColor Gray
Write-Host ""

# Test 1: Ping
Write-Host "1. Testing ping..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $SERVER_IP -Count 2 -ErrorAction SilentlyContinue
if ($pingResult) {
    Write-Host "   Ping successful" -ForegroundColor Green
    $pingResult | ForEach-Object { Write-Host "   Response time: $($_.ResponseTime)ms" -ForegroundColor Gray }
} else {
    Write-Host "   Ping failed - server may be down or unreachable" -ForegroundColor Red
}

Write-Host ""

# Test 2: Port 22 (SSH)
Write-Host "2. Testing SSH port (22)..." -ForegroundColor Yellow
try {
    $tcpTest = Test-NetConnection -ComputerName $SERVER_IP -Port $SERVER_PORT -WarningAction SilentlyContinue -ErrorAction Stop
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "   Port 22 is open and accessible" -ForegroundColor Green
    } else {
        Write-Host "   Port 22 is closed or filtered" -ForegroundColor Red
    }
} catch {
    Write-Host "   Port 22 test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: SSH connection with timeout
Write-Host "3. Testing SSH connection (10 second timeout)..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no pleroma "echo SSH_OK" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "   SSH connection failed" -ForegroundColor Red
    Write-Host "   Error: $sshTest" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connection Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Provide recommendations
if (-not $pingResult) {
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "  - Check if server is running" -ForegroundColor Gray
    Write-Host "  - Verify IP address is correct: $SERVER_IP" -ForegroundColor Gray
    Write-Host "  - Check firewall rules" -ForegroundColor Gray
    Write-Host "  - Verify network connectivity" -ForegroundColor Gray
}

if ($pingResult -and -not $tcpTest.TcpTestSucceeded) {
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "  - Server is reachable but SSH port (22) is blocked" -ForegroundColor Gray
    Write-Host "  - Check firewall on server" -ForegroundColor Gray
    Write-Host "  - Verify SSH service is running on server" -ForegroundColor Gray
    Write-Host "  - Check if SSH is on a different port" -ForegroundColor Gray
}
