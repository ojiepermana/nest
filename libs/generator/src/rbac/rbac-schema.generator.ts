/**
 * RBAC Schema Generator
 *
 * Generates database schema for Role-Based Access Control system
 * including roles, permissions, and relationships.
 */

export interface RBACSchemaOptions {
  database: 'postgresql' | 'mysql';
  schemaName?: string;
  includeFieldPermissions?: boolean;
  includeRowLevelSecurity?: boolean;
}

export class RBACSchemaGenerator {
  private database: 'postgresql' | 'mysql';
  private schemaName: string;
  private includeFieldPermissions: boolean;
  private includeRowLevelSecurity: boolean;

  constructor(options: RBACSchemaOptions) {
    this.database = options.database;
    this.schemaName = options.schemaName || 'rbac';
    this.includeFieldPermissions = options.includeFieldPermissions ?? true;
    this.includeRowLevelSecurity = options.includeRowLevelSecurity ?? false;
  }

  /**
   * Generate complete RBAC schema
   */
  generate(): string {
    const parts: string[] = [];

    // Create schema
    parts.push(this.generateSchemaCreation());

    // Core tables
    parts.push(this.generateRolesTable());
    parts.push(this.generatePermissionsTable());
    parts.push(this.generateUserRolesTable());
    parts.push(this.generateRolePermissionsTable());

    // Optional tables
    if (this.includeFieldPermissions) {
      parts.push(this.generateFieldPermissionsTable());
    }

    if (this.includeRowLevelSecurity) {
      parts.push(this.generateRowLevelSecurityTable());
    }

    // Indexes
    parts.push(this.generateIndexes());

    // Helper functions
    parts.push(this.generateHelperFunctions());

    // Seed data
    parts.push(this.generateSeedData());

    return parts.join('\n\n');
  }

  private generateSchemaCreation(): string {
    if (this.database === 'postgresql') {
      return `-- Create RBAC schema
CREATE SCHEMA IF NOT EXISTS ${this.schemaName};`;
    }
    return `-- RBAC schema (MySQL uses database)`;
  }

  private generateRolesTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- Roles table
CREATE TABLE ${prefix}roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

COMMENT ON TABLE ${prefix}roles IS 'User roles for RBAC system';
COMMENT ON COLUMN ${prefix}roles.name IS 'Unique role identifier (e.g., admin, user, moderator)';
COMMENT ON COLUMN ${prefix}roles.is_system IS 'System roles cannot be deleted';
COMMENT ON COLUMN ${prefix}roles.priority IS 'Role priority for conflict resolution (higher = more priority)';`;
    } else {
      return `-- Roles table
CREATE TABLE ${prefix}roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generatePermissionsTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- Permissions table
CREATE TABLE ${prefix}permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(200) UNIQUE NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_resource_action UNIQUE (resource, action)
);

COMMENT ON TABLE ${prefix}permissions IS 'System permissions (e.g., users:create, posts:update)';
COMMENT ON COLUMN ${prefix}permissions.resource IS 'Resource type (e.g., users, posts, comments)';
COMMENT ON COLUMN ${prefix}permissions.action IS 'Action type (create, read, update, delete, manage)';
COMMENT ON COLUMN ${prefix}permissions.name IS 'Full permission name (resource:action)';`;
    } else {
      return `-- Permissions table
CREATE TABLE ${prefix}permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(200) UNIQUE NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT unique_resource_action UNIQUE (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generateUserRolesTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- User roles junction table
CREATE TABLE ${prefix}user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES ${prefix}roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,
  expires_at TIMESTAMP,
  metadata JSONB,
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

COMMENT ON TABLE ${prefix}user_roles IS 'Many-to-many relationship between users and roles';
COMMENT ON COLUMN ${prefix}user_roles.expires_at IS 'Optional expiration date for temporary role assignments';`;
    } else {
      return `-- User roles junction table
CREATE TABLE ${prefix}user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by CHAR(36),
  expires_at TIMESTAMP NULL,
  metadata JSON,
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id),
  FOREIGN KEY (role_id) REFERENCES ${prefix}roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generateRolePermissionsTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- Role permissions junction table
CREATE TABLE ${prefix}role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ${prefix}roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES ${prefix}permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID,
  metadata JSONB,
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE ${prefix}role_permissions IS 'Permissions granted to roles';`;
    } else {
      return `-- Role permissions junction table
CREATE TABLE ${prefix}role_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by CHAR(36),
  metadata JSON,
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES ${prefix}roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES ${prefix}permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generateFieldPermissionsTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- Field-level permissions table
CREATE TABLE ${prefix}field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ${prefix}roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_resource_field UNIQUE (role_id, resource, field_name)
);

COMMENT ON TABLE ${prefix}field_permissions IS 'Fine-grained field-level access control';
COMMENT ON COLUMN ${prefix}field_permissions.conditions IS 'Optional conditions for field access (e.g., only own records)';`;
    } else {
      return `-- Field-level permissions table
CREATE TABLE ${prefix}field_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_resource_field UNIQUE (role_id, resource, field_name),
  FOREIGN KEY (role_id) REFERENCES ${prefix}roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generateRowLevelSecurityTable(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    if (this.database === 'postgresql') {
      return `-- Row-level security policies
CREATE TABLE ${prefix}row_level_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ${prefix}roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  policy_name VARCHAR(200) NOT NULL,
  policy_type VARCHAR(50) NOT NULL, -- 'filter', 'validate'
  condition_sql TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_policy UNIQUE (role_id, resource, policy_name)
);

COMMENT ON TABLE ${prefix}row_level_policies IS 'Row-level security policies for filtering queries';
COMMENT ON COLUMN ${prefix}row_level_policies.condition_sql IS 'SQL WHERE clause for row filtering';`;
    } else {
      return `-- Row-level security policies
CREATE TABLE ${prefix}row_level_policies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  policy_name VARCHAR(200) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  condition_sql TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_policy UNIQUE (role_id, resource, policy_name),
  FOREIGN KEY (role_id) REFERENCES ${prefix}roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }
  }

  private generateIndexes(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    return `-- Indexes for performance
CREATE INDEX idx_roles_name ON ${prefix}roles(name);
CREATE INDEX idx_roles_is_active ON ${prefix}roles(is_active);
CREATE INDEX idx_permissions_resource ON ${prefix}permissions(resource);
CREATE INDEX idx_permissions_action ON ${prefix}permissions(action);
CREATE INDEX idx_permissions_name ON ${prefix}permissions(name);
CREATE INDEX idx_user_roles_user_id ON ${prefix}user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON ${prefix}user_roles(role_id);
CREATE INDEX idx_user_roles_expires_at ON ${prefix}user_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_role_permissions_role_id ON ${prefix}role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON ${prefix}role_permissions(permission_id);
${
  this.includeFieldPermissions
    ? `CREATE INDEX idx_field_permissions_role_id ON ${prefix}field_permissions(role_id);
CREATE INDEX idx_field_permissions_resource ON ${prefix}field_permissions(resource);`
    : ''
}
${
  this.includeRowLevelSecurity
    ? `CREATE INDEX idx_row_policies_role_id ON ${prefix}row_level_policies(role_id);
CREATE INDEX idx_row_policies_resource ON ${prefix}row_level_policies(resource);`
    : ''
}`;
  }

  private generateHelperFunctions(): string {
    if (this.database === 'postgresql') {
      const prefix = `${this.schemaName}.`;

      return `-- Helper function: Check if user has permission
CREATE OR REPLACE FUNCTION ${this.schemaName}.user_has_permission(
  p_user_id UUID,
  p_permission_name VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM ${prefix}user_roles ur
    JOIN ${prefix}role_permissions rp ON ur.role_id = rp.role_id
    JOIN ${prefix}permissions p ON rp.permission_id = p.id
    JOIN ${prefix}roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
      AND r.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- Helper function: Get user permissions
CREATE OR REPLACE FUNCTION ${this.schemaName}.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_name VARCHAR,
  resource VARCHAR,
  action VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.name,
    p.resource,
    p.action
  FROM ${prefix}user_roles ur
  JOIN ${prefix}role_permissions rp ON ur.role_id = rp.role_id
  JOIN ${prefix}permissions p ON rp.permission_id = p.id
  JOIN ${prefix}roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ORDER BY p.name;
END;
$$;

-- Helper function: Get user roles
CREATE OR REPLACE FUNCTION ${this.schemaName}.get_user_roles(p_user_id UUID)
RETURNS TABLE (
  role_id UUID,
  role_name VARCHAR,
  role_priority INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.priority
  FROM ${prefix}user_roles ur
  JOIN ${prefix}roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ORDER BY r.priority DESC;
END;
$$;`;
    }

    return `-- Helper functions not available for MySQL
-- Use application-level permission checks instead`;
  }

  private generateSeedData(): string {
    const prefix = this.database === 'postgresql' ? `${this.schemaName}.` : '';

    return `-- Seed data: Default roles
INSERT INTO ${prefix}roles (name, display_name, description, is_system, priority) VALUES
  ('super_admin', 'Super Administrator', 'Full system access', true, 1000),
  ('admin', 'Administrator', 'Administrative access', true, 500),
  ('user', 'User', 'Regular user access', true, 100),
  ('guest', 'Guest', 'Limited access', true, 0)
ON CONFLICT (name) DO NOTHING;

-- Seed data: Default permissions
INSERT INTO ${prefix}permissions (resource, action, name, display_name, description, is_system) VALUES
  -- User permissions
  ('users', 'create', 'users:create', 'Create Users', 'Can create new users', true),
  ('users', 'read', 'users:read', 'Read Users', 'Can view users', true),
  ('users', 'update', 'users:update', 'Update Users', 'Can update users', true),
  ('users', 'delete', 'users:delete', 'Delete Users', 'Can delete users', true),
  ('users', 'manage', 'users:manage', 'Manage Users', 'Full user management', true),
  
  -- Role permissions
  ('roles', 'create', 'roles:create', 'Create Roles', 'Can create roles', true),
  ('roles', 'read', 'roles:read', 'Read Roles', 'Can view roles', true),
  ('roles', 'update', 'roles:update', 'Update Roles', 'Can update roles', true),
  ('roles', 'delete', 'roles:delete', 'Delete Roles', 'Can delete roles', true),
  ('roles', 'manage', 'roles:manage', 'Manage Roles', 'Full role management', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin
INSERT INTO ${prefix}role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM ${prefix}roles r
CROSS JOIN ${prefix}permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read-only permissions to user role
INSERT INTO ${prefix}role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM ${prefix}roles r
JOIN ${prefix}permissions p ON p.action = 'read'
WHERE r.name = 'user'
ON CONFLICT (role_id, permission_id) DO NOTHING;`;
  }
}
