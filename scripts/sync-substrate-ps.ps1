# Sync substrate using PowerShell Compress-Archive + scp
$ErrorActionPreference = "Stop"

Write-Host "Syncing substrate directory..." -ForegroundColor Cyan

$substratePath = "substrate"
$serverPath = "/opt/demiurge-blockchain/substrate"
$tempZip = "$env:TEMP\substrate-sync.zip"

if (-not (Test-Path $substratePath)) {
    Write-Host "ERROR: substrate directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating ZIP archive (excluding build files)..." -ForegroundColor Yellow

# Get all files except exclusions
$files = Get-ChildItem -Path $substratePath -Recurse -File | 
    Where-Object { 
        $_.FullName -notmatch '\\target\\' -and
        $_.FullName -notmatch '\\.git\\' -and
        $_.Extension -ne '.lock'
    }

# Create temp directory for filtered files
$tempDir = "$env:TEMP\substrate-sync-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Copy filtered files maintaining structure
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring((Resolve-Path $substratePath).Path.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path $destPath -Parent
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item $file.FullName $destPath -Force
    }
    
    # Create ZIP
    Compress-Archive -Path "$tempDir\*" -DestinationPath $tempZip -Force
    
    Write-Host "Step 2: Uploading to server..." -ForegroundColor Yellow
    scp $tempZip pleroma:/tmp/substrate-sync.zip
    
    Write-Host "Step 3: Extracting on server..." -ForegroundColor Yellow
    ssh pleroma "mkdir -p $serverPath && cd $serverPath && unzip -q -o /tmp/substrate-sync.zip && rm /tmp/substrate-sync.zip && echo 'Extraction complete'"
    
    Write-Host "SUCCESS: Sync complete!" -ForegroundColor Green
    
    Write-Host "`nVerifying..." -ForegroundColor Cyan
    ssh pleroma "ls -lh $serverPath | head -10"
    
} finally {
    # Cleanup
    if (Test-Path $tempZip) { Remove-Item $tempZip -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}
