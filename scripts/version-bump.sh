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

# Function to get current version
get_current_version() {
    local lib_path=$1
    cd "$lib_path"
    local version=$(node -p "require('./package.json').version")
    cd - > /dev/null
    echo "$version"
}

# Menu pilihan library
echo -e "\n${BLUE}📚 Select library:${NC}"
GENERATOR_VERSION=$(get_current_version "libs/generator")
NEST_VERSION=$(get_current_version "libs/nest")
RBAC_VERSION=$(get_current_version "libs/rbac")

echo "1. @ojiepermana/nest-generator (current: ${GENERATOR_VERSION})"
echo "2. @ojiepermana/nest (current: ${NEST_VERSION})"
echo "3. @ojiepermana/nest-rbac (current: ${RBAC_VERSION})"
echo "4. All libraries"
read -p "Enter choice (1-4): " lib_choice

# Menu pilihan version type
echo -e "\n${BLUE}📈 Select version bump type:${NC}"
echo "1. patch (x.y.z -> x.y.z+1)"
echo "2. minor (x.y.z -> x.y+1.0)"
echo "3. major (x.y.z -> x+1.0.0)"
echo "4. custom (specify exact version)"
read -p "Enter choice (1-4): " version_choice

case $version_choice in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    4) 
        VERSION_TYPE="custom"
        read -p "Enter custom version (e.g., 2.1.5): " CUSTOM_VERSION
        ;;
    *) 
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

bump_version() {
    local lib_path=$1
    local lib_name=$2
    
    echo -e "\n${BLUE}🔢 Bumping ${lib_name} version...${NC}"
    
    cd "$lib_path"
    
    # Get current version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    
    # Calculate new version
    if [ "$VERSION_TYPE" = "custom" ]; then
        # For custom version, ask for each library separately when bumping all
        if [ "$lib_choice" = "4" ]; then
            read -p "Enter custom version for ${lib_name} (e.g., 2.1.5): " LIB_CUSTOM_VERSION
            NEW_VERSION="$LIB_CUSTOM_VERSION"
        else
            NEW_VERSION="$CUSTOM_VERSION"
        fi
        echo -e "Current: ${CURRENT_VERSION}"
        echo -e "New:     ${NEW_VERSION}"
    else
        # Calculate new version for preview
        IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
        case $VERSION_TYPE in
            "major")
                NEW_VERSION="$((major + 1)).0.0"
                ;;
            "minor")
                NEW_VERSION="${major}.$((minor + 1)).0"
                ;;
            "patch")
                NEW_VERSION="${major}.${minor}.$((patch + 1))"
                ;;
        esac
        echo -e "Current: ${CURRENT_VERSION}"
        echo -e "Type:    ${VERSION_TYPE}"
        echo -e "New:     ${NEW_VERSION}"
    fi
    
    # Confirm
    read -p "Proceed with version bump? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Skipped ${lib_name}${NC}"
        cd - > /dev/null
        return
    fi
    
    # Bump version
    if [ "$VERSION_TYPE" = "custom" ]; then
        if [ "$lib_choice" = "4" ]; then
            npm version "$LIB_CUSTOM_VERSION" --no-git-tag-version --allow-same-version
        else
            npm version "$CUSTOM_VERSION" --no-git-tag-version --allow-same-version
        fi
    else
        npm version "$VERSION_TYPE" --no-git-tag-version
    fi
    
    # Get new version
    FINAL_VERSION=$(node -p "require('./package.json').version")
    
    cd - > /dev/null
    
    echo -e "${GREEN}✓ ${lib_name}: ${CURRENT_VERSION} -> ${FINAL_VERSION}${NC}"
}

case $lib_choice in
    1)
        bump_version "libs/generator" "@ojiepermana/nest-generator"
        ;;
    2)
        bump_version "libs/nest" "@ojiepermana/nest"
        ;;
    3)
        bump_version "libs/rbac" "@ojiepermana/nest-rbac"
        ;;
    4)
        bump_version "libs/generator" "@ojiepermana/nest-generator"
        bump_version "libs/nest" "@ojiepermana/nest"
        bump_version "libs/rbac" "@ojiepermana/nest-rbac"
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
