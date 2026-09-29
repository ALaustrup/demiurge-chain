# Free Disk Space - Clean Build Directories
# Removes Rust target directories to free up space

Write-Host "🧹 Freeing Disk Space" -ForegroundColor Cyan
Write-Host ""

$targetDirs = @(
    "x:\Demiurge-Blockchain\substrate\target",
    "x:\Demiurge-Blockchain\blockchain\target",
    "x:\Demiurge-Blockchain\packages\wallet-wasm\target"
)

$totalFreed = 0

foreach ($dir in $targetDirs) {
    if (Test-Path $dir) {
        Write-Host "Checking: $dir" -ForegroundColor Yellow
        $size = (Get-ChildItem $dir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
        Write-Host "  Size: $([math]::Round($size, 2)) GB" -ForegroundColor White
        
        $response = Read-Host "  Delete this directory? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
            Write-Host "  ✅ Deleted" -ForegroundColor Green
            $totalFreed += $size
        } else {
            Write-Host "  ⏭️  Skipped" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Total space freed: $([math]::Round($totalFreed, 2)) GB" -ForegroundColor Green
Write-Host ""
Write-Host "Note: You'll need to rebuild, but this frees up critical disk space." -ForegroundColor Yellow
