# NestJS Generator - Copilot Instructions

## 📋 Documentation Rules

**All `.md` files (except README.md) must be in `docs/` subdirectories:**

- `docs/workspace/` - Publishing, development, changelogs
- `docs/generator/` - Feature guides, API docs, examples
- `docs/nestjs/` - NestJS patterns and best practices

**🚨 CRITICAL - Always Update INDEX.md**:

When making changes to library features or documentation:

1. **Update `docs/generator/INDEX.md`** after:
   - ✅ Adding new features
   - ✅ Updating existing features
   - ✅ Changing feature implementation status
   - ✅ Adding new documentation files
   - ✅ Version bumps or releases

2. **Update Feature Implementation Status table**:
   - Mark features as: ✅ Auto-generated | ⚠️ Partial | ❌ Not generated
   - Update evidence and required actions
   - Test actual generation output to verify status

3. **Update Documentation Structure**:
   - Add new `.md` files to appropriate section
   - Update file counts in tree diagram
   - Cross-link related guides

4. **Update Recent Updates section**:
   - Document breaking changes
   - List new features with status
   - Update test results

**Flow**: `Feature change` → `Test generation` → `Update INDEX.md` → `Update related docs` → `Commit`

---

## 🎯 Project Overview

**What**: Metadata-driven NestJS CRUD generator

**No ORM**: Uses native drivers (pg/mysql2) with raw SQL

**Status**: 119/100 score, 579/585 tests passing (99%)

**Features**: CRUD, Audit, File Upload, Search, Caching, Swagger

---

## 🏗️ Monorepo Structure

```
nest/
├── node_modules/      ← ALL dependencies here
├── package.json      ← Root dependencies
├── libs/
│   ├── generator/    ← @ojiepermana/nest-generator (peerDependencies only)
│   └── nest/         ← @ojiepermana/nest (peerDependencies only)
└── docs/
    ├── workspace/    ← Publishing, dev guides
    └── generator/    ← Feature documentation
```

**CRITICAL**: Libraries do NOT have `node_modules/`. All packages in root only.

---

## ⚙️ Architecture Patterns

1. **Standalone** - Single app
2. **Monorepo** - Shared modules
3. **Microservices** - Distributed

Auto-detected from metadata or prompts.

---

## 🚀 Quick Commands

```bash
# Development
npm test                    # Run tests
npm run build:generator     # Build library

# Generation
nest-generator init                              # Setup metadata
nest-generator generate users.profile            # Generate module
nest-generator generate users --features.audit=true  # With audit

# Publishing
./scripts/version-bump.sh   # Bump version
./scripts/publish-libs.sh   # Publish to npm
```

---

## 📝 Code Generation Flow

**Input**: Metadata tables (`meta.table`, `meta.column`)

**Output**: Complete NestJS module (Controller, Service, Repository, DTOs)

**Features**: Auto-detected from metadata or CLI flags

**Documentation Flow**:

1. Generate code → Test output → Verify features
2. Update `docs/generator/INDEX.md` with actual status
3. Update feature-specific guides if behavior changed
4. Run tests to ensure coverage maintained

---

## 💡 Conventions

**Generator Pattern**:

- Detection: `has*()` or `detect*()`
- Generation: `generate*()`
- Integration: Update CLI + tests

**Dependencies**:

- Root `package.json` → `dependencies` + `devDependencies`
- Library `package.json` → `peerDependencies` only

**Testing**:

- Write tests FIRST
- 99% coverage target

**🚨 CRITICAL RULE - Fix Generator, NOT Generated Output**:

- ❌ **NEVER** manually fix files in `src/` that were generated
- ✅ **ALWAYS** fix the generator templates in `libs/generator/src/generators/`
- When generated code has errors → Fix the generator → Rebuild → Re-generate
- Flow: `Fix generator` → `npm run build:generator` → `rm -rf src/module` → `nest-generator generate` → `npm run build`
- This ensures all future generations are correct, not just one-time fixes

---

## 📚 Documentation

**See full docs**: `docs/generator/INDEX.md`

**Quick links**:

- `docs/generator/QUICKSTART.md` - 5-min tutorial
- `docs/generator/FEATURES.md` - All features
- `docs/generator/ENTERPRISE_QUALITY.md` - ⭐ Enterprise best practices
- `docs/generator/RECOMMENDED_SCHEMAS.md` - ⭐ Database schemas
- `docs/generator/audit/AUDIT_GUIDE.md` - Audit trail
- `docs/workspace/PUBLISHING.md` - Publishing guide

---

## ✅ Before Making Changes

1. Check tests: `npm test -- <file>.spec.ts`
2. Dependencies in root `package.json` only
3. Follow generator pattern
4. Write tests first
5. **Update `docs/generator/INDEX.md`** with status changes
6. Update related documentation

**After Changes Checklist**:

- [ ] Tests passing
- [ ] Generator rebuilt (`npm run build:generator`)
- [ ] Test generation output verified
- [ ] `docs/generator/INDEX.md` updated with new status
- [ ] Feature-specific guides updated if needed
- [ ] Version bumped if breaking changes
- [ ] **Code formatted (`npm run format`)** before commit

**🚨 CRITICAL - Always Format Before Commit**:

```bash
npm run format  # Format all code with Prettier
git add -A
git commit -m "your message"
git push
```

Never commit without formatting - ensures consistent code style across the project.

---

**Full details**: See `docs/generator/INDEX.md` and `docs/workspace/copilot-instructions-FULL.md`
