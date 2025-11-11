# Migration Guide

Guide for upgrading between versions of **@ojiepermana/nest-generator**.

## Table of Contents

- [Upgrading to v1.0.5](#upgrading-to-v105)
- [Upgrading to v1.0.4](#upgrading-to-v104)
- [Upgrading to v1.0.3](#upgrading-to-v103)
- [Upgrading from v0.x to v1.0](#upgrading-from-v0x-to-v10)
- [Database Schema Migrations](#database-schema-migrations)
- [Breaking Changes](#breaking-changes)
- [Deprecations](#deprecations)

---

## Upgrading to v1.0.5

**Release Date:** November 10, 2024

**What's New:**

- ✅ Complete documentation refactoring (40% redundancy reduction)
- ✅ New quickstart guides (RBAC, Audit, File Upload, Microservices)
- ✅ New essential guides (Troubleshooting, Migration, Best Practices, Examples)
- ✅ Improved INDEX.md navigation with quick links
- ✅ QUICKSTART.md for 5-minute setup

**Breaking Changes:** None

**Steps to Upgrade:**

```bash
# Update package
npm install @ojiepermana/nest-generator@^1.0.5

# No code changes required
# Documentation improvements only
```

**New Documentation:**

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute tutorial
- [quickstart/RBAC_QUICKSTART.md](./quickstart/RBAC_QUICKSTART.md) - RBAC in 10 min
- [quickstart/AUDIT_QUICKSTART.md](./quickstart/AUDIT_QUICKSTART.md) - Audit in 5 min
- [quickstart/UPLOAD_QUICKSTART.md](./quickstart/UPLOAD_QUICKSTART.md) - File upload in 7 min
- [quickstart/MICROSERVICES_QUICKSTART.md](./quickstart/MICROSERVICES_QUICKSTART.md) - Microservices in 15 min
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [MIGRATION.md](./MIGRATION.md) - This guide
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Production tips
- [EXAMPLES.md](./EXAMPLES.md) - Real-world examples

---

## Upgrading to v1.0.4

**Release Date:** November 9, 2024

**What's New:**

- ✅ npm version requirement updated to 11.0.0+
- ✅ Enhanced requirements validation

**Breaking Changes:**

- **npm 11.0.0+ required** (was 10.0.0+)

**Steps to Upgrade:**

```bash
# Update npm first
npm install -g npm@latest

# Verify npm version
npm --version  # Should be >= 11.0.0

# Update package
npm install @ojiepermana/nest-generator@^1.0.4
```

**Post-Install Check:**

The package will automatically verify system requirements:

```
✅ Node.js version: 24.7.0 (✓ >= 24.0.0)
✅ npm version: 11.5.1 (✓ >= 11.0.0)
✅ NestJS installed: 11.0.5 (✓ >= 11.0.0)
✅ Database driver: pg@8.11.0 (PostgreSQL)
```

---

## Upgrading to v1.0.3

**Release Date:** November 8, 2024

**What's New:**

- ✅ System requirements validation
- ✅ Automatic checks on install
- ✅ Colored warning messages

**Breaking Changes:**

- **Node.js 24.0.0+ required**
- **npm 10.0.0+ required**
- **NestJS 11.0.0+ required**
- **PostgreSQL 18+ or MySQL 8+ required**

**Steps to Upgrade:**

```bash
# 1. Update Node.js (using nvm)
nvm install 24
nvm use 24

# 2. Update npm
npm install -g npm@latest

# 3. Update NestJS dependencies
npm install @nestjs/core@^11.0.0 @nestjs/common@^11.0.0

# 4. Update database client
npm install pg@latest  # PostgreSQL
# OR
npm install mysql2@latest  # MySQL

# 5. Update generator
npm install @ojiepermana/nest-generator@^1.0.3
```

**New Features:**

- Automatic validation on `npm install`
- Warning messages for incompatible versions
- `REQUIREMENTS.md` documentation

---

## Upgrading from v0.x to v1.0

**Major Version Release**

**Breaking Changes:**

### 1. Metadata Schema Changes

**Old Schema (v0.x):**

```sql
CREATE TABLE table_metadata (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100)
);
```

**New Schema (v1.0):**

```sql
CREATE TABLE meta.table_metadata (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  schema_name VARCHAR(50),
  table_name VARCHAR(100),
  architecture_type VARCHAR(50),
  -- ... many new columns
);
```

**Migration Steps:**

```bash
# 1. Backup existing metadata
pg_dump -U postgres -d myapp -t table_metadata > backup.sql

# 2. Drop old tables (if exists)
DROP TABLE IF EXISTS column_metadata CASCADE;
DROP TABLE IF EXISTS table_metadata CASCADE;

# 3. Run new schema
nest-generator init

# 4. Migrate data (manual)
INSERT INTO meta.table_metadata (schema_name, table_name)
SELECT 'public', table_name FROM old_table_metadata;
```

### 2. Generated Code Structure

**Old Structure (v0.x):**

```
src/
├── entities/
│   └── user.entity.ts
├── dto/
│   └── user.dto.ts
└── services/
    └── user.service.ts
```

**New Structure (v1.0):**

```
src/modules/users/
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── filter-user.dto.ts
│   └── response-user.dto.ts
└── users.module.ts
```

**Migration:**

```bash
# 1. Delete old generated files
rm -rf src/entities src/dto src/services

# 2. Regenerate with new structure
nest-generator generate public.users
```

### 3. Service Method Signatures

**Old (v0.x):**

```typescript
async create(dto: CreateUserDto): Promise<User> {
  return this.repository.save(dto);
}
```

**New (v1.0):**

```typescript
async create(dto: CreateUserDto, userId: string): Promise<User> {
  return this.repository.create(dto, userId);
}
```

**Migration:**

Update all service method calls to include `userId` parameter.

### 4. Repository Pattern

**Old (v0.x):** Used TypeORM repositories directly

**New (v1.0):** Custom repository with raw SQL

**Migration:**

```typescript
// Old
constructor(
  @InjectRepository(User)
  private repository: Repository<User>,
) {}

// New
constructor(
  @Inject('DATABASE_POOL')
  private pool: Pool,
) {}
```

### 5. Controller Response Format

**Old (v0.x):**

```json
[
  { "id": 1, "name": "John" },
  { "id": 2, "name": "Jane" }
]
```

**New (v1.0):**

```json
{
  "data": [
    { "id": "uuid", "name": "John" },
    { "id": "uuid", "name": "Jane" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Database Schema Migrations

### PostgreSQL: v0.x → v1.0

```sql
-- 1. Create new schema
CREATE SCHEMA IF NOT EXISTS meta;

-- 2. Create UUID v7 function
CREATE OR REPLACE FUNCTION uuidv7() RETURNS UUID AS $$
DECLARE
  timestamp BIGINT;
  uuid_bytes BYTEA;
BEGIN
  timestamp := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  uuid_bytes := E'\\x' || LPAD(TO_HEX(timestamp), 12, '0') ||
                encode(gen_random_bytes(10), 'hex');
  RETURN uuid_bytes::UUID;
END;
$$ LANGUAGE plpgsql;

-- 3. Create metadata tables
CREATE TABLE meta.table_metadata (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  schema_name VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  architecture_type VARCHAR(50) DEFAULT 'standalone',
  has_soft_delete BOOLEAN DEFAULT true,
  has_created_by BOOLEAN DEFAULT true,
  cache_enabled BOOLEAN DEFAULT false,
  cache_ttl INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schema_name, table_name)
);

CREATE TABLE meta.column_metadata (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  table_metadata_id UUID REFERENCES meta.table_metadata(id) ON DELETE CASCADE,
  column_name VARCHAR(100) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  is_nullable BOOLEAN DEFAULT true,
  is_unique BOOLEAN DEFAULT false,
  is_primary_key BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  is_searchable BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  max_length INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,
  validation_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_metadata_id, column_name)
);

-- 4. Migrate old data (if applicable)
INSERT INTO meta.table_metadata (schema_name, table_name)
SELECT 'public', table_name
FROM old_table_metadata
WHERE table_name NOT IN (SELECT table_name FROM meta.table_metadata);
```

### MySQL: v0.x → v1.0

```sql
-- Similar migration for MySQL
CREATE TABLE meta_table_metadata (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  schema_name VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  architecture_type VARCHAR(50) DEFAULT 'standalone',
  -- ... other columns
  UNIQUE KEY unique_table (schema_name, table_name)
);
```

---

## Breaking Changes Summary

### v1.0.4

- **npm 11.0.0+ required** (breaking for npm 10.x users)

### v1.0.3

- **Node.js 24+ required** (breaking for Node.js < 24)
- **npm 10+ required** (breaking for npm < 10)
- **NestJS 11+ required** (breaking for NestJS < 11)

### v1.0.0

- **Metadata schema changed** - Must re-initialize with `nest-generator init`
- **Module structure changed** - Generated files in `src/modules/` instead of flat structure
- **Repository pattern changed** - Raw SQL instead of TypeORM
- **Method signatures changed** - `userId` parameter required
- **Response format changed** - Wrapped in `{ data, meta }` object
- **Primary keys** - UUID instead of auto-increment integers
- **File naming** - Kebab-case instead of camelCase

---

## Deprecations

### Deprecated in v1.0

- `--use-typeorm` flag - No longer supported, use raw SQL
- `--auto-increment-id` - UUIDs are now default
- Old metadata tables without `meta.` schema prefix

### Will be Deprecated in v2.0

- TCP transport for microservices - Recommend Redis/RabbitMQ for production
- Manual audit logging - Will be decorator-only

---

## Rollback Guide

### From v1.0.5 to v1.0.4

```bash
npm install @ojiepermana/nest-generator@1.0.4
```

No code changes needed (documentation only).

### From v1.0.4 to v1.0.3

```bash
npm install @ojiepermana/nest-generator@1.0.3
```

No code changes needed.

### From v1.0.x to v0.x

**Not recommended.** If absolutely necessary:

```bash
# 1. Backup current code
cp -r src src.backup

# 2. Downgrade package
npm install @ojiepermana/nest-generator@0.9.0

# 3. Restore old metadata schema
psql -U postgres -d myapp -f backup.sql

# 4. Regenerate all modules
nest-generator generate public.users
```

---

## Migration Checklist

**Before upgrading:**

- [ ] Backup database: `pg_dump myapp > backup.sql`
- [ ] Backup code: `git commit -am "Before upgrade"`
- [ ] Read changelog: Check `CHANGELOG.md` for breaking changes
- [ ] Update Node.js to 24+
- [ ] Update npm to 11+
- [ ] Update NestJS to 11+

**After upgrading:**

- [ ] Run `npm install`
- [ ] Check requirements: Should pass automatically
- [ ] Run tests: `npm test`
- [ ] Regenerate modules (if needed): `nest-generator generate`
- [ ] Test locally: `npm run start:dev`
- [ ] Update CI/CD: Update Node.js version in `.github/workflows/`
- [ ] Deploy to staging
- [ ] Test thoroughly
- [ ] Deploy to production

---

## Version Compatibility Matrix

| Generator | Node.js | npm | NestJS | PostgreSQL | MySQL |
| --------- | ------- | --- | ------ | ---------- | ----- |
| v1.0.5    | 24+     | 11+ | 11+    | 18+        | 8+    |
| v1.0.4    | 24+     | 11+ | 11+    | 18+        | 8+    |
| v1.0.3    | 24+     | 10+ | 11+    | 18+        | 8+    |
| v1.0.2    | 20+     | 9+  | 10+    | 16+        | 8+    |
| v1.0.1    | 20+     | 9+  | 10+    | 16+        | 8+    |
| v1.0.0    | 20+     | 9+  | 10+    | 16+        | 8+    |
| v0.9.x    | 18+     | 8+  | 9+     | 14+        | 5.7+  |

---

## Getting Help

- **Documentation**: [INDEX.md](./INDEX.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Issues**: [Report migration issues](https://github.com/ojiepermana/nest/issues)
- **Discord**: NestJS community server

---

## Changelog

Full changelog available at [CHANGELOG.md](../../CHANGELOG.md).

**Quick Links:**

- [v1.0.5 Release Notes](#upgrading-to-v105)
- [v1.0.4 Release Notes](#upgrading-to-v104)
- [v1.0.3 Release Notes](#upgrading-to-v103)
- [v1.0.0 Release Notes](#upgrading-from-v0x-to-v10)
