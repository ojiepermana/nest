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

echo "1. @ojiepermana/nest-generator (current: ${GENERATOR_VERSION})"
echo "2. @ojiepermana/nest (current: ${NEST_VERSION})"
echo "3. Both libraries"
read -p "Enter choice (1-3): " lib_choice

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
    
    # Calculate new version preview
    if [ "$VERSION_TYPE" = "custom" ]; then
        NEW_VERSION="$CUSTOM_VERSION"
    else
        # Calculate what the new version will be
        NEW_VERSION=$(node -p "
            const semver = require('./package.json').version.split('.');
            const major = parseInt(semver[0]);
            const minor = parseInt(semver[1]);
            const patch = parseInt(semver[2]);
            
            if ('$VERSION_TYPE' === 'major') {
                console.log(\`\${major + 1}.0.0\`);
            } else if ('$VERSION_TYPE' === 'minor') {
                console.log(\`\${major}.\${minor + 1}.0\`);
            } else if ('$VERSION_TYPE' === 'patch') {
                console.log(\`\${major}.\${minor}.\${patch + 1}\`);
            }
        ")
    fi
    
    # Show preview
    echo -e "Current: ${CURRENT_VERSION}"
    echo -e "New:     ${NEW_VERSION}"
    echo -e "Type:    ${VERSION_TYPE}"
    
    # Confirm
    read -p "Proceed with version bump? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Skipped ${lib_name}${NC}"
        cd ../..
        return
    fi
    
    # Bump version
    if [ "$VERSION_TYPE" = "custom" ]; then
        npm version "$CUSTOM_VERSION" --no-git-tag-version --allow-same-version
    else
        npm version "$VERSION_TYPE" --no-git-tag-version
    fi
    
    # Get actual new version (verify)
    ACTUAL_NEW_VERSION=$(node -p "require('./package.json').version")
    
    cd ../..
    
    echo -e "${GREEN}✓ ${lib_name}: ${CURRENT_VERSION} -> ${ACTUAL_NEW_VERSION}${NC}"
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
