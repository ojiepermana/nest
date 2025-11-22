/**
 * Test Permission Seed Generator
 * Verify that generator produces correct scoped permissions
 */

import { PermissionSeedGenerator } from './libs/generator/src/rbac/permission-seed.generator';

const generator = new PermissionSeedGenerator();

console.log('========================================');
console.log('🧪 Testing Permission Seed Generator');
console.log('========================================\n');

// Test 1: Generate scoped permissions for 'users' resource
console.log('✅ Test 1: Generate scoped permissions (users)');
console.log('─────────────────────────────────────────');
const userPermissions = generator.generateCrudPermissions({
  resourceName: 'users',
  schema: 'user',
  description: 'user profiles',
  category: 'users',
  generateScopes: true,
});
console.log(userPermissions);
console.log('\n');

// Test 2: Generate scoped permissions for 'orders' resource
console.log('✅ Test 2: Generate scoped permissions (orders)');
console.log('─────────────────────────────────────────');
const orderPermissions = generator.generateCrudPermissions({
  resourceName: 'orders',
  schema: 'user',
  description: 'customer orders',
  category: 'orders',
  generateScopes: true,
});
console.log(orderPermissions);
console.log('\n');

// Test 3: Generate simple permissions (backward compatible)
console.log('✅ Test 3: Generate simple permissions (backward compatible)');
console.log('─────────────────────────────────────────');
const simplePermissions = generator.generateCrudPermissions({
  resourceName: 'products',
  schema: 'user',
  description: 'products',
  generateScopes: false,
});
console.log(simplePermissions);
console.log('\n');

console.log('========================================');
console.log('✅ All Tests Completed');
console.log('========================================');
