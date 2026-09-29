# Start QOR Auth Service
# This script starts the QOR Auth service either via Docker or natively

param(
    [switch]$Docker,
    [switch]$Native
)

$ErrorActionPreference = "Stop"

Write-Host "🎭 Starting QOR Auth Service..." -ForegroundColor Cyan

if ($Docker) {
    Write-Host "🐳 Starting via Docker Compose..." -ForegroundColor Yellow
    
    # Check if Docker Desktop is running
    try {
        docker ps | Out-Null
    } catch {
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        exit 1
    }
    
    # Navigate to docker directory
    Push-Location "$PSScriptRoot\..\docker"
    
    try {
        # Check if .env exists
        if (-not (Test-Path ".env")) {
            Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Yellow
            Copy-Item ".env.example" ".env"
            Write-Host "⚠️  Please edit .env and update configuration values!" -ForegroundColor Yellow
        }
        
        # Start services (postgres, redis, qor-auth)
        Write-Host "▶️  Starting PostgreSQL, Redis, and QOR Auth..." -ForegroundColor Green
        docker-compose up -d postgres redis qor-auth
        
        Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Check status
        Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
        docker-compose ps
        
        Write-Host "`n📋 QOR Auth Logs (last 20 lines):" -ForegroundColor Cyan
        docker-compose logs --tail=20 qor-auth
        
        Write-Host "`n✅ QOR Auth should be running on http://localhost:8080" -ForegroundColor Green
        Write-Host "🔍 Health check: curl http://localhost:8080/health" -ForegroundColor Gray
        
    } finally {
        Pop-Location
    }
    
} elseif ($Native) {
    Write-Host "🦀 Starting natively with Cargo..." -ForegroundColor Yellow
    
    # Check prerequisites
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if PostgreSQL is running
    try {
        $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
        if (-not $pgTest.TcpTestSucceeded) {
            Write-Host "❌ PostgreSQL is not running on port 5432!" -ForegroundColor Red
            Write-Host "Please start PostgreSQL first." -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "⚠️  Could not verify PostgreSQL connection" -ForegroundColor Yellow
    }
    
    # Check if Redis is running
    try {
        $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
        if (-not $redisTest.TcpTestSucceeded) {
            Write-Host "❌ Redis is not running on port 6379!" -ForegroundColor Red
            Write-Host "Please start Redis first." -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "⚠️  Could not verify Redis connection" -ForegroundColor Yellow
    }
    
    # Navigate to service directory
    Push-Location "$PSScriptRoot\..\services\qor-auth"
    
    try {
        # Check if .env exists
        if (-not (Test-Path ".env")) {
            Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Yellow
            Copy-Item ".env.example" ".env"
            
            # Update port to 8080
            $envContent = Get-Content ".env" -Raw
            $envContent = $envContent -replace "QOR_AUTH__SERVER__PORT=3000", "QOR_AUTH__SERVER__PORT=8080"
            Set-Content ".env" -Value $envContent
            
            Write-Host "⚠️  Please edit .env and update database/redis URLs and JWT secrets!" -ForegroundColor Yellow
        }
        
        # Set environment variable for port
        $env:QOR_AUTH__SERVER__PORT = "8080"
        
        Write-Host "▶️  Building and starting QOR Auth..." -ForegroundColor Green
        cargo run --release
        
    } finally {
        Pop-Location
    }
    
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start-qor-auth.ps1 -Docker    # Start via Docker Compose (recommended)" -ForegroundColor Gray
    Write-Host "  .\start-qor-auth.ps1 -Native    # Start natively with Cargo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Quick start with Docker:" -ForegroundColor Cyan
    Write-Host "  1. Start Docker Desktop" -ForegroundColor Gray
    Write-Host "  2. Run: .\start-qor-auth.ps1 -Docker" -ForegroundColor Gray
    exit 0
}
