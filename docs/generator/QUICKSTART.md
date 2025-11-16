# Quick Start Guide

Get up and running with `@ojiepermana/nest-generator` in minutes.

## Prerequisites

- Node.js 24.0.0 or newer
- npm 11.0.0 or newer
- NestJS 11.x project
- PostgreSQL 18+ or MySQL 8+ database with access to create schemas

## Install the Generator

**⚠️ Install as dev dependency:**

```bash
npm install --save-dev @ojiepermana/nest-generator
```

Or install globally for CLI usage:

```bash
npm install -g @ojiepermana/nest-generator
```

## Step-by-Step

### 1. Initialize the workspace

```bash
nest-generator init
```

Answer the prompts for architecture, database connection, and optional features. The command creates `generator.config.json`, validates the connection, and provisions the `meta` schema used to store metadata.

### 2. Seed table metadata

Create metadata for the table you want to scaffold. Example for a simple `public.users` table:

```sql
INSERT INTO meta.table_metadata (schema_name, table_name, table_purpose)
VALUES ('public', 'users', 'User management');

INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required,
  is_filterable,
  display_in_list
)
SELECT id, 'id', 'uuid', true, false, true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users'
UNION ALL
SELECT id, 'email', 'varchar', true, true, true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users'
UNION ALL
SELECT id, 'name', 'varchar', true, true, true
FROM meta.table_metadata
WHERE schema_name = 'public' AND table_name = 'users';
```

### 3. Generate the module

```bash
nest-generator generate public.users
```

Key flags you can pass:

- `--skip-prompts` to use defaults from `generator.config.json`
- `--features.audit`, `--features.caching`, `--features.fileUpload`, `--features.rbac` to toggle features
- `--storageProvider <local|s3|gcs|azure>` when enabling file upload
- `--all` to enable every available feature in one go

The generator will fetch metadata, create the module under `src/users/` (path depends on architecture), and auto-register the module in `app.module.ts`. Swagger configuration and RBAC module registration are also handled when the related features are enabled.

### 4. Run the application

```bash
npm run start:dev
```

Open the API documentation at `http://localhost:3000/api`. You should see:

- CRUD endpoints (`POST`, `GET`, `GET /filter`, `GET :id`, `PUT`, `DELETE`)
- Pagination, sorting, and filtering query parameters
- Swagger schemas generated from metadata
- Optional audit hooks, caching, RBAC decorators, and upload endpoints if those features were enabled

## Feature Recipes

### Add RBAC to a module

```bash
nest-generator generate public.users --features.rbac
```

The controller will include decorators such as:

```typescript
@RequirePermission('users.read')
@Get()
findAll() {
  return this.service.findWithFilters({}, {});
}
```

Learn more: [RBAC Guide](./rbac/RBAC_GUIDE.md)

### Enable file upload with Amazon S3

```bash
nest-generator generate public.profiles --features.fileUpload --storageProvider s3
```

Set the provider credentials before running the app:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=my-uploads
```

Learn more: [File Upload Guide](./FILE_UPLOAD.md)

### Record audit logs

```bash
nest-generator generate public.orders --features.audit
```

Generated services call `AuditLogService` automatically. Use the audit module to query history:

```typescript
const events = await this.auditQueryService.findByEntity('orders');
```

Learn more: [Audit Trail Guide](./audit/AUDIT_GUIDE.md)

### Target a microservices architecture

During `nest-generator init`, select the microservices option. Generation will split files across the gateway and service apps:

```bash
nest-generator generate public.products
```

- `apps/gateway/src/users/users.controller.ts` exposes REST endpoints and proxies via `ClientProxy`
- `apps/products-service/src/users/users.controller.ts` handles `@MessagePattern` handlers

Learn more: [Architecture Support](./FEATURES.md#architecture-support)

## Next Steps

- Review the [Feature Overview](./FEATURES.md) for the complete capability matrix
- Check [Feature Scoring](./FEATURE_SCORING.md) to understand compliance with the original specification
- Follow the [Caching](./CACHING.md), [RBAC](./rbac/RBAC_GUIDE.md), [Audit](./audit/AUDIT_GUIDE.md), and [File Upload](./FILE_UPLOAD.md) guides for deep dives
- Browse [Best Practices](./BEST_PRACTICES.md) for production tips and [Troubleshooting](./TROUBLESHOOTING.md) for common fixes

## Troubleshooting

| Issue                                     | Resolution                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Module not found` when starting the app  | Install database drivers: `npm install pg` (PostgreSQL) or `npm install mysql2` (MySQL)                         |
| `Table metadata not found`                | Re-run `nest-generator init` and ensure metadata rows exist in `meta.table_metadata` and `meta.column_metadata` |
| `Permission denied` when connecting to DB | Update credentials in `generator.config.json` and ensure the user can create schemas                            |

Need more help? Visit the [documentation index](./INDEX.md) or open an issue on [GitHub](https://github.com/ojiepermana/nest/issues).

## Tips

- Use `--skip-prompts` in CI or scripted environments
- Run `nest-generator generate <schema.table> --all` to create a fully featured module for smoke testing
- Regenerate modules safely; custom code blocks wrapped in `// CUSTOM_CODE_START` and `// CUSTOM_CODE_END` are preserved
- Run `npm test` after generation to confirm coverage remains above the 99 percent target

Happy coding!
