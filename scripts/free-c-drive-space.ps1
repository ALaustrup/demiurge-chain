# Free C: Drive Space - CRITICAL for Cursor Stability
# Run this script to free up space on C: drive

Write-Host "🚨 Freeing C: Drive Space" -ForegroundColor Red
Write-Host "Current C: drive free space: $([math]::Round((Get-WmiObject Win32_LogicalDisk -Filter 'DeviceID=\"C:\"').FreeSpace/1GB,2)) GB" -ForegroundColor Yellow
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell and 'Run as Administrator' for best results." -ForegroundColor Gray
    Write-Host ""
}

$totalFreed = 0

# 1. Clean Windows Temp
Write-Host "1. Cleaning Windows Temp directories..." -ForegroundColor Cyan
try {
    $tempSize = (Get-ChildItem $env:TEMP -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
    if ($tempSize -gt 0) {
        Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleaned $([math]::Round($tempSize,2)) GB from %TEMP%" -ForegroundColor Green
        $totalFreed += $tempSize
    }
} catch {
    Write-Host "   ⚠️  Could not clean %TEMP%: $_" -ForegroundColor Yellow
}

try {
    if (Test-Path "C:\Windows\Temp") {
        $winTempSize = (Get-ChildItem "C:\Windows\Temp" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
        if ($winTempSize -gt 0) {
            Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Cleaned $([math]::Round($winTempSize,2)) GB from C:\Windows\Temp" -ForegroundColor Green
            $totalFreed += $winTempSize
        }
    }
} catch {
    Write-Host "   ⚠️  Could not clean C:\Windows\Temp (may need admin): $_" -ForegroundColor Yellow
}

# 2. Clean Cargo cache (if on C:)
Write-Host ""
Write-Host "2. Checking Cargo cache..." -ForegroundColor Cyan
$cargoHome = $env:CARGO_HOME
if (-not $cargoHome) {
    $cargoHome = "$env:USERPROFILE\.cargo"
}

if (Test-Path $cargoHome) {
    $cargoRegistry = Join-Path $cargoHome "registry"
    if (Test-Path $cargoRegistry) {
        $cargoSize = (Get-ChildItem $cargoRegistry -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
        Write-Host "   Found Cargo cache: $([math]::Round($cargoSize,2)) GB at $cargoRegistry" -ForegroundColor Gray
        
        $response = Read-Host "   Clean Cargo cache? (y/N) - WARNING: Will require re-downloading crates"
        if ($response -eq "y" -or $response -eq "Y") {
            try {
                Remove-Item -Path "$cargoRegistry\cache" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Cleaned Cargo cache" -ForegroundColor Green
                $totalFreed += $cargoSize * 0.5  # Estimate, cache is usually ~50% of registry
            } catch {
                Write-Host "   ⚠️  Could not clean Cargo cache: $_" -ForegroundColor Yellow
            }
        }
    }
}

# 3. Clean npm cache (if on C:)
Write-Host ""
Write-Host "3. Checking npm cache..." -ForegroundColor Cyan
$npmCache = npm config get cache 2>$null
if ($npmCache -and (Test-Path $npmCache)) {
    $npmSize = (Get-ChildItem $npmCache -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "   Found npm cache: $([math]::Round($npmSize,2)) GB at $npmCache" -ForegroundColor Gray
    
    $response = Read-Host "   Clean npm cache? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        try {
            npm cache clean --force 2>&1 | Out-Null
            Write-Host "   ✅ Cleaned npm cache" -ForegroundColor Green
            $totalFreed += $npmSize * 0.8  # Estimate
        } catch {
            Write-Host "   ⚠️  Could not clean npm cache: $_" -ForegroundColor Yellow
        }
    }
}

# 4. Clean Recycle Bin
Write-Host ""
Write-Host "4. Checking Recycle Bin..." -ForegroundColor Cyan
try {
    $shell = New-Object -ComObject Shell.Application
    $recycleBin = $shell.NameSpace(0xA)
    $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum / 1GB
    if ($recycleBinSize -gt 0) {
        Write-Host "   Found $([math]::Round($recycleBinSize,2)) GB in Recycle Bin" -ForegroundColor Gray
        $response = Read-Host "   Empty Recycle Bin? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Clear-RecycleBin -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Emptied Recycle Bin" -ForegroundColor Green
            $totalFreed += $recycleBinSize
        }
    }
} catch {
    Write-Host "   ⚠️  Could not check Recycle Bin: $_" -ForegroundColor Yellow
}

# Final status
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$newFreeSpace = [math]::Round((Get-WmiObject Win32_LogicalDisk -Filter 'DeviceID=\"C:\"').FreeSpace/1GB,2)
Write-Host "Estimated space freed: $([math]::Round($totalFreed,2)) GB" -ForegroundColor Green
Write-Host "New C: drive free space: $newFreeSpace GB" -ForegroundColor $(if ($newFreeSpace -lt 20) { "Red" } elseif ($newFreeSpace -lt 50) { "Yellow" } else { "Green" })
Write-Host ""

if ($newFreeSpace -lt 20) {
    Write-Host "⚠️  WARNING: C: drive still has less than 20 GB free!" -ForegroundColor Red
    Write-Host "   Consider:" -ForegroundColor Yellow
    Write-Host "   - Moving large files to X: or E: drive" -ForegroundColor White
    Write-Host "   - Uninstalling unused programs" -ForegroundColor White
    Write-Host "   - Running Windows Disk Cleanup tool" -ForegroundColor White
} else {
    Write-Host "✅ C: drive space is now acceptable. Restart Cursor." -ForegroundColor Green
}
