# Fix wasm-bindgen version incompatibility
# Update wasm-bindgen to v0.2.88+ for Rust compatibility

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing wasm-bindgen Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$blockchainDir = "x:\Demiurge-Blockchain\blockchain"
Push-Location $blockchainDir

try {
    Write-Host "Updating wasm-bindgen crates to v0.2.88+..." -ForegroundColor Yellow
    
    # Update all wasm-bindgen related crates
    cargo update -p wasm-bindgen -p wasm-bindgen-macro -p wasm-bindgen-macro-support -p wasm-bindgen-shared -p wasm-bindgen-backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Updated wasm-bindgen crates" -ForegroundColor Green
    } else {
        Write-Host "⚠ Update completed with warnings" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Try check again
    Write-Host "Checking build after wasm-bindgen update..." -ForegroundColor Yellow
    cargo check --bin demiurge-node 2>&1 | Select-Object -First 50
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Build check passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠ Build check has errors (see above)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "If wasm-bindgen error persists, try:" -ForegroundColor Gray
        Write-Host "  cargo update -p wasm-bindgen --precise 0.2.88" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
