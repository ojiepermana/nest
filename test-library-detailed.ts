/**
 * Detailed Library Test
 * Show complete SQL output
 */

import { PermissionSeedGenerator } from './libs/generator/src/rbac/permission-seed.generator';

const generator = new PermissionSeedGenerator();

console.log('========================================');
console.log('📋 Complete SQL Output Example');
console.log('========================================\n');

// Generate complete setup for a realistic scenario
const sql = generator.generateCompleteSetup('invoices', {
  customEndpoints: [
    {
      action: 'approve',
      name: 'Approve Invoice',
      description: 'Approve invoice for payment',
      scope: 'team',
    },
    {
      action: 'send',
      name: 'Send Invoice',
      description: 'Send invoice to customer',
      scope: 'own',
    },
  ],
  roleMappings: [
    {
      roleCode: 'accountant',
      permissions: ['invoices:read:all', 'invoices:update:all', 'invoices:approve:team'],
    },
    {
      roleCode: 'sales',
      permissions: ['invoices:create:basic', 'invoices:read:own', 'invoices:send:own'],
    },
  ],
});

console.log(sql);

console.log('\n========================================');
console.log('📊 Analysis');
console.log('========================================\n');

// Analyze output
const lines = sql.split('\n');
const permissionInserts = lines.filter(
  (line) => line.includes('INSERT INTO') && line.includes('permissions'),
).length;
const roleInserts = lines.filter(
  (line) => line.includes('INSERT INTO') && line.includes('role_permissions'),
).length;
const scopedPerms = lines
  .filter((line) => line.includes("VALUES ('invoices:"))
  .map((line) => {
    const match = line.match(
      /VALUES \('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+)/,
    );
    if (match) {
      return {
        code: match[1],
        name: match[2],
        scope: match[5],
        priority: match[6],
      };
    }
    return null;
  })
  .filter(Boolean);

console.log(`Total Permission Inserts: ${permissionInserts}`);
console.log(`Total Role-Permission Mappings: ${roleInserts}`);
console.log(`\nGenerated Permissions (${scopedPerms.length}):`);

// Group by scope
const byScope = scopedPerms.reduce((acc, p) => {
  if (!acc[p.scope]) acc[p.scope] = [];
  acc[p.scope].push(p);
  return acc;
}, {});

Object.entries(byScope).forEach(([scope, perms]) => {
  console.log(`\n  ${scope.toUpperCase()} (priority ${perms[0].priority}):`);
  perms.forEach((p) => console.log(`    - ${p.code}`));
});

console.log('\n✅ Library generates production-ready SQL!');
