# 🔐 RBAC Library Migration Guide

**Detailed Plan for Separating RBAC to `@ojiepermana/nest-rbac`**

---

## 📊 Executive Summary

### Current State

```
@ojiepermana/nest-generator (v4.0.0)
  └── /rbac (exported as @ojiepermana/nest-rbac)
       ├── 22 TypeScript files
       ├── ~248KB source code
       ├── Runtime dependencies: @nestjs/common, @nestjs/core, pg/mysql2
       └── Used in: Standalone, Monorepo, Microservices architectures
```

### Target State

```
@ojiepermana/nest-rbac (v1.0.0)
  ├── Decorators (@RequirePermission, @RequireRole, @Public)
  ├── Guards (PermissionsGuard, RolesGuard)
  ├── Services (RBACService, RBACRepository)
  ├── Module (RBACModule)
  └── Database schemas (PostgreSQL, MySQL)

@ojiepermana/nest-generator (v5.0.0) - BREAKING
  ├── Removes /rbac code
  ├── Updates templates to import from @ojiepermana/nest-rbac
  └── Adds @ojiepermana/nest-rbac as peerDependency
```

---

## 🎯 Migration Objectives

### Primary Goals

1. ✅ **Reusability**: RBAC usable without installing generator
2. ✅ **Separation**: Runtime code separate from build-time tools
3. ✅ **Lighter Dependencies**: Production apps don't need generator deps
4. ✅ **Independent Versioning**: RBAC updates without generator changes

### Success Criteria

- [ ] All existing tests pass (579/585 → 100%)
- [ ] Generated code uses new imports
- [ ] Zero breaking changes for users who update both packages
- [ ] Documentation updated with migration path
- [ ] CI/CD pipeline for new package

---

## 📁 File Structure Analysis

### Files to Move (22 files)

#### Core Runtime Files ✅ (Must Move)

```
libs/rbac/src/
├── index.ts                          # Main barrel export
├── rbac.module.ts                    # Dynamic module registration
├── rbac.service.ts                   # Permission/Role checking service
├── rbac.repository.ts                # Database operations
├── decorators/
│   ├── index.ts
│   ├── require-permission.decorator.ts
│   ├── require-role.decorator.ts
│   ├── require-permission.decorator.spec.ts
│   └── require-role.decorator.spec.ts
├── guards/
│   ├── index.ts
│   ├── permissions.guard.ts
│   ├── roles.guard.ts
│   ├── permissions.guard.spec.ts
│   └── roles.guard.spec.ts
└── interfaces/
    ├── index.ts
    └── rbac.interface.ts
```

#### Schema & Migration Files ⚠️ (Decision Needed)

```
libs/rbac/
├── schemas/
│   ├── postgresql-rbac.sql           # Keep in RBAC lib
│   └── mysql-rbac.sql                # Keep in RBAC lib
└── migrations/
    └── *.sql                         # Keep in RBAC lib
```

#### Generator-Specific Files ❌ (Stay in Generator)

```
libs/generator/src/rbac/
├── permission-seed.generator.ts      # Code generation tool
├── permission-seed.generator.spec.ts
├── rbac-schema.generator.ts          # Schema generation tool
└── rbac.integration.spec.ts          # Integration tests
```

**Decision**: Generator tools stay in `@ojiepermana/nest-generator`, but import runtime types from `@ojiepermana/nest-rbac`

---

## 🔧 Dependency Analysis

### Current Dependencies (nest-generator)

```json
{
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.0.0",
    "pg": "^8.13.0", // RBAC needs this
    "mysql2": "^3.11.0", // RBAC needs this
    "commander": "^12.1.0", // Generator only
    "inquirer": "^8.2.0", // Generator only
    "chalk": "^4.1.0", // Generator only
    "ora": "^5.4.0" // Generator only
  }
}
```

### New RBAC Package Dependencies

```json
{
  "name": "@ojiepermana/nest-rbac",
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.0.0"
  },
  "peerDependenciesMeta": {
    "pg": {
      "optional": true // User installs either pg OR mysql2
    },
    "mysql2": {
      "optional": true
    }
  }
}
```

### Updated Generator Dependencies

```json
{
  "name": "@ojiepermana/nest-generator",
  "peerDependencies": {
    "@ojiepermana/nest-rbac": "^1.0.0", // NEW!
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "pg": "^8.13.0",
    "mysql2": "^3.11.0",
    "commander": "^12.1.0",
    "inquirer": "^8.2.0",
    "chalk": "^4.1.0",
    "ora": "^5.4.0"
  }
}
```

---

## 🚀 Migration Phases

### Phase 1: Preparation (Week 1)

#### 1.1 Create Library Structure

```bash
# Create new library directory
mkdir -p libs/rbac
cd libs/rbac

# Initialize package.json
npm init -y
```

**package.json**:

```json
{
  "name": "@ojiepermana/nest-rbac",
  "version": "1.0.0",
  "description": "Role-Based Access Control (RBAC) for NestJS - Production-ready decorators, guards, and services",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "author": "Ojie Permana",
  "license": "MIT",
  "keywords": ["nestjs", "rbac", "role-based-access-control", "permissions", "authorization", "guards", "decorators"],
  "repository": {
    "type": "git",
    "url": "https://github.com/ojiepermana/nest.git",
    "directory": "libs/rbac"
  },
  "homepage": "https://github.com/ojiepermana/nest/tree/main/libs/rbac#readme",
  "bugs": "https://github.com/ojiepermana/nest/issues",
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "cache-manager": "^5.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.0.0"
  },
  "peerDependenciesMeta": {
    "pg": {
      "optional": true
    },
    "mysql2": {
      "optional": true
    }
  },
  "publishConfig": {
    "access": "public"
  },
  "files": ["dist/**/*.js", "dist/**/*.d.ts", "schemas/*.sql", "migrations/*.sql", "README.md"]
}
```

#### 1.2 Setup TypeScript Config

**tsconfig.lib.json**:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

#### 1.3 Create README

```markdown
# @ojiepermana/nest-rbac

Production-ready Role-Based Access Control for NestJS applications.

## Features

- 🔐 Decorator-based permission checks
- 👥 Role hierarchy support
- 🎯 Ownership validation
- ⚡ Built-in caching
- 🗄️ PostgreSQL & MySQL support
- 🧪 100% test coverage

## Installation

\`\`\`bash
npm install @ojiepermana/nest-rbac
\`\`\`

## Quick Start

See full documentation: https://github.com/ojiepermana/nest/tree/main/libs/rbac
```

---

### Phase 2: Code Migration (Week 1-2)

#### 2.1 Copy Runtime Files

```bash
# Copy core RBAC code
cp -r libs/generator/src/rbac/decorators libs/rbac/src/
cp -r libs/generator/src/rbac/guards libs/rbac/src/
cp -r libs/generator/src/rbac/interfaces libs/rbac/src/
cp libs/generator/src/rbac/rbac.module.ts libs/rbac/src/
cp libs/generator/src/rbac/rbac.service.ts libs/rbac/src/
cp libs/generator/src/rbac/rbac.repository.ts libs/rbac/src/

# Copy schemas
cp -r libs/generator/src/rbac/schemas libs/rbac/
cp -r libs/generator/src/rbac/migrations libs/rbac/

# Copy tests
cp libs/generator/src/rbac/rbac.module.spec.ts libs/rbac/test/
cp libs/generator/src/rbac/rbac.repository.spec.ts libs/rbac/test/
```

#### 2.2 Update Imports in RBAC Library

Replace all internal imports to use relative paths:

```typescript
// Before (generator paths)
import { RBACService } from '../rbac.service';

// After (relative paths in new lib)
import { RBACService } from './rbac.service';
```

#### 2.3 Create Barrel Export

**libs/rbac/src/index.ts**:

```typescript
/**
 * @ojiepermana/nest-rbac
 *
 * Production-ready RBAC for NestJS
 */

// Module
export * from './rbac.module';

// Services
export * from './rbac.service';
export * from './rbac.repository';

// Decorators
export * from './decorators';

// Guards
export * from './guards';

// Interfaces
export * from './interfaces';
```

---

### Phase 3: Generator Updates (Week 2)

#### 3.1 Update Generator Templates

**libs/generator/src/generators/controller/service-controller.generator.ts**:

```typescript
// BEFORE
protected generateImports(): string {
  if (this.hasRBAC()) {
    imports.push(
      "import { RequirePermission, RequireRole, Public, RoleLogic } from '@ojiepermana/nest-rbac';"
    );
  }
}

// AFTER
protected generateImports(): string {
  if (this.hasRBAC()) {
    imports.push(
      "import { RequirePermission, RequireRole, Public, RoleLogic } from '@ojiepermana/nest-rbac';"
    );
  }
}
```

#### 3.2 Update Module Generator

**libs/generator/src/generators/module/module.generator.ts**:

```typescript
// BEFORE
if (hasRBAC) {
  imports.push("import { RBACModule } from '@ojiepermana/nest-rbac';");
}

// AFTER
if (hasRBAC) {
  imports.push("import { RBACModule } from '@ojiepermana/nest-rbac';");
}
```

#### 3.3 Keep Generator Tools

**libs/generator/src/rbac/permission-seed.generator.ts**:

```typescript
// Update to import types from new package
import { RBACService, PermissionData } from '@ojiepermana/nest-rbac';

export class PermissionSeedGenerator {
  // Tool stays in generator but uses RBAC types
}
```

---

### Phase 4: Testing Strategy (Week 2-3)

#### 4.1 RBAC Library Tests

```bash
# Setup Jest for RBAC library
libs/rbac/jest.config.json
```

```json
{
  "displayName": "@ojiepermana/nest-rbac",
  "preset": "../../jest.config.json",
  "testEnvironment": "node",
  "testMatch": ["<rootDir>/test/**/*.spec.ts", "<rootDir>/src/**/*.spec.ts"],
  "collectCoverageFrom": ["src/**/*.ts", "!src/**/*.spec.ts", "!src/**/*.interface.ts"],
  "coverageThreshold": {
    "global": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

#### 4.2 Test Migration Checklist

- [ ] Copy all `.spec.ts` files to `libs/rbac/test/`
- [ ] Update imports in test files
- [ ] Run tests: `npm test -- libs/rbac`
- [ ] Verify 100% pass rate
- [ ] Update coverage thresholds

#### 4.3 Integration Tests

Create new integration test in generator:

```typescript
// libs/generator/test/rbac-integration.spec.ts
import { RBACModule } from '@ojiepermana/nest-rbac';

describe('Generator + RBAC Integration', () => {
  it('should generate controller with RBAC imports', async () => {
    const result = await generator.generate('users');
    expect(result.controller).toContain('@ojiepermana/nest-rbac');
  });
});
```

---

### Phase 5: Build & Publish Setup (Week 3)

#### 5.1 Update Root package.json

```json
{
  "scripts": {
    "build:rbac": "tsc -p libs/rbac/tsconfig.lib.json",
    "build:generator": "tsc -p libs/generator/tsconfig.lib.json",
    "build:all": "npm run build:rbac && npm run build:generator && npm run build:nest",
    "test:rbac": "jest --config=libs/rbac/jest.config.json",
    "test:generator": "jest --config=libs/generator/jest.config.json"
  }
}
```

#### 5.2 Create Build Script

**scripts/build-rbac.sh**:

```bash
#!/bin/bash
set -e

echo "🔨 Building @ojiepermana/nest-rbac..."

# Clean
rm -rf libs/rbac/dist

# Build TypeScript
tsc -p libs/rbac/tsconfig.lib.json

# Copy non-TS files
cp libs/rbac/README.md libs/rbac/dist/
cp -r libs/rbac/schemas libs/rbac/dist/
cp -r libs/rbac/migrations libs/rbac/dist/

echo "✅ Build complete: libs/rbac/dist"
```

#### 5.3 Publishing Order

```bash
# CRITICAL: Publish in this order!
./scripts/publish-rbac.sh      # 1. Publish RBAC first
./scripts/publish-generator.sh # 2. Then generator (depends on RBAC)
./scripts/publish-nest.sh      # 3. Finally nest lib
```

**scripts/publish-rbac.sh**:

```bash
#!/bin/bash
set -e

# Build
npm run build:rbac

# Test
npm run test:rbac

# Publish
cd libs/rbac
npm publish --access public
cd ../..

echo "✅ Published @ojiepermana/nest-rbac"
```

---

### Phase 6: Documentation Updates (Week 3-4)

#### 6.1 Update Main Documentation

Files to update:

- [ ] `README.md` - Add RBAC package reference
- [ ] `libs/generator/README.md` - Update import examples
- [ ] `docs/generator/FEATURES.md` - Update RBAC section
- [ ] `docs/generator/rbac/*.md` - Update all import paths
- [ ] `CHANGELOG.md` - Document breaking change

#### 6.2 Create Migration Guide for Users

**MIGRATION.md**:

```markdown
# Migrating to @ojiepermana/nest-rbac v1.0

## Breaking Changes in nest-generator v5.0

### Old Import Path (v4.x)

\`\`\`typescript
import { RequirePermission } from '@ojiepermana/nest-rbac';
\`\`\`

### New Import Path (v5.x)

\`\`\`typescript
import { RequirePermission } from '@ojiepermana/nest-rbac';
\`\`\`

## Installation

\`\`\`bash

# Install RBAC library

npm install @ojiepermana/nest-rbac

# Update generator (if using)

npm install --save-dev @ojiepermana/nest-generator@^5.0.0
\`\`\`

## Automated Migration Script

\`\`\`bash

# Replace imports in all TypeScript files

find . -name "\*.ts" -type f -exec sed -i '' \
 "s/@ojiepermana\/nest-generator\/rbac/@ojiepermana\/nest-rbac/g" {} +
\`\`\`
```

#### 6.3 Update Examples

All example code in docs must use new import:

```bash
# Find and replace in docs
find docs/ -name "*.md" -type f -exec sed -i '' \
  "s/@ojiepermana\/nest-generator\/rbac/@ojiepermana\/nest-rbac/g" {} +
```

---

### Phase 7: Backward Compatibility (Week 4)

#### 7.1 Deprecation Path

Keep old export in generator with deprecation notice:

**libs/generator/src/rbac/index.ts** (deprecated):

```typescript
/**
 * @deprecated This module has moved to @ojiepermana/nest-rbac
 *
 * Please update your imports:
 *
 * Before:
 *   import { RequirePermission } from '@ojiepermana/nest-rbac';
 *
 * After:
 *   import { RequirePermission } from '@ojiepermana/nest-rbac';
 *
 * This re-export will be removed in v6.0.0
 */

// Re-export everything from new package
export * from '@ojiepermana/nest-rbac';

// Log deprecation warning
console.warn(`
⚠️  DEPRECATION WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are importing RBAC from @ojiepermana/nest-rbac

This path is deprecated. Please update to:
  npm install @ojiepermana/nest-rbac

Then update your imports to:
  import { ... } from '@ojiepermana/nest-rbac'

The old path will be removed in v6.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
```

#### 7.2 Version Timeline

```
v4.x (Current)
  └── @ojiepermana/nest-rbac ✅ Works

v5.0.0 (Breaking, with compatibility)
  ├── @ojiepermana/nest-rbac ✅ Recommended
  └── @ojiepermana/nest-rbac ⚠️ Deprecated (re-exports v5.0)

v6.0.0 (Future - full removal)
  ├── @ojiepermana/nest-rbac ✅ Only way
  └── @ojiepermana/nest-rbac ❌ Removed
```

---

## 📋 Pre-Migration Checklist

### Before Starting

- [ ] Commit all current changes
- [ ] Create feature branch: `git checkout -b feat/rbac-library-separation`
- [ ] Backup database schemas
- [ ] Document current test results
- [ ] Review all RBAC usage across projects

### Development Environment

- [ ] Node.js >= 20.x installed
- [ ] npm >= 11.x installed
- [ ] TypeScript 5.x installed
- [ ] All current tests passing (579/585)

### Dependencies

- [ ] Verify @nestjs packages at v11.x
- [ ] Check pg/mysql2 versions
- [ ] Ensure cache-manager compatibility

---

## 🧪 Testing Checklist

### RBAC Library Tests

- [ ] All decorator tests pass
- [ ] All guard tests pass
- [ ] Module registration tests pass
- [ ] Repository tests pass
- [ ] Integration tests pass
- [ ] Coverage >= 95%

### Generator Tests

- [ ] Template generation uses new imports
- [ ] CLI commands work with new package
- [ ] Permission seed generator works
- [ ] Schema generator works
- [ ] All 585 tests pass

### End-to-End Tests

- [ ] Generate new standalone app with RBAC
- [ ] Generate new monorepo with RBAC
- [ ] Generate new microservices with RBAC
- [ ] Verify guards work in runtime
- [ ] Test database connections (PostgreSQL)
- [ ] Test database connections (MySQL)

---

## 🚨 Risk Assessment

### High Risk (Must Address)

1. **Breaking Changes**
   - Impact: ALL users must update imports
   - Mitigation: Deprecation path in v5.0, remove in v6.0
   - Timeline: 6-12 months deprecation window

2. **Circular Dependencies**
   - Risk: Generator imports RBAC, RBAC might need generator types
   - Mitigation: Clear dependency direction (RBAC → no generator deps)
   - Testing: Verify build order

3. **Version Sync Issues**
   - Risk: Generator v5.0 with RBAC v1.0, compatibility matrix
   - Mitigation: Document compatible versions in README
   - Automation: Add version check in generator CLI

### Medium Risk

1. **Test Migration**
   - Risk: Some tests might fail after moving
   - Mitigation: Copy tests first, verify pass, then refactor
2. **Documentation Drift**
   - Risk: Old docs show wrong import paths
   - Mitigation: Search & replace all docs, add migration guide

3. **Local Development**
   - Risk: `npm link` setup more complex with 3 packages
   - Mitigation: Update `setup-local-generator.sh` script

### Low Risk

1. **Package Discovery**
   - Users might not find RBAC package
   - Mitigation: Good README, npm keywords, GitHub topics

2. **Size Optimization**
   - Risk: Minor - tree-shaking already works
   - Impact: Minimal bundle size difference

---

## 📊 Success Metrics

### Code Quality

- ✅ All 585+ tests passing
- ✅ Coverage maintained at 99%+
- ✅ No TypeScript errors
- ✅ No ESLint warnings

### Performance

- ✅ Build time < 30 seconds
- ✅ Test time < 2 minutes
- ✅ Package size < 100KB (RBAC lib)

### User Experience

- ✅ Migration guide clear and complete
- ✅ Breaking changes documented
- ✅ Examples updated
- ✅ No regression in functionality

---

## 🔄 Rollback Plan

If migration fails:

### Step 1: Stop Publishing

```bash
# Don't publish if tests fail
# Keep RBAC in generator
```

### Step 2: Revert Branch

```bash
git checkout main
git branch -D feat/rbac-library-separation
```

### Step 3: Communicate

- Document what went wrong
- Update timeline
- Re-evaluate approach

### Rollback Triggers

- More than 10% test failures
- Circular dependency detected
- Build time > 2x current
- Critical bug in core functionality

---

## 📅 Timeline Estimate

### Conservative Estimate (4 weeks)

```
Week 1: Setup + Code Migration
  - Days 1-2: Create library structure
  - Days 3-4: Copy and update code
  - Day 5: Initial build and fix errors

Week 2: Generator Updates + Testing
  - Days 1-2: Update all generator templates
  - Days 3-4: Migrate and run tests
  - Day 5: Fix failing tests

Week 3: Documentation + Build Setup
  - Days 1-2: Update all documentation
  - Days 3-4: Create build scripts
  - Day 5: Test publishing locally

Week 4: Integration + Release
  - Days 1-2: End-to-end testing
  - Day 3: Prepare release notes
  - Day 4: Publish packages
  - Day 5: Monitor and fix issues
```

### Aggressive Estimate (2 weeks)

Only if:

- ✅ All automation scripts ready
- ✅ No blockers found
- ✅ Tests pass first try
- ✅ Documentation straightforward

---

## 💰 Cost-Benefit Analysis

### One-Time Costs

- **Development Time**: 2-4 weeks (40-80 hours)
- **Testing Time**: Additional 10-20 hours
- **Documentation**: 5-10 hours
- **User Support**: 5-10 hours (migration questions)

**Total**: ~60-120 hours

### Ongoing Costs (Yearly)

- **Maintenance**: +20% (3 packages vs 2)
- **CI/CD**: +$0 (same GitHub Actions)
- **Documentation**: +10 hours/year
- **Support**: +5 hours/year

### Benefits (Yearly)

- **Reusability**: Save 10-20 hours for new projects
- **Separation**: Clearer architecture (qualitative)
- **Professional Image**: Better portfolio piece (qualitative)
- **Community**: Potential external users (TBD)

### Break-Even Point

If you create **3+ new projects/year** that use RBAC:

- Time saved: 30-60 hours/year
- Maintenance overhead: 15 hours/year
- **Net benefit**: +15-45 hours/year

**Recommendation**:

- ✅ **Do it if**: You plan 3+ projects using RBAC
- ❌ **Skip if**: This is your only project using RBAC

---

## 🎯 Decision Framework

### Should You Migrate? (Score System)

Answer these questions (1-5 points each):

1. **Do you have 3+ projects that use/will use RBAC?**
   - 1 = No, just this one
   - 5 = Yes, 5+ projects

2. **Is RBAC a core part of your offering?**
   - 1 = Just a feature
   - 5 = Central to product

3. **Do you plan to maintain this long-term (2+ years)?**
   - 1 = No, short-term project
   - 5 = Yes, long-term product

4. **Do you want external users to use just RBAC?**
   - 1 = No, internal only
   - 5 = Yes, marketing as separate product

5. **Can you dedicate 2-4 weeks for this migration?**
   - 1 = No, too busy
   - 5 = Yes, have time now

**Scoring**:

- **20-25 points**: ✅ **Migrate NOW** - Clear benefits
- **15-19 points**: ⚠️ **Maybe** - Evaluate again in 3 months
- **10-14 points**: ⏸️ **Wait** - Keep current structure
- **5-9 points**: ❌ **Don't migrate** - Not worth it

---

## 📚 References

### Similar Examples

1. **@nestjs/passport** - Separate from core
2. **@nestjs/swagger** - Separate from core
3. **@nestjs/typeorm** - Separate from core

### Best Practices

- NestJS module best practices
- npm package publishing guide
- Monorepo management with Lerna/Nx

### Tools

- **TypeScript Project References**: For monorepo builds
- **Changesets**: For version management
- **API Extractor**: For API documentation

---

## 🤝 Next Steps

### If Proceeding with Migration

1. **Review this guide with team/stakeholders**
2. **Score decision framework** (see above)
3. **Set target date** (recommend: start in 2-4 weeks)
4. **Create GitHub Project** for tracking
5. **Start with Phase 1** (preparation)

### If Keeping Current Structure

1. **Document decision** in CHANGELOG
2. **Close this guide** for future reference
3. **Continue with current roadmap**
4. **Revisit in 6 months** if situation changes

---

## 📞 Support

**Questions about this migration?**

- Open GitHub Issue: `Migration: RBAC Library Separation`
- Tag: `question`, `migration`, `rbac`
- Reference: `RBAC_LIBRARY_MIGRATION_GUIDE.md`

---

**Document Version**: 1.0.0  
**Last Updated**: November 22, 2025  
**Status**: ⏸️ Pending Decision  
**Next Review**: In 3-6 months or when 3+ RBAC projects confirmed
