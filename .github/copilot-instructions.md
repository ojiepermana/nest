# NestJS Generator - Copilot Instructions

## 📋 Documentation Rules

**All `.md` files (except README.md) must be in `docs/` subdirectories:**

- `docs/workspace/` - Publishing, development, changelogs
- `docs/generator/` - Feature guides, API docs, examples
- `docs/nestjs/` - NestJS patterns and best practices

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

**Input**: Metadata tables (`meta.table_metadata`, `meta.column_metadata`)

**Output**: Complete NestJS module (Controller, Service, Repository, DTOs)

**Features**: Auto-detected from metadata or CLI flags

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

---

## 🐛 Common Issues

**Dependency in wrong place**:

```bash
rm -rf libs/generator/node_modules
npm install
```

**Build errors**:

```bash
rm -rf dist
npm run build:generator
```

**Import errors**: Use path aliases `@ojiepermana/nest-generator`

---

## 📚 Documentation

**See full docs**: `docs/generator/INDEX.md`

**Quick links**:

- `docs/generator/QUICKSTART.md` - 5-min tutorial
- `docs/generator/FEATURES.md` - All features
- `docs/generator/audit/AUDIT_GUIDE.md` - Audit trail
- `docs/workspace/PUBLISHING.md` - Publishing guide

---

## 📊 Feature Score: 119/100 ✅

| Feature     | Score | Status  |
| ----------- | ----- | ------- |
| Core CRUD   | 10/10 | ✅ Done |
| Queries     | 10/10 | ✅ Done |
| Validation  | 10/10 | ✅ Done |
| Security    | 10/10 | ✅ Done |
| Caching     | 10/10 | ✅ Done |
| Swagger     | 10/10 | ✅ Done |
| Export      | 10/10 | ✅ Done |
| Audit       | +6    | ✅ Done |
| File Upload | +6    | ✅ Done |
| Search      | +13   | ✅ Done |

---

## ✅ Before Making Changes

1. Check tests: `npm test -- <file>.spec.ts`
2. Dependencies in root `package.json` only
3. Follow generator pattern
4. Write tests first
5. Update docs

---

**Full details**: See `docs/generator/INDEX.md` and `docs/workspace/copilot-instructions-FULL.md`
