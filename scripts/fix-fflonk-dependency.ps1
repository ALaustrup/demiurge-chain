# Fix FFLONK Dependency Issue
# Copies working Cargo.lock from Substrate fork

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing FFLONK Dependency" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$blockchainDir = "x:\Demiurge-Blockchain\blockchain"
$substrateLock = "x:\Demiurge-Blockchain\substrate\Cargo.lock"
$blockchainLock = "$blockchainDir\Cargo.lock"

# Step 1: Backup existing Cargo.lock if it exists
if (Test-Path $blockchainLock) {
    Write-Host "Backing up existing Cargo.lock..." -ForegroundColor Yellow
    $backup = "$blockchainLock.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $blockchainLock $backup
    Write-Host "Backed up to: $backup" -ForegroundColor Gray
    Write-Host ""
}

# Step 2: Copy Cargo.lock from Substrate fork
Write-Host "Copying Cargo.lock from Substrate fork..." -ForegroundColor Yellow
if (Test-Path $substrateLock) {
    Copy-Item $substrateLock $blockchainLock -Force
    Write-Host "✓ Copied Cargo.lock" -ForegroundColor Green
} else {
    Write-Host "✗ Substrate Cargo.lock not found at: $substrateLock" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Update dependencies
Write-Host "Updating dependencies..." -ForegroundColor Yellow
Push-Location $blockchainDir
try {
    cargo update
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies updated" -ForegroundColor Green
    } else {
        Write-Host "⚠ Update completed with warnings" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}
Write-Host ""

# Step 4: Verify
Write-Host "Verifying build..." -ForegroundColor Yellow
Push-Location $blockchainDir
try {
    cargo check --bin demiurge-node 2>&1 | Select-Object -First 20
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Build check passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠ Build check has errors (see above)" -ForegroundColor Yellow
        Write-Host "Run 'cargo check --bin demiurge-node' for full output" -ForegroundColor Gray
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
