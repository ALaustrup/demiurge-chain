# Fix time crate compilation error
# The time crate v0.3.21 has a compilation issue - we need to update it

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing time crate compilation error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$blockchainDir = "x:\Demiurge-Blockchain\blockchain"
Push-Location $blockchainDir

try {
    Write-Host "Updating time crate to latest compatible version..." -ForegroundColor Yellow
    
    # Update time crate specifically
    cargo update -p time
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Updated time crate" -ForegroundColor Green
    } else {
        Write-Host "⚠ Update completed with warnings" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Try check again
    Write-Host "Checking build after time crate update..." -ForegroundColor Yellow
    cargo check --bin demiurge-node 2>&1 | Select-Object -First 50
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Build check passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠ Build check has errors (see above)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "If time crate error persists, try:" -ForegroundColor Gray
        Write-Host "  cargo update -p time --precise 0.3.34" -ForegroundColor Gray
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
