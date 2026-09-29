# Generate Visual Studio Project Files for Demiurge Client
# This script finds UE5 and generates the .sln file

Write-Host "🔧 Generating Visual Studio project files..." -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectFile = Join-Path $ProjectRoot "DemiurgeClient.uproject"

if (-not (Test-Path $ProjectFile)) {
    Write-Host "❌ Error: Cannot find DemiurgeClient.uproject" -ForegroundColor Red
    exit 1
}

# Common UE5 installation paths
$PossiblePaths = @(
    "C:\Program Files\Epic Games\UE_5.7\Engine\Build\BatchFiles\Build.bat",
    "C:\Program Files (x86)\Epic Games\UE_5.7\Engine\Build\BatchFiles\Build.bat",
    "$env:LOCALAPPDATA\Programs\Epic Games\UE_5.7\Engine\Build\BatchFiles\Build.bat",
    "C:\UnrealEngine\UE_5.7\Engine\Build\BatchFiles\Build.bat"
)

# Try to find UE5 installation
$UE5BuildBat = $null
foreach ($Path in $PossiblePaths) {
    if (Test-Path $Path) {
        $UE5BuildBat = $Path
        Write-Host "✅ Found UE5 at: $Path" -ForegroundColor Green
        break
    }
}

if (-not $UE5BuildBat) {
    Write-Host "❌ Could not find Unreal Engine 5.7 installation" -ForegroundColor Red
    Write-Host "`n📋 Manual Steps:" -ForegroundColor Yellow
    Write-Host "  1. Right-click DemiurgeClient.uproject" -ForegroundColor White
    Write-Host "  2. Select 'Generate Visual Studio project files'" -ForegroundColor White
    Write-Host "`nOR" -ForegroundColor Yellow
    Write-Host "  1. Open Unreal Engine 5.7.1 from Epic Games Launcher" -ForegroundColor White
    Write-Host "  2. Open DemiurgeClient.uproject" -ForegroundColor White
    Write-Host "  3. Editor will auto-generate project files" -ForegroundColor White
    exit 1
}

# Generate project files using UnrealBuildTool
Write-Host "`n🔨 Running UnrealBuildTool..." -ForegroundColor Yellow

$Arguments = @(
    "-projectfiles",
    "-project=`"$ProjectFile`"",
    "-game",
    "-rocket",
    "-progress"
)

try {
    & $UE5BuildBat $Arguments
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Project files generated successfully!" -ForegroundColor Green
        
        $SlnFile = Join-Path $ProjectRoot "DemiurgeClient.sln"
        if (Test-Path $SlnFile) {
            Write-Host "`n📄 Solution file created: DemiurgeClient.sln" -ForegroundColor Cyan
            Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
            Write-Host "  1. Open DemiurgeClient.sln in Visual Studio 2026" -ForegroundColor White
            Write-Host "  2. Build → Build Solution (or use Unreal Editor's Compile)" -ForegroundColor White
        } else {
            Write-Host "`n⚠️  Warning: .sln file not found, but generation may have succeeded" -ForegroundColor Yellow
            Write-Host "   Try opening the .uproject file in Unreal Editor instead" -ForegroundColor White
        }
    } else {
        Write-Host "`n❌ Project file generation failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "`n📋 Try manual method:" -ForegroundColor Yellow
        Write-Host "  Right-click DemiurgeClient.uproject → Generate Visual Studio project files" -ForegroundColor White
    }
} catch {
    Write-Host "`n❌ Error running UnrealBuildTool: $_" -ForegroundColor Red
    Write-Host "`n📋 Try manual method:" -ForegroundColor Yellow
    Write-Host "  Right-click DemiurgeClient.uproject → Generate Visual Studio project files" -ForegroundColor White
}
