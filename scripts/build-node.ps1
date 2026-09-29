# Build Demiurge Node Script
# IMPORTANT: Run this in an external PowerShell terminal, NOT in Cursor
# Large cargo builds can cause Cursor to crash

Write-Host "🔨 Building Demiurge Node..." -ForegroundColor Cyan
Write-Host "⚠️  This will take 30-60 minutes on first build" -ForegroundColor Yellow
Write-Host "⚠️  Make sure you're running this in an external PowerShell terminal" -ForegroundColor Yellow
Write-Host ""

$nodeDir = Join-Path $PSScriptRoot "..\blockchain\node"
Set-Location $nodeDir

Write-Host "📦 Building release binary..." -ForegroundColor Cyan
Write-Host "Location: $nodeDir" -ForegroundColor Gray
Write-Host ""

# Build the node in release mode
cargo build --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Binary location:" -ForegroundColor Cyan
    Write-Host "  $nodeDir\target\release\demiurge-node.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To start the node:" -ForegroundColor Cyan
    Write-Host "  cd blockchain\node" -ForegroundColor Gray
    Write-Host "  .\target\release\demiurge-node.exe --dev" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Missing Rust toolchain - Install from https://rustup.rs/" -ForegroundColor Gray
    Write-Host "  2. Missing Visual C++ Build Tools" -ForegroundColor Gray
    Write-Host "  3. Out of memory - Close other applications" -ForegroundColor Gray
    Write-Host "  4. Network issues - Check internet connection" -ForegroundColor Gray
    exit 1
}
