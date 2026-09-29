# SSH Key Setup Script for Demiurge-Cloud
# Sets up SSH keys for connecting to Monad (Pleroma) server
#
# Usage: .\scripts\setup-ssh-keys.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SSH KEY SETUP - MONAD (PLEROMA)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$SSH_HOST = "pleroma"
$SSH_CONFIG_PATH = Join-Path $env:USERPROFILE ".ssh\config"
$SSH_DIR = Join-Path $env:USERPROFILE ".ssh"

# Possible key locations
$altSSHDir = Join-Path $PSScriptRoot "..\.ssh"
$POSSIBLE_KEY_LOCATIONS = @(
    "G:\Users\Gnosis\.ssh",
    $SSH_DIR,
    "C:\Users\Gnosis\.ssh",
    $altSSHDir
)

Write-Host "Searching for SSH keys..." -ForegroundColor Yellow

# Find SSH keys
$foundKeys = @()
foreach ($location in $POSSIBLE_KEY_LOCATIONS) {
    if (Test-Path $location) {
        Write-Host "  Checking: $location" -ForegroundColor Gray
        $keys = Get-ChildItem $location -Filter "id_*" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne ".pub" -or $_.Name -like "id_*" }
        if ($keys) {
            foreach ($key in $keys) {
                $foundKeys += @{
                    Path = $key.FullName
                    Name = $key.Name
                    Location = $location
                }
                Write-Host "  Found: $($key.Name)" -ForegroundColor Green
            }
        }
    }
}

if ($foundKeys.Count -eq 0) {
    Write-Host ""
    Write-Host "No SSH keys found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Would you like to generate a new SSH key?" -ForegroundColor Yellow
    $generate = Read-Host "Generate new key? (yes/no)"
    
    if ($generate -eq "yes") {
        $keyName = "id_ed25519_pleroma"
        $keyPath = Join-Path $SSH_DIR $keyName
        
        Write-Host ""
        Write-Host "Generating new SSH key..." -ForegroundColor Yellow
        $emptyPassphrase = '""'
        ssh-keygen -t ed25519 -f $keyPath -C "ubuntu@51.210.209.112" -N $emptyPassphrase
        
        if (Test-Path $keyPath) {
            Write-Host "Key generated: $keyPath" -ForegroundColor Green
            $foundKeys = @(@{
                Path = $keyPath
                Name = $keyName
                Location = $SSH_DIR
            })
        } else {
            Write-Host "Failed to generate key" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please place your SSH keys in: $SSH_DIR" -ForegroundColor Yellow
        exit 1
    }
}

# Select key to use (prefer pleroma-specific keys)
$selectedKey = $foundKeys | Where-Object { $_.Name -like "*pleroma*" -or $_.Name -like "*monad*" } | Select-Object -First 1
if (-not $selectedKey) {
    $selectedKey = $foundKeys[0]
}

Write-Host ""
Write-Host "Using SSH key: $($selectedKey.Name)" -ForegroundColor Blue
Write-Host "  Location: $($selectedKey.Path)" -ForegroundColor Gray

# Ensure standard .ssh directory exists
if (-not (Test-Path $SSH_DIR)) {
    Write-Host ""
    Write-Host "Creating .ssh directory: $SSH_DIR" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SSH_DIR -Force | Out-Null
}

# Copy key to standard location if it's not already there
$standardKeyPath = Join-Path $SSH_DIR $selectedKey.Name
if ($selectedKey.Path -ne $standardKeyPath) {
    Write-Host ""
    Write-Host "Copying key to standard location..." -ForegroundColor Yellow
    Copy-Item $selectedKey.Path $standardKeyPath -Force -ErrorAction SilentlyContinue
    $pubPath = $selectedKey.Path + ".pub"
    $standardPubPath = $standardKeyPath + ".pub"
    if (Test-Path $pubPath) {
        Copy-Item $pubPath $standardPubPath -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  Copied to: $standardKeyPath" -ForegroundColor Green
}

# Set proper permissions
Write-Host ""
Write-Host "Setting key permissions..." -ForegroundColor Yellow
icacls $standardKeyPath /inheritance:r /grant:r "$env:USERNAME`:F" 2>&1 | Out-Null
$standardPubPath = $standardKeyPath + ".pub"
if (Test-Path $standardPubPath) {
    icacls $standardPubPath /inheritance:r /grant:r "$env:USERNAME`:F" 2>&1 | Out-Null
}
Write-Host "  Permissions set" -ForegroundColor Green

# Create/update SSH config
Write-Host ""
Write-Host "Configuring SSH config..." -ForegroundColor Yellow

$knownHostsPath = Join-Path $SSH_DIR "known_hosts"
$sshConfigLines = @()
$sshConfigLines += "# Demiurge-Cloud - Monad (Pleroma) Server Configuration"
$sshConfigLines += "Host $SSH_HOST"
$sshConfigLines += "    HostName $SERVER_IP"
$sshConfigLines += "    User $SERVER_USER"
$sshConfigLines += "    IdentityFile $standardKeyPath"
$sshConfigLines += "    IdentitiesOnly yes"
$sshConfigLines += "    StrictHostKeyChecking no"
$sshConfigLines += "    UserKnownHostsFile $knownHostsPath"
$sshConfigLines += ""
$sshConfigLines += "Host monad"
$sshConfigLines += "    HostName $SERVER_IP"
$sshConfigLines += "    User $SERVER_USER"
$sshConfigLines += "    IdentityFile $standardKeyPath"
$sshConfigLines += "    IdentitiesOnly yes"
$sshConfigLines += "    StrictHostKeyChecking no"
$sshConfigLines += "    UserKnownHostsFile $knownHostsPath"
$sshConfigLines += ""

$sshConfigContent = $sshConfigLines -join "`n"

# Read existing config if it exists
$existingConfig = ""
if (Test-Path $SSH_CONFIG_PATH) {
    $existingConfig = Get-Content $SSH_CONFIG_PATH -Raw
    Write-Host "  Found existing SSH config" -ForegroundColor Gray
}

# Check if config already has our entries
if ($existingConfig -notmatch "Host $SSH_HOST") {
    # Append to existing config
    if ($existingConfig) {
        Add-Content -Path $SSH_CONFIG_PATH -Value "`n$sshConfigContent"
    } else {
        Set-Content -Path $SSH_CONFIG_PATH -Value $sshConfigContent
    }
    Write-Host "  SSH config updated" -ForegroundColor Green
} else {
    Write-Host "  SSH config already configured" -ForegroundColor Green
}

# Test SSH connection
Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$sshTarget = "$SERVER_USER@$SERVER_IP"
Write-Host "  Using: $SSH_HOST ($sshTarget)" -ForegroundColor Gray

$testResult = ssh -o ConnectTimeout=5 -o BatchMode=yes $SSH_HOST "echo SSH_OK" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "  SSH connection failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "  1. Copy your public key to the server:" -ForegroundColor Gray
    $copyCommand = "type $standardPubPath | ssh ${SERVER_USER}@${SERVER_IP} 'mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'"
    Write-Host "     $copyCommand" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Or manually copy the public key:" -ForegroundColor Gray
    Write-Host "     Get-Content $standardPubPath | Set-Clipboard" -ForegroundColor Cyan
    Write-Host "     Then paste it into ~/.ssh/authorized_keys on the server" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SSH SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Blue
Write-Host "  SSH Key: $standardKeyPath" -ForegroundColor Gray
Write-Host "  SSH Config: $SSH_CONFIG_PATH" -ForegroundColor Gray
$hostMapping = "$SERVER_USER@$SERVER_IP"
Write-Host "  Hostname: $SSH_HOST (maps to $hostMapping)" -ForegroundColor Gray
Write-Host ""
Write-Host "You can now use:" -ForegroundColor Blue
Write-Host "  ssh $SSH_HOST" -ForegroundColor Cyan
Write-Host "  ssh monad" -ForegroundColor Cyan
Write-Host ""
