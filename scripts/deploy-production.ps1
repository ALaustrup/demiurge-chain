# Production Deployment Script
# Deploys optimized configuration to production server

$ErrorActionPreference = "Stop"

Write-Host "🚀 Production Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "51.210.209.112"
$SSH_USER = "ubuntu"

Write-Host "📋 Deployment Checklist" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will help you deploy:" -ForegroundColor Gray
Write-Host "1. QOR Auth service optimizations" -ForegroundColor Gray
Write-Host "2. Next.js Hub production build" -ForegroundColor Gray
Write-Host "3. Nginx reverse proxy configuration" -ForegroundColor Gray
Write-Host "4. SSL/TLS certificates (Let's Encrypt)" -ForegroundColor Gray
Write-Host "5. Monitoring setup" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📦 Step 1: Building Next.js Hub..." -ForegroundColor Yellow
Write-Host "   cd apps/hub" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Please run the build command manually, then press Enter to continue..."
Read-Host

Write-Host ""
Write-Host "📤 Step 2: Deploying to Server..." -ForegroundColor Yellow
Write-Host "   Files to deploy:" -ForegroundColor Gray
Write-Host "   - apps/hub/.next (production build)" -ForegroundColor Gray
Write-Host "   - docker/docker-compose.production.yml" -ForegroundColor Gray
Write-Host "   - nginx configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Deployment commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Copy files to server" -ForegroundColor DarkGray
Write-Host "scp -r apps/hub/.next $SSH_USER@$SERVER:/opt/demiurge/hub/" -ForegroundColor DarkGray
Write-Host "scp docker/docker-compose.production.yml $SSH_USER@$SERVER:/opt/demiurge/" -ForegroundColor DarkGray
Write-Host ""
Write-Host "# SSH into server" -ForegroundColor DarkGray
Write-Host "ssh $SSH_USER@$SERVER" -ForegroundColor DarkGray
Write-Host ""
Write-Host "# On server, restart services" -ForegroundColor DarkGray
Write-Host "cd /opt/demiurge" -ForegroundColor DarkGray
Write-Host "docker-compose -f docker-compose.production.yml up -d --build" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Deployment instructions provided!" -ForegroundColor Green
