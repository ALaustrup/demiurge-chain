# Setup script for Demiurge Web Pivot - Phase 1 (PowerShell)

Write-Host "🌐 Demiurge Web Pivot - Phase 1 Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

$nodeVersion = (node -v).Substring(1).Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $(node -v)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node -v) detected" -ForegroundColor Green

# Check npm version
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ npm $(npm -v) detected" -ForegroundColor Green
Write-Host ""

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Build shared packages
Write-Host ""
Write-Host "🔨 Building shared packages..." -ForegroundColor Yellow

Write-Host "  → Building @demiurge/qor-sdk..." -ForegroundColor Gray
Set-Location packages/qor-sdk
npm install
npm run build
Set-Location ../..

Write-Host "  → Building @demiurge/ui-shared..." -ForegroundColor Gray
Set-Location packages/ui-shared
npm install
npm run build
Set-Location ../..

# Install hub dependencies
Write-Host ""
Write-Host "📦 Installing hub dependencies..." -ForegroundColor Yellow
Set-Location apps/hub
npm install
Set-Location ../..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy apps/hub/.env.example to apps/hub/.env.local"
Write-Host "  2. Update .env.local with your configuration"
Write-Host "  3. Start Docker services: cd docker; docker-compose up -d"
Write-Host "  4. Start development server: cd apps/hub; npm run dev"
Write-Host ""
Write-Host "The hub will be available at http://localhost:3000" -ForegroundColor Green
