/**
 * Core RBAC Interfaces
 *
 * Type definitions for RBAC entities and operations
 */

/**
 * Permission entity from database
 *
 * Format: {resource}:{action}:{scope}[:{condition}]
 * Examples:
 * - users:create:basic
 * - users:read:own
 * - users:read:team
 * - orders:approve:team:under-10k
 */
export interface Permission {
  id: string;
  code: string; // Primary identifier: "users:read:team"
  name: string; // Display name: "View Team Users"
  resource: string; // Resource type: "users", "orders"
  action: string; // Action: "create", "read", "update", "delete", "approve"
  scope?: string; // Scope: "own", "team", "department", "all"
  conditions?: Record<string, any>; // Business rules: {status: ["active"], amount_lte: 10000}
  description?: string;
  is_active: boolean;
  is_system: boolean; // System permission (cannot be deleted)
  priority: number; // Permission priority (higher = more important)
  metadata?: Record<string, any>; // Additional data
  created_at: Date;
  updated_at: Date;
}

/**
 * Role entity from database
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User-Role assignment entity
 */
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Role-Permission assignment entity
 */
export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_by?: string;
  granted_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * User context for permission checking
 */
export interface UserContext {
  id: string;
  roles: string[];
  permissions: string[]; // Permission codes: ["users:read:own", "orders:approve:team"]
  department?: string; // For scope filtering
  team?: string; // For scope filtering
  metadata?: Record<string, any>; // Additional attributes for ABAC
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  missingPermissions?: string[];
  missingRoles?: string[];
}

/**
 * Role check result
 */
export interface RoleCheckResult {
  granted: boolean;
  reason?: string;
  missingRoles?: string[];
  expiredRoles?: string[];
  inactiveRoles?: string[];
}

/**
 * Field-level permission configuration
 */
export interface FieldPermission {
  field: string;
  requiredPermission: string;
  defaultValue?: any;
}

/**
 * Row-level security filter
 */
export interface RowFilter {
  column: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

/**
 * Ownership check configuration
 */
export interface OwnershipConfig {
  ownerField: string; // e.g., 'created_by', 'user_id'
  userIdField?: string; // default: 'id'
  allowAdminOverride?: boolean;
}

/**
 * Cache configuration for RBAC
 */
export interface RBACCacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  prefix: string;
}

/**
 * RBAC service configuration
 */
export interface RBACServiceConfig {
  cache?: RBACCacheConfig;
  adminRoles?: string[]; // roles with all permissions
  superAdminRole?: string; // role with absolute access
  defaultExpiration?: number; // default role expiration in days
}
