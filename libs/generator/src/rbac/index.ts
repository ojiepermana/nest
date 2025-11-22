/**
 * RBAC Generator Tools
 *
 * @deprecated For RBAC runtime (decorators, guards, services), use @ojiepermana/nest-rbac
 *
 * This module now only contains generator-specific tools:
 * - PermissionSeedGenerator: Generate permission SQL seeds
 * - RBACSchemaGenerator: Generate RBAC database schemas
 *
 * For runtime RBAC features, install:
 *   npm install @ojiepermana/nest-rbac
 *
 * Then import from:
 *   import { RequirePermission, RBACModule } from '@ojiepermana/nest-rbac';
 */

// Re-export RBAC runtime for backward compatibility (will be removed in v6.0.0)
export * from '@ojiepermana/nest-rbac';

// Generator-specific tools (these will remain in this package)
export * from './permission-seed.generator';
export * from './rbac-schema.generator';

// Deprecation warning for runtime imports
let warningShown = false;
if (!warningShown && typeof console !== 'undefined') {
  const stack = new Error().stack || '';
  // Only show warning if importing runtime features (not generator tools)
  if (!stack.includes('permission-seed') && !stack.includes('rbac-schema')) {
    console.warn(`
⚠️  DEPRECATION WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are importing RBAC runtime from @ojiepermana/nest-generator/rbac

This path is deprecated. Please update to:
  npm install @ojiepermana/nest-rbac

Then update your imports to:
  import { RequirePermission, RBACModule, ... } from '@ojiepermana/nest-rbac'

Generator tools (PermissionSeedGenerator, RBACSchemaGenerator) will 
remain in @ojiepermana/nest-generator/rbac

This re-export will be removed in v6.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    warningShown = true;
  }
}
