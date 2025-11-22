import { SetMetadata } from '@nestjs/common';

/**
 * Permission requirement metadata key
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Permission logic type
 */
export enum PermissionLogic {
  AND = 'AND', // User must have ALL permissions
  OR = 'OR', // User must have AT LEAST ONE permission
}

/**
 * Permission requirement options
 */
export interface RequirePermissionOptions {
  /**
   * Logic to apply when multiple permissions are specified
   * @default PermissionLogic.AND
   */
  logic?: PermissionLogic;

  /**
   * Custom error message when permission check fails
   */
  errorMessage?: string;

  /**
   * Whether to check resource ownership
   * If true, user must own the resource (e.g., userId === resource.createdBy)
   */
  requireOwnership?: boolean;

  /**
   * Field name to check for ownership
   * @default 'created_by'
   */
  ownershipField?: string;
}

/**
 * Permission metadata structure
 */
export interface PermissionMetadata {
  permissions: string[];
  options: RequirePermissionOptions;
}

/**
 * Decorator to require specific permissions for endpoint access
 *
 * @param permissions - Permission code(s) in format "resource:action:scope" or "resource:action:scope:condition"
 * @param options - Additional options for permission checking
 *
 * Permission Format: {resource}:{action}:{scope}[:{condition}]
 * - resource: Resource type (e.g., 'users', 'orders', 'products')
 * - action: Action type (e.g., 'create', 'read', 'update', 'delete', 'approve')
 * - scope: Access scope (e.g., 'own', 'team', 'department', 'all')
 * - condition: Optional condition (e.g., 'active-only', 'under-10k')
 *
 * @example
 * ```typescript
 * // Basic permission - allow users to read their own data
 * @RequirePermission('users:read:own')
 * async getProfile() { }
 *
 * // Team-level permission - allow reading team members
 * @RequirePermission('users:read:team')
 * async getTeamMembers() { }
 *
 * // All-level permission - admin access
 * @RequirePermission('users:read:all')
 * async getAllUsers() { }
 *
 * // Multiple permissions with AND logic (default) - user needs both
 * @RequirePermission(['orders:read:team', 'orders:approve:team'])
 * async approveTeamOrder() { }
 *
 * // Multiple permissions with OR logic - user needs at least one
 * @RequirePermission(['users:update:own', 'users:update:team'], { logic: PermissionLogic.OR })
 * async updateUser() { }
 *
 * // Conditional permission - only for specific conditions
 * @RequirePermission('orders:approve:team:under-10k')
 * async approveSmallOrder() { }
 *
 * // With ownership check
 * @RequirePermission('posts:update:own', { requireOwnership: true })
 * async updatePost(@Param('id') id: string) { }
 *
 * // Custom error message
 * @RequirePermission('system:admin:all', {
 *   errorMessage: 'System administrator access required'
 * })
 * async adminPanel() { }
 * ```
 */
export const RequirePermission = (
  permissions: string | string[],
  options: RequirePermissionOptions = {},
): MethodDecorator => {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  const metadata: PermissionMetadata = {
    permissions: permissionArray,
    options: {
      logic: options.logic || PermissionLogic.AND,
      errorMessage: options.errorMessage,
      requireOwnership: options.requireOwnership || false,
      ownershipField: options.ownershipField || 'created_by',
    },
  };

  return SetMetadata(PERMISSIONS_KEY, metadata);
};

/**
 * Decorator to require ANY of the specified permissions (shorthand for OR logic)
 *
 * @param permissions - Permission name(s)
 *
 * @example
 * ```typescript
 * @RequireAnyPermission(['users:update', 'users:manage'])
 * async updateUser() { }
 * ```
 */
export const RequireAnyPermission = (
  permissions: string[],
  options: Omit<RequirePermissionOptions, 'logic'> = {},
): MethodDecorator => {
  return RequirePermission(permissions, {
    ...options,
    logic: PermissionLogic.OR,
  });
};

/**
 * Decorator to require ALL of the specified permissions (shorthand for AND logic)
 *
 * @param permissions - Permission name(s)
 *
 * @example
 * ```typescript
 * @RequireAllPermissions(['users:read', 'users:update'])
 * async updateUser() { }
 * ```
 */
export const RequireAllPermissions = (
  permissions: string[],
  options: Omit<RequirePermissionOptions, 'logic'> = {},
): MethodDecorator => {
  return RequirePermission(permissions, {
    ...options,
    logic: PermissionLogic.AND,
  });
};

/**
 * Decorator for resource ownership check
 * Requires user to own the resource being accessed
 *
 * @param permission - Base permission required
 * @param ownershipField - Field name to check for ownership
 *
 * @example
 * ```typescript
 * @RequireOwnership('posts:update')
 * async updatePost(@Param('id') id: string, @User() user: any) {
 *   // User must have 'posts:update' permission AND own the post
 * }
 *
 * @RequireOwnership('profiles:update', 'user_id')
 * async updateProfile(@Param('id') id: string) {
 *   // Check 'user_id' field for ownership
 * }
 * ```
 */
export const RequireOwnership = (
  permission: string,
  ownershipField: string = 'created_by',
): MethodDecorator => {
  return RequirePermission(permission, {
    requireOwnership: true,
    ownershipField,
  });
};
