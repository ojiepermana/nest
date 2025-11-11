# Quick Start Guide

Get started with @ojiepermana/nest-generator in under 5 minutes!

## Prerequisites

- Node.js 24.0.0+
- npm 11.0.0+
- NestJS 11.x
- PostgreSQL 18+ or MySQL 8+

## Installation

```bash
npm install -g @ojiepermana/nest-generator
```

## 5-Minute Tutorial

### Step 1: Initialize Configuration (1 min)

```bash
nest-generator init
```

Answer the prompts:

- Architecture type: `standalone`
- Database type: `postgresql`
- Database host: `localhost`
- Database port: `5432`
- Database name: `myapp`
- Database user: `postgres`
- Database password: `your_password`

This creates:

- `generator.config.json` - Generator configuration
- Metadata schema tables in your database

### Step 2: Create Metadata for Your Table (2 min)

Let's create a simple `users` table metadata:

```sql
-- Insert table metadata
INSERT INTO meta.table_metadata (schema_name, table_name, table_purpose)
VALUES ('public', 'users', 'User management');

-- Insert column metadata
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required,
  is_filterable,
  display_in_list
)
SELECT
  id,
  'id',
  'uuid',
  true,
  false,
  true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users'

UNION ALL

SELECT
  id,
  'email',
  'varchar',
  true,
  true,
  true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users'

UNION ALL

SELECT
  id,
  'name',
  'varchar',
  true,
  true,
  true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users';
```

### Step 3: Generate Your First Module (1 min)

```bash
nest-generator generate public.users
```

Interactive prompts:

- Enable caching? `Yes`
- Enable audit trail? `Yes`
- Enable Swagger? `Yes`

Generated files:

```
src/modules/users/
├── users.controller.ts    # REST API endpoints
├── users.service.ts       # Business logic
├── users.repository.ts    # Database access
├── users.entity.ts        # TypeScript entity
├── create-users.dto.ts    # Create DTO
├── update-users.dto.ts    # Update DTO
├── users-filter.dto.ts    # Filter DTO
├── users.module.ts        # NestJS module
└── index.ts               # Exports
```

### Step 4: Import & Test (1 min)

Add to your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
})
export class AppModule {}
```

Start your application:

```bash
npm run start:dev
```

Visit Swagger UI:

```
http://localhost:3000/api
```

You now have:

- ✅ Full CRUD API (GET, POST, PUT, DELETE)
- ✅ Filtering & pagination
- ✅ Swagger documentation
- ✅ Audit trail (if enabled)
- ✅ Redis caching (if enabled)

## Common Use Cases

### Use Case 1: Add RBAC to Generated Module

```bash
nest-generator generate public.users --features.rbac=true
```

Then configure permissions:

```typescript
// In your controller
@RequirePermission('users:read')
@Get()
async findAll() {
  // ...
}
```

**Learn more**: [RBAC Guide](./rbac/RBAC_GUIDE.md)

### Use Case 2: Add File Upload

```bash
nest-generator generate public.profiles --features.fileUpload=true --storageProvider=s3
```

Configure AWS S3 in `.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=my-uploads
```

**Learn more**: [File Upload Guide](./FILE_UPLOAD.md)

### Use Case 3: Add Audit Trail

```bash
nest-generator generate public.orders --features.audit=true
```

Query audit logs:

```typescript
const auditLogs = await auditQueryService.findByEntity('orders');
```

**Learn more**: [Audit Trail Guide](./audit/AUDIT_DOCUMENTATION.md)

### Use Case 4: Microservices Architecture

```bash
nest-generator init
# Select: Microservices (Distributed)

nest-generator generate public.products
# Generator creates:
# - apps/product-service/ (Microservice)
# - apps/gateway/ (API Gateway with proxy)
```

**Learn more**: [Architecture Guide](./FEATURE_STATUS.md#architecture-patterns)

## Next Steps

### Explore Features

- 📖 [All Features Overview](./FEATURE_STATUS.md)
- 🎯 [Feature Scoring](./FEATURE_SCORING.md)
- 📊 [Requirements](./REQUIREMENTS.md)

### Deep Dive Guides

- 🔐 [RBAC Complete Guide](./rbac/RBAC_GUIDE.md) - Role-based access control
- 🔍 [Audit Trail Guide](./audit/AUDIT_DOCUMENTATION.md) - Change tracking
- 📤 [File Upload Guide](./FILE_UPLOAD.md) - Multi-provider uploads
- 💾 [Caching Guide](./CACHING.md) - Redis integration
- 🗄️ [Database Guide](./DATABASE.md) - PostgreSQL & MySQL support

### Advanced Topics

- 🏗️ [Custom Generators](./FEATURE_STATUS.md#extending-generators)
- 🔧 [Configuration](./FEATURE_STATUS.md#configuration)
- 🧪 [Testing](./FEATURE_STATUS.md#testing-generated-code)
- 🚀 [Deployment](./REQUIREMENTS.md#production-recommendations)

## Troubleshooting

### "Module not found" error

Ensure dependencies are installed:

```bash
npm install pg  # For PostgreSQL
# OR
npm install mysql2  # For MySQL
```

### "Table metadata not found" error

Run the init command:

```bash
nest-generator init
```

### "Permission denied" error

Check database credentials in `generator.config.json`

### Need More Help?

- 📚 [Complete Documentation Index](./INDEX.md)
- 💬 [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- 📧 Email: <me@ojiepermana.com>

## Tips & Tricks

### Speed Up Development

```bash
# Generate without prompts (use defaults)
nest-generator generate public.users --skip-prompts

# Generate with all features enabled
nest-generator generate public.users \
  --features.audit=true \
  --features.rbac=true \
  --features.fileUpload=true \
  --features.cache=true
```

### Best Practices

1. **Use metadata-driven approach** - Define structure in database first
2. **Enable audit trail for critical tables** - Orders, payments, user data
3. **Use RBAC for multi-tenant apps** - Better security and isolation
4. **Cache frequently accessed data** - Improve performance
5. **Test generated code** - Run `npm test` after generation

### Keyboard Shortcuts

While in interactive mode:

- `↑/↓` - Navigate options
- `Space` - Select/deselect
- `Enter` - Confirm
- `Ctrl+C` - Cancel

## What's Next?

After completing this quick start:

1. ✅ You have a working CRUD module
2. ✅ You understand the basic workflow
3. ✅ You know how to enable features

**Recommended Next Steps**:

1. Read [Feature Status](./FEATURE_STATUS.md) to see all capabilities
2. Explore [RBAC Guide](./rbac/RBAC_GUIDE.md) if you need access control
3. Check [File Upload Guide](./FILE_UPLOAD.md) for handling uploads
4. Review [Best Practices](./FEATURE_STATUS.md#best-practices)

Happy coding! 🚀
