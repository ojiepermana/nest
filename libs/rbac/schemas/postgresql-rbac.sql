-- ================================================
-- RBAC (Role-Based Access Control) Schema
-- Database: PostgreSQL 18+
-- Purpose: Complete RBAC system with permissions,
--          roles, hierarchies, and field-level access
-- ================================================

-- Enable UUID v7 extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create RBAC schema
CREATE SCHEMA IF NOT EXISTS rbac;

-- ================================================
-- 1. PERMISSIONS TABLE
-- ================================================
-- Stores all available permissions in the system
-- Permission Format: {resource}:{action}:{scope}[:{condition}]
-- Examples: users:read:own, orders:approve:team:under-10k
CREATE TABLE IF NOT EXISTS rbac.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(200) NOT NULL UNIQUE,            -- e.g., 'users:read:team', 'orders:approve:all'
  name VARCHAR(200) NOT NULL,                   -- Display name: 'View Team Users'
  resource VARCHAR(100) NOT NULL,               -- e.g., 'users', 'posts', 'products', 'orders'
  action VARCHAR(50) NOT NULL,                  -- e.g., 'create', 'read', 'update', 'delete', 'approve'
  scope VARCHAR(50) DEFAULT 'own',              -- Scope: 'own', 'team', 'department', 'all'
  conditions JSONB DEFAULT '{}',                -- Business rules: {"status": ["active"], "amount_lte": 10000}
  description TEXT,                             -- Human-readable description
  is_active BOOLEAN DEFAULT true,               -- Can be disabled without deletion
  is_system BOOLEAN DEFAULT false,              -- System-level permission (cannot be deleted)
  priority INTEGER DEFAULT 0,                   -- Permission priority (higher = more specific)
  metadata JSONB DEFAULT '{}',                  -- Additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Indexes for fast permission lookups
CREATE INDEX idx_permissions_code ON rbac.permissions(code) WHERE is_active = true;
CREATE INDEX idx_permissions_resource ON rbac.permissions(resource);
CREATE INDEX idx_permissions_action ON rbac.permissions(action);
CREATE INDEX idx_permissions_scope ON rbac.permissions(scope);
CREATE INDEX idx_permissions_resource_action ON rbac.permissions(resource, action);
CREATE INDEX idx_permissions_priority ON rbac.permissions(priority DESC);

-- ================================================
-- 2. ROLES TABLE
-- ================================================
-- Stores roles with hierarchy support
CREATE TABLE IF NOT EXISTS rbac.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,            -- e.g., 'admin', 'editor', 'viewer'
  display_name VARCHAR(255) NOT NULL,           -- e.g., 'Administrator', 'Content Editor'
  description TEXT,                             -- Role purpose
  parent_role_id UUID,                          -- For role hierarchy (inherits permissions)
  level INTEGER DEFAULT 0,                      -- Hierarchy level (0 = top)
  is_system BOOLEAN DEFAULT false,              -- System role (cannot be deleted)
  is_active BOOLEAN DEFAULT true,               -- Can be disabled without deletion
  metadata JSONB DEFAULT '{}',                  -- Custom attributes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  
  -- Self-referential foreign key for hierarchy
  CONSTRAINT fk_parent_role FOREIGN KEY (parent_role_id) 
    REFERENCES rbac.roles(id) ON DELETE SET NULL
);

-- Indexes for role queries
CREATE INDEX idx_roles_name ON rbac.roles(name);
CREATE INDEX idx_roles_parent ON rbac.roles(parent_role_id);
CREATE INDEX idx_roles_level ON rbac.roles(level);
CREATE INDEX idx_roles_active ON rbac.roles(is_active);

-- ================================================
-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ================================================
-- Maps permissions to roles
CREATE TABLE IF NOT EXISTS rbac.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_by UUID,                              -- Who granted this permission
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,                         -- Optional expiration
  conditions JSONB DEFAULT '{}',                -- Permission conditions (field-level, time-based)
  
  -- Foreign keys
  CONSTRAINT fk_role FOREIGN KEY (role_id) 
    REFERENCES rbac.roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_permission FOREIGN KEY (permission_id) 
    REFERENCES rbac.permissions(id) ON DELETE CASCADE,
  
  -- Prevent duplicate permission assignments
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- Indexes for permission checks
CREATE INDEX idx_role_permissions_role ON rbac.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON rbac.role_permissions(permission_id);
CREATE INDEX idx_role_permissions_expires ON rbac.role_permissions(expires_at);

-- ================================================
-- 4. USER_ROLES TABLE (Many-to-Many)
-- ================================================
-- Assigns roles to users
CREATE TABLE IF NOT EXISTS rbac.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,                        -- Reference to your users table
  role_id UUID NOT NULL,
  assigned_by UUID,                             -- Who assigned this role
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,                         -- Optional expiration
  is_active BOOLEAN DEFAULT true,               -- Can be temporarily disabled
  scope JSONB DEFAULT '{}',                     -- Role scope (organization, project, etc.)
  
  -- Foreign key to roles
  CONSTRAINT fk_role_assignment FOREIGN KEY (role_id) 
    REFERENCES rbac.roles(id) ON DELETE CASCADE,
  
  -- Prevent duplicate role assignments per user
  CONSTRAINT unique_user_role UNIQUE(user_id, role_id)
);

-- Indexes for user permission lookups
CREATE INDEX idx_user_roles_user ON rbac.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON rbac.user_roles(role_id);
CREATE INDEX idx_user_roles_active ON rbac.user_roles(is_active);
CREATE INDEX idx_user_roles_expires ON rbac.user_roles(expires_at);

-- ================================================
-- 5. FIELD_PERMISSIONS TABLE
-- ================================================
-- Field-level access control (optional advanced feature)
CREATE TABLE IF NOT EXISTS rbac.field_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL,
  resource VARCHAR(50) NOT NULL,                -- e.g., 'users', 'posts'
  field_name VARCHAR(100) NOT NULL,             -- e.g., 'email', 'salary', 'ssn'
  access_level VARCHAR(20) NOT NULL,            -- 'read', 'write', 'none'
  conditions JSONB DEFAULT '{}',                -- Additional conditions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT fk_field_role FOREIGN KEY (role_id) 
    REFERENCES rbac.roles(id) ON DELETE CASCADE,
  
  -- Unique field permission per role
  CONSTRAINT unique_role_resource_field UNIQUE(role_id, resource, field_name)
);

-- Indexes for field permission checks
CREATE INDEX idx_field_permissions_role ON rbac.field_permissions(role_id);
CREATE INDEX idx_field_permissions_resource ON rbac.field_permissions(resource);

-- ================================================
-- 6. PERMISSION_AUDIT TABLE
-- ================================================
-- Tracks permission check history for security auditing
CREATE TABLE IF NOT EXISTS rbac.permission_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(50),
  granted BOOLEAN NOT NULL,                     -- Was permission granted?
  reason TEXT,                                  -- Why denied (if applicable)
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_permission_audit_user ON rbac.permission_audit(user_id);
CREATE INDEX idx_permission_audit_permission ON rbac.permission_audit(permission_name);
CREATE INDEX idx_permission_audit_granted ON rbac.permission_audit(granted);
CREATE INDEX idx_permission_audit_time ON rbac.permission_audit(checked_at);

-- ================================================
-- 7. HELPER FUNCTIONS
-- ================================================

-- Function: Get all permissions for a user (including inherited from roles)
CREATE OR REPLACE FUNCTION rbac.get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_code VARCHAR, permission_name VARCHAR, resource VARCHAR, action VARCHAR, scope VARCHAR, via_role VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.code,
    p.name,
    p.resource,
    p.action,
    p.scope,
    r.name as via_role
  FROM rbac.user_roles ur
  JOIN rbac.roles r ON ur.role_id = r.id
  JOIN rbac.role_permissions rp ON r.id = rp.role_id
  JOIN rbac.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    AND (rp.expires_at IS NULL OR rp.expires_at > CURRENT_TIMESTAMP)
    AND r.is_active = true
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user has specific permission
CREATE OR REPLACE FUNCTION rbac.has_permission(p_user_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM rbac.get_user_permissions(p_user_id)
    WHERE permission_code = p_permission_code
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Function: Get role hierarchy (with inherited roles)
CREATE OR REPLACE FUNCTION rbac.get_role_hierarchy(p_role_id UUID)
RETURNS TABLE(role_id UUID, role_name VARCHAR, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_tree AS (
    -- Base case: the role itself
    SELECT id, name, level, parent_role_id
    FROM rbac.roles
    WHERE id = p_role_id
    
    UNION ALL
    
    -- Recursive case: parent roles
    SELECT r.id, r.name, r.level, r.parent_role_id
    FROM rbac.roles r
    JOIN role_tree rt ON r.id = rt.parent_role_id
  )
  SELECT id, name, level
  FROM role_tree
  ORDER BY level;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. SEED DATA (Default Permissions & Roles)
-- ================================================

-- Insert default permissions (with new format: resource:action:scope)
INSERT INTO rbac.permissions (code, name, resource, action, scope, description, is_system, priority) VALUES
  -- User permissions
  ('users:create:basic', 'Create User', 'users', 'create', 'own', 'Create new user account', true, 10),
  ('users:read:own', 'View Own Profile', 'users', 'read', 'own', 'View own user profile', true, 10),
  ('users:read:team', 'View Team Users', 'users', 'read', 'team', 'View users in same team', true, 20),
  ('users:read:all', 'View All Users', 'users', 'read', 'all', 'View all users in system', true, 30),
  ('users:update:own', 'Update Own Profile', 'users', 'update', 'own', 'Update own user profile', true, 10),
  ('users:update:team', 'Update Team Users', 'users', 'update', 'team', 'Update users in same team', true, 20),
  ('users:update:all', 'Update All Users', 'users', 'update', 'all', 'Update any user', true, 30),
  ('users:delete:team', 'Delete Team Users', 'users', 'delete', 'team', 'Delete users in same team', true, 20),
  ('users:delete:all', 'Delete Any User', 'users', 'delete', 'all', 'Delete any user', true, 30),
  ('users:export:department', 'Export Department Users', 'users', 'export', 'department', 'Export users in department', true, 20),
  ('users:export:all', 'Export All Users', 'users', 'export', 'all', 'Export all users', true, 30),
  
  -- Role & Permission management
  ('roles:manage:all', 'Manage Roles', 'roles', 'manage', 'all', 'Manage roles and assignments', true, 50),
  ('permissions:manage:all', 'Manage Permissions', 'permissions', 'manage', 'all', 'Manage permission definitions', true, 50),
  
  -- System administration
  ('system:admin:all', 'System Admin', 'system', 'admin', 'all', 'Full system administration', true, 100)
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO rbac.roles (name, display_name, description, level, is_system) VALUES
  ('super_admin', 'Super Administrator', 'Full system access', 0, true),
  ('admin', 'Administrator', 'Administrative access', 1, true),
  ('manager', 'Manager', 'Team management access', 2, true),
  ('user', 'User', 'Standard user access', 3, true),
  ('viewer', 'Viewer', 'Read-only access', 4, true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to super_admin (all permissions)
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'super_admin' AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to admin (all except system:admin:all)
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'admin' AND p.code != 'system:admin:all' AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to manager (team-level permissions)
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'manager' 
  AND p.scope IN ('own', 'team') 
  AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to user (own-level permissions)
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'user' 
  AND p.scope = 'own'
  AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read permissions to viewer
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'viewer' 
  AND p.action = 'read' 
  AND p.scope IN ('own', 'team')
  AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to admin (all except system.admin)
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'admin' AND p.name != 'system.admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read permissions to viewer
INSERT INTO rbac.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM rbac.roles r
CROSS JOIN rbac.permissions p
WHERE r.name = 'viewer' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ================================================
-- 9. TRIGGERS
-- ================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION rbac.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permissions_update_timestamp
  BEFORE UPDATE ON rbac.permissions
  FOR EACH ROW
  EXECUTE FUNCTION rbac.update_timestamp();

CREATE TRIGGER roles_update_timestamp
  BEFORE UPDATE ON rbac.roles
  FOR EACH ROW
  EXECUTE FUNCTION rbac.update_timestamp();

-- ================================================
-- SETUP COMPLETE
-- ================================================

COMMENT ON SCHEMA rbac IS 'Role-Based Access Control (RBAC) system';
COMMENT ON TABLE rbac.permissions IS 'Available permissions in the system';
COMMENT ON TABLE rbac.roles IS 'User roles with hierarchy support';
COMMENT ON TABLE rbac.role_permissions IS 'Permission assignments to roles';
COMMENT ON TABLE rbac.user_roles IS 'Role assignments to users';
COMMENT ON TABLE rbac.field_permissions IS 'Field-level access control';
COMMENT ON TABLE rbac.permission_audit IS 'Permission check audit log';
