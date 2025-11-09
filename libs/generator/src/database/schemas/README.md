# Database Schemas

This directory contains SQL schema scripts for creating metadata tables required by the NestJS Generator.

## Overview

The generator uses metadata tables to store configuration for automatic CRUD module generation:

- **table_metadata** - Configuration for each table/module
- **column_metadata** - Column-level validation, display, and behavior settings
- **generated_files** - Tracking for regeneration and custom code preservation

## Supported Databases

### PostgreSQL (Recommended)

- **File**: `postgresql.sql`
- **Requirements**: PostgreSQL 12+
- **Features**:
  - UUID v7 generation (time-ordered UUIDs)
  - JSONB support for complex configurations
  - Advanced constraints and triggers
  - Schema-based organization (`meta` schema)

### MySQL

- **File**: `mysql.sql`
- **Requirements**: MySQL 8.0+
- **Features**:
  - JSON column type support
  - CHECK constraints (MySQL 8.0.16+)
  - Table prefixes (`meta_` prefix instead of schema)

## Schema Installation

### Using CLI (Recommended)

The generator will automatically create these tables when you run:

```bash
nest-generator init
```

### Manual Installation

#### PostgreSQL

```bash
psql -U your_user -d your_database -f postgresql.sql
```

#### MySQL

```bash
mysql -u your_user -p your_database < mysql.sql
```

## Table Structures

### meta.table_metadata / meta_table_metadata

Stores table-level configuration:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID/CHAR(36) | Primary key (UUID v7) |
| `schema_name` | VARCHAR(63) | Database schema name |
| `table_name` | VARCHAR(63) | Table name |
| `display_name` | VARCHAR(255) | Human-readable name |
| `module_name` | VARCHAR(100) | NestJS module name (unique) |
| `entity_name` | VARCHAR(100) | Entity class name |
| `table_type` | VARCHAR(20) | master/transaction/reference/junction |
| `has_soft_delete` | BOOLEAN | Enable soft delete |
| `cache_enabled` | BOOLEAN | Enable Redis caching |
| `throttle_enabled` | BOOLEAN | Enable rate limiting |
| `enable_export` | BOOLEAN | Generate export endpoints |
| `enable_recap` | BOOLEAN | Generate recap/aggregation endpoints |
| `permission_config` | JSON | RBAC configuration |

**Constraints**:
- Unique: `(schema_name, table_name)`
- Unique: `module_name`
- CHECK: `table_type IN ('master', 'transaction', 'reference', 'junction')`

### meta.column_metadata / meta_column_metadata

Stores column-level configuration:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID/CHAR(36) | Primary key |
| `table_id` | UUID/CHAR(36) | Foreign key to table_metadata |
| `column_name` | VARCHAR(63) | Column name |
| `data_type` | VARCHAR(50) | Column data type |
| `display_name` | VARCHAR(255) | Label for UI |
| `is_required` | BOOLEAN | Required validation |
| `validation_rules` | JSON | class-validator rules |
| `is_filterable` | BOOLEAN | Allow filtering |
| `filter_operators` | JSON | Allowed operators array |
| `is_foreign_key` | BOOLEAN | Is this a foreign key? |
| `ref_schema`, `ref_table`, `ref_column` | VARCHAR | Foreign key reference |
| `input_type` | VARCHAR(50) | UI input type (text/select/date/etc) |
| `is_file_upload` | BOOLEAN | File upload column |
| `file_upload_config` | JSON | Upload validation and storage |
| `swagger_example` | TEXT | Example for API docs |
| `display_order` | INT | Column ordering in forms |

**Constraints**:
- Unique: `(table_id, column_name)`
- Foreign key: `table_id → meta.table_metadata(id)` ON DELETE CASCADE
- CHECK: Foreign key fields consistency

### meta.generated_files / meta_generated_files

Tracks generated files:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID/CHAR(36) | Primary key |
| `table_id` | UUID/CHAR(36) | Foreign key to table_metadata |
| `file_path` | VARCHAR(500) | Absolute path to generated file |
| `file_type` | VARCHAR(50) | dto/entity/service/controller/etc |
| `checksum` | VARCHAR(64) | SHA-256 of current file |
| `metadata_checksum` | VARCHAR(64) | SHA-256 of metadata used |
| `has_custom_code` | BOOLEAN | Contains CUSTOM_CODE blocks |
| `last_generated_at` | TIMESTAMP | Last generation time |
| `last_modified_at` | TIMESTAMP | Last manual modification |

**Constraints**:
- Unique: `file_path`
- Foreign key: `table_id → meta.table_metadata(id)` ON DELETE CASCADE

## Indexes

Performance indexes are created on:

- Foreign key columns
- Frequently queried columns (`is_active`, `module_name`)
- Sort/filter columns (`created_at`, `display_order`)
- Lookup columns (`file_path`, `checksum`)

## UUID v7 Function

PostgreSQL includes a custom UUID v7 implementation (`meta.uuid_generate_v7()`) that generates time-ordered UUIDs for better B-tree indexing performance.

MySQL uses standard `UUID()` (v1) as v7 is not natively supported. UUIDs are stored as `CHAR(36)`.

## Automatic Triggers

PostgreSQL schema includes triggers for:

- `updated_at` timestamp auto-update on all tables
- Metadata change detection

## Usage in Application

```typescript
import { getSchemaForDatabase } from '@ojiepermana/nest-generator';

// Get schema script
const schema = getSchemaForDatabase('postgresql');

// Execute with connection manager
await connectionManager.query(schema);
```

## Migration Strategy

When updating schema:

1. Create migration SQL scripts
2. Version control all changes
3. Test with sample data
4. Update both PostgreSQL and MySQL versions
5. Document breaking changes

## Security Notes

- Always use parameterized queries (enforced by connection manager)
- Validate all metadata before insertion
- Restrict database user permissions to metadata tables only
- Use read-only connections for query generation

## Future Enhancements

- [ ] Schema versioning table
- [ ] Migration tracking
- [ ] Metadata validation functions
- [ ] Audit log tables
- [ ] Backup/restore procedures
