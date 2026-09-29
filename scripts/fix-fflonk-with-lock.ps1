# Fix FFLONK Dependency by using Substrate Cargo.lock
# This preserves the working git references

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

# Step 3: Verify Cargo.lock has fflonk entry
Write-Host "Verifying Cargo.lock contains fflonk..." -ForegroundColor Yellow
$lockContent = Get-Content $blockchainLock -Raw
if ($lockContent -match "name = \"fflonk\"") {
    Write-Host "✓ Cargo.lock contains fflonk entry" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: fflonk not found in Cargo.lock" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Try to fetch git dependencies (this may fail, but that's OK)
Write-Host "Attempting to fetch git dependencies..." -ForegroundColor Yellow
Write-Host "(This may fail for fflonk - that's OK if bandersnatch-experimental is not enabled)" -ForegroundColor Gray
Write-Host ""

Push-Location $blockchainDir
try {
    # Use --offline flag to prevent fetching, just use what's in Cargo.lock
    cargo check --bin demiurge-node --offline 2>&1 | Select-Object -First 30
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Build check passed with offline mode!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Note: Using --offline prevents git fetching." -ForegroundColor Gray
        Write-Host "If you need to update dependencies, ensure fflonk repository is accessible." -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "⚠ Build check has errors (see above)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Trying without --offline flag..." -ForegroundColor Yellow
        cargo check --bin demiurge-node 2>&1 | Select-Object -First 30
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
Write-Host "If fflonk errors persist:" -ForegroundColor Yellow
Write-Host "1. Ensure bandersnatch-experimental feature is NOT enabled" -ForegroundColor Gray
Write-Host "2. The dependency is optional and should not block builds" -ForegroundColor Gray
Write-Host "3. Try: cargo check --bin demiurge-node --offline" -ForegroundColor Gray
