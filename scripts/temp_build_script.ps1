# Build Demiurge Node - Release Build Script
# Run this in an EXTERNAL PowerShell terminal to avoid Cursor crashes

Write-Host "🎭 Building Demiurge Node (Release)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to blockchain directory
$blockchainPath = "x:\Demiurge-Blockchain\blockchain"
Set-Location $blockchainPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Check if cargo is available
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Cargo not found. Please install Rust toolchain." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cargo found: $(cargo --version)" -ForegroundColor Green
Write-Host ""

# Clean previous build (optional - uncomment if needed)
# Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
# cargo clean
# Write-Host ""

Write-Host "🔨 Starting release build..." -ForegroundColor Yellow
Write-Host "   This may take 30-60 minutes on first build" -ForegroundColor Gray
Write-Host "   Building ~500+ Substrate crates..." -ForegroundColor Gray
Write-Host ""

# Build with release profile
$buildStart = Get-Date
cargo build --release

$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "   Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📦 Binary location:" -ForegroundColor Cyan
    Write-Host "   $blockchainPath\target\release\demiurge-node.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test node startup:" -ForegroundColor Gray
    Write-Host "      cd node" -ForegroundColor DarkGray
    Write-Host "      .\target\release\demiurge-node.exe --dev" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   2. Test RPC endpoints:" -ForegroundColor Gray
    Write-Host "      curl -H 'Content-Type: application/json' -d '{\"id\":1,\"jsonrpc\":\"2.0\",\"method\":\"cgt_totalBurned\",\"params\":[]}' http://127.0.0.1:9944" -ForegroundColor DarkGray
} else {
    Write-Host "❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Dependency version conflicts (check Cargo.toml)" -ForegroundColor Gray
    Write-Host "  - Missing system dependencies (protoc, Visual C++ Build Tools)" -ForegroundColor Gray
    Write-Host "  - Memory issues (try: cargo build --release -j 1)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}

Write-Host "=====================================" -ForegroundColor Cyan
