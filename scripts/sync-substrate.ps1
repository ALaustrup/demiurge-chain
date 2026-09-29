# Sync substrate directory to server using tar+ssh
# This script compresses and transfers the substrate directory

$ErrorActionPreference = "Stop"

Write-Host "🔄 Syncing substrate directory to server..." -ForegroundColor Cyan

$substratePath = Join-Path $PSScriptRoot "..\substrate"
$serverPath = "/opt/demiurge-blockchain/substrate"

if (-not (Test-Path $substratePath)) {
    Write-Host "❌ Substrate directory not found at: $substratePath" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Creating archive (excluding target, .git, *.lock)..." -ForegroundColor Yellow

# Create temp archive
$tempArchive = Join-Path $env:TEMP "substrate-sync-$(Get-Date -Format 'yyyyMMddHHmmss').tar.gz"

try {
    # Use 7zip or tar if available, otherwise fall back to manual method
    if (Get-Command tar -ErrorAction SilentlyContinue) {
        # Use tar (Windows 10+)
        Push-Location (Split-Path $substratePath)
        tar --exclude='target' --exclude='.git' --exclude='*.lock' --exclude='Cargo.lock' -czf $tempArchive -C (Split-Path $substratePath) substrate
        Pop-Location
        
        Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
        scp $tempArchive pleroma:/tmp/substrate-sync.tar.gz
        
        Write-Host "📂 Extracting on server..." -ForegroundColor Yellow
        ssh pleroma "mkdir -p $serverPath && cd $serverPath && tar -xzf /tmp/substrate-sync.tar.gz --strip-components=1 && rm /tmp/substrate-sync.tar.gz"
        
        Write-Host "✅ Sync complete!" -ForegroundColor Green
    } else {
        Write-Host "❌ tar command not found. Please use FileZilla or install tar for Windows." -ForegroundColor Red
        Write-Host "   Alternatively, install Git for Windows which includes tar." -ForegroundColor Yellow
        exit 1
    }
} finally {
    # Cleanup temp file
    if (Test-Path $tempArchive) {
        Remove-Item $tempArchive -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Verifying upload..." -ForegroundColor Cyan
ssh pleroma "ls -lh $serverPath | head -20"
