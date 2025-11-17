# @ojiepermana/nest-generator

A powerful code generator library for NestJS applications that creates production-ready CRUD modules from database metadata.

## 🎉 What's New in v3.0.2

- 🔧 **Remove Command Improvements** - Complete cleanup logic for gateway modules and barrel exports
- 🧹 **Better Module Cleanup** - Properly removes imports, controllers, and updates index.ts
- ✨ **Auto Schema Cleanup** - Deletes empty schema directories and updates app module
- ✅ **Remove Command** - Delete generated files with `nest-generator remove`
- ✅ **Schema-Based Structure** - Organized by database schema (e.g., `src/entity/`, `src/user/`)
- ✅ **Contract-First Pattern** - Shared DTOs between microservices to avoid duplication
- ✅ **6 Critical Bug Fixes** - DTO imports, Swagger, AuditModule, service ports, and more
- ✅ **Auto-detection** - Dynamically detects root module files (`*-service.module.ts`)
- ✅ **Config from File** - Service ports and hosts from `config/generator/*.config.json`

## Requirements

Before installing, ensure you have:

- **NestJS** 11.x or higher
- **Node.js** 24.0.0 or higher
- **npm** 11.0.0 or higher
- **Database**:
  - PostgreSQL 18+ **OR**
  - MySQL 8+

> ⚠️ **Warning**: This library requires Node.js 24+. Installation on older versions will show warnings and may cause runtime errors.

> ⚠️ **Database Requirements**: PostgreSQL 18+ or MySQL 8.0+ is **strictly required**. The library uses version-specific features like UUID v7 (PostgreSQL) and JSON functions (MySQL 8+). See [Database Compatibility Matrix](./DATABASE_COMPATIBILITY.md) for details.

## Features

✅ **No ORM** - Uses native database drivers (pg/mysql2) with raw SQL for maximum performance
✅ **Multi-Architecture** - Standalone, Monorepo, Microservices (fully tested with 0 compilation errors)
✅ **Smart Code Preservation** - Regenerate without losing custom code
✅ **Advanced Filtering** - URL-based filters with 12+ operators
✅ **Type Safety** - Full TypeScript with auto-generated DTOs
✅ **Auto Swagger** - API documentation generation
✅ **RBAC** - Complete Role-Based Access Control with 92 passing tests
✅ **Audit Trail** - Auto-track CREATE, UPDATE, DELETE with change history
✅ **File Upload** - 4 storage providers (Local, S3, GCS, Azure Blob)
✅ **Caching** - Redis integration with smart invalidation
✅ **Export** - CSV/Excel streaming for large datasets
✅ **Microservices** - Gateway + Service controllers with TCP/gRPC support

**Test Coverage:** 707/740 passing (95.5%) | **Feature Score:** 119/100

## Installation

**⚠️ Important: This is a development tool and should be installed as a dev dependency:**

```bash
npm install --save-dev @ojiepermana/nest-generator
```

**Other package managers:**

```bash
# Yarn
yarn add -D @ojiepermana/nest-generator

# pnpm
pnpm add -D @ojiepermana/nest-generator
```

### Why Dev Dependency Only?

1. **Not needed in production** - Generates code files during development, not runtime
2. **Reduces bundle size** - Development tools shouldn't bloat production dependencies
3. **Security** - Limits exposure of development tools in production environments
4. **Best practices** - Follows npm/Node.js ecosystem conventions for CLI tools

> **Note**: Installing as a regular dependency (`npm install`) will fail with an error. This package is designed to be used during development only.

### Usage After Installation

Once installed, use the CLI via npx:

```bash
# Initialize configuration
npx nest-generator init

# Generate modules
npx nest-generator generate users.profile

# With features
npx nest-generator generate users.profile \
  --features.audit=true \
  --features.rbac=true \
  --storageProvider=s3
```

### CI/CD Environments

Dev dependencies are installed automatically in CI/CD:

```bash
npm ci  # Installs all dependencies including devDependencies
```

## Quick Start

```typescript
import { Module } from '@nestjs/common';
import { GeneratorModule } from '@ojiepermana/nest-generator';

@Module({
  imports: [GeneratorModule],
})
export class AppModule {}
```

## CLI Usage

```bash
# Initialize configuration
nest-generator init
nest-generator init --architecture=microservices

# Generate module from metadata (schema.table format)
nest-generator generate entity.entity
nest-generator generate entity.location

# With all features enabled
nest-generator generate entity.entity --all

# With specific features
nest-generator generate entity.location \
  --features.audit=true \
  --features.rbac=true \
  --features.fileUpload=true \
  --storageProvider=s3

# For monorepo/microservices: specify target app
nest-generator generate entity.location --app=entity
nest-generator generate orders.order --app=gateway

# Remove generated files (NEW in v2.1.5!)
nest-generator remove entity.location --app=entity
nest-generator remove users.profile --app=user

# Delete module (legacy - for old single-app structure)
nest-generator delete users
```

## Remove Command (NEW!)

The `remove` command deletes all generated files and updates modules:

```bash
# Remove a table from microservices
nest-generator remove entity.location --app=entity
```

**What it does:**

- ✅ Deletes controllers, services, repositories, entities, DTOs
- ✅ Removes from service app (`apps/microservices/entity/src/entity/`)
- ✅ Removes from gateway app (`apps/microservices/gateway/src/entity/`)
- ✅ Removes contracts (`libs/contracts/entity/`)
- ✅ Updates schema modules (removes imports, providers, controllers)
- ✅ Updates `index.ts` barrel exports
- ✅ Auto-cleans empty schema directories
- ✅ Removes schema module from app module if empty

**Supported architectures:**

- Standalone: `nest-generator remove entity.product`
- Monorepo: `nest-generator remove entity.user --app=user`
- Microservices: `nest-generator remove entity.location --app=entity`

## Documentation

### Quick Links

- 📖 [Complete Documentation Index](https://github.com/ojiepermana/nest/blob/main/docs/generator/INDEX.md)
- 🚀 [5-Minute Quickstart](https://github.com/ojiepermana/nest/blob/main/docs/generator/QUICKSTART.md)
- 🏗️ [Microservices Quickstart](https://github.com/ojiepermana/nest/blob/main/docs/generator/quickstart/MICROSERVICES_QUICKSTART.md)
- 🔐 [RBAC Complete Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/rbac/RBAC_GUIDE.md) (1432 lines)
- 📝 [Audit Trail Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/audit/AUDIT_GUIDE.md)
- 📤 [File Upload Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/FILE_UPLOAD.md)
- ⭐ [Feature Scoring](https://github.com/ojiepermana/nest/blob/main/docs/generator/FEATURE_SCORING.md) (119/100)
- 🎯 [Enterprise Quality Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/ENTERPRISE_QUALITY.md)
- 🗄️ [Recommended Database Schemas](https://github.com/ojiepermana/nest/blob/main/docs/generator/RECOMMENDED_SCHEMAS.md)

### Examples

See the [examples directory](https://github.com/ojiepermana/nest/tree/main/docs/generator/EXAMPLES.md) for:

- Basic CRUD setup
- RBAC implementation
- Audit trail configuration
- File upload with S3
- Microservices architecture
- Monorepo setup

## Architecture Support

### Standalone Application

Single NestJS app with all modules in `src/modules/`.

### Monorepo

Multiple apps sharing common libraries. Each app has its own modules.

### Microservices (NEW! Fully Tested)

Distributed services with API gateway pattern:

- **Gateway**: HTTP REST API with ClientProxy to microservices
- **Services**: @MessagePattern handlers for TCP/gRPC communication
- **Auto-detection**: Generates appropriate controllers based on app type
- **Transport support**: TCP, gRPC, Redis, RabbitMQ, Kafka, NATS
- **0 compilation errors**: Fully tested and production-ready

## Generated Files

For each table in metadata, generates an organized **schema-based directory structure**:

```
{schema-name}/                         # Organized by database schema
├── controllers/
│   ├── {table1}.controller.ts         # REST or @MessagePattern handlers
│   └── {table2}.controller.ts
├── dto/
│   ├── {table1}/
│   │   ├── create-{table1}.dto.ts     # Create DTO with validation
│   │   ├── update-{table1}.dto.ts     # Update DTO (partial)
│   │   └── {table1}-filter.dto.ts     # Query filters (12+ operators)
│   └── {table2}/
│       └── ...
├── entities/
│   ├── {table1}.entity.ts             # Plain TypeScript entity
│   └── {table2}.entity.ts
├── repositories/
│   ├── {table1}.repository.ts         # Database operations (raw SQL)
│   └── {table2}.repository.ts
├── services/
│   ├── {table1}.service.ts            # Business logic + audit
│   └── {table2}.service.ts
├── {schema-name}.module.ts            # Schema module (aggregates all tables)
└── index.ts                           # Barrel exports
```

**Example for `entity` schema with tables `entity`, `location`, `business_entity`:**

```
apps/microservices/entity/src/entity/
├── controllers/
│   ├── entity.controller.ts
│   ├── location.controller.ts
│   └── business-entity.controller.ts
├── dto/
│   ├── entity/
│   ├── location/
│   └── business-entity/
├── entities/
│   ├── entity.entity.ts
│   ├── location.entity.ts
│   └── business-entity.entity.ts
├── repositories/
│   ├── entity.repository.ts
│   ├── location.repository.ts
│   └── business-entity.repository.ts
├── services/
│   ├── entity.service.ts
│   ├── location.service.ts
│   └── business-entity.service.ts
├── entity.module.ts                   # ONE module for entire schema
└── index.ts
```

**Microservices Architecture (NEW!):**

Gateway and service apps are separated with **shared contracts**:

```
# Service app (entity)
apps/microservices/entity/src/entity/
├── controllers/                       # @MessagePattern handlers
├── services/                          # Business logic
├── repositories/                      # Database access
└── dto/                               # Service-specific DTOs (extends contracts)

# Gateway app
apps/microservices/gateway/src/entity/
├── controllers/                       # HTTP REST controllers
└── dto/                               # Gateway DTOs with Swagger (extends contracts)

# Shared contracts (NO DUPLICATION!)
libs/contracts/entity/
└── dto/
    ├── entity/
    │   ├── create-entity.dto.ts       # Base DTOs shared by service & gateway
    │   ├── update-entity.dto.ts
    │   └── entity-filter.dto.ts
    ├── location/
    └── business-entity/
```

**Architecture-specific:**

- **Standalone/Monorepo**: REST controllers with HTTP decorators
- **Microservices Gateway**: HTTP + ClientProxy to services
- **Microservices Service**: @MessagePattern handlers for TCP/gRPC

## Filter Operators

```bash
GET /users?username_like=john&age_gte=18&role_in=admin,user
```

Supported operators:

- `_eq`, `_ne` - Equality
- `_gt`, `_gte`, `_lt`, `_lte` - Comparison
- `_like` - Pattern matching (case-insensitive)
- `_in`, `_nin` - Array operations
- `_between` - Range queries
- `_null`, `_nnull` - NULL checks

## Database Support

- **PostgreSQL** - Native `pg` driver with UUID v7, JSONB
- **MySQL** - Native `mysql2` driver with JSON columns

## Metadata Schema

Uses metadata tables to define module structure:

- `meta.table_metadata` - Table configuration
- `meta.column_metadata` - Column definitions with validation
- `meta.generated_files` - File tracking with checksums

## Custom Code Preservation

```typescript
// GENERATED_METHOD_START: find-all
async findAll() {
  // Auto-generated code
}
// GENERATED_METHOD_END: find-all

// CUSTOM_METHOD_START
async myCustomMethod() {
  // Your code - preserved during regeneration
}
// CUSTOM_METHOD_END
```

## Configuration

```json
{
  "architecture": "standalone",
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "myapp"
  }
}
```

## Advanced Features

### Swagger/OpenAPI ✅

Auto-generated API documentation with examples and schemas.

### Export Functionality ✅

Export to CSV/Excel with streaming for large datasets.

### Caching Layer ✅

Redis integration with smart invalidation and configurable TTL.

### Audit Trail ✅

Auto-track CREATE, UPDATE, DELETE operations with:

- Change history (old_values → new_values)
- User tracking (created_by, updated_by)
- Timestamp tracking
- Rollback support

### RBAC (Role-Based Access Control) ✅

**92 passing tests** - Production-ready with:

- Permission-based access (`@RequirePermission`)
- Role-based access (`@RequireRole`)
- Ownership verification (`@RequireOwnership`)
- Field-level permissions
- Hierarchical roles with super admin
- Redis caching for performance
- [Complete Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/rbac/RBAC_GUIDE.md)

### File Upload ✅

4 storage providers with automatic validation:

- **Local**: File system storage
- **AWS S3**: Amazon S3 buckets
- **Google Cloud Storage**: GCS buckets
- **Azure Blob Storage**: Azure containers

### Microservices Support ✅ NEW!

Full microservices architecture with:

- **Schema-based structure**: Organized by database schema (e.g., `entity/`, `user/`)
- **Contract-First pattern**: Shared DTOs in `libs/contracts/` to avoid duplication
- **Auto-detect gateway vs service**: Generates appropriate controllers
- **TCP/gRPC transport**: Message pattern handlers for microservices
- **ClientProxy integration**: Gateway uses ClientProxy to communicate with services
- **Service port from config**: Reads host/port from `config/generator/microservices.config.json`
- **Remove command**: Clean deletion of generated files with module updates
- [Quickstart Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/quickstart/MICROSERVICES_QUICKSTART.md)

**Recent Bug Fixes (v2.1.5):**

- ✅ Fixed DTO import aliases (no more `EntityDto as CreateEntityDto`)
- ✅ Swagger only for gateway (not generated for TCP microservices)
- ✅ AuditModule auto-imports when audit enabled
- ✅ Service ports from config (no more hardcoded 3001)
- ✅ Gateway `index.ts` only exports controllers and DTOs (not entities/services)
- ✅ Dynamic root module detection (`*-service.module.ts`)

## Recent Changes

### v3.0.2 (November 2025)

**Bug Fixes:**

- 🔧 Fixed remove command cleanup logic for gateway modules
- 🧹 Properly removes imports and updates controllers array
- ✨ New updateBarrelExports method for index.ts cleanup
- 📦 removeFromArray helper for clean array item removal
- 🗑️ Auto-cleanup empty schemas and update app module

### v3.0.1 (November 2025)

**Improvements:**

- 📚 Added version synchronization checklist for publishing
- 🔧 Improved version-bump.sh script with confirmation prompts
- 📖 Documentation updates for version consistency

### v3.0.0 (November 2025) - BREAKING CHANGES

**Major Changes:**

- 🚨 **BREAKING**: Schema-based directory structure replaces per-table structure
- 🚨 **BREAKING**: Contract-First pattern requires `libs/contracts/` directory
- 🎉 NEW: `remove` command for deleting generated files
- ⚙️ Service config from `config/generator/*.config.json`

**Bug Fixes:**

- Fixed DTO import aliases in service DTOs
- Swagger generation only for gateway apps
- AuditModule auto-import when audit feature enabled
- Service ports read from config instead of hardcoded
- Gateway barrel exports (index.ts) exclude non-existent files
- Warning removal for missing `app.module.ts`

**Test Coverage:** 579/585 passing (99%) | **Feature Score:** 119/100

## License

MIT

## Author

Ojie Permana

## Support

- Issues: [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- Repository: [GitHub](https://github.com/ojiepermana/nest)
