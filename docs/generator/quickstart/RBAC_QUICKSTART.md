# RBAC Quick Start Guide

Get Role-Based Access Control (RBAC) running in **10 minutes**.

## Prerequisites

- Node.js 24+
- npm 11+
- NestJS 11+
- Database (PostgreSQL 18+ or MySQL 8+)

## Step 1: Database Setup (2 min)

Create RBAC tables:

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE rbac.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE rbac.role_permissions (
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES rbac.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE rbac.user_roles (
  user_id UUID NOT NULL,
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);
```

**MySQL:**

```sql
-- Create permissions table
CREATE TABLE rbac_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE rbac_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE rbac_role_permissions (
  role_id CHAR(36),
  permission_id CHAR(36),
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE
);

-- User-Role mapping
CREATE TABLE rbac_user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by CHAR(36),
  expires_at TIMESTAMP NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE
);
```

## Step 2: Seed Initial Data (1 min)

```sql
-- Create basic permissions
INSERT INTO rbac.permissions (name, resource, action, description) VALUES
  ('users:create', 'users', 'create', 'Create users'),
  ('users:read', 'users', 'read', 'Read users'),
  ('users:update', 'users', 'update', 'Update users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('posts:create', 'posts', 'create', 'Create posts'),
  ('posts:read', 'posts', 'read', 'Read posts'),
  ('posts:update', 'posts', 'update', 'Update posts'),
  ('posts:delete', 'posts', 'delete', 'Delete posts');

-- Create basic roles
INSERT INTO rbac.roles (name, description, is_super_admin) VALUES
  ('admin', 'Administrator with full access', true),
  ('editor', 'Can create and edit content', false),
  ('viewer', 'Can only view content', false);

-- Assign permissions to roles
-- Admin: all permissions
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM rbac.roles r, rbac.permissions p WHERE r.name = 'admin';

-- Editor: create, read, update posts
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM rbac.roles r, rbac.permissions p 
WHERE r.name = 'editor' AND p.name IN ('posts:create', 'posts:read', 'posts:update', 'users:read');

-- Viewer: read only
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM rbac.roles r, rbac.permissions p 
WHERE r.name = 'viewer' AND p.name IN ('posts:read', 'users:read');
```

## Step 3: Generate Module with RBAC (1 min)

```bash
nest-generator generate users.profile --features.rbac=true
```

This generates:

```
src/modules/users-profile/
├── rbac/
│   ├── rbac.service.ts          # RBAC service
│   ├── rbac.guard.ts            # Permission/role guard
│   ├── rbac.decorator.ts        # @RequirePermission, @RequireRole
│   └── rbac.module.ts           # RBAC module
├── users-profile.controller.ts  # With RBAC decorators
└── users-profile.module.ts      # Imports RbacModule
```

## Step 4: Use in Controller (2 min)

The generated controller already includes RBAC decorators:

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { RbacGuard } from './rbac/rbac.guard';
import { RequirePermission, RequireRole } from './rbac/rbac.decorator';

@Controller('users/profile')
@UseGuards(RbacGuard)
export class UsersProfileController {
  
  // Require specific permission
  @Get()
  @RequirePermission('users:read')
  async findAll() {
    return this.service.findAll();
  }

  // Require multiple permissions (AND logic)
  @Post()
  @RequirePermission(['users:create', 'users:read'], 'AND')
  async create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  // Require any permission (OR logic)
  @Put(':id')
  @RequirePermission(['users:update', 'posts:update'], 'OR')
  async update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto);
  }

  // Require specific role
  @Delete(':id')
  @RequireRole('admin')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // Require multiple roles (OR logic)
  @Get('stats')
  @RequireRole(['admin', 'editor'], 'OR')
  async getStats() {
    return this.service.getStatistics();
  }
}
```

## Step 5: Assign Roles to Users (1 min)

```typescript
import { Injectable } from '@nestjs/common';
import { RbacService } from './rbac/rbac.service';

@Injectable()
export class UsersService {
  constructor(private readonly rbacService: RbacService) {}

  async assignRole(userId: string, roleName: string) {
    return this.rbacService.assignRole(userId, roleName);
  }

  async assignRoleWithExpiry(userId: string, roleName: string, expiresAt: Date) {
    return this.rbacService.assignRole(userId, roleName, expiresAt);
  }

  async removeRole(userId: string, roleName: string) {
    return this.rbacService.removeRole(userId, roleName);
  }

  async getUserRoles(userId: string) {
    return this.rbacService.getUserRoles(userId);
  }
}
```

## Step 6: Programmatic Permission Check (1 min)

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { RbacService } from './rbac/rbac.service';

@Injectable()
export class PostsService {
  constructor(private readonly rbacService: RbacService) {}

  async publish(userId: string, postId: string) {
    // Check single permission
    const canPublish = await this.rbacService.hasPermission(userId, 'posts:publish');
    if (!canPublish) {
      throw new ForbiddenException('You do not have permission to publish posts');
    }

    // Check multiple permissions (AND)
    const hasAll = await this.rbacService.hasAllPermissions(userId, [
      'posts:publish',
      'posts:update'
    ]);

    // Check any permission (OR)
    const hasAny = await this.rbacService.hasAnyPermission(userId, [
      'posts:publish',
      'posts:admin'
    ]);

    // Check role
    const isAdmin = await this.rbacService.hasRole(userId, 'admin');

    // Your business logic here
    return this.postsRepository.publish(postId);
  }
}
```

## Step 7: Test Your RBAC (2 min)

```bash
# Start your application
npm run start:dev

# Test endpoint without authentication
curl http://localhost:3000/users/profile
# Response: 403 Forbidden

# Assign admin role to user (via your admin panel or direct DB)
INSERT INTO rbac.user_roles (user_id, role_id)
VALUES ('your-user-id', (SELECT id FROM rbac.roles WHERE name = 'admin'));

# Test with authenticated user (with admin role)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/users/profile
# Response: 200 OK with data
```

## Common Patterns

### 1. Ownership Check with RBAC

```typescript
@Put(':id')
@RequirePermission('users:update')
async update(@Param('id') id: string, @Req() req, @Body() dto: UpdateDto) {
  const userId = req.user.id;
  const isOwner = await this.rbacService.isOwner(userId, 'users', id);
  const isAdmin = await this.rbacService.hasRole(userId, 'admin');
  
  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You can only update your own profile');
  }
  
  return this.service.update(id, dto);
}
```

### 2. Field-Level Permissions

```typescript
@Get(':id')
@RequirePermission('users:read')
async findOne(@Param('id') id: string, @Req() req) {
  const user = await this.service.findOne(id);
  
  // Filter sensitive fields based on permissions
  const canViewEmail = await this.rbacService.hasPermission(req.user.id, 'users:view_email');
  const canViewPhone = await this.rbacService.hasPermission(req.user.id, 'users:view_phone');
  
  return {
    ...user,
    email: canViewEmail ? user.email : undefined,
    phone: canViewPhone ? user.phone : undefined,
  };
}
```

### 3. Custom Permission Logic

```typescript
// Create custom permissions
await this.rbacService.createPermission({
  name: 'posts:publish',
  resource: 'posts',
  action: 'publish',
  description: 'Publish posts to public'
});

// Create custom role
await this.rbacService.createRole({
  name: 'publisher',
  description: 'Can publish posts',
  permissions: ['posts:create', 'posts:read', 'posts:update', 'posts:publish']
});
```

## Troubleshooting

### ❌ Error: "No role found for user"

**Solution**: Ensure user has at least one role assigned:

```sql
SELECT * FROM rbac.user_roles WHERE user_id = 'your-user-id';
```

If empty, assign a role:

```sql
INSERT INTO rbac.user_roles (user_id, role_id)
VALUES ('your-user-id', (SELECT id FROM rbac.roles WHERE name = 'viewer'));
```

### ❌ Error: "Permission denied"

**Solution**: Check user's permissions:

```typescript
const permissions = await this.rbacService.getUserPermissions(userId);
console.log('User permissions:', permissions);
```

Ensure the required permission exists:

```sql
SELECT * FROM rbac.permissions WHERE name = 'users:read';
```

### ❌ Error: "RbacGuard is not working"

**Solution**: Ensure guard is applied:

```typescript
@Controller('users')
@UseGuards(RbacGuard)  // ← Must be here!
export class UsersController {}
```

And RBAC module is imported:

```typescript
@Module({
  imports: [RbacModule],  // ← Must import!
  controllers: [UsersController],
})
export class UsersModule {}
```

## Next Steps

- **Full Documentation**: [RBAC_GUIDE.md](../rbac/RBAC_GUIDE.md)
- **Permission Management**: Add/remove permissions dynamically
- **Role Hierarchy**: Implement role inheritance
- **Caching**: Enable Redis caching for performance
- **Field-Level Control**: Implement fine-grained field access
- **Audit Integration**: Track RBAC changes with audit trail

## Quick Reference

```typescript
// Decorators
@RequirePermission('resource:action')
@RequirePermission(['perm1', 'perm2'], 'AND')
@RequireRole('admin')
@RequireRole(['admin', 'editor'], 'OR')
@RequireOwnership('users')

// Service Methods
rbacService.hasPermission(userId, permission)
rbacService.hasAllPermissions(userId, permissions)
rbacService.hasAnyPermission(userId, permissions)
rbacService.hasRole(userId, role)
rbacService.assignRole(userId, role, expiresAt?)
rbacService.removeRole(userId, role)
rbacService.getUserPermissions(userId)
rbacService.getUserRoles(userId)
rbacService.isOwner(userId, entityType, entityId)
```

**Total Time: ~10 minutes** ✅
