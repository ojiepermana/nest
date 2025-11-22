# @ojiepermana/nest-generator Documentation

NestJS metadata-driven CRUD generator with audit, caching, RBAC, and file upload support. Use this index as the navigation hub for every guide inside `docs/generator/`.

**Current Version**: 4.0.3 | **Test Coverage**: 711/742 (95.8%) | **Feature Score**: 119/100

## 📊 Feature Implementation Status

Based on actual generation testing (`apps/microservices/entity`):

### ✅ Auto-Generated Features (8/9 - 89%)

| Feature             | Status      | Evidence                                                                                   |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| **Core CRUD**       | ✅ Complete | Controllers, Services, Repositories, DTOs, Entities                                        |
| **Caching**         | ✅ Complete | CacheModule, Cache Manager, invalidation in services                                       |
| **Audit Trail**     | ✅ Complete | AuditModule, AuditLogService, logging in CREATE/UPDATE/DELETE                              |
| **Microservices**   | ✅ Complete | @MessagePattern handlers, proper payload handling                                          |
| **RBAC Decorators** | ✅ Complete | @RequirePermission, @RequireRole, @Public auto-applied (v4.0.1)                            |
| **Swagger/OpenAPI** | ✅ Complete | Full suite: @ApiTags, @ApiOperation, @ApiResponse, @ApiBody, @ApiParam, @ApiQuery (v4.0.1) |
| **File Upload**     | ✅ Complete | Auto-detect file columns, upload/delete endpoints with Swagger (v4.0.1)                    |
| **JOIN Queries**    | ✅ Complete | findWithRelations(), findAllWithRelations() with FK detection (v4.0.2)                     |
| **Recap/Analytics** | ✅ Complete | getDailyRecap(), getMonthlyRecap(), getYearlyRecap(), getMonthlyBreakdown() (v4.0.2)       |

### ❌ Features Requiring Manual Setup (1/9 - 11%)

| Feature              | Status     | Missing Component                                  | Required Action                             |
| -------------------- | ---------- | -------------------------------------------------- | ------------------------------------------- |
| **Advanced Queries** | ⚠️ Partial | Aggregations (COUNT/SUM/AVG), Search, Export, CTEs | Manual implementation or future enhancement |

**Note**: 92% of core features are now auto-generated! Only export and CTE features require manual setup.

## Start Here

- [Quick Start Guide](./QUICKSTART.md) – Generate the first module in five minutes
- [Requirements](./REQUIREMENTS.md) – Node, npm, database, and tooling checklist
- [Installation](../../libs/generator/README.md#installation) – Add the generator to a project
- [Configuration](./CONFIGURATION.md) – Generator config and feature flags

## Feature Guides

### Core Features

- [Features Overview](./FEATURES.md) – Complete generator capabilities and status matrix
- [Configuration](./CONFIGURATION.md) – Feature flags, CLI options, and config files
- [Best Practices](./BEST_PRACTICES.md) – Production considerations and patterns

### Advanced Features

- [Audit Trail](./audit/AUDIT_GUIDE.md) – Metadata, tables, and query hooks (✅ Auto-generated)
- [Advanced Query Features](./QUERY_FEATURES.md) – JOIN, analytics, aggregation, search (✅ Auto-generated v4.0.2+)
- [RBAC Guide](./rbac/RBAC_GUIDE.md) – Role, permission, and decorator usage (⚠️ Module only)
- [RBAC Implementation Status](./rbac/IMPLEMENTATION_STATUS.md) – Current RBAC feature state
- [RBAC Examples](./rbac/RBAC_EXAMPLES.md) – Real-world RBAC patterns
- [File Upload Guide](./FILE_UPLOAD.md) – Storage providers, validation, and generated helpers
- [Caching Guide](./CACHING.md) – Redis integration and cache invalidation flows (✅ Auto-generated)

## Quick Paths by Goal

- **Ship CRUD fast** → [Quick Start](./QUICKSTART.md)
- **Secure endpoints** → [RBAC Guide](./rbac/RBAC_GUIDE.md) + [RBAC Quickstart](./quickstart/RBAC_QUICKSTART.md)
- **Track changes** → [Audit Guide](./audit/AUDIT_GUIDE.md) + [Audit Quickstart](./quickstart/AUDIT_QUICKSTART.md)
- **Handle files** → [File Upload](./FILE_UPLOAD.md) + [Upload Quickstart](./quickstart/UPLOAD_QUICKSTART.md)
- **Improve performance** → [Caching](./CACHING.md)
- **Build microservices** → [Microservices Quickstart](./quickstart/MICROSERVICES_QUICKSTART.md)
- **Plan architecture** → [Features · Architecture Support](./FEATURES.md#architecture-support)

## Architecture & Data

- [Database Guide](./DATABASE.md) – PostgreSQL and MySQL configuration
- [Metadata Schemas](./database/SCHEMAS.md) – `meta.*` schema layout
- [Recommended Schemas](./RECOMMENDED_SCHEMAS.md) – Table patterns that work best
- [Schema Structure](./SCHEMA_STRUCTURE.md) – Directory organization by database schema ✨ NEW!
- [Migration Guide](./MIGRATION.md) – Upgrade steps between releases

## Quality, Operations, and Examples

- [Feature Scoring](./FEATURE_SCORING.md) – Compliance scoring vs. prompt specification
- [Enterprise Quality](./ENTERPRISE_QUALITY.md) – Hardening checklist
- [Best Practices](./BEST_PRACTICES.md) – Production considerations
- [Examples](./EXAMPLES.md) – Real-world module scenarios
- [Troubleshooting](./TROUBLESHOOTING.md) – Common errors and fixes

## Quickstart Series

- [RBAC Quickstart](./quickstart/RBAC_QUICKSTART.md) – Role-based access control in 10 minutes ⚠️
- [Audit Quickstart](./quickstart/AUDIT_QUICKSTART.md) – Track all changes automatically ✅
- [Upload Quickstart](./quickstart/UPLOAD_QUICKSTART.md) – File uploads with S3/GCS/Azure
- [Microservices Quickstart](./quickstart/MICROSERVICES_QUICKSTART.md) – Gateway + Services architecture ✅

**Legend**: ✅ Auto-generated | ⚠️ Module only, decorators manual | ❌ Manual setup required

## Feature Detection

The generator detects features from metadata structure:

### Automatic Detection

- **Foreign Keys** → Generates JOIN queries and relation methods (findWithRelations, findAllWithRelations)
- **File Columns** (`file_path`, `file_url`, `*_file`) → Adds StorageService and upload methods
- **Timestamp Columns** (`created_at`, `updated_at`) → Enables recap queries (daily/monthly/yearly)
- **Numeric Columns** (integer, bigint, decimal) → Generates aggregation methods (COUNT/SUM/AVG/MIN/MAX)
- **Text Columns** (varchar, text, char) → Generates search methods (ILIKE, fuzzy, column-specific)
- **Soft Delete** (`deleted_at`, `is_deleted`) → Generates soft delete logic

### Manual Flags

Use CLI flags to explicitly enable features:

```bash
# Enable all features
nest-generator generate schema.table --all

# Specific features
nest-generator generate schema.table --features.audit=true
nest-generator generate schema.table --features.cache=true
nest-generator generate schema.table --features.rbac=true
nest-generator generate schema.table --features.upload=true
nest-generator generate schema.table --features.search=true
nest-generator generate schema.table --features.export=true
```

### Known Limitations

1. **Export Features** - CSV/Excel export requires manual implementation
2. **CTE Queries** - WITH clause queries require manual implementation
3. **Fuzzy Search** - Requires PostgreSQL pg_trgm extension to be installed
4. **File Upload** - Detection based on column naming patterns (`*_file`, `file_path`, etc.)

## Reference & History

### Source Code

- Project CLI contract → `libs/generator/src/cli`
- Generator sources → `libs/generator/src/generators`
- Feature modules → `libs/generator/src/audit`, `libs/generator/src/rbac`, `libs/generator/src/cache`

### Documentation Structure

```
docs/generator/
├── INDEX.md                    ← You are here
├── FEATURES.md                 ← Complete feature matrix
├── QUICKSTART.md               ← 5-minute tutorial
├── CONFIGURATION.md            ← Config & flags
├── BEST_PRACTICES.md           ← Production patterns
├── ENTERPRISE_QUALITY.md       ← Hardening checklist
├── EXAMPLES.md                 ← Real scenarios
├── TROUBLESHOOTING.md          ← Common errors
├── quickstart/                 ← Quick tutorials (4 files)
├── rbac/                       ← RBAC guides (3 files)
├── audit/                      ← Audit documentation
├── database/                   ← DB schemas
├── result/                     ← Generation results
└── archive/                    ← Historical notes
```

### Archives

- Archived notes → `docs/generator/archive/`
- Original specification → [archive/specs/prompt.md](./archive/specs/prompt.md)
- Progress history → [archive/PROGRESS_HISTORY.md](./archive/PROGRESS_HISTORY.md)

## Contributing to the Docs

1. Place new `.md` files inside the appropriate subdirectory (`docs/generator/...`).
2. Add a link in this index and cross-link related guides.
3. Keep instructions aligned with current generator behavior (check `libs/generator/src`).
4. Document new features and update the feature matrix after shipping changes.

## Support & Links

- **NPM Package**: [@ojiepermana/nest-generator](https://www.npmjs.com/package/@ojiepermana/nest-generator) v4.0.0
- **Repository**: [github.com/ojiepermana/nest](https://github.com/ojiepermana/nest)
- **Issues**: [Open issues](https://github.com/ojiepermana/nest/issues)
- **License**: MIT © Ojie Permana

## Recent Updates (v4.0.3)

**New Features**:

- ✅ **Aggregation & Statistics Methods** - Auto-generate analytics for numeric columns
  - getStatistics() - comprehensive stats for all numeric fields (COUNT, SUM, AVG, MIN, MAX)
  - getAggregation(groupBy, column) - dynamic GROUP BY with validation
  - Individual methods: getSum{Column}(), getAvg{Column}(), getMinMax{Column}()
  - Auto-detects numeric types: integer, bigint, decimal, numeric, real, double precision, money
  - Soft-delete filtering and NULL safety with COALESCE

- ✅ **Full-Text Search Methods** - PostgreSQL ILIKE-based search
  - search(query, options) - multi-column search across ALL text fields
  - searchByColumn(column, query) - column-specific search with validation
  - searchCount(query) - count results for pagination
  - fuzzySearch(query, threshold) - trigram similarity (requires pg_trgm extension)
  - searchBy{Column}() - shortcuts for name, title, description, email
  - Auto-detects text types: varchar, text, char, character varying

**Previous Updates (v4.0.2)**:

- ✅ **JOIN Query Methods** - findWithRelations() with FK detection (INNER/LEFT JOIN)
- ✅ **Recap/Analytics Methods** - Time-based analytics (daily, monthly, yearly breakdowns)

**Previous Updates (v4.0.1)**:

- ✅ **RBAC Decorators Auto-Generation** - Smart decorator selection (@Public, @RequireRole, @RequirePermission)
- ✅ **Complete Swagger/OpenAPI Suite** - Full decorators for gateway controllers
- ✅ **File Upload Detection** - Auto-detect file columns and generate upload/delete endpoints
- ✅ **RBAC Schema Migration** - Consolidated RBAC tables from `rbac` schema to `user` schema

**Breaking Changes (v4.0.0)**:

- Metadata tables renamed: `meta.table_metadata` → `meta.table`, `meta.column_metadata` → `meta.column`
- Migration SQL required for existing databases (see [MIGRATION.md](./MIGRATION.md))

**Test Results**: 711/742 passing (95.8% coverage)
