-- ================================================
-- RBAC Tables in USER Schema
-- Database: PostgreSQL 18+
-- Purpose: Complete RBAC system using user schema
-- ================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure user schema exists
CREATE SCHEMA IF NOT EXISTS "user";

-- ================================================
-- 1. PERMISSIONS TABLE
-- ================================================
-- Permission Format: {resource}:{action}:{scope}[:{condition}]
CREATE TABLE IF NOT EXISTS "user".permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(200) NOT NULL UNIQUE,            -- e.g., 'users:read:team', 'orders:approve:all'
  name VARCHAR(200) NOT NULL,                   -- Display name: 'View Team Users'
  resource VARCHAR(100) NOT NULL,               -- e.g., 'users', 'orders'
  action VARCHAR(50) NOT NULL,                  -- e.g., 'create', 'read', 'approve'
  scope VARCHAR(50) DEFAULT 'own',              -- 'own', 'team', 'department', 'all'
  conditions JSONB DEFAULT '{}',                -- Business rules
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,              -- Cannot be deleted
  priority INTEGER DEFAULT 0,                   -- Permission priority
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_user_permissions_code ON "user".permissions(code) WHERE is_active = true;
CREATE INDEX idx_user_permissions_resource ON "user".permissions(resource);
CREATE INDEX idx_user_permissions_action ON "user".permissions(action);
CREATE INDEX idx_user_permissions_scope ON "user".permissions(scope);
CREATE INDEX idx_user_permissions_resource_action ON "user".permissions(resource, action);
CREATE INDEX idx_user_permissions_priority ON "user".permissions(priority DESC);

-- ================================================
-- 2. ROLES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS "user".roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_role_id UUID,
  level INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  CONSTRAINT fk_parent_role FOREIGN KEY (parent_role_id) 
    REFERENCES "user".roles(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_roles_name ON "user".roles(name);
CREATE INDEX idx_user_roles_parent ON "user".roles(parent_role_id);
CREATE INDEX idx_user_roles_level ON "user".roles(level);
CREATE INDEX idx_user_roles_active ON "user".roles(is_active);

-- ================================================
-- 3. ROLE_PERMISSIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS "user".role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  conditions JSONB DEFAULT '{}',
  CONSTRAINT fk_role FOREIGN KEY (role_id) 
    REFERENCES "user".roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_permission FOREIGN KEY (permission_id) 
    REFERENCES "user".permissions(id) ON DELETE CASCADE,
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_user_role_permissions_role ON "user".role_permissions(role_id);
CREATE INDEX idx_user_role_permissions_permission ON "user".role_permissions(permission_id);
CREATE INDEX idx_user_role_permissions_expires ON "user".role_permissions(expires_at);

-- ================================================
-- 4. USER_ROLES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS "user".user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  scope JSONB DEFAULT '{}',
  CONSTRAINT fk_role_assignment FOREIGN KEY (role_id) 
    REFERENCES "user".roles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_role UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON "user".user_roles(user_id);
CREATE INDEX idx_user_roles_role ON "user".user_roles(role_id);
CREATE INDEX idx_user_roles_active ON "user".user_roles(is_active);
CREATE INDEX idx_user_roles_expires ON "user".user_roles(expires_at);

-- ================================================
-- 5. FIELD_PERMISSIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS "user".field_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL,
  resource VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  access_level VARCHAR(20) NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_field_role FOREIGN KEY (role_id) 
    REFERENCES "user".roles(id) ON DELETE CASCADE,
  CONSTRAINT unique_role_resource_field UNIQUE(role_id, resource, field_name)
);

CREATE INDEX idx_user_field_permissions_role ON "user".field_permissions(role_id);
CREATE INDEX idx_user_field_permissions_resource ON "user".field_permissions(resource);

-- ================================================
-- 6. PERMISSION_AUDIT TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS "user".permission_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  permission_name VARCHAR(100),
  role_name VARCHAR(100),
  result VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_permission_audit_user ON "user".permission_audit(user_id);
CREATE INDEX idx_user_permission_audit_action ON "user".permission_audit(action);
CREATE INDEX idx_user_permission_audit_result ON "user".permission_audit(result);
CREATE INDEX idx_user_permission_audit_created ON "user".permission_audit(created_at);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Get all permissions for a user (including inherited from roles)
CREATE OR REPLACE FUNCTION "user".get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_code VARCHAR, permission_name VARCHAR, resource VARCHAR, action VARCHAR, scope VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    p.code,
    p.name,
    p.resource,
    p.action,
    p.scope
  FROM "user".permissions p
  JOIN "user".role_permissions rp ON p.id = rp.permission_id
  JOIN "user".user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND p.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    AND (rp.expires_at IS NULL OR rp.expires_at > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION "user".has_permission(p_user_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user".get_user_permissions(p_user_id) WHERE permission_code = p_permission_code
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get role hierarchy
CREATE OR REPLACE FUNCTION "user".get_role_hierarchy(p_role_id UUID)
RETURNS TABLE(role_id UUID, role_name VARCHAR, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_tree AS (
    SELECT id, name, level, parent_role_id FROM "user".roles WHERE id = p_role_id
    UNION ALL
    SELECT r.id, r.name, r.level, r.parent_role_id
    FROM "user".roles r
    JOIN role_tree rt ON r.id = rt.parent_role_id
  )
  SELECT id, name, level FROM role_tree ORDER BY level;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- SEED DEFAULT DATA
-- ================================================

-- Insert default permissions (new format: resource:action:scope)
INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority) VALUES
  -- User permissions
  ('users:create:basic', 'Create User', 'users', 'create', 'own', 'Create new user account', true, 10),
  ('users:read:own', 'View Own Profile', 'users', 'read', 'own', 'View own user profile', true, 10),
  ('users:read:team', 'View Team Users', 'users', 'read', 'team', 'View users in same team', true, 20),
  ('users:read:all', 'View All Users', 'users', 'read', 'all', 'View all users', true, 30),
  ('users:update:own', 'Update Own Profile', 'users', 'update', 'own', 'Update own profile', true, 10),
  ('users:update:team', 'Update Team Users', 'users', 'update', 'team', 'Update team users', true, 20),
  ('users:update:all', 'Update All Users', 'users', 'update', 'all', 'Update any user', true, 30),
  ('users:delete:team', 'Delete Team Users', 'users', 'delete', 'team', 'Delete team users', true, 20),
  ('users:delete:all', 'Delete Any User', 'users', 'delete', 'all', 'Delete any user', true, 30),
  ('users:export:all', 'Export All Users', 'users', 'export', 'all', 'Export all users', true, 30),
  ('roles:manage:all', 'Manage Roles', 'roles', 'manage', 'all', 'Manage roles', true, 50),
  ('permissions:manage:all', 'Manage Permissions', 'permissions', 'manage', 'all', 'Manage permissions', true, 50),
  ('system:admin:all', 'System Admin', 'system', 'admin', 'all', 'Full system access', true, 100)
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO "user".roles (name, display_name, description, level, is_system) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions', 0, true),
  ('admin', 'Administrator', 'Administrative access', 1, true),
  ('manager', 'Manager', 'Team management access', 2, true),
  ('user', 'User', 'Standard user access', 3, true),
  ('viewer', 'Viewer', 'Read-only access', 4, true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO "user".role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM "user".roles r, "user".permissions p
WHERE r.name = 'super_admin' AND p.is_active = true  -- Super admin gets all permissions
ON CONFLICT DO NOTHING;

INSERT INTO "user".role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM "user".roles r, "user".permissions p
WHERE r.name = 'admin' AND p.code != 'system:admin:all' AND p.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO "user".role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM "user".roles r, "user".permissions p
WHERE r.name = 'manager' AND p.scope IN ('own', 'team') AND p.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO "user".role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM "user".roles r, "user".permissions p
WHERE r.name = 'user' AND p.scope = 'own' AND p.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO "user".role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM "user".roles r, "user".permissions p
WHERE r.name = 'viewer' AND p.action = 'read' AND p.scope IN ('own', 'team') AND p.is_active = true
ON CONFLICT DO NOTHING;

-- Create system user if doesn't exist in users table
INSERT INTO "user".users (id, username, email, full_name, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system@system.local',
  'System User',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- TRIGGERS
-- ================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION "user".update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permissions_timestamp
  BEFORE UPDATE ON "user".permissions
  FOR EACH ROW EXECUTE FUNCTION "user".update_timestamp();

CREATE TRIGGER update_roles_timestamp
  BEFORE UPDATE ON "user".roles
  FOR EACH ROW EXECUTE FUNCTION "user".update_timestamp();

-- ================================================
-- COMMENTS
-- ================================================
COMMENT ON SCHEMA "user" IS 'User management and RBAC system';
COMMENT ON TABLE "user".permissions IS 'System-wide permissions';
COMMENT ON TABLE "user".roles IS 'User roles with hierarchy support';
COMMENT ON TABLE "user".role_permissions IS 'Permission assignments to roles';
COMMENT ON TABLE "user".user_roles IS 'Role assignments to users';
COMMENT ON TABLE "user".field_permissions IS 'Field-level access control';
COMMENT ON TABLE "user".permission_audit IS 'Audit trail for permission checks';
