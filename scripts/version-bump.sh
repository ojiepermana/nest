#!/bin/bash

# Script untuk bump version library
# Author: Ojie Permana
# Date: November 8, 2025

set -e

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔢 Version Bump Script"
echo "====================="

# Menu pilihan library
echo -e "\n${BLUE}📚 Select library:${NC}"
echo "1. @ojiepermana/nest-generator"
echo "2. @ojiepermana/nest"
echo "3. Both libraries"
read -p "Enter choice (1-3): " lib_choice

# Menu pilihan version type
echo -e "\n${BLUE}📈 Select version bump type:${NC}"
echo "1. patch (1.0.0 -> 1.0.1)"
echo "2. minor (1.0.0 -> 1.1.0)"
echo "3. major (1.0.0 -> 2.0.0)"
read -p "Enter choice (1-3): " version_choice

case $version_choice in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) 
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

bump_version() {
    local lib_path=$1
    local lib_name=$2
    
    echo -e "\n${BLUE}🔢 Bumping ${lib_name} version (${VERSION_TYPE})...${NC}"
    
    cd "$lib_path"
    
    # Get current version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    
    # Bump version
    npm version "$VERSION_TYPE" --no-git-tag-version
    
    # Get new version
    NEW_VERSION=$(node -p "require('./package.json').version")
    
    cd ../..
    
    echo -e "${GREEN}✓ ${lib_name}: ${CURRENT_VERSION} -> ${NEW_VERSION}${NC}"
}

case $lib_choice in
    1)
        bump_version "libs/generator" "@ojiepermana/nest-generator"
        ;;
    2)
        bump_version "libs/nest" "@ojiepermana/nest"
        ;;
    3)
        bump_version "libs/generator" "@ojiepermana/nest-generator"
        bump_version "libs/nest" "@ojiepermana/nest"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Version bump completed!${NC}"
echo -e "${YELLOW}💡 Don't forget to:${NC}"
echo "  1. Commit the version changes"
echo "  2. Run ./scripts/publish-libs.sh to publish"
