#!/bin/bash
# Setup script for Demiurge Web Pivot - Phase 1

set -e

echo "🌐 Demiurge Web Pivot - Phase 1 Setup"
echo "======================================"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm version
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build shared packages
echo ""
echo "🔨 Building shared packages..."

echo "  → Building @demiurge/qor-sdk..."
cd packages/qor-sdk
npm install
npm run build
cd ../..

echo "  → Building @demiurge/ui-shared..."
cd packages/ui-shared
npm install
npm run build
cd ../..

# Install hub dependencies
echo ""
echo "📦 Installing hub dependencies..."
cd apps/hub
npm install
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy apps/hub/.env.example to apps/hub/.env.local"
echo "  2. Update .env.local with your configuration"
echo "  3. Start Docker services: cd docker && docker-compose up -d"
echo "  4. Start development server: cd apps/hub && npm run dev"
echo ""
echo "The hub will be available at http://localhost:3000"
