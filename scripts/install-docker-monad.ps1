# Docker Installation Script for Monad (Pleroma) - PowerShell
# Server: 51.210.209.112
# OS: Ubuntu Server 25.10 "Questing Quokka"
# Provider: OVH (RISE-LE-2)
#
# Usage:
#   .\scripts\install-docker-monad.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DOCKER INSTALLATION - MONAD (PLEROMA)" -ForegroundColor Cyan
Write-Host "  Server: 51.210.209.112" -ForegroundColor Cyan
Write-Host "  OS: Ubuntu Server 25.10 Questing Quokka" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
# Use SSH config hostname if available, otherwise use IP
$SERVER_HOST = "pleroma"
$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$SCRIPT_PATH = Join-Path $PSScriptRoot "install-docker-monad.sh"

Write-Host "Installation Plan:" -ForegroundColor Blue
Write-Host "  1. Copy installation script to server" -ForegroundColor Gray
Write-Host "  2. Execute script via SSH (requires sudo)" -ForegroundColor Gray
Write-Host "  3. Verify Docker installation" -ForegroundColor Gray
Write-Host ""

# Auto-confirm if running non-interactively
try {
    $confirm = Read-Host "Continue with Docker installation on Monad? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "Running in non-interactive mode. Proceeding with installation..." -ForegroundColor Yellow
}

# Check for SSH keys first
Write-Host ""
Write-Host "Checking SSH setup..." -ForegroundColor Yellow
$SSH_DIR = Join-Path $env:USERPROFILE ".ssh"
$sshKeysFound = $false

# Check standard location
if (Test-Path $SSH_DIR) {
    $keys = Get-ChildItem $SSH_DIR -Filter "id_*" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne ".pub" }
    if ($keys) {
        Write-Host "  Found SSH keys in: $SSH_DIR" -ForegroundColor Green
        $sshKeysFound = $true
    }
}

# Check alternative location
if (-not $sshKeysFound -and (Test-Path "G:\Users\Gnosis\.ssh")) {
    $keys = Get-ChildItem "G:\Users\Gnosis\.ssh" -Filter "id_*" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne ".pub" }
    if ($keys) {
        Write-Host "  Found SSH keys in: G:\Users\Gnosis\.ssh" -ForegroundColor Yellow
        Write-Host "  Please run: .\scripts\setup-ssh-keys.ps1" -ForegroundColor Yellow
        Write-Host "  This will copy keys to the standard location" -ForegroundColor Yellow
        try {
            $setupSSH = Read-Host "Run SSH setup script now? (yes/no)"
            if ($setupSSH -eq "yes") {
                & (Join-Path $PSScriptRoot "setup-ssh-keys.ps1")
            } else {
                Write-Host "Skipping SSH setup. Continuing with installation..." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Skipping SSH setup in non-interactive mode. Continuing..." -ForegroundColor Yellow
        }
    }
}

if (-not $sshKeysFound) {
    Write-Host "  No SSH keys found in standard location" -ForegroundColor Yellow
    Write-Host "  Please run: .\scripts\setup-ssh-keys.ps1" -ForegroundColor Yellow
    try {
        $setupSSH = Read-Host "Run SSH setup script now? (yes/no)"
        if ($setupSSH -eq "yes") {
            & (Join-Path $PSScriptRoot "setup-ssh-keys.ps1")
        } else {
            Write-Host "Continuing anyway..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Continuing in non-interactive mode..." -ForegroundColor Yellow
    }
}

# Check SSH connection
Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_HOST "echo SSH_OK" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SSH connection successful (using SSH config: $SERVER_HOST)" -ForegroundColor Green
        $TARGET_HOST = $SERVER_HOST
    } else {
        throw "SSH config hostname failed"
    }
} catch {
    Write-Host "  SSH connection failed with config hostname, trying direct IP..." -ForegroundColor Yellow
    try {
        $targetIP = "$SERVER_USER@$SERVER_IP"
        $sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $targetIP "echo SSH_OK" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SSH connection successful (using direct IP)" -ForegroundColor Green
            $TARGET_HOST = $targetIP
        } else {
            throw "SSH connection failed"
        }
    } catch {
        Write-Host "  SSH connection failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run SSH setup first:" -ForegroundColor Yellow
        Write-Host "  .\scripts\setup-ssh-keys.ps1" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Or ensure:" -ForegroundColor Yellow
        Write-Host "  1. SSH key is set up for $SERVER_USER@$SERVER_IP" -ForegroundColor Gray
        Write-Host "  2. SSH config has 'pleroma' or 'monad' hostname configured" -ForegroundColor Gray
        Write-Host "  3. Public key is in ~/.ssh/authorized_keys on the server" -ForegroundColor Gray
        Write-Host "  4. Server is accessible" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "Step 1: Copying script to server..." -ForegroundColor Yellow

# Check if script exists locally
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "  Error: Script not found at $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

# Copy script to server
$remoteScriptPath = "/tmp/install-docker-monad.sh"
Write-Host "  Copying $SCRIPT_PATH to ${TARGET_HOST}:$remoteScriptPath" -ForegroundColor Gray
scp $SCRIPT_PATH "${TARGET_HOST}:$remoteScriptPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Error: Failed to copy script to server" -ForegroundColor Red
    Write-Host "  Make sure SSH key is set up and server is accessible" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Script copied successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Executing installation script on server..." -ForegroundColor Yellow
Write-Host "  This will require sudo password on the server" -ForegroundColor Gray
Write-Host ""

# Execute script on server
ssh $TARGET_HOST "sudo bash $remoteScriptPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Error: Installation failed" -ForegroundColor Red
    Write-Host "  Check the output above for details" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Verifying installation..." -ForegroundColor Yellow

# Verify Docker installation
Write-Host "  Checking Docker version..." -ForegroundColor Gray
$dockerVersion = ssh $TARGET_HOST "docker --version 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "  Docker may not be accessible yet (group changes require logout/login)" -ForegroundColor Yellow
}

# Verify Docker Compose
Write-Host "  Checking Docker Compose version..." -ForegroundColor Gray
$composeVersion = ssh $TARGET_HOST "docker compose version 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker Compose installed: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "  Docker Compose check failed (may need logout/login)" -ForegroundColor Yellow
}

# Test Docker daemon
Write-Host "  Testing Docker daemon..." -ForegroundColor Gray
$dockerInfo = ssh $TARGET_HOST "docker info 2>&1 | head -5"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker daemon is running" -ForegroundColor Green
} else {
    Write-Host "  Docker daemon check failed (user may need to logout/login)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: User '$SERVER_USER' must log out and log back in" -ForegroundColor Yellow
Write-Host "  for docker group changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Log out and log back in to SSH" -ForegroundColor Gray
Write-Host "  2. Verify: ssh $TARGET_HOST 'docker ps'" -ForegroundColor Gray
Write-Host "  3. Verify: ssh $TARGET_HOST 'docker compose version'" -ForegroundColor Gray
Write-Host "  4. Deploy: cd /data/Demiurge-Blockchain/docker" -ForegroundColor Gray
$deployCmd = "docker compose -f docker-compose.production.yml up -d"
Write-Host "  5. Start: $deployCmd" -ForegroundColor Gray
Write-Host ""
