#!/bin/bash

# Script untuk publish NestJS libraries ke npm registry
# Author: Ojie Permana
# Date: November 8, 2025

set -e  # Exit jika ada error

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📦 Script Publish NestJS Libraries"
echo "===================================="

# Cek apakah user sudah login ke npm
echo -e "\n${BLUE}🔐 Checking npm authentication...${NC}"
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ You are not logged in to npm.${NC}"
    echo -e "${YELLOW}💡 Please run: npm login${NC}"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✓ Logged in as: ${NPM_USER}${NC}"

# Pastikan working directory bersih
echo -e "\n${BLUE}🔍 Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo -e "${YELLOW}💡 Commit your changes before publishing${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Publish cancelled${NC}"
        exit 1
    fi
fi

# Menu pilihan
echo -e "\n${BLUE}📚 Select library to publish:${NC}"
echo "1. @ojiepermana/nest-generator"
echo "2. @ojiepermana/nest"
echo "3. Both libraries"
echo "4. Cancel"
read -p "Enter choice (1-4): " choice

publish_generator() {
    echo -e "\n${BLUE}📦 Publishing @ojiepermana/nest-generator...${NC}"
    
    # Build library
    echo -e "${BLUE}🔨 Building generator library...${NC}"
    npm run build:generator
    
    # Copy dist to library folder
    echo -e "${BLUE}📋 Copying build output...${NC}"
    cp -r dist/libs/generator libs/generator/dist
    
    # Check if dist exists
    if [ ! -d "libs/generator/dist" ]; then
        echo -e "${RED}❌ Build failed! dist directory not found${NC}"
        exit 1
    fi
    
    # Publish
    cd libs/generator
    echo -e "${BLUE}📤 Publishing to npm...${NC}"
    npm publish
    cd ../..
    
    echo -e "${GREEN}✅ @ojiepermana/nest-generator published successfully!${NC}"
}

publish_nest() {
    echo -e "\n${BLUE}📦 Publishing @ojiepermana/nest...${NC}"
    
    # Build library
    echo -e "${BLUE}🔨 Building nest library...${NC}"
    npm run build:nest
    
    # Copy dist to library folder
    echo -e "${BLUE}📋 Copying build output...${NC}"
    cp -r dist/libs/nest libs/nest/dist
    
    # Check if dist exists
    if [ ! -d "libs/nest/dist" ]; then
        echo -e "${RED}❌ Build failed! dist directory not found${NC}"
        exit 1
    fi
    
    # Publish
    cd libs/nest
    echo -e "${BLUE}📤 Publishing to npm...${NC}"
    npm publish
    cd ../..
    
    echo -e "${GREEN}✅ @ojiepermana/nest published successfully!${NC}"
}

case $choice in
    1)
        publish_generator
        ;;
    2)
        publish_nest
        ;;
    3)
        publish_generator
        publish_nest
        echo -e "\n${GREEN}🎉 All libraries published successfully!${NC}"
        ;;
    4)
        echo -e "${YELLOW}❌ Publish cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}📊 Published packages info:${NC}"
echo -e "${YELLOW}View on npm:${NC}"
if [[ $choice == "1" || $choice == "3" ]]; then
    echo "  - https://www.npmjs.com/package/@ojiepermana/nest-generator"
fi
if [[ $choice == "2" || $choice == "3" ]]; then
    echo "  - https://www.npmjs.com/package/@ojiepermana/nest"
fi

echo -e "\n${YELLOW}💡 Install in other projects:${NC}"
if [[ $choice == "1" || $choice == "3" ]]; then
    echo "  npm install @ojiepermana/nest-generator"
fi
if [[ $choice == "2" || $choice == "3" ]]; then
    echo "  npm install @ojiepermana/nest"
fi

echo -e "\n${GREEN}✨ Done!${NC}"
