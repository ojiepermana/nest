-- ================================================
-- RBAC (Role-Based Access Control) Schema
-- Database: MySQL 8.0+
-- Purpose: Complete RBAC system with permissions,
--          roles, hierarchies, and field-level access
-- ================================================

-- Create RBAC database (if separate)
-- CREATE DATABASE IF NOT EXISTS rbac;
-- USE rbac;

-- ================================================
-- 1. PERMISSIONS TABLE
-- ================================================
-- Stores all available permissions in the system
-- Permission Format: {resource}:{action}:{scope}[:{condition}]
CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(200) NOT NULL UNIQUE,            -- e.g., 'users:read:team', 'orders:approve:all'
  name VARCHAR(200) NOT NULL,                   -- Display name: 'View Team Users'
  resource VARCHAR(100) NOT NULL,               -- e.g., 'users', 'orders', 'products'
  action VARCHAR(50) NOT NULL,                  -- e.g., 'create', 'read', 'approve'
  scope VARCHAR(50) DEFAULT 'own',              -- 'own', 'team', 'department', 'all'
  conditions JSON DEFAULT '{}',                 -- Business rules: {"status": ["active"]}
  description TEXT,                             -- Human-readable description
  is_active BOOLEAN DEFAULT true,               -- Can be disabled
  is_system BOOLEAN DEFAULT false,              -- System-level permission (cannot be deleted)
  priority INT DEFAULT 0,                       -- Permission priority
  metadata JSON DEFAULT '{}',                   -- Additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_permissions_code (code),
  INDEX idx_permissions_resource (resource),
  INDEX idx_permissions_action (action),
  INDEX idx_permissions_scope (scope),
  INDEX idx_permissions_resource_action (resource, action),
  INDEX idx_permissions_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 2. ROLES TABLE
-- ================================================
-- Stores roles with hierarchy support
CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,            -- e.g., 'admin', 'editor', 'viewer'
  display_name VARCHAR(255) NOT NULL,           -- e.g., 'Administrator', 'Content Editor'
  description TEXT,                             -- Role purpose
  parent_role_id CHAR(36),                      -- For role hierarchy (inherits permissions)
  level INT DEFAULT 0,                          -- Hierarchy level (0 = top)
  is_system BOOLEAN DEFAULT false,              -- System role (cannot be deleted)
  is_active BOOLEAN DEFAULT true,               -- Can be disabled without deletion
  metadata JSON DEFAULT '{}',                   -- Custom attributes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign key for hierarchy
  CONSTRAINT fk_parent_role FOREIGN KEY (parent_role_id) 
    REFERENCES roles(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_roles_name (name),
  INDEX idx_roles_parent (parent_role_id),
  INDEX idx_roles_level (level),
  INDEX idx_roles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ================================================
-- Maps permissions to roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  granted_by CHAR(36),                          -- Who granted this permission
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,                    -- Optional expiration
  conditions JSON DEFAULT '{}',                 -- Permission conditions (field-level, time-based)
  
  -- Foreign keys
  CONSTRAINT fk_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_permission FOREIGN KEY (permission_id) 
    REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Prevent duplicate permission assignments
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id),
  
  -- Indexes
  INDEX idx_role_permissions_role (role_id),
  INDEX idx_role_permissions_permission (permission_id),
  INDEX idx_role_permissions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4. USER_ROLES TABLE (Many-to-Many)
-- ================================================
-- Assigns roles to users
CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,                    -- Reference to your users table
  role_id CHAR(36) NOT NULL,
  assigned_by CHAR(36),                         -- Who assigned this role
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,                    -- Optional expiration
  is_active BOOLEAN DEFAULT true,               -- Can be temporarily disabled
  scope JSON DEFAULT '{}',                      -- Role scope (organization, project, etc.)
  
  -- Foreign key to roles
  CONSTRAINT fk_role_assignment FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE CASCADE,
  
  -- Prevent duplicate role assignments per user
  CONSTRAINT unique_user_role UNIQUE(user_id, role_id),
  
  -- Indexes
  INDEX idx_user_roles_user (user_id),
  INDEX idx_user_roles_role (role_id),
  INDEX idx_user_roles_active (is_active),
  INDEX idx_user_roles_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. FIELD_PERMISSIONS TABLE
-- ================================================
-- Field-level access control (optional advanced feature)
CREATE TABLE IF NOT EXISTS field_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  resource VARCHAR(50) NOT NULL,                -- e.g., 'users', 'posts'
  field_name VARCHAR(100) NOT NULL,             -- e.g., 'email', 'salary', 'ssn'
  access_level VARCHAR(20) NOT NULL,            -- 'read', 'write', 'none'
  conditions JSON DEFAULT '{}',                 -- Additional conditions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT fk_field_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE CASCADE,
  
  -- Unique field permission per role
  CONSTRAINT unique_role_resource_field UNIQUE(role_id, resource, field_name),
  
  -- Indexes
  INDEX idx_field_permissions_role (role_id),
  INDEX idx_field_permissions_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6. PERMISSION_AUDIT TABLE
-- ================================================
-- Tracks permission check history for security auditing
CREATE TABLE IF NOT EXISTS permission_audit (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(50),
  granted BOOLEAN NOT NULL,                     -- Was permission granted?
  reason TEXT,                                  -- Why denied (if applicable)
  ip_address VARCHAR(45),                       -- IPv4 or IPv6
  user_agent TEXT,
  request_path TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_permission_audit_user (user_id),
  INDEX idx_permission_audit_permission (permission_name),
  INDEX idx_permission_audit_granted (granted),
  INDEX idx_permission_audit_time (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7. STORED PROCEDURES
-- ================================================

-- Procedure: Get all permissions for a user
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS get_user_permissions(IN p_user_id CHAR(36))
BEGIN
  SELECT DISTINCT
    p.code,
    p.name,
    p.resource,
    p.action,
    p.scope,
    r.name as via_role
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND p.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND (rp.expires_at IS NULL OR rp.expires_at > NOW())
    AND r.is_active = true;
END //

-- Function: Check if user has specific permission
CREATE FUNCTION IF NOT EXISTS has_permission(p_user_id CHAR(36), p_permission_code VARCHAR(200))
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE has_perm BOOLEAN;
  
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
      AND ur.is_active = true
      AND p.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND (rp.expires_at IS NULL OR rp.expires_at > NOW())
      AND r.is_active = true
  ) INTO has_perm;
  
  RETURN has_perm;
END //

-- Procedure: Get role hierarchy
CREATE PROCEDURE IF NOT EXISTS get_role_hierarchy(IN p_role_id CHAR(36))
BEGIN
  WITH RECURSIVE role_tree AS (
    -- Base case: the role itself
    SELECT id, name, level, parent_role_id
    FROM roles
    WHERE id = p_role_id
    
    UNION ALL
    
    -- Recursive case: parent roles
    SELECT r.id, r.name, r.level, r.parent_role_id
    FROM roles r
    JOIN role_tree rt ON r.id = rt.parent_role_id
  )
  SELECT id, name, level
  FROM role_tree
  ORDER BY level;
END //

DELIMITER ;

-- ================================================
-- 8. SEED DATA (Default Permissions & Roles)
-- ================================================

-- Insert default permissions (new format: resource:action:scope)
INSERT INTO permissions (code, name, resource, action, scope, description, is_system, priority) VALUES
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
  ('system:admin:all', 'System Admin', 'system', 'admin', 'all', 'Full system administration', true, 100)
ON DUPLICATE KEY UPDATE code=code;

-- Insert default roles
INSERT INTO roles (name, display_name, description, level, is_system) VALUES
  ('super_admin', 'Super Administrator', 'Full system access', 0, true),
  ('admin', 'Administrator', 'Administrative access', 1, true),
  ('manager', 'Manager', 'Team management access', 2, true),
  ('user', 'User', 'Standard user access', 3, true),
  ('viewer', 'Viewer', 'Read-only access', 4, true)
ON DUPLICATE KEY UPDATE name=name;

-- Assign permissions to super_admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND p.is_active = true
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to admin (all except system:admin:all)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.code != 'system:admin:all' AND p.is_active = true
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to manager (team-level permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager' AND p.scope IN ('own', 'team') AND p.is_active = true
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to user (own-level permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user' AND p.scope = 'own' AND p.is_active = true
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign read permissions to viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer' AND p.action = 'read' AND p.scope IN ('own', 'team') AND p.is_active = true
ON DUPLICATE KEY UPDATE role_id=role_id;

-- ================================================
-- SETUP COMPLETE
-- ================================================
