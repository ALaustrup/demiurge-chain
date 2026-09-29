# Build Demiurge-Cloud Outside Cursor
# Run this script in PowerShell (outside Cursor) to avoid crashes

param(
    [switch]$Check,
    [switch]$Build,
    [switch]$Release,
    [switch]$Clean,
    [string]$Target = "demiurge-node"
)

$ErrorActionPreference = "Stop"
$blockchainDir = "x:\Demiurge-Blockchain\blockchain"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Demiurge-Cloud Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to blockchain directory
Push-Location $blockchainDir

try {
    if ($Clean) {
        Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
        cargo clean
        Write-Host "Clean complete!" -ForegroundColor Green
        return
    }

    if ($Check) {
        Write-Host "Running cargo check..." -ForegroundColor Yellow
        Write-Host "Target: $Target" -ForegroundColor Gray
        Write-Host ""
        
        if ($Target -eq "demiurge-node") {
            cargo check --bin demiurge-node 2>&1 | Tee-Object -FilePath "build-check.log"
        } else {
            cargo check --package $Target 2>&1 | Tee-Object -FilePath "build-check.log"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Check passed!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ Check failed! See build-check.log for details" -ForegroundColor Red
            exit 1
        }
    }

    if ($Build) {
        Write-Host "Building blockchain..." -ForegroundColor Yellow
        Write-Host "Target: $Target" -ForegroundColor Gray
        Write-Host "Release: $Release" -ForegroundColor Gray
        Write-Host ""
        
        $buildArgs = @()
        if ($Release) {
            $buildArgs += "--release"
        }
        
        if ($Target -eq "demiurge-node") {
            cargo build --bin demiurge-node @buildArgs 2>&1 | Tee-Object -FilePath "build.log"
        } else {
            cargo build --package $Target @buildArgs 2>&1 | Tee-Object -FilePath "build.log"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Build successful!" -ForegroundColor Green
            
            if ($Release) {
                $binaryPath = "target\release\demiurge-node.exe"
            } else {
                $binaryPath = "target\debug\demiurge-node.exe"
            }
            
            if (Test-Path $binaryPath) {
                $size = (Get-Item $binaryPath).Length / 1MB
                Write-Host "Binary: $binaryPath ($([math]::Round($size, 2)) MB)" -ForegroundColor Cyan
            }
        } else {
            Write-Host ""
            Write-Host "✗ Build failed! See build.log for details" -ForegroundColor Red
            exit 1
        }
    }

    if (-not $Check -and -not $Build) {
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\build-blockchain-external.ps1 -Check          # Run cargo check"
        Write-Host "  .\build-blockchain-external.ps1 -Build          # Build debug binary"
        Write-Host "  .\build-blockchain-external.ps1 -Build -Release # Build release binary"
        Write-Host "  .\build-blockchain-external.ps1 -Clean          # Clean build artifacts"
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\build-blockchain-external.ps1 -Check"
        Write-Host "  .\build-blockchain-external.ps1 -Build -Release"
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
