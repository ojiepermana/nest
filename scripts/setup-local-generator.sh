#!/bin/bash

# Quick Start Generator Testing Script
# This script helps you test the local generator build

set -e

echo "🚀 NestJS Generator - Local Testing Setup"
echo "=========================================="
echo ""

# Step 1: Build generator
echo "📦 Step 1: Building generator..."
npm run build:generator
echo "✅ Generator built successfully"
echo ""

# Step 2: Link CLI
echo "🔗 Step 2: Linking CLI globally..."
cd libs/generator
npm link
cd ../..
echo "✅ CLI linked successfully"
echo ""

# Step 3: Verify installation
echo "✓ Step 3: Verifying installation..."
echo "Command location: $(which nest-generator)"
echo "Version: $(nest-generator --version)"
echo ""

# Step 4: Create directories
echo "📁 Step 4: Creating output directories..."
mkdir -p src/modules
echo "✅ Created src/modules"
echo ""

# Step 5: Check environment
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file (please update database credentials)"
else
    echo "✅ .env file exists"
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Run: npm run generator:init"
echo "3. Add metadata to your database (see LOCAL_TESTING.md)"
echo "4. Generate: nest-generator generate schema.table"
echo ""
echo "Quick commands:"
echo "  npm run generator:init       - Initialize database"
echo "  npm run generator:generate   - Generate module"
echo "  npm run generator:list       - List modules"
echo "  nest-generator --help        - Show all commands"
echo ""
echo "📚 Full documentation: LOCAL_TESTING.md"
echo "=========================================="
