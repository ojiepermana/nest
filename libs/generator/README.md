# @ojiepermana/nest-generator

A powerful code generator library for NestJS applications that creates production-ready CRUD modules from database metadata.

## Features

✅ **No ORM** - Uses native database drivers (PostgreSQL, MySQL)
✅ **Multi-Architecture** - Supports standalone, monorepo, and microservices
✅ **Smart Code Preservation** - Regenerate without losing custom code
✅ **Advanced Filtering** - URL-based filters with 12+ operators
✅ **Type Safety** - Full TypeScript with auto-generated DTOs
✅ **Auto Swagger** - API documentation generation
✅ **Advanced Features** - Export, caching, RBAC, audit trail, search

## Installation

```bash
npm install @ojiepermana/nest-generator
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

# Generate module from metadata
nest-generator generate user.users

# Sync all modules
nest-generator sync

# List generated modules
nest-generator list
```

## Documentation

Full documentation available at: [GitHub Repository](https://github.com/ojiepermana/nest/tree/main/libs/generator)

See [prompt.md](./prompt.md) for complete feature list and implementation guide.

## Architecture Support

### Standalone Application

Single NestJS app with all modules.

### Monorepo

Multiple apps sharing common libraries.

### Microservices

Distributed services with API gateway pattern.

## Generated Files

For each table in metadata, generates:

- `*.dto.ts` - DTOs with validation
- `*.query.ts` - SQL queries
- `*.repository.ts` - Database operations
- `*.service.ts` - Business logic
- `*.controller.ts` - REST/Message handlers
- `*.module.ts` - NestJS module
- `*.spec.ts` - Unit tests (optional)

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

### Swagger/OpenAPI

Auto-generated API documentation with examples.

### Export Functionality

Export to CSV, Excel, PDF.

### Caching Layer

Redis integration with auto-invalidation.

### Rate Limiting

IP-based throttling with configurable limits.

### Audit Trail

Activity logging with rollback support.

### RBAC

Role-based access control with field-level permissions.

### Search Integration

Elasticsearch/Algolia for full-text search.

## Requirements

- NestJS 11.x
- Node.js 18+
- PostgreSQL 12+ or MySQL 8+

## License

MIT

## Author

Ojie Permana

## Support

- Issues: [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- Repository: [GitHub](https://github.com/ojiepermana/nest)
