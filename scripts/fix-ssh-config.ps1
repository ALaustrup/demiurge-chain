# Fix SSH Config - Add timeout settings to prevent freezing
# Usage: .\scripts\fix-ssh-config.ps1

$SSH_CONFIG_PATH = Join-Path $env:USERPROFILE ".ssh\config"

Write-Host "Updating SSH config with timeout settings..." -ForegroundColor Yellow

# Read existing config
$configContent = ""
if (Test-Path $SSH_CONFIG_PATH) {
    $configContent = Get-Content $SSH_CONFIG_PATH -Raw
    Write-Host "Found existing SSH config" -ForegroundColor Gray
}

# Check if timeout settings already exist
if ($configContent -notmatch "ConnectTimeout") {
    # Add timeout settings to prevent freezing
    $timeoutSettings = @"

# Timeout settings to prevent SSH from hanging
Host *
    ConnectTimeout 10
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes

"@
    
    if ($configContent) {
        $newConfig = $timeoutSettings + $configContent
    } else {
        $newConfig = $timeoutSettings
    }
    
    Set-Content -Path $SSH_CONFIG_PATH -Value $newConfig
    Write-Host "Added timeout settings to SSH config" -ForegroundColor Green
} else {
    Write-Host "Timeout settings already exist in SSH config" -ForegroundColor Green
}

# Update pleroma/monad host with specific settings
$pleromaConfig = @"

Host pleroma monad
    HostName 51.210.209.112
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_pleroma
    IdentitiesOnly yes
    ConnectTimeout 10
    ServerAliveInterval 30
    ServerAliveCountMax 2
    TCPKeepAlive yes

"@

# Check if pleroma config exists and update it
if ($configContent -match "Host pleroma") {
    # Replace existing pleroma config
    $configContent = $configContent -replace "(?s)Host pleroma.*?(?=\nHost |\Z)", $pleromaConfig.Trim()
    Set-Content -Path $SSH_CONFIG_PATH -Value $configContent
    Write-Host "Updated pleroma/monad host settings" -ForegroundColor Green
} else {
    # Add pleroma config
    Add-Content -Path $SSH_CONFIG_PATH -Value $pleromaConfig
    Write-Host "Added pleroma/monad host configuration" -ForegroundColor Green
}

Write-Host ""
Write-Host "SSH config updated successfully!" -ForegroundColor Green
Write-Host "Config file: $SSH_CONFIG_PATH" -ForegroundColor Gray
Write-Host ""
Write-Host "Now SSH will:" -ForegroundColor Blue
Write-Host "  - Timeout after 10 seconds if connection fails" -ForegroundColor Gray
Write-Host "  - Send keepalive packets every 30 seconds" -ForegroundColor Gray
Write-Host "  - Disconnect after 2 failed keepalive attempts" -ForegroundColor Gray
Write-Host ""
