# Diagnose Unreal Editor Launch Failure
# This script checks common causes of editor launch failures

Write-Host "🔍 Diagnosing Unreal Editor Launch Failure..." -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectFile = Join-Path $ProjectRoot "DemiurgeClient.uproject"
$Issues = @()
$Warnings = @()

# Check 1: Project file exists
Write-Host "[1/10] Checking project file..." -ForegroundColor Yellow
if (Test-Path $ProjectFile) {
    Write-Host "  ✅ Project file exists" -ForegroundColor Green
    $ProjectContent = Get-Content $ProjectFile -Raw | ConvertFrom-Json
    
    # Check EngineAssociation
    if ($ProjectContent.EngineAssociation) {
        Write-Host "  ✅ Engine association: $($ProjectContent.EngineAssociation)" -ForegroundColor Green
    } else {
        $Issues += "Project file missing EngineAssociation"
    }
} else {
    $Issues += "Project file not found: $ProjectFile"
    Write-Host "  ❌ Project file missing!" -ForegroundColor Red
}

# Check 2: Binaries folder
Write-Host "[2/10] Checking Binaries folder..." -ForegroundColor Yellow
$BinariesPath = Join-Path $ProjectRoot "Binaries"
if (Test-Path $BinariesPath) {
    $BinariesCount = (Get-ChildItem $BinariesPath -Recurse -File -ErrorAction SilentlyContinue).Count
    if ($BinariesCount -gt 0) {
        Write-Host "  ⚠️  Binaries folder exists ($BinariesCount files) - may be corrupted" -ForegroundColor Yellow
        $Warnings += "Binaries folder exists but editor won't launch - may need cleanup"
    } else {
        Write-Host "  ✅ Binaries folder empty (expected for first launch)" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ Binaries folder doesn't exist (expected for first launch)" -ForegroundColor Green
}

# Check 3: Intermediate folder
Write-Host "[3/10] Checking Intermediate folder..." -ForegroundColor Yellow
$IntermediatePath = Join-Path $ProjectRoot "Intermediate"
if (Test-Path $IntermediatePath) {
    $IntermediateCount = (Get-ChildItem $IntermediatePath -Recurse -File -ErrorAction SilentlyContinue).Count
    Write-Host "  ℹ️  Intermediate folder exists ($IntermediateCount files)" -ForegroundColor Gray
} else {
    Write-Host "  ✅ Intermediate folder doesn't exist (will be created)" -ForegroundColor Green
}

# Check 4: Source modules
Write-Host "[4/10] Checking C++ modules..." -ForegroundColor Yellow
$SourcePath = Join-Path $ProjectRoot "Source"
$RequiredModules = @("DemiurgeClient", "DemiurgeWeb3", "QorUI")
$MissingModules = @()

foreach ($Module in $RequiredModules) {
    $ModulePath = Join-Path $SourcePath $Module
    if (Test-Path $ModulePath) {
        $BuildCs = Join-Path $ModulePath "$Module.Build.cs"
        if (Test-Path $BuildCs) {
            Write-Host "  ✅ Module '$Module' found" -ForegroundColor Green
        } else {
            $MissingModules += "$Module (missing .Build.cs)"
        }
    } else {
        $MissingModules += "$Module (missing folder)"
    }
}

if ($MissingModules.Count -gt 0) {
    $Issues += "Missing modules: $($MissingModules -join ', ')"
}

# Check 5: Visual Studio installation
Write-Host "[5/10] Checking Visual Studio..." -ForegroundColor Yellow
$VS2026Paths = @(
    "C:\Program Files\Microsoft Visual Studio\2026\Community\Common7\IDE\devenv.exe",
    "C:\Program Files\Microsoft Visual Studio\2026\Professional\Common7\IDE\devenv.exe",
    "C:\Program Files\Microsoft Visual Studio\2026\Enterprise\Common7\IDE\devenv.exe"
)

$VSFound = $false
foreach ($VSPath in $VS2026Paths) {
    if (Test-Path $VSPath) {
        Write-Host "  ✅ Visual Studio 2026 found" -ForegroundColor Green
        $VSFound = $true
        break
    }
}

if (-not $VSFound) {
    $Warnings += "Visual Studio 2026 not found - C++ modules may not compile"
    Write-Host "  ⚠️  Visual Studio 2026 not found in standard locations" -ForegroundColor Yellow
}

# Check 6: UE5 installation
Write-Host "[6/10] Checking Unreal Engine installation..." -ForegroundColor Yellow
$UE5Paths = @(
    "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe",
    "C:\Program Files (x86)\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe",
    "$env:LOCALAPPDATA\Programs\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe"
)

$UE5Found = $false
$UE5Path = $null
foreach ($Path in $UE5Paths) {
    if (Test-Path $Path) {
        $UE5Path = $Path
        $UE5Found = $true
        Write-Host "  ✅ Unreal Engine 5.7 found: $Path" -ForegroundColor Green
        break
    }
}

if (-not $UE5Found) {
    $Issues += "Unreal Engine 5.7 installation not found"
    Write-Host "  ❌ Unreal Engine 5.7 not found!" -ForegroundColor Red
}

# Check 7: WebSocket plugin
Write-Host "[7/10] Checking WebSocket plugin..." -ForegroundColor Yellow
$WebSocketPluginPath = Join-Path $ProjectRoot "Plugins\WebSockets"
if (Test-Path $WebSocketPluginPath) {
    $UPluginFile = Join-Path $WebSocketPluginPath "WebSockets.uplugin"
    if (Test-Path $UPluginFile) {
        Write-Host "  ✅ WebSocket plugin found" -ForegroundColor Green
    } else {
        $Warnings += "WebSocket plugin folder exists but .uplugin file missing"
        Write-Host "  ⚠️  WebSocket plugin folder exists but .uplugin missing" -ForegroundColor Yellow
    }
} else {
    $Warnings += "WebSocket plugin not installed - may cause module compilation errors"
    Write-Host "  ⚠️  WebSocket plugin not found (see WEBSOCKET_PLUGIN_SETUP.md)" -ForegroundColor Yellow
}

# Check 8: Solution file
Write-Host "[8/10] Checking Visual Studio solution..." -ForegroundColor Yellow
$SlnFile = Join-Path $ProjectRoot "DemiurgeClient.sln"
if (Test-Path $SlnFile) {
    Write-Host "  ✅ Solution file exists" -ForegroundColor Green
} else {
    $Warnings += "Solution file (.sln) not generated - run GENERATE_PROJECT_FILES.ps1"
    Write-Host "  ⚠️  Solution file not found (run GENERATE_PROJECT_FILES.ps1)" -ForegroundColor Yellow
}

# Check 9: File permissions
Write-Host "[9/10] Checking file permissions..." -ForegroundColor Yellow
try {
    $TestFile = Join-Path $ProjectRoot "test_write.tmp"
    "test" | Out-File $TestFile -ErrorAction Stop
    Remove-Item $TestFile -ErrorAction SilentlyContinue
    Write-Host "  ✅ Write permissions OK" -ForegroundColor Green
} catch {
    $Issues += "No write permissions in project directory"
    Write-Host "  ❌ Write permission denied!" -ForegroundColor Red
}

# Check 10: Running processes
Write-Host "[10/10] Checking for running UE5 processes..." -ForegroundColor Yellow
$RunningProcesses = Get-Process -Name "UnrealEditor*" -ErrorAction SilentlyContinue
if ($RunningProcesses) {
    Write-Host "  ⚠️  Unreal Editor processes already running:" -ForegroundColor Yellow
    foreach ($Proc in $RunningProcesses) {
        Write-Host "      - $($Proc.ProcessName) (PID: $($Proc.Id))" -ForegroundColor Gray
    }
    $Warnings += "Unreal Editor already running - close before launching"
} else {
    Write-Host "  ✅ No conflicting processes" -ForegroundColor Green
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "DIAGNOSIS SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

if ($Issues.Count -eq 0 -and $Warnings.Count -eq 0) {
    Write-Host "`n✅ No issues detected!" -ForegroundColor Green
    Write-Host "`nTry launching the editor again." -ForegroundColor White
} else {
    if ($Issues.Count -gt 0) {
        Write-Host "`n❌ CRITICAL ISSUES ($($Issues.Count)):" -ForegroundColor Red
        foreach ($Issue in $Issues) {
            Write-Host "   • $Issue" -ForegroundColor Red
        }
    }
    
    if ($Warnings.Count -gt 0) {
        Write-Host "`n⚠️  WARNINGS ($($Warnings.Count)):" -ForegroundColor Yellow
        foreach ($Warning in $Warnings) {
            Write-Host "   • $Warning" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📋 RECOMMENDED ACTIONS:" -ForegroundColor Cyan

if ($Issues.Count -gt 0) {
    Write-Host "`n1. Fix critical issues above" -ForegroundColor White
}

if ($Warnings -contains "Binaries folder exists but editor won't launch") {
    Write-Host "`n2. Clean build artifacts:" -ForegroundColor White
    Write-Host "   .\CLEAN_BUILD.ps1" -ForegroundColor Gray
}

if ($Warnings -contains "Solution file (.sln) not generated") {
    Write-Host "`n3. Generate project files:" -ForegroundColor White
    Write-Host "   .\GENERATE_PROJECT_FILES.ps1" -ForegroundColor Gray
}

if ($Warnings -contains "WebSocket plugin not installed") {
    Write-Host "`n4. Install WebSocket plugin (see WEBSOCKET_PLUGIN_SETUP.md)" -ForegroundColor White
}

Write-Host "`n5. Try launching from Epic Games Launcher:" -ForegroundColor White
Write-Host "   - Open Epic Games Launcher" -ForegroundColor Gray
Write-Host "   - Unreal Engine → Library → Launch UE 5.7" -ForegroundColor Gray
Write-Host "   - Browse to project and open" -ForegroundColor Gray

Write-Host "`n" + "="*60 -ForegroundColor Cyan
