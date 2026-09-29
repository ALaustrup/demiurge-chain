# Build script that works around fflonk dependency issue
# Since bandersnatch_vrfs is optional, we can ignore fflonk errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building with FFLONK Workaround" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$blockchainDir = "x:\Demiurge-Blockchain\blockchain"
Push-Location $blockchainDir

try {
    # Step 1: Try to update dependencies (will fail on fflonk, but that's OK)
    Write-Host "Step 1: Updating dependencies (fflonk errors are OK)..." -ForegroundColor Yellow
    $updateOutput = cargo update 2>&1 | Out-String
    
    if ($updateOutput -match "fflonk") {
        Write-Host "⚠ fflonk error detected (expected - dependency is optional)" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Dependencies updated" -ForegroundColor Green
    }
    Write-Host ""
    
    # Step 2: Check build (will use cached dependencies, ignore fflonk errors)
    Write-Host "Step 2: Checking compilation..." -ForegroundColor Yellow
    Write-Host "(This may show fflonk warnings - they can be ignored)" -ForegroundColor Gray
    Write-Host ""
    
    # Run check and capture output
    $checkOutput = cargo check --bin demiurge-node 2>&1 | Out-String
    
    # Check for actual compilation errors (not just fflonk dependency errors)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Check passed!" -ForegroundColor Green
    } elseif ($checkOutput -match "fflonk" -and $checkOutput -notmatch "error\[E") {
        # If only fflonk dependency errors (no actual compilation errors), continue
        Write-Host "⚠ fflonk dependency error (can be ignored)" -ForegroundColor Yellow
        Write-Host "Attempting to continue with build..." -ForegroundColor Yellow
        Write-Host ""
        
        # Try to build anyway - the optional dependency shouldn't block compilation
        Write-Host "Step 3: Building (ignoring optional fflonk dependency)..." -ForegroundColor Yellow
        cargo build --bin demiurge-node --release 2>&1 | Where-Object { $_ -notmatch "fflonk" -or $_ -match "warning" }
        
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
            Write-Host "✗ Build failed. Check errors above (excluding fflonk warnings)." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "✗ Check failed with compilation errors:" -ForegroundColor Red
        Write-Host $checkOutput -ForegroundColor Red
        exit 1
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
