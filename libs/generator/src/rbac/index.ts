/**
 * @deprecated This module has moved to @ojiepermana/nest-rbac
 *
 * Please update your imports:
 *
 * Before:
 *   import { RequirePermission, RBACModule } from '@ojiepermana/nest-generator/rbac';
 *
 * After:
 *   import { RequirePermission, RBACModule } from '@ojiepermana/nest-rbac';
 *
 * This re-export will be removed in v6.0.0
 *
 * Install the new package:
 *   npm install @ojiepermana/nest-rbac
 */

// Re-export everything from new package for backward compatibility
export * from '@ojiepermana/nest-rbac';

// Keep generator-specific tools here
export * from './permission-seed.generator';
export * from './rbac-schema.generator';

// Log deprecation warning only once
let warningShown = false;
if (!warningShown && typeof console !== 'undefined') {
  console.warn(`
⚠️  DEPRECATION WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are importing RBAC from @ojiepermana/nest-generator/rbac

This path is deprecated. Please update to:
  npm install @ojiepermana/nest-rbac

Then update your imports to:
  import { ... } from '@ojiepermana/nest-rbac'

The old path will be removed in v6.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  warningShown = true;
}
