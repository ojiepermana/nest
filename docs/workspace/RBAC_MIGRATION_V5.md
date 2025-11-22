# Migrating to @ojiepermana/nest-rbac v1.0

## Overview

Starting with `@ojiepermana/nest-generator` v5.0.0, the RBAC functionality has been extracted into a separate package: `@ojiepermana/nest-rbac`.

This allows you to use RBAC in your NestJS applications without needing the entire generator toolkit.

## Breaking Changes in Generator v5.0

### Old Import Path (v4.x)

```typescript
import { RequirePermission, RBACModule } from '@ojiepermana/nest-rbac';
```

### New Import Path (v5.x)

```typescript
import { RequirePermission, RBACModule } from '@ojiepermana/nest-rbac';
```

## Migration Steps

### 1. Install the New Package

```bash
npm install @ojiepermana/nest-rbac
```

### 2. Update Imports

#### Option A: Automated (Recommended)

Use this script to automatically update all imports in your project:

```bash
# Replace imports in all TypeScript files
find . -name "*.ts" -type f -not -path "*/node_modules/*" -exec sed -i \
  "s/@ojiepermana\/nest-generator\/rbac/@ojiepermana\/nest-rbac/g" {} +
```

#### Option B: Manual

Update each import manually:

**Before:**

```typescript
import { RequirePermission, RequireRole, RBACModule, RBACService } from '@ojiepermana/nest-rbac';
```

**After:**

```typescript
import { RequirePermission, RequireRole, RBACModule, RBACService } from '@ojiepermana/nest-rbac';
```

### 3. Update Generator (Optional)

If you're using the generator, update to v5.0.0:

```bash
npm install --save-dev @ojiepermana/nest-generator@^5.0.0
```

Generated code will automatically use the new import paths.

## Backward Compatibility

### Generator v5.0.0

The old import path is still supported in v5.0.0 through re-exports, but will show a deprecation warning:

```
⚠️  DEPRECATION WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are importing RBAC from @ojiepermana/nest-rbac

This path is deprecated. Please update to:
  npm install @ojiepermana/nest-rbac

Then update your imports to:
  import { ... } from '@ojiepermana/nest-rbac'

The old path will be removed in v6.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Timeline

- **v4.x**: Old path works (`@ojiepermana/nest-rbac`)
- **v5.0.0**: Both paths work, old path shows deprecation warning
- **v6.0.0**: Only new path works (`@ojiepermana/nest-rbac`)

## What Changed

### Moved to Separate Package

All runtime RBAC code has moved to `@ojiepermana/nest-rbac`:

- ✅ Decorators (`@RequirePermission`, `@RequireRole`, `@Public`)
- ✅ Guards (`PermissionsGuard`, `RolesGuard`)
- ✅ Services (`RBACService`, `RBACRepository`)
- ✅ Module (`RBACModule`)
- ✅ Database schemas (PostgreSQL, MySQL)

### Stayed in Generator

Code generation tools remain in `@ojiepermana/nest-generator`:

- ✅ Permission seed generator
- ✅ RBAC schema generator
- ✅ CLI commands

## Benefits of Separation

1. **Lighter Dependencies**: Production apps don't need generator dependencies
2. **Reusability**: Use RBAC without installing the generator
3. **Separation of Concerns**: Runtime code separate from build-time tools
4. **Independent Versioning**: RBAC can be updated without generator changes

## Example: Full Migration

### Before (v4.x)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RBACModule } from '@ojiepermana/nest-rbac';

@Module({
  imports: [
    RBACModule.register({
      /* config */
    }),
  ],
})
export class AppModule {}

// users.controller.ts
import { Controller, Get } from '@nestjs/common';
import { RequirePermission } from '@ojiepermana/nest-rbac';

@Controller('users')
export class UsersController {
  @Get()
  @RequirePermission('users:read')
  findAll() {
    // ...
  }
}
```

### After (v5.x)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RBACModule } from '@ojiepermana/nest-rbac';

@Module({
  imports: [
    RBACModule.register({
      /* config */
    }),
  ],
})
export class AppModule {}

// users.controller.ts
import { Controller, Get } from '@nestjs/common';
import { RequirePermission } from '@ojiepermana/nest-rbac';

@Controller('users')
export class UsersController {
  @Get()
  @RequirePermission('users:read')
  findAll() {
    // ...
  }
}
```

## Package.json Example

```json
{
  "dependencies": {
    "@ojiepermana/nest-rbac": "^1.0.0"
  },
  "devDependencies": {
    "@ojiepermana/nest-generator": "^5.0.0"
  }
}
```

## Troubleshooting

### Issue: Module not found error

**Error:**

```
Cannot find module '@ojiepermana/nest-rbac'
```

**Solution:**

```bash
npm install @ojiepermana/nest-rbac
```

### Issue: Type errors after migration

**Solution:**
Rebuild your project:

```bash
npm run build
```

### Issue: Tests failing after migration

**Solution:**
Update test imports and rebuild:

```bash
# Update imports
find . -name "*.spec.ts" -exec sed -i \
  "s/@ojiepermana\/nest-generator\/rbac/@ojiepermana\/nest-rbac/g" {} +

# Run tests
npm test
```

## Need Help?

- [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- [RBAC Documentation](https://github.com/ojiepermana/nest/tree/main/docs/generator/rbac)
- [Migration Guide](https://github.com/ojiepermana/nest/tree/main/docs/workspace/RBAC_LIBRARY_MIGRATION_GUIDE.md)

## Version Compatibility Matrix

| Generator Version | RBAC Package                    | Import Path              | Status         |
| ----------------- | ------------------------------- | ------------------------ | -------------- |
| v4.x              | Included                        | `@ojiepermana/nest-rbac` | ✅ Supported   |
| v5.0.0            | `@ojiepermana/nest-rbac` v1.0.0 | `@ojiepermana/nest-rbac` | ✅ Recommended |
| v5.0.0            | -                               | `@ojiepermana/nest-rbac` | ⚠️ Deprecated  |
| v6.0.0+           | `@ojiepermana/nest-rbac` v1.x   | `@ojiepermana/nest-rbac` | ✅ Required    |

---

**Migration completed successfully?** Remove the old import path and enjoy cleaner dependencies! 🚀
