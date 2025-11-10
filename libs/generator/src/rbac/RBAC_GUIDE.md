# RBAC (Role-Based Access Control) Guide

Complete guide for using the RBAC system in your NestJS applications generated with `@ojiepermana/nest-generator`.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Module Configuration](#module-configuration)
- [Core Concepts](#core-concepts)
- [Using Decorators](#using-decorators)
- [Using Guards](#using-guards)
- [Service API Reference](#service-api-reference)
- [Permission Management](#permission-management)
- [Role Management](#role-management)
- [Ownership Verification](#ownership-verification)
- [Field-Level Permissions](#field-level-permissions)
- [Caching](#caching)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## Overview

The RBAC system provides comprehensive authorization for NestJS applications with:

- **Permission-based access control** - Fine-grained permissions for specific actions
- **Role-based access control** - Assign roles with predefined permissions
- **Ownership verification** - Check if users own resources
- **Field-level permissions** - Control access to specific fields
- **Hierarchical roles** - Role inheritance with super admin support
- **Caching** - Redis-based caching for performance
- **Type-safe** - Full TypeScript support with generics

**Key Features:**

✅ Decorator-based authorization (`@RequirePermission`, `@RequireRole`, `@RequireOwnership`)  
✅ Guard-based enforcement (automatic permission/role checking)  
✅ Service-based API for programmatic checks  
✅ Flexible logic (AND/OR) for multiple permissions/roles  
✅ Expiration support for temporary role assignments  
✅ Active/inactive role status  
✅ Database-driven with metadata tables  
✅ Integration with generated CRUD modules

---

## Installation

The RBAC system is automatically generated when using the `--features.rbac=true` flag:

```bash
nest-generator generate <schema>.<table> --features.rbac=true
```

**Manual Installation:**

If you need to add RBAC to an existing project:

1. Copy RBAC files to your project:

```bash
cp -r libs/generator/src/rbac src/rbac
```

2. Install dependencies (if not already present):

```bash
npm install @nestjs/cache-manager cache-manager
npm install -D @types/cache-manager
```

---

## Database Setup

### Required Tables

RBAC requires these metadata tables in your database:

**PostgreSQL:**

```sql
-- Create RBAC schema
CREATE SCHEMA IF NOT EXISTS rbac;

-- Permissions table
CREATE TABLE rbac.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE rbac.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions junction
CREATE TABLE rbac.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES rbac.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User roles junction
CREATE TABLE rbac.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References your users table
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- User permissions (direct assignments)
CREATE TABLE rbac.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES rbac.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON rbac.user_roles(user_id);
CREATE INDEX idx_user_roles_active ON rbac.user_roles(user_id, is_active);
CREATE INDEX idx_user_permissions_user_id ON rbac.user_permissions(user_id);
CREATE INDEX idx_role_permissions_role_id ON rbac.role_permissions(role_id);
```

**MySQL:**

```sql
-- Create RBAC schema
CREATE DATABASE IF NOT EXISTS rbac;
USE rbac;

-- Similar table structure with MySQL syntax
-- (Use CHAR(36) for UUIDs, DATETIME instead of TIMESTAMPTZ)
```

### Seed Initial Data

Create system roles and permissions:

```sql
-- Insert system roles
INSERT INTO rbac.roles (name, description, is_system_role) VALUES
  ('super_admin', 'Super administrator with full access', true),
  ('admin', 'Administrator with elevated privileges', true),
  ('user', 'Standard user role', true),
  ('guest', 'Read-only guest access', true);

-- Insert common permissions
INSERT INTO rbac.permissions (name, description, resource, action) VALUES
  ('users.create', 'Create users', 'users', 'create'),
  ('users.read', 'View users', 'users', 'read'),
  ('users.update', 'Update users', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  ('posts.create', 'Create posts', 'posts', 'create'),
  ('posts.read', 'View posts', 'posts', 'read'),
  ('posts.update', 'Update posts', 'posts', 'update'),
  ('posts.delete', 'Delete posts', 'posts', 'delete');

-- Assign permissions to super_admin role
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r, rbac.permissions p
WHERE r.name = 'super_admin';

-- Assign limited permissions to user role
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r, rbac.permissions p
WHERE r.name = 'user'
  AND p.name IN ('posts.create', 'posts.read', 'posts.update');
```

---

## Module Configuration

### Basic Registration

Register RBAC module in your application:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RBACModule } from './rbac/rbac.module';

@Module({
  imports: [
    RBACModule.register({
      database: {
        type: 'postgresql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      },
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        store: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      superAdminRole: 'super_admin',
    }),
  ],
})
export class AppModule {}
```

### Async Registration

For dynamic configuration with dependency injection:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RBACModule } from './rbac/rbac.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RBACModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        database: {
          type: config.get('DB_TYPE'),
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_DATABASE'),
        },
        cache: {
          enabled: config.get('CACHE_ENABLED') === 'true',
          ttl: config.get('CACHE_TTL') || 300,
          store: config.get('CACHE_STORE') || 'redis',
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
        superAdminRole: config.get('SUPER_ADMIN_ROLE') || 'super_admin',
      }),
    }),
  ],
})
export class AppModule {}
```

### Global Guards (Recommended)

Enable RBAC guards globally for automatic authorization:

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { RolesGuard } from './rbac/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector);

  // Register guards globally
  app.useGlobalGuards(new PermissionsGuard(reflector), new RolesGuard(reflector));

  await app.listen(3000);
}
bootstrap();
```

---

## Core Concepts

### Permission vs Role

**Permission**: Specific action on a resource

- Format: `<resource>.<action>` (e.g., `users.create`, `posts.delete`)
- Fine-grained control
- Can be assigned directly to users or via roles

**Role**: Collection of permissions

- Examples: `admin`, `moderator`, `user`, `guest`
- Simplifies permission management
- Supports hierarchy (role inheritance)

### Authorization Flow

```
1. Request → Controller Endpoint
2. Guard Interceptor (PermissionsGuard / RolesGuard)
3. Extract Metadata from Decorator (@RequirePermission / @RequireRole)
4. Get User from Request (user.id)
5. Check Permission/Role via RBACService
6. Query Database (with caching)
7. Allow or Deny Access (throw ForbiddenException if denied)
```

### Caching Strategy

**Cache Keys:**

- Permission: `rbac:user:{userId}:permission:{permission}`
- Role: `rbac:user:{userId}:role:{roleName}`
- User context: `rbac:user:{userId}:context`

**Cache Invalidation:**

- Automatic on role assignment/removal
- Automatic on permission changes
- Manual via service methods

---

## Using Decorators

### @RequirePermission

Protect endpoints with permission requirements.

**Single Permission:**

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@Controller('users')
export class UsersController {
  @Post()
  @RequirePermission('users.create')
  async createUser(@Body() createDto: CreateUserDto) {
    return this.service.create(createDto);
  }

  @Get()
  @RequirePermission('users.read')
  async listUsers() {
    return this.service.findAll();
  }
}
```

**Multiple Permissions (AND logic):**

```typescript
@Post('admin-action')
@RequirePermission(['users.create', 'users.update'], {
  logic: PermissionLogic.AND, // User must have ALL permissions
})
async adminAction() {
  // Only accessible if user has both permissions
}
```

**Multiple Permissions (OR logic):**

```typescript
@Get('flexible-access')
@RequirePermission(['users.read', 'users.list'], {
  logic: PermissionLogic.OR, // User needs AT LEAST ONE
})
async flexibleAccess() {
  // Accessible if user has either permission
}
```

**With Ownership Check:**

```typescript
@Put(':id')
@RequirePermission('posts.update', {
  requireOwnership: true,
  ownershipField: 'user_id',
})
async updatePost(@Param('id') id: string, @Body() updateDto: UpdatePostDto) {
  // Only post owner or super admin can update
}
```

**Custom Error Message:**

```typescript
@Delete(':id')
@RequirePermission('users.delete', {
  errorMessage: 'You do not have permission to delete users',
})
async deleteUser(@Param('id') id: string) {
  return this.service.delete(id);
}
```

### @RequireRole

Protect endpoints with role requirements.

**Single Role:**

```typescript
@Get('admin-dashboard')
@RequireRole('admin')
async adminDashboard() {
  return this.service.getAdminStats();
}
```

**Multiple Roles (AND logic):**

```typescript
@Post('critical-action')
@RequireRole(['admin', 'moderator'], {
  logic: RoleLogic.AND,
})
async criticalAction() {
  // User must have BOTH roles
}
```

**Multiple Roles (OR logic):**

```typescript
@Get('staff-area')
@RequireRole(['admin', 'moderator', 'support'], {
  logic: RoleLogic.OR,
})
async staffArea() {
  // User needs ANY of these roles
}
```

**Check Active Roles Only:**

```typescript
@Get('active-only')
@RequireRole('premium', {
  activeOnly: true, // Only active, non-expired roles
})
async premiumFeature() {
  // Only active premium users
}
```

**Check Expiration:**

```typescript
@Get('time-limited')
@RequireRole('trial', {
  checkExpiration: true,
})
async trialFeature() {
  // Will fail if role has expired
}
```

### @RequireOwnership

Ensure user owns the resource.

```typescript
@Put(':id')
@RequireOwnership({
  ownerField: 'user_id',
  allowAdminOverride: true,
})
async updatePost(@Param('id') id: string, @Body() updateDto: UpdatePostDto) {
  // Only owner can update (or super admin if allowAdminOverride=true)
}
```

**With Schema/Table:**

```typescript
@Delete(':id')
@RequireOwnership({
  schema: 'app',
  table: 'posts',
  ownerField: 'created_by',
  allowAdminOverride: false, // Even admins can't delete others' posts
})
async deletePost(@Param('id') id: string) {
  return this.service.delete(id);
}
```

### @Public

Mark endpoints as public (skip all RBAC checks).

```typescript
@Get('health')
@Public()
async healthCheck() {
  return { status: 'ok' };
}

@Post('login')
@Public()
async login(@Body() credentials: LoginDto) {
  return this.authService.login(credentials);
}
```

### @SkipPermissionCheck

Skip permission check but still enforce role checks.

```typescript
@Get('internal')
@RequireRole('admin')
@SkipPermissionCheck()
async internalAdminEndpoint() {
  // Role check enforced, permission check skipped
}
```

---

## Using Guards

### PermissionsGuard

Automatically enforces `@RequirePermission` decorator.

**Global Registration:**

```typescript
// main.ts
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { Reflector } from '@nestjs/core';

const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new PermissionsGuard(app.get(Reflector)));
```

**Module Registration:**

```typescript
// app.module.ts
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from './rbac/guards/permissions.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
```

**Controller-Level Registration:**

```typescript
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  // All endpoints protected by PermissionsGuard
}
```

### RolesGuard

Automatically enforces `@RequireRole` decorator.

**Usage:** Same registration patterns as PermissionsGuard.

### OwnershipGuard

Enforces `@RequireOwnership` decorator.

```typescript
import { UseGuards } from '@nestjs/common';
import { OwnershipGuard } from '../rbac/guards/ownership.guard';

@Controller('posts')
@UseGuards(OwnershipGuard)
export class PostsController {
  @Put(':id')
  @RequireOwnership({ ownerField: 'user_id' })
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.service.update(id, dto);
  }
}
```

---

## Service API Reference

Inject `RBACService` for programmatic authorization checks:

```typescript
import { Injectable } from '@nestjs/common';
import { RBACService } from '../rbac/rbac.service';

@Injectable()
export class UsersService {
  constructor(private readonly rbac: RBACService) {}

  async sensitiveAction(userId: string) {
    // Check permission programmatically
    const hasPermission = await this.rbac.hasPermission(userId, 'users.delete');

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    // Proceed with action
  }
}
```

### Permission Methods

#### `hasPermission(userId: string, permission: string): Promise<boolean>`

Check if user has a specific permission.

```typescript
const canDelete = await this.rbac.hasPermission('user-123', 'users.delete');
// Returns: true or false
```

#### `hasAllPermissions(userId: string, permissions: string[]): Promise<PermissionCheckResult>`

Check if user has ALL specified permissions (AND logic).

```typescript
const result = await this.rbac.hasAllPermissions('user-123', ['users.create', 'users.update', 'users.delete']);

/*
Returns:
{
  granted: boolean,
  reason?: string,
  missingPermissions?: string[]
}
*/

if (result.granted) {
  // User has all permissions
} else {
  console.log(`Missing: ${result.missingPermissions.join(', ')}`);
}
```

#### `hasAnyPermission(userId: string, permissions: string[]): Promise<PermissionCheckResult>`

Check if user has ANY of the specified permissions (OR logic).

```typescript
const result = await this.rbac.hasAnyPermission('user-123', ['posts.update', 'posts.delete']);

if (result.granted) {
  // User has at least one permission
}
```

### Role Methods

#### `hasRole(userId: string, roleName: string, activeOnly?: boolean, checkExpiration?: boolean): Promise<boolean>`

Check if user has a specific role.

```typescript
// Basic check
const isAdmin = await this.rbac.hasRole('user-123', 'admin');

// Check only active roles
const isActiveAdmin = await this.rbac.hasRole('user-123', 'admin', true);

// Check expiration
const hasValidRole = await this.rbac.hasRole('user-123', 'premium', true, true);
```

#### `hasAllRoles(userId: string, roles: string[]): Promise<RoleCheckResult>`

Check if user has ALL specified roles.

```typescript
const result = await this.rbac.hasAllRoles('user-123', ['admin', 'moderator']);

if (result.granted) {
  // User has both roles
}
```

#### `hasAnyRole(userId: string, roles: string[]): Promise<RoleCheckResult>`

Check if user has ANY of the specified roles.

```typescript
const result = await this.rbac.hasAnyRole('user-123', ['admin', 'moderator', 'support']);
```

#### `getUserContext(userId: string): Promise<UserRBACContext>`

Get complete user context (all roles and permissions).

```typescript
const context = await this.rbac.getUserContext('user-123');

/*
Returns:
{
  userId: string,
  roles: Array<{
    id: string,
    name: string,
    assigned_at: Date,
    expires_at?: Date,
    is_active: boolean
  }>,
  permissions: Array<{
    id: string,
    name: string,
    resource: string,
    action: string
  }>,
  isSuperAdmin: boolean
}
*/

console.log(`User has ${context.permissions.length} permissions`);
console.log(`Roles: ${context.roles.map((r) => r.name).join(', ')}`);
```

### Role Management

#### `assignRole(userId: string, roleName: string, expiresAt?: Date): Promise<void>`

Assign a role to a user.

```typescript
// Permanent assignment
await this.rbac.assignRole('user-123', 'admin');

// Temporary assignment (expires in 7 days)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 7);
await this.rbac.assignRole('user-123', 'trial', expiryDate);
```

#### `removeRole(userId: string, roleName: string): Promise<void>`

Remove a role from a user.

```typescript
await this.rbac.removeRole('user-123', 'admin');
```

### Ownership Methods

#### `checkOwnership(userId: string, schema: string, table: string, resourceId: string, config: OwnershipConfig): Promise<boolean>`

Check if user owns a resource.

```typescript
const ownsPost = await this.rbac.checkOwnership('user-123', 'app', 'posts', 'post-456', {
  ownerField: 'user_id',
  allowAdminOverride: true,
});

if (ownsPost) {
  // User owns the post or is super admin
}
```

### Admin Methods

#### `isSuperAdmin(userId: string): Promise<boolean>`

Check if user is a super administrator.

```typescript
const isSuperAdmin = await this.rbac.isSuperAdmin('user-123');

if (isSuperAdmin) {
  // User has super admin role
}
```

#### `isAdmin(userId: string): Promise<boolean>`

Check if user has admin role.

```typescript
const isAdmin = await this.rbac.isAdmin('user-123');
```

---

## Permission Management

### Creating Permissions

```sql
INSERT INTO rbac.permissions (name, description, resource, action)
VALUES ('products.manage_inventory', 'Manage product inventory', 'products', 'manage_inventory');
```

### Assigning Permissions to Roles

```sql
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r, rbac.permissions p
WHERE r.name = 'warehouse_manager'
  AND p.name = 'products.manage_inventory';
```

### Direct User Permissions

Grant permission directly to a user (bypassing roles):

```sql
INSERT INTO rbac.user_permissions (user_id, permission_id, granted_by)
VALUES (
  'user-123',
  (SELECT id FROM rbac.permissions WHERE name = 'reports.view_sensitive'),
  'admin-456'
);
```

### Permission Naming Conventions

Follow consistent naming patterns:

- **Format:** `<resource>.<action>`
- **Resource:** Plural noun (users, posts, products)
- **Action:** Verb (create, read, update, delete, manage, approve)

**Examples:**

- `users.create`
- `posts.publish`
- `orders.approve`
- `reports.export`
- `products.manage_inventory`

---

## Role Management

### Creating Roles

```sql
INSERT INTO rbac.roles (name, description, is_system_role)
VALUES ('content_editor', 'Edit and publish content', false);
```

### Role Hierarchy

Implement role inheritance by assigning broader permissions to higher-level roles:

```
super_admin → ALL permissions
  ↓
admin → Most permissions
  ↓
moderator → Content management permissions
  ↓
user → Basic permissions
  ↓
guest → Read-only permissions
```

### Temporary Roles

Assign roles with expiration:

```typescript
// Grant trial role for 14 days
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 14);
await this.rbac.assignRole(userId, 'trial', expiryDate);
```

### Deactivating Roles

Temporarily disable a user's role without removing it:

```sql
UPDATE rbac.user_roles
SET is_active = false
WHERE user_id = 'user-123' AND role_id = (SELECT id FROM rbac.roles WHERE name = 'moderator');
```

---

## Ownership Verification

### Basic Ownership Check

```typescript
@Put('posts/:id')
@RequireOwnership({
  ownerField: 'user_id',
})
async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
  // Only owner can update
}
```

### Admin Override

Allow super admins to bypass ownership:

```typescript
@Delete('posts/:id')
@RequireOwnership({
  ownerField: 'created_by',
  allowAdminOverride: true,
})
async deletePost(@Param('id') id: string) {
  // Owner or super admin can delete
}
```

### Custom Owner Field

```typescript
@Put('teams/:id')
@RequireOwnership({
  schema: 'app',
  table: 'teams',
  ownerField: 'team_leader_id',
})
async updateTeam(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
  // Only team leader can update
}
```

---

## Field-Level Permissions

### Using @RequireFieldPermission

Control access to specific fields based on permissions.

```typescript
import { RequireFieldPermission } from '../rbac/decorators/require-field-permission.decorator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @RequireFieldPermission('users.set_role')
  role?: string; // Only users with users.set_role can set this field

  @IsNumber()
  @RequireFieldPermission('users.set_salary')
  salary?: number; // Sensitive field
}
```

**Guard Usage:**

```typescript
import { UseGuards } from '@nestjs/common';
import { FieldPermissionsGuard } from '../rbac/guards/field-permissions.guard';

@Controller('users')
@UseGuards(FieldPermissionsGuard)
export class UsersController {
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // Guard automatically checks field permissions
    // If user lacks 'users.set_role', the 'role' field is ignored
  }
}
```

---

## Caching

### Configuration

```typescript
RBACModule.register({
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    store: 'redis',
    host: 'localhost',
    port: 6379,
  },
});
```

### Cache Keys

The system uses predictable cache keys:

- **User Permission:** `rbac:user:{userId}:permission:{permission}`
- **User Role:** `rbac:user:{userId}:role:{roleName}`
- **User Context:** `rbac:user:{userId}:context`

### Manual Cache Invalidation

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async updateUserRoles(userId: string, roles: string[]) {
    // Update roles in database
    await this.updateRoles(userId, roles);

    // Invalidate user's cache
    const keys = await this.cacheManager.store.keys(`rbac:user:${userId}:*`);
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }
}
```

### Performance Tips

- **Enable caching in production** - Reduces database queries
- **Use appropriate TTL** - Balance freshness vs performance (recommended: 300-600 seconds)
- **Invalidate on changes** - Clear cache when roles/permissions change
- **Monitor cache hit rate** - Use Redis monitoring tools

---

## Best Practices

### 1. Use Decorators for Static Authorization

```typescript
// ✅ Good - Clear and declarative
@Get('admin')
@RequireRole('admin')
async adminEndpoint() {}

// ❌ Bad - Manual checks in controller
@Get('admin')
async adminEndpoint(@Request() req) {
  if (req.user.role !== 'admin') throw new ForbiddenException();
}
```

### 2. Use Service Methods for Dynamic Authorization

```typescript
// ✅ Good - Dynamic business logic
async deletePost(userId: string, postId: string) {
  const post = await this.findPost(postId);

  // Check ownership OR admin status
  const isOwner = post.user_id === userId;
  const isAdmin = await this.rbac.hasRole(userId, 'admin');

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException();
  }

  return this.repository.delete(postId);
}
```

### 3. Implement Principle of Least Privilege

Grant minimum permissions necessary:

```typescript
// ✅ Good - Specific permission
@Post('publish')
@RequirePermission('posts.publish')

// ❌ Bad - Overly broad permission
@Post('publish')
@RequireRole('admin')
```

### 4. Use Role Hierarchies

```typescript
// Define clear role hierarchy
const roleHierarchy = {
  super_admin: ['admin', 'moderator', 'user'],
  admin: ['moderator', 'user'],
  moderator: ['user'],
  user: [],
};
```

### 5. Validate User Context

Always ensure user is authenticated before authorization:

```typescript
@Get('protected')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('resource.read')
async protectedEndpoint() {
  // AuthGuard runs first, PermissionsGuard second
}
```

### 6. Log Authorization Failures

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  try {
    // Authorization logic
  } catch (error) {
    this.logger.warn(`Authorization failed for user ${userId}: ${error.message}`);
    throw new ForbiddenException();
  }
}
```

### 7. Use Expiration for Temporary Access

```typescript
// Trial user - 14 days
await this.rbac.assignRole(userId, 'trial', addDays(new Date(), 14));

// Temporary admin - 1 hour
await this.rbac.assignRole(userId, 'temp_admin', addHours(new Date(), 1));
```

---

## Common Patterns

### Pattern 1: Resource Owner or Admin

```typescript
@Put(':id')
@RequireOwnership({ ownerField: 'user_id', allowAdminOverride: true })
async update(@Param('id') id: string, @Body() dto: UpdateDto) {
  // Only owner or super admin
}
```

### Pattern 2: Multiple Permissions (Any)

```typescript
@Get('dashboard')
@RequirePermission(['admin.view_dashboard', 'reports.view_dashboard'], {
  logic: PermissionLogic.OR,
})
async dashboard() {
  // Accessible to users with either permission
}
```

### Pattern 3: Role-Based Feature Flags

```typescript
@Get('beta-feature')
async betaFeature(@Request() req) {
  const hasBetaAccess = await this.rbac.hasRole(req.user.id, 'beta_tester');

  return {
    feature: hasBetaAccess ? this.getBetaContent() : this.getStandardContent(),
  };
}
```

### Pattern 4: Programmatic Permission Check

```typescript
async complexBusinessLogic(userId: string, resourceId: string) {
  // Get full user context
  const userContext = await this.rbac.getUserContext(userId);

  if (userContext.isSuperAdmin) {
    // Super admin bypass
    return this.performAction(resourceId);
  }

  // Check multiple conditions
  const hasPermission = await this.rbac.hasPermission(userId, 'resource.action');
  const ownsResource = await this.rbac.checkOwnership(userId, 'app', 'resources', resourceId, {
    ownerField: 'user_id',
  });

  if (!hasPermission && !ownsResource) {
    throw new ForbiddenException();
  }

  return this.performAction(resourceId);
}
```

### Pattern 5: Conditional Field Access

```typescript
async getUserProfile(viewerId: string, targetUserId: string) {
  const user = await this.findUser(targetUserId);

  // Check if viewer can see sensitive data
  const canViewSensitive = await this.rbac.hasAnyPermission(viewerId, [
    'users.view_all_fields',
    'admin.view_users',
  ]);

  return {
    id: user.id,
    name: user.name,
    email: canViewSensitive.granted ? user.email : undefined,
    phone: canViewSensitive.granted ? user.phone : undefined,
    salary: canViewSensitive.granted ? user.salary : undefined,
  };
}
```

---

## Troubleshooting

### Issue: Guards Not Enforcing Authorization

**Symptoms:** Endpoints accessible without proper permissions

**Solutions:**

1. **Check guard registration:**

```typescript
// Make sure guards are registered globally
app.useGlobalGuards(new PermissionsGuard(reflector));
```

2. **Check guard order:**

```typescript
// AuthGuard must run before PermissionsGuard
app.useGlobalGuards(
  new AuthGuard(), // First - authenticate user
  new PermissionsGuard(reflector), // Second - check permissions
);
```

3. **Verify decorator usage:**

```typescript
// Make sure decorator is applied
@RequirePermission('users.create') // ← This must be present
async createUser() {}
```

### Issue: User Always Denied Access

**Symptoms:** All requests return 403 Forbidden

**Solutions:**

1. **Check user authentication:**

```typescript
// Verify req.user exists and has id
const user = request.user;
if (!user || !user.id) {
  throw new UnauthorizedException('User not authenticated');
}
```

2. **Verify permissions in database:**

```sql
-- Check if user has permission
SELECT p.name
FROM rbac.permissions p
LEFT JOIN rbac.user_permissions up ON p.id = up.permission_id
LEFT JOIN rbac.role_permissions rp ON p.id = rp.permission_id
LEFT JOIN rbac.user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = 'user-123' OR up.user_id = 'user-123';
```

3. **Check cache staleness:**

```typescript
// Clear user cache
await cacheManager.del(`rbac:user:${userId}:*`);
```

### Issue: Cache Not Working

**Symptoms:** Slow permission checks, high database load

**Solutions:**

1. **Verify Redis connection:**

```typescript
// Test Redis connectivity
await cacheManager.set('test', 'value');
const value = await cacheManager.get('test');
console.log(value); // Should print 'value'
```

2. **Check cache configuration:**

```typescript
RBACModule.register({
  cache: {
    enabled: true, // ← Must be true
    ttl: 300,
    store: 'redis',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
});
```

3. **Monitor cache keys:**

```bash
# Redis CLI
redis-cli KEYS "rbac:*"
```

### Issue: Ownership Check Failing

**Symptoms:** Users can't access their own resources

**Solutions:**

1. **Verify owner field:**

```typescript
// Make sure ownerField matches database column
@RequireOwnership({ ownerField: 'user_id' }) // ← Check column name
```

2. **Check resource ID parameter:**

```typescript
// Verify :id parameter is being passed correctly
@Put(':id') // ← Parameter name
@RequireOwnership({ ownerField: 'user_id' })
async update(@Param('id') id: string) {} // ← Must match
```

3. **Test database query:**

```sql
SELECT user_id FROM app.posts WHERE id = 'post-123';
-- Verify user_id matches expected user
```

---

## Migration Guide

### Migrating from Custom Authorization

**Step 1:** Install RBAC system

```bash
nest-generator generate <table> --features.rbac=true
```

**Step 2:** Seed permissions and roles

```sql
-- Map existing permissions
INSERT INTO rbac.permissions (name, description, resource, action)
SELECT
  CONCAT(resource, '.', action) as name,
  description,
  resource,
  action
FROM legacy_permissions;

-- Map existing roles
INSERT INTO rbac.roles (name, description)
SELECT name, description FROM legacy_roles;
```

**Step 3:** Replace custom decorators

```typescript
// Before
@Roles('admin')
@UseGuards(RolesGuard)

// After
@RequireRole('admin')
```

**Step 4:** Replace custom service calls

```typescript
// Before
const hasAccess = await this.authService.checkPermission(userId, 'users.create');

// After
const hasAccess = await this.rbac.hasPermission(userId, 'users.create');
```

**Step 5:** Update guard registration

```typescript
// Before
app.useGlobalGuards(new CustomAuthGuard());

// After
const reflector = app.get(Reflector);
app.useGlobalGuards(new AuthGuard(), new PermissionsGuard(reflector), new RolesGuard(reflector));
```

### Breaking Changes

- `checkPermission()` → `hasPermission()`
- `checkRole()` → `hasRole()`
- Custom guard logic → Use decorators + built-in guards
- Permission format: Now requires `<resource>.<action>` pattern

---

## API Reference Table

| Method              | Parameters                                                                                   | Return Type                      | Description                 |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------- |
| `hasPermission`     | `userId: string, permission: string`                                                         | `Promise<boolean>`               | Check single permission     |
| `hasAllPermissions` | `userId: string, permissions: string[]`                                                      | `Promise<PermissionCheckResult>` | Check all permissions (AND) |
| `hasAnyPermission`  | `userId: string, permissions: string[]`                                                      | `Promise<PermissionCheckResult>` | Check any permission (OR)   |
| `hasRole`           | `userId: string, roleName: string, activeOnly?: boolean, checkExpiration?: boolean`          | `Promise<boolean>`               | Check single role           |
| `hasAllRoles`       | `userId: string, roles: string[]`                                                            | `Promise<RoleCheckResult>`       | Check all roles (AND)       |
| `hasAnyRole`        | `userId: string, roles: string[]`                                                            | `Promise<RoleCheckResult>`       | Check any role (OR)         |
| `getUserContext`    | `userId: string`                                                                             | `Promise<UserRBACContext>`       | Get full user RBAC context  |
| `assignRole`        | `userId: string, roleName: string, expiresAt?: Date`                                         | `Promise<void>`                  | Assign role to user         |
| `removeRole`        | `userId: string, roleName: string`                                                           | `Promise<void>`                  | Remove role from user       |
| `checkOwnership`    | `userId: string, schema: string, table: string, resourceId: string, config: OwnershipConfig` | `Promise<boolean>`               | Verify resource ownership   |
| `isSuperAdmin`      | `userId: string`                                                                             | `Promise<boolean>`               | Check super admin status    |
| `isAdmin`           | `userId: string`                                                                             | `Promise<boolean>`               | Check admin status          |

---

## Testing RBAC

### Unit Testing with Mocks

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RBACService } from './rbac.service';

describe('UsersController', () => {
  let controller: UsersController;
  let rbacService: jest.Mocked<RBACService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: RBACService,
          useValue: {
            hasPermission: jest.fn(),
            hasRole: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    rbacService = module.get(RBACService);
  });

  it('should allow access with permission', async () => {
    rbacService.hasPermission.mockResolvedValue(true);

    const result = await controller.createUser(createDto);
    expect(result).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('RBAC Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should deny access without permission', async () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send(createDto)
      .expect(403);
  });

  it('should allow access with permission', async () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createDto)
      .expect(201);
  });
});
```

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues:** https://github.com/ojiepermana/nest/issues
- **Documentation:** https://github.com/ojiepermana/nest/blob/main/libs/generator/README.md
- **NPM Package:** https://www.npmjs.com/package/@ojiepermana/nest-generator

---

## License

MIT License - See LICENSE file for details.
