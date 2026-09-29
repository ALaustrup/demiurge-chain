# Clean Build Directories - Free Disk Space
# Safely removes build artifacts that can be regenerated

param(
    [switch]$Force,
    [switch]$DryRun
)

Write-Host "🧹 Cleaning Build Directories" -ForegroundColor Cyan
Write-Host ""

$dirsToClean = @(
    @{Path="x:\Demiurge-Blockchain\substrate\target"; Name="Substrate build"; Safe=$true},
    @{Path="x:\Demiurge-Blockchain\blockchain\target"; Name="Blockchain build"; Safe=$true},
    @{Path="x:\Demiurge-Blockchain\packages\wallet-wasm\target"; Name="WASM build"; Safe=$true},
    @{Path="x:\Demiurge-Blockchain\apps\hub\.next"; Name="Next.js build"; Safe=$true},
    @{Path="x:\Demiurge-Blockchain\apps\hub\node_modules"; Name="Node modules"; Safe=$false}
)

$totalFreed = 0
$cleaned = @()

foreach ($item in $dirsToClean) {
    $dir = $item.Path
    $name = $item.Name
    $safe = $item.Safe
    
    if (Test-Path $dir) {
        $size = (Get-ChildItem $dir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
        $sizeGB = [math]::Round($size, 2)
        
        Write-Host "$name" -ForegroundColor Yellow
        Write-Host "  Path: $dir" -ForegroundColor Gray
        Write-Host "  Size: $sizeGB GB" -ForegroundColor White
        
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete" -ForegroundColor Cyan
            $totalFreed += $size
            continue
        }
        
        if ($Force -or $safe) {
            if ($safe -or $Force) {
                Write-Host "  Deleting..." -ForegroundColor Yellow
                try {
                    Remove-Item -Recurse -Force $dir -ErrorAction Stop
                    Write-Host "  ✅ Deleted ($sizeGB GB freed)" -ForegroundColor Green
                    $totalFreed += $size
                    $cleaned += $name
                } catch {
                    Write-Host "  ❌ Error: $_" -ForegroundColor Red
                }
            } else {
                Write-Host "  ⚠️  Not safe to auto-delete (use -Force to override)" -ForegroundColor Yellow
            }
        } else {
            $response = Read-Host "  Delete? (y/N)"
            if ($response -eq "y" -or $response -eq "Y") {
                try {
                    Remove-Item -Recurse -Force $dir -ErrorAction Stop
                    Write-Host "  ✅ Deleted ($sizeGB GB freed)" -ForegroundColor Green
                    $totalFreed += $size
                    $cleaned += $name
                } catch {
                    Write-Host "  ❌ Error: $_" -ForegroundColor Red
                }
            } else {
                Write-Host "  ⏭️  Skipped" -ForegroundColor Gray
            }
        }
        Write-Host ""
    } else {
        Write-Host "$name: Not found" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Total space freed: $([math]::Round($totalFreed, 2)) GB" -ForegroundColor Green
Write-Host ""

if ($cleaned.Count -gt 0) {
    Write-Host "Cleaned directories:" -ForegroundColor Cyan
    foreach ($item in $cleaned) {
        Write-Host "  ✅ $item" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Note: You'll need to rebuild these:" -ForegroundColor Yellow
    Write-Host "  - Substrate: cd substrate; cargo build" -ForegroundColor White
    Write-Host "  - Blockchain: cd blockchain; cargo build" -ForegroundColor White
    Write-Host "  - Hub: cd apps/hub; npm install; npm run dev" -ForegroundColor White
}
