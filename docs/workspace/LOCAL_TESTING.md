# Local Generator Testing Guide

This guide shows how to use the `nest-generator` CLI from local build in this workspace.

## 🔧 Setup (Already Done)

The generator CLI has been linked globally using `npm link`:

```bash
cd libs/generator
npm link
```

This creates a global symlink to the local build at:

- Binary: `libs/generator/dist/cli/index.js`
- Global command: `nest-generator`

## 📋 Prerequisites

1. **Build the generator first:**

   ```bash
   npm run build:generator
   ```

2. **Database setup:**
   - PostgreSQL or MySQL running
   - Create test database
   - Update `.env` file with credentials

3. **Initialize metadata schema:**
   ```bash
   nest-generator init
   ```

## 🚀 Usage Examples

### 1. Initialize Metadata Schema

```bash
nest-generator init
```

This creates:

- `meta.table_metadata` - Table configurations
- `meta.column_metadata` - Column definitions
- `meta.generated_files` - File tracking

### 2. Generate Module from Metadata

```bash
# Basic generation
nest-generator generate users.profile

# With features
nest-generator generate users.profile \
  --features.audit=true \
  --features.fileUpload=true \
  --storageProvider=s3
```

### 3. Testing Generated Code

Generated files will be in `src/modules/`:

```
src/modules/
└── users-profile/
    ├── users-profile.controller.ts
    ├── users-profile.service.ts
    ├── users-profile.repository.ts
    ├── users-profile.dto.ts
    ├── users-profile.entity.ts
    └── users-profile.module.ts
```

Import in `src/app.module.ts`:

```typescript
import { UsersProfileModule } from './modules/users-profile/users-profile.module';

@Module({
  imports: [UsersProfileModule],
  // ...
})
export class AppModule {}
```

### 4. Run Application

```bash
npm run start:dev
```

## 📊 Example: Create Test Table Metadata

```sql
-- Connect to your database
psql -U postgres -d nest_test

-- Create metadata for a test table
INSERT INTO meta.table_metadata (
  schema_name, table_name, table_purpose,
  has_soft_delete, cache_enabled, cache_ttl
) VALUES (
  'public', 'users', 'User management',
  true, true, 3600
) RETURNING id;

-- Add columns (use the returned id above)
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type,
  is_required, is_filterable, display_in_list
) VALUES
  ('<table_id>', 'id', 'uuid', true, false, true),
  ('<table_id>', 'username', 'varchar', true, true, true),
  ('<table_id>', 'email', 'varchar', true, true, true),
  ('<table_id>', 'created_at', 'timestamp', true, false, true);
```

Then generate:

```bash
nest-generator generate public.users
```

## 🔄 Rebuild & Update

When you modify the generator code:

```bash
# 1. Rebuild
npm run build:generator

# 2. Generator is already linked, changes take effect immediately
nest-generator --version  # Should show updated version

# 3. Regenerate modules if needed
nest-generator generate <schema>.<table>
```

## 🐛 Troubleshooting

### Command not found

```bash
# Re-link the package
cd libs/generator
npm link
```

### Old version showing

```bash
# Check which binary is being used
which nest-generator

# Should point to:
# /usr/local/bin/nest-generator -> ../lib/node_modules/@ojiepermana/nest-generator/dist/cli/index.js

# If not, unlink and relink
npm unlink -g @ojiepermana/nest-generator
cd libs/generator
npm link
```

### Build errors

```bash
# Clean and rebuild
npm run clean:dist
npm run build:generator
```

## 📚 Available Commands

```bash
# Show help
nest-generator --help

# Show version
nest-generator --version

# Initialize database
nest-generator init

# Generate module
nest-generator generate <schema>.<table>

# Check metadata changes
nest-generator check <schema>.<table>

# Sync metadata changes
nest-generator sync <schema>.<table>
```

## 🎯 Quick Test Workflow

```bash
# 1. Build generator
npm run build:generator

# 2. Initialize database
nest-generator init

# 3. Add metadata via SQL (see example above)

# 4. Generate module
nest-generator generate public.users

# 5. Import in app.module.ts

# 6. Start app
npm run start:dev

# 7. Test endpoints
curl http://localhost:3000/users
curl http://localhost:3000/users/123
```

## 📦 Output Directory Structure

```
src/
├── app.module.ts          # Import generated modules here
├── main.ts
└── modules/               # Generated modules output
    ├── users/
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   ├── users.repository.ts
    │   ├── users.dto.ts
    │   └── users.module.ts
    └── products/
        ├── products.controller.ts
        └── ...
```

## 🔗 Useful Links

- [Generator Documentation](libs/generator/README.md)
- [RBAC Guide](libs/generator/src/rbac/RBAC_GUIDE.md)
- [Metadata Schema](libs/generator/src/database/schemas/README.md)

---

**Note:** This setup uses `npm link` which creates a symlink to the local build. Any changes to the generator code require rebuilding (`npm run build:generator`), but no need to re-link.
