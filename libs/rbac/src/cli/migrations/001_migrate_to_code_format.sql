-- ================================================
-- RBAC Permission Migration
-- From: name format (table.action)
-- To: code format (resource:action:scope)
-- 
-- Database: PostgreSQL 18+
-- Schema: user
-- ================================================

-- ================================================
-- STEP 1: Add New Columns (if not exists)
-- ================================================

-- Add code column
ALTER TABLE "user".permissions 
ADD COLUMN IF NOT EXISTS code VARCHAR(200);

-- Add scope column
ALTER TABLE "user".permissions 
ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'all';

-- Add conditions column
ALTER TABLE "user".permissions 
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';

-- Add priority column
ALTER TABLE "user".permissions 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Add is_active column (if not exists)
ALTER TABLE "user".permissions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ================================================
-- STEP 2: Migrate Existing Data
-- ================================================

-- Convert old format (table.action) to new format (resource:action:scope)
-- Example: users.create → users:create:basic
--          users.read → users:read:all
--          users.update → users:update:all
--          users.delete → users:delete:all

UPDATE "user".permissions
SET 
  code = CASE
    -- Special cases first
    WHEN name LIKE '%.manage' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.admin' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.export' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.import' THEN REPLACE(name, '.', ':') || ':all'
    
    -- Standard CRUD operations
    WHEN name LIKE '%.create' THEN REPLACE(name, '.', ':') || ':basic'
    WHEN name LIKE '%.read' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.list' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.update' THEN REPLACE(name, '.', ':') || ':all'
    WHEN name LIKE '%.delete' THEN REPLACE(name, '.', ':') || ':all'
    
    -- Fallback: any other format
    ELSE REPLACE(name, '.', ':') || ':all'
  END,
  scope = CASE
    WHEN name LIKE '%.create' THEN 'own'
    WHEN name LIKE '%.manage' THEN 'all'
    WHEN name LIKE '%.admin' THEN 'all'
    WHEN name LIKE '%.export' THEN 'all'
    WHEN name LIKE '%.import' THEN 'all'
    ELSE 'all'
  END,
  priority = CASE
    WHEN name LIKE '%.create' THEN 10
    WHEN name LIKE '%.read' THEN 30
    WHEN name LIKE '%.list' THEN 30
    WHEN name LIKE '%.update' THEN 30
    WHEN name LIKE '%.delete' THEN 30
    WHEN name LIKE '%.manage' THEN 50
    WHEN name LIKE '%.admin' THEN 100
    ELSE 10
  END
WHERE code IS NULL OR code = '';

-- ================================================
-- STEP 3: Create Unique Constraint on Code
-- ================================================

-- Remove old unique constraint on name (if exists)
ALTER TABLE "user".permissions 
DROP CONSTRAINT IF EXISTS permissions_name_key;

-- Remove old unique constraint on resource+action (if exists)
ALTER TABLE "user".permissions 
DROP CONSTRAINT IF EXISTS unique_resource_action;

-- Add unique constraint on code
ALTER TABLE "user".permissions 
ADD CONSTRAINT permissions_code_key UNIQUE (code);

-- ================================================
-- STEP 4: Update Indexes
-- ================================================

-- Drop old indexes
DROP INDEX IF EXISTS "user".idx_user_permissions_name;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_code ON "user".permissions(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON "user".permissions(scope);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource_action ON "user".permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_priority ON "user".permissions(priority DESC);

-- ================================================
-- STEP 5: Make Code NOT NULL (after migration)
-- ================================================

-- Update any remaining NULL codes
UPDATE "user".permissions
SET code = REPLACE(name, '.', ':') || ':all'
WHERE code IS NULL;

-- Make code NOT NULL
ALTER TABLE "user".permissions 
ALTER COLUMN code SET NOT NULL;

-- ================================================
-- STEP 6: Expand Existing Permissions with Scopes
-- ================================================

-- For each existing permission, create scoped variants
-- Example: users:read:all → also create users:read:own, users:read:team

-- Insert scoped variants for read operations
INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':own' as code,
  'View Own ' || INITCAP(resource) as name,
  resource,
  action,
  'own' as scope,
  'View own ' || resource || ' records' as description,
  false as is_system,
  10 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'read' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':team' as code,
  'View Team ' || INITCAP(resource) as name,
  resource,
  action,
  'team' as scope,
  'View team ' || resource || ' records' as description,
  false as is_system,
  20 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'read' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

-- Insert scoped variants for update operations
INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':own' as code,
  'Update Own ' || INITCAP(resource) as name,
  resource,
  action,
  'own' as scope,
  'Update own ' || resource || ' records' as description,
  false as is_system,
  10 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'update' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':team' as code,
  'Update Team ' || INITCAP(resource) as name,
  resource,
  action,
  'team' as scope,
  'Update team ' || resource || ' records' as description,
  false as is_system,
  20 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'update' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

-- Insert scoped variants for delete operations
INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':own' as code,
  'Delete Own ' || INITCAP(resource) as name,
  resource,
  action,
  'own' as scope,
  'Delete own ' || resource || ' records' as description,
  false as is_system,
  10 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'delete' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

INSERT INTO "user".permissions (code, name, resource, action, scope, description, is_system, priority, is_active)
SELECT 
  resource || ':' || action || ':team' as code,
  'Delete Team ' || INITCAP(resource) as name,
  resource,
  action,
  'team' as scope,
  'Delete team ' || resource || ' records' as description,
  false as is_system,
  20 as priority,
  true as is_active
FROM "user".permissions
WHERE action = 'delete' AND scope = 'all'
ON CONFLICT (code) DO NOTHING;

-- ================================================
-- STEP 7: Update Helper Functions
-- ================================================

-- Drop old function
DROP FUNCTION IF EXISTS "user".has_permission(UUID, VARCHAR);

-- Create new function with code parameter
CREATE OR REPLACE FUNCTION "user".has_permission(p_user_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user".get_user_permissions(p_user_id) WHERE permission_code = p_permission_code
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Uncomment to verify migration
/*
-- Check all permissions have codes
SELECT COUNT(*) as total_permissions, 
       COUNT(code) as with_code,
       COUNT(*) - COUNT(code) as missing_code
FROM "user".permissions;

-- View sample of old vs new format
SELECT 
  name as old_format,
  code as new_format,
  scope,
  priority,
  is_active
FROM "user".permissions
LIMIT 20;

-- Check for duplicates
SELECT code, COUNT(*) 
FROM "user".permissions 
GROUP BY code 
HAVING COUNT(*) > 1;

-- View scope distribution
SELECT scope, COUNT(*) 
FROM "user".permissions 
GROUP BY scope 
ORDER BY COUNT(*) DESC;
*/

-- ================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ================================================

/*
-- To rollback this migration:

-- 1. Drop new columns
ALTER TABLE "user".permissions DROP COLUMN IF EXISTS code;
ALTER TABLE "user".permissions DROP COLUMN IF EXISTS scope;
ALTER TABLE "user".permissions DROP COLUMN IF EXISTS conditions;
ALTER TABLE "user".permissions DROP COLUMN IF EXISTS priority;

-- 2. Restore old indexes
CREATE INDEX idx_user_permissions_name ON "user".permissions(name);

-- 3. Restore old unique constraint
ALTER TABLE "user".permissions ADD CONSTRAINT unique_resource_action UNIQUE(resource, action);

-- 4. Delete scoped variant permissions
DELETE FROM "user".permissions 
WHERE is_system = false 
  AND (scope IN ('own', 'team', 'department') OR code LIKE '%:own' OR code LIKE '%:team');
*/
