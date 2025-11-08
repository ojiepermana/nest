# @ojiepermana/nest

A powerful code generator library for NestJS that creates complete CRUD modules from PostgreSQL table metadata, without using any ORM.

[![npm version](https://badge.fury.io/js/@ojiepermana%2Fnest.svg)](https://www.npmjs.com/package/@ojiepermana/nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@ojiepermana/nest)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue)](https://www.postgresql.org/)

## Features

- ✅ **No ORM** - Uses native `pg` (node-postgres) for better control and performance
- ✅ **Multi-Connection Support** - Handle multiple database connections simultaneously
- ✅ **Automatic Setup** - One command to create required database schema and tables
- ✅ **Safe Updates** - Regenerate code without overwriting custom modifications
- ✅ **Dynamic Filtering** - Advanced query filters via URL parameters (\_eq, \_like, \_in, \_between, etc.)
- ✅ **SQL Separation** - All queries stored in separate \*.query.ts files
- ✅ **Type Safety** - Full TypeScript support with generated DTOs
- ✅ **Schema Tracking** - Automatic change detection with checksums
- ✅ **CLI Tools** - Generate, sync, and check modules via command line
- ✅ **Multi-App Support** - Generate modules for different apps with --app parameter

## Installation

```bash
npm install @ojiepermana/nest pg class-validator class-transformer
# or
yarn add @ojiepermana/nest pg class-validator class-transformer
```

**Required Peer Dependencies:**

- `@nestjs/common` >= 11.0.0
- `@nestjs/core` >= 11.0.0
- `pg` >= 8.16.0
- `class-validator` >= 0.14.0
- `class-transformer` >= 0.5.0
- `reflect-metadata` >= 0.2.0

## Quick Start

### 1. Configure Database Connections

Create `src/config/databases.ts`:

```typescript
import { DatabaseConfig } from '@ojiepermana/nest';

export const DATABASES: DatabaseConfig[] = [
  {
    name: 'main',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
];
```

### 2. Import GeneratorModule in Your App

In `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { GeneratorModule } from '@ojiepermana/nest';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { 
  ResponseInterceptor, 
  AllExceptionsFilter 
} from '@ojiepermana/nest';

@Module({
  imports: [GeneratorModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

### 3. Setup Database (Automatic)

Run the setup command to create required schema and tables:

```bash
# Using npm script (development)
npm run setup:db -- --conn=main

# Or using npx (after package installation)
npx @ojiepermana/nest setup --conn=main
```

This will automatically create:

- `tool` schema for system tables
- `tool.crud_generator_metadata` table
- Required indexes and triggers

For detailed setup instructions, see [Database Setup Guide](../../docs/DATABASE_SETUP_GUIDE.md).

### 3a. Manual Setup (Alternative)

If you prefer manual setup, run this SQL:

```sql
-- Create tool schema
CREATE SCHEMA IF NOT EXISTS tool;

-- Create metadata table
CREATE TABLE IF NOT EXISTS tool.crud_generator_metadata (
  id SERIAL PRIMARY KEY,
  connection_name VARCHAR(100) NOT NULL,
  schema_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  checksum VARCHAR(32) NOT NULL,
  column_metadata JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(connection_name, schema_name, table_name)
);

CREATE INDEX idx_metadata_conn_schema ON crud_generator_metadata(connection_name, schema_name);
CREATE INDEX idx_metadata_checksum ON crud_generator_metadata(checksum);
```

### 4. Generate Your First CRUD Module

```bash
# Using the CLI directly
npx nest-crud-generate --conn=main --schema=public --table=users --app=demo

# Or add to package.json scripts:
# "generate:crud": "nest-crud-generate"
npm run generate:crud -- --conn=main --schema=public --table=users --app=demo
```

This creates:

- `apps/demo/src/modules/users/users.dto.ts` - DTOs for create/update
- `apps/demo/src/modules/users/users.query.ts` - SQL queries
- `apps/demo/src/modules/users/users.repository.ts` - Database operations
- `apps/demo/src/modules/users/users.service.ts` - Business logic
- `apps/demo/src/modules/users/users.controller.ts` - REST endpoints
- `apps/demo/src/modules/users/users.module.ts` - NestJS module

### 5. Import Generated Module

In `apps/demo/src/demo.module.ts`:

```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [GeneratorModule, UsersModule],
  // ...
})
export class DemoModule {}
```

## CLI Commands

### Setup Database (First Time)

```bash
# Setup database schema and metadata table
npm run setup:db -- --conn=main

# Or using npx
npx @ojiepermana/nest setup --conn=main

# Show help
npx @ojiepermana/nest setup --help
```

### Generate Single Module

```bash
npm run generate:crud -- --conn=main --schema=public --table=users --app=demo
```

**Options:**

- `--conn=<name>` - Connection name (required)
- `--schema=<name>` - Schema name (required)
- `--table=<name>` - Table name (required)
- `--app=<name>` - Target app name (default: demo)
- `--module=<name>` - Custom module name (optional, defaults to table name)
- `--update-only` - Only update auto-generated blocks, preserve custom code
- `--diff` - Show column differences before updating
- `--yes` - Skip confirmation prompts

### Update Existing Module

When table schema changes:

```bash
npm run generate:crud -- --conn=main --schema=public --table=users --app=demo --update-only --diff
```

### Sync Entire Schema

Generate/update all tables in a schema:

```bash
npm run generate:crud -- --conn=main --schema=public --app=demo --update-only
```

### Check for Changes

Compare current database schema with generated modules:

```bash
npm run generate:crud -- --conn=main --schema=public --check
```

## API Usage

### REST Endpoints

Generated controllers create these endpoints:

**List with filters:**

```http
GET /users?name_like=john&age_gte=18&page=1&limit=10
```

**Get by ID:**

```http
GET /users/123
```

**Create:**

```http
POST /users
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com"
}
```

**Update:**

```http
PUT /users/123
Content-Type: application/json

{
  "name": "John Doe"
}
```

**Delete:**

```http
DELETE /users/123
```

### Filter Operators

- `field_eq=value` - Equal to
- `field_ne=value` - Not equal to
- `field_gt=value` - Greater than
- `field_lt=value` - Less than
- `field_gte=value` - Greater than or equal
- `field_lte=value` - Less than or equal
- `field_like=value` - Case-insensitive pattern match
- `field_in=val1,val2,val3` - In array
- `field_nin=val1,val2` - Not in array
- `field_between=min,max` - Between two values

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-15T10:30:00.000Z",
    "path": "/main/public/users",
    "method": "GET"
  }
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message",
  "meta": {
    "timestamp": "2025-10-15T10:30:00.000Z",
    "path": "/main/public/users/999",
    "method": "GET",
    "statusCode": 404
  }
}
```

## Safe Code Updates

Generated files use special markers to protect custom code:

```typescript
// AUTO-GENERATED by CRUD Generator — DO NOT EDIT
import { Injectable } from '@nestjs/common';

// <AUTO-GENERATED>
@Injectable()
export class UsersService {
  // Auto-generated methods here
}
// </AUTO-GENERATED>

// Add custom methods below this line
export class UsersService {
  async customMethod() {
    // Your custom code is safe here
  }
}
```

When you run with `--update-only`, only content between `<AUTO-GENERATED>` tags is replaced.

### Direct Library Usage

You can also use the library components directly in your code:

#### ConnectionRegistry

```typescript
import { ConnectionRegistry } from '@ojiepermana/nest';

constructor(private readonly connectionRegistry: ConnectionRegistry) {}

async query() {
  const result = await this.connectionRegistry.query(
    'main',
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows;
}
```

#### TransactionManager

```typescript
import { TransactionManager } from '@ojiepermana/nest';

constructor(private readonly transactionManager: TransactionManager) {}

async transferMoney(fromId: number, toId: number, amount: number) {
  return this.transactionManager.runInTransaction('main', async (client) => {
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
  });
}
```

#### SqlFilterBuilder

```typescript
import { SqlFilterBuilder } from '@ojiepermana/nest';

const filters = { name_like: 'john', age_gte: 18 };
const allowedColumns = ['name', 'email', 'age'];

const { whereClause, params } = SqlFilterBuilder.buildAdvancedWhereClause(
  filters,
  allowedColumns
);

const sql = `SELECT * FROM users WHERE ${whereClause}`;
const result = await connectionRegistry.query('main', sql, params);
```

## Environment Variables

Create a `.env` file in your project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=postgres
```

## Project Structure

```text
libs/nest/src/
├── cli/
│   ├── crud-generator.ts          # CRUD Generator CLI
│   └── setup-database.ts          # Database setup CLI
├── common/
│   ├── db/
│   │   ├── connection.registry.ts # Connection pool manager
│   │   └── transaction.manager.ts # Transaction handler
│   ├── http/
│   │   ├── response.interceptor.ts
│   │   ├── exception.filter.ts
│   │   └── validation.pipe.ts
│   └── utils/
│       └── sql-filter.builder.ts  # Dynamic query builder
├── config/
│   └── databases.ts               # Database configurations
├── generator.module.ts
├── generator.service.ts
└── index.ts

apps/<app-name>/src/modules/       # Generated modules go here
└── <table-name>/
    ├── <table>.dto.ts
    ├── <table>.query.ts
    ├── <table>.repository.ts
    ├── <table>.service.ts
    ├── <table>.controller.ts
    └── <table>.module.ts
```

## Best Practices

1. **Run setup:db first** - Always setup database before generating modules
2. **Use --app parameter** - Specify target app for better organization
3. **Always use --update-only** - When regenerating existing modules
4. **Add custom code outside** - AUTO-GENERATED blocks
5. **Use transactions** - For multi-step operations
6. **Whitelist columns** - In filter queries for security
7. **Keep SQL in .query.ts files** - Don't mix SQL in services
8. **Use environment variables** - For database credentials
9. **Run migrations** - Before generating modules

## Troubleshooting

**Setup errors:**

- Check database credentials in `.env` file
- Ensure PostgreSQL is running: `systemctl status postgresql`
- Verify network connectivity and firewall settings
- Check user permissions: `GRANT CREATE ON DATABASE mydb TO myuser;`

**Connection errors:**

- Check database credentials in `config/databases.ts`
- Ensure PostgreSQL is running
- Verify network connectivity

**Module not found:**

- Check the module is imported in `app.module.ts`
- Verify the path alias `@ojiepermana/nest` in `tsconfig.json`

**Schema changes not detected:**

- Run `npm run generate:crud -- --conn=main --schema=public --check`
- Ensure metadata table exists in `tool` schema

## Documentation

- **[Database Setup Guide](../../docs/DATABASE_SETUP_GUIDE.md)** - Complete setup instructions
- **[Quick Reference](../../docs/SETUP_QUICK_REFERENCE.md)** - Quick commands reference  
- **[User Guide](../../docs/USER_GUIDE_GENERATOR.md)** - Step-by-step guide for new apps
- **[Migration Guide](../../docs/MIGRATION_METADATA_TO_TOOL_SCHEMA.md)** - Upgrading from v1.0.0
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- **Issues**: [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- **Documentation**: [GitHub Repository](https://github.com/ojiepermana/nest)
- **npm Package**: [@ojiepermana/nest](https://www.npmjs.com/package/@ojiepermana/nest)

## License

MIT
