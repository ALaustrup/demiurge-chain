# Demiurge Client - Clean Build Script
# Removes all build artifacts to resolve version mismatch errors

Write-Host "🧹 Cleaning Demiurge Client build artifacts..." -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Continue"

# Kill any running UE5 processes first
Write-Host "`n🛑 Stopping Unreal Engine processes..." -ForegroundColor Yellow
$Processes = @("UnrealEditor*", "UnrealBuildTool*", "UE5Editor*", "UE_5.7*")
foreach ($ProcessName in $Processes) {
    $Running = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($Running) {
        foreach ($Proc in $Running) {
            Write-Host "  Stopping: $($Proc.ProcessName) (PID: $($Proc.Id))" -ForegroundColor Gray
            Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 2

# Directories to clean
$CleanDirs = @(
    "$ProjectRoot\Binaries",
    "$ProjectRoot\Intermediate",
    "$ProjectRoot\Saved",
    "$ProjectRoot\.vs",
    "$ProjectRoot\DerivedDataCache"
)

# Files to clean
$CleanFiles = @(
    "$ProjectRoot\*.sln",
    "$ProjectRoot\*.suo",
    "$ProjectRoot\*.user",
    "$ProjectRoot\*.opensdf",
    "$ProjectRoot\*.sdf",
    "$ProjectRoot\*.db"
)

Write-Host "`n📁 Removing directories..." -ForegroundColor Yellow
foreach ($Dir in $CleanDirs) {
    if (Test-Path $Dir) {
        Write-Host "  Removing: $Dir" -ForegroundColor Gray
        Remove-Item -Path $Dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n📄 Removing files..." -ForegroundColor Yellow
foreach ($Pattern in $CleanFiles) {
    $Files = Get-ChildItem -Path $Pattern -ErrorAction SilentlyContinue
    foreach ($File in $Files) {
        Write-Host "  Removing: $($File.Name)" -ForegroundColor Gray
        Remove-Item -Path $File.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n✅ Clean complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Right-click DemiurgeClient.uproject → Generate Visual Studio project files" -ForegroundColor White
Write-Host "  2. Open the .sln file in Visual Studio 2026" -ForegroundColor White
Write-Host "  3. Build → Build Solution (or use Unreal Editor's Compile button)" -ForegroundColor White
Write-Host "`n⚠️  Note: This will regenerate all project files and rebuild from scratch." -ForegroundColor Yellow
