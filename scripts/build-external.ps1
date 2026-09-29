# ================================================================================
# EXTERNAL BUILD SCRIPT - Demiurge-Cloud Node (PowerShell)
# ================================================================================
# 
# This script builds the Demiurge node EXTERNALLY to avoid Cursor crashes.
# Run this in a separate PowerShell terminal or CI/CD pipeline.
#
# Usage:
#   .\scripts\build-external.ps1 [-Clean] [-Docker] [-Check]
#
# Options:
#   -Clean      Clean build cache before building
#   -Docker     Build using Docker instead of local Rust
#   -Check      Only check compilation, don't build binary
#
# ================================================================================

param(
    [switch]$Clean,
    [switch]$Docker,
    [switch]$Check
)

$ErrorActionPreference = "Stop"

# Configuration
# Handle being run from any directory
$ScriptPath = $MyInvocation.MyCommand.Path
if (-not $ScriptPath) {
    # If run directly, use PSScriptRoot
    $ScriptDir = $PSScriptRoot
} else {
    $ScriptDir = Split-Path -Parent $ScriptPath
}
$ProjectRoot = Split-Path -Parent $ScriptDir
$BlockchainDir = Join-Path $ProjectRoot "blockchain"
$BuildMode = if ($Docker) { "docker" } else { "local" }

# Verify paths exist
if (-not (Test-Path $BlockchainDir)) {
    Write-Host "Error: Cannot find blockchain directory at: $BlockchainDir" -ForegroundColor Red
    Write-Host "Please run this script from the project root or blockchain directory." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "    EXTERNAL BUILD - Demiurge-Cloud Node" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build mode: $BuildMode" -ForegroundColor Cyan
Write-Host "Clean build: $Clean" -ForegroundColor Cyan
Write-Host "Check only: $Check" -ForegroundColor Cyan
Write-Host ""

# ================================================================================
# DOCKER BUILD
# ================================================================================

if ($BuildMode -eq "docker") {
    Write-Host "Building with Docker..." -ForegroundColor Yellow
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "Docker not found. Install Docker or use local mode." -ForegroundColor Red
        exit 1
    }
    
    Set-Location $BlockchainDir
    
    # Build Docker image
    docker build -t demiurge-node:latest .
    
    Write-Host "Docker build complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the container:" -ForegroundColor Cyan
    Write-Host "  docker run -it --rm demiurge-node:latest --dev" -ForegroundColor Gray
    exit 0
}

# ================================================================================
# LOCAL BUILD
# ================================================================================

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Rust
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Rust not found. Install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

$RustVersion = (rustc --version).Split(' ')[1]
Write-Host "  Rust version: $RustVersion" -ForegroundColor Cyan

# Check Cargo
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Cargo not found" -ForegroundColor Red
    exit 1
}

# Check WASM target
$wasmInstalled = rustup target list --installed | Select-String "wasm32-unknown-unknown"
if (-not $wasmInstalled) {
    Write-Host "  Adding WASM target..." -ForegroundColor Yellow
    rustup target add wasm32-unknown-unknown
}

Write-Host "Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Navigate to blockchain directory
Set-Location $BlockchainDir

# Clean if requested
if ($Clean) {
    Write-Host "Cleaning build cache..." -ForegroundColor Yellow
    cargo clean
    Write-Host "Clean complete" -ForegroundColor Green
    Write-Host ""
}

# Build
$BuildStart = Get-Date
$BuildSuccess = $false

if ($Check) {
    Write-Host "Checking compilation..." -ForegroundColor Yellow
    try {
        cargo check --release 2>&1 | Tee-Object -Variable buildOutput
        if ($LASTEXITCODE -eq 0) {
            $BuildSuccess = $true
        } else {
            $buildOutputString = $buildOutput -join "`n"
            if ($buildOutputString -match "librocksdb-sys") {
                Write-Host ""
                Write-Host "================================================================================" -ForegroundColor Yellow
                Write-Host "KNOWN DEPENDENCY CONFLICT DETECTED" -ForegroundColor Yellow
                Write-Host "================================================================================" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "The librocksdb-sys conflict prevents full workspace builds." -ForegroundColor Yellow
                Write-Host "This is a known issue with sc-cli v0.56.0 and sc-service v0.56.0." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "WORKAROUNDS:" -ForegroundColor Cyan
                Write-Host "  1. Build pallets individually (recommended for Phase 11):" -ForegroundColor White
                Write-Host "     cd blockchain\pallets\pallet-session-keys" -ForegroundColor Gray
                Write-Host "     cargo check" -ForegroundColor Gray
                Write-Host ""
                Write-Host "  2. Use Docker build (avoids dependency conflicts):" -ForegroundColor White
                Write-Host "     .\scripts\build-external.ps1 -Docker" -ForegroundColor Gray
                Write-Host ""
                Write-Host "  3. See blockchain\DEPENDENCY_CONFLICT_RESOLUTION.md for details" -ForegroundColor White
                Write-Host ""
            }
        }
    } catch {
        Write-Host "Build check failed: $_" -ForegroundColor Red
    }
} else {
    $cpuCount = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
    Write-Host "Building release binary..." -ForegroundColor Yellow
    Write-Host "  This may take 30-60 minutes on first build" -ForegroundColor Gray
    Write-Host "  Using $cpuCount CPU cores" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $buildOutput = cargo build --release --bin demiurge-node 2>&1 | Tee-Object -Variable buildOutput
        if ($LASTEXITCODE -eq 0) {
            $BuildSuccess = $true
        } else {
            $buildOutputString = $buildOutput -join "`n"
            if ($buildOutputString -match "librocksdb-sys") {
                Write-Host ""
                Write-Host "================================================================================" -ForegroundColor Yellow
                Write-Host "KNOWN DEPENDENCY CONFLICT DETECTED" -ForegroundColor Yellow
                Write-Host "================================================================================" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "The librocksdb-sys conflict prevents node binary builds." -ForegroundColor Yellow
                Write-Host "This is a known issue with sc-cli v0.56.0 and sc-service v0.56.0." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "WORKAROUNDS:" -ForegroundColor Cyan
                Write-Host "  1. Use Docker build (recommended):" -ForegroundColor White
                Write-Host "     .\scripts\build-external.ps1 -Docker" -ForegroundColor Gray
                Write-Host ""
                Write-Host "  2. Build pallets individually (for Phase 11 development):" -ForegroundColor White
                Write-Host "     cd blockchain\pallets\pallet-session-keys" -ForegroundColor Gray
                Write-Host "     cargo check" -ForegroundColor Gray
                Write-Host ""
                Write-Host "  3. See blockchain\DEPENDENCY_CONFLICT_RESOLUTION.md for details" -ForegroundColor White
                Write-Host ""
            }
        }
    } catch {
        Write-Host "Build failed: $_" -ForegroundColor Red
    }
}

$BuildEnd = Get-Date
$BuildDuration = $BuildEnd - $BuildStart

Write-Host ""
if ($BuildSuccess) {
    Write-Host "Build complete!" -ForegroundColor Green
} else {
    Write-Host "Build encountered issues (see above)" -ForegroundColor Yellow
}
Write-Host "  Duration: $($BuildDuration.ToString('mm\:ss'))" -ForegroundColor Cyan

# Verify binary
$BinaryPath = Join-Path $BlockchainDir "target\release\demiurge-node.exe"
if (Test-Path $BinaryPath) {
    $BinarySize = (Get-Item $BinaryPath).Length / 1MB
    Write-Host ""
    Write-Host "Binary verified" -ForegroundColor Green
    Write-Host "  Path: $BinaryPath" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($BinarySize, 2)) MB" -ForegroundColor Cyan
    
    # Test version
    & $BinaryPath --version 2>&1 | Out-Null
} else {
    Write-Host "Binary not found (check-only mode?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Build process complete!" -ForegroundColor Green
Write-Host ""
