# RBAC Database Schemas

This directory contains SQL schema files for setting up Role-Based Access Control (RBAC) in your database.

## Quick Setup

### PostgreSQL

```bash
psql -U postgres -d your_database -f postgresql-rbac.sql
```

### MySQL

```bash
mysql -u root -p your_database < mysql-rbac.sql
```

## Schema Overview

The RBAC system consists of 6 core tables:

### 1. **permissions** - Available Permissions
- Stores all system permissions
- Format: `resource.action` (e.g., `users.create`, `posts.read`)
- System permissions cannot be deleted

### 2. **roles** - User Roles
- Defines roles with hierarchy support
- Parent roles inherit permissions from child roles
- Supports role levels (0 = highest)

### 3. **role_permissions** - Permission Assignments
- Maps permissions to roles (many-to-many)
- Supports expiration dates
- Tracks who granted each permission

### 4. **user_roles** - User Role Assignments
- Assigns roles to users (many-to-many)
- Supports expiration and scope
- Can be temporarily disabled

### 5. **field_permissions** - Field-Level Access
- Controls access to specific fields
- Supports read/write/none levels
- Applied per role and resource

### 6. **permission_audit** - Audit Trail
- Logs all permission checks
- Tracks granted/denied access
- Includes IP, user agent, and request path

## Default Data

Both schemas include seed data:

### Permissions
- `users.*` - User CRUD operations
- `roles.manage` - Role management
- `permissions.manage` - Permission management
- `system.admin` - Full system access

### Roles
- **super_admin** (Level 0) - All permissions
- **admin** (Level 1) - All except system.admin
- **editor** (Level 2) - Content editing (to be configured)
- **viewer** (Level 3) - Read-only access

## Helper Functions/Procedures

### PostgreSQL Functions

```sql
-- Get all permissions for a user
SELECT * FROM rbac.get_user_permissions('user-uuid-here');

-- Check if user has permission
SELECT rbac.has_permission('user-uuid-here', 'users.create');

-- Get role hierarchy
SELECT * FROM rbac.get_role_hierarchy('role-uuid-here');
```

### MySQL Stored Procedures

```sql
-- Get all permissions for a user
CALL get_user_permissions('user-uuid-here');

-- Check if user has permission
SELECT has_permission('user-uuid-here', 'users.create');

-- Get role hierarchy
CALL get_role_hierarchy('role-uuid-here');
```

## Usage Examples

### Assign Role to User

```sql
-- PostgreSQL
INSERT INTO rbac.user_roles (user_id, role_id, assigned_by)
VALUES ('user-uuid', 'role-uuid', 'admin-uuid');

-- MySQL
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES ('user-uuid', 'role-uuid', 'admin-uuid');
```

### Grant Permission to Role

```sql
-- PostgreSQL
INSERT INTO rbac.role_permissions (role_id, permission_id, granted_by)
VALUES ('role-uuid', 'permission-uuid', 'admin-uuid');

-- MySQL
INSERT INTO role_permissions (role_id, permission_id, granted_by)
VALUES ('role-uuid', 'permission-uuid', 'admin-uuid');
```

### Check User Permissions

```sql
-- PostgreSQL
SELECT * FROM rbac.get_user_permissions('user-uuid');

-- MySQL
CALL get_user_permissions('user-uuid');
```

## Advanced Features

### Role Hierarchy
Roles can inherit from parent roles:

```sql
-- Create a role hierarchy
-- super_admin (0)
--   └── admin (1)
--       └── editor (2)
--           └── viewer (3)

UPDATE roles SET parent_role_id = 'super-admin-uuid', level = 1 
WHERE name = 'admin';
```

### Time-Based Permissions

```sql
-- Grant temporary role (expires in 30 days)
INSERT INTO user_roles (user_id, role_id, expires_at)
VALUES ('user-uuid', 'role-uuid', NOW() + INTERVAL '30 days');
```

### Field-Level Permissions

```sql
-- Restrict salary field to admin only
INSERT INTO field_permissions (role_id, resource, field_name, access_level)
VALUES ('viewer-role-uuid', 'users', 'salary', 'none');
```

## Migration Guide

If you already have users, connect the RBAC system:

```sql
-- Example: Assign all existing users a default role
INSERT INTO user_roles (user_id, role_id)
SELECT id, (SELECT id FROM roles WHERE name = 'viewer')
FROM your_users_table
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = your_users_table.id
);
```

## Security Considerations

1. **System Permissions**: Cannot be deleted (is_system = true)
2. **Audit Trail**: All permission checks are logged
3. **Expiration**: Roles and permissions support expiration dates
4. **Soft Disable**: Roles can be disabled without deletion
5. **Hierarchy**: Use role levels to enforce permission inheritance

## Troubleshooting

### PostgreSQL: UUID Extension Not Found
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### MySQL: UUID() Function Not Available
Requires MySQL 8.0+. For older versions:
```sql
-- Use CHAR(36) and generate UUIDs in application code
```

### Permission Check Returns False
1. Verify role is active: `is_active = true`
2. Check expiration: `expires_at IS NULL OR expires_at > NOW()`
3. Verify permission exists in role_permissions
4. Check user_roles assignment

## Next Steps

After running the schema:

1. ✅ Run the SQL file for your database
2. ✅ Verify tables were created
3. ✅ Test helper functions
4. ✅ Configure your NestJS application to use RBAC
5. ✅ Generate RBAC-enabled modules with `--features.rbac=true`

For full integration guide, see:
- `/docs/generator/rbac/RBAC_GUIDE.md`
- `/docs/generator/quickstart/RBAC_QUICKSTART.md`
