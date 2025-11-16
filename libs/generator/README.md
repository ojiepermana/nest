# @ojiepermana/nest-generator

A powerful code generator library for NestJS applications that creates production-ready CRUD modules from database metadata.

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

# Generate module from metadata
nest-generator generate users.profile

# With features
nest-generator generate users.profile \
  --features.audit=true \
  --features.rbac=true \
  --features.fileUpload=true \
  --storageProvider=s3

# For monorepo/microservices: specify target app
nest-generator generate users.profile --app=user
nest-generator generate orders.order --app=gateway
```

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

For each table in metadata, generates:

- `dto/*.dto.ts` - DTOs with validation (Create, Update, Filter, Response)
- `*.query.ts` - SQL queries (JOINs, CTEs, Aggregations)
- `repositories/*.repository.ts` - Database operations with raw SQL
- `services/*.service.ts` - Business logic with audit trail
- `controllers/*.controller.ts` - REST endpoints or @MessagePattern handlers
- `*.module.ts` - NestJS module with all dependencies

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

- Auto-detect gateway vs service
- Generate appropriate controllers
- TCP/gRPC transport configuration
- Message pattern handlers
- ClientProxy integration
- [Quickstart Guide](https://github.com/ojiepermana/nest/blob/main/docs/generator/quickstart/MICROSERVICES_QUICKSTART.md)

## License

MIT

## Author

Ojie Permana

## Support

- Issues: [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- Repository: [GitHub](https://github.com/ojiepermana/nest)
