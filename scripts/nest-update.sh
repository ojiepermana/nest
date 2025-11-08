#!/bin/bash

# Script untuk mengupdate NestJS dan dev dependencies ke versi terbaru
# Author: Ojie Permana
# Date: November 8, 2025

set -e  # Exit jika ada error

echo "🚀 Memulai update NestJS dan dependencies..."

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup package.json
echo -e "${BLUE}📦 Backup package.json...${NC}"
cp package.json package.json.backup
echo -e "${GREEN}✓ Backup berhasil dibuat: package.json.backup${NC}"

# Update NestJS core packages
echo -e "\n${BLUE}📦 Update NestJS core packages...${NC}"
npm install --save \
  @nestjs/common@latest \
  @nestjs/core@latest \
  @nestjs/platform-express@latest \
  reflect-metadata@latest \
  rxjs@latest

echo -e "${GREEN}✓ NestJS core packages berhasil diupdate${NC}"

# Update NestJS dev dependencies
echo -e "\n${BLUE}🔧 Update NestJS dev dependencies...${NC}"
npm install --save-dev \
  @nestjs/cli@latest \
  @nestjs/schematics@latest \
  @nestjs/testing@latest

echo -e "${GREEN}✓ NestJS dev dependencies berhasil diupdate${NC}"

# Update TypeScript dan tools terkait
echo -e "\n${BLUE}📘 Update TypeScript dan tools...${NC}"
npm install --save-dev \
  typescript@latest \
  ts-node@latest \
  ts-jest@latest \
  ts-loader@latest \
  tsconfig-paths@latest

echo -e "${GREEN}✓ TypeScript tools berhasil diupdate${NC}"

# Update Testing tools
echo -e "\n${BLUE}🧪 Update testing tools...${NC}"
npm install --save-dev \
  jest@latest \
  @types/jest@latest \
  supertest@latest \
  @types/supertest@latest

echo -e "${GREEN}✓ Testing tools berhasil diupdate${NC}"

# Update ESLint dan Prettier
echo -e "\n${BLUE}✨ Update ESLint dan Prettier...${NC}"
npm install --save-dev \
  eslint@latest \
  @eslint/js@latest \
  @eslint/eslintrc@latest \
  typescript-eslint@latest \
  eslint-config-prettier@latest \
  eslint-plugin-prettier@latest \
  prettier@latest \
  globals@latest

echo -e "${GREEN}✓ ESLint dan Prettier berhasil diupdate${NC}"

# Update types
echo -e "\n${BLUE}📝 Update @types packages...${NC}"
npm install --save-dev \
  @types/node@latest \
  @types/express@latest

echo -e "${GREEN}✓ @types packages berhasil diupdate${NC}"

# Update other dev dependencies
echo -e "\n${BLUE}🔨 Update other dev dependencies...${NC}"
npm install --save-dev \
  source-map-support@latest

echo -e "${GREEN}✓ Other dev dependencies berhasil diupdate${NC}"

# Audit dependencies
echo -e "\n${BLUE}🔍 Checking for security vulnerabilities...${NC}"
npm audit || true

# Tampilkan versi yang terinstall
echo -e "\n${YELLOW}📊 Versi NestJS yang terinstall:${NC}"
npx nest --version

echo -e "\n${YELLOW}📊 Versi TypeScript yang terinstall:${NC}"
npx tsc --version

# Cleanup
echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
rm -rf node_modules package-lock.json
npm install

echo -e "\n${GREEN}✅ Update selesai!${NC}"
echo -e "${YELLOW}💡 Jangan lupa untuk:${NC}"
echo -e "   1. Test aplikasi dengan 'npm run test'"
echo -e "   2. Build aplikasi dengan 'npm run build'"
echo -e "   3. Jalankan aplikasi dengan 'npm run start:dev'"
echo -e "   4. Hapus backup jika semua berjalan lancar: rm package.json.backup"
echo -e "\n${BLUE}📄 Backup tersimpan di: package.json.backup${NC}"
