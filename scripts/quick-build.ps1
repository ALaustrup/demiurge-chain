# Quick Build Script - Run in PowerShell (outside Cursor)
# Usage: .\quick-build.ps1

cd x:\Demiurge-Blockchain\blockchain

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Demiurge-Cloud Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Update dependencies
Write-Host "Step 1: Updating dependencies..." -ForegroundColor Yellow
cargo update
Write-Host ""

# Step 2: Check build
Write-Host "Step 2: Checking compilation..." -ForegroundColor Yellow
cargo check --bin demiurge-node

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Check failed! Fix errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Check passed!" -ForegroundColor Green
Write-Host ""

# Step 3: Build release
Write-Host "Step 3: Building release binary..." -ForegroundColor Yellow
cargo build --bin demiurge-node --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Build successful!" -ForegroundColor Green
    $bin = "target\release\demiurge-node.exe"
    if (Test-Path $bin) {
        $size = (Get-Item $bin).Length / 1MB
        Write-Host "Binary: $bin ($([math]::Round($size, 2)) MB)" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
