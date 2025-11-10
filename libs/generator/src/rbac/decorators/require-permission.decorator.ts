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
 * @param permissions - Permission name(s) in format "resource:action" (e.g., "users:create")
 * @param options - Additional options for permission checking
 *
 * @example
 * ```typescript
 * // Single permission
 * @RequirePermission('users:create')
 * async createUser() { }
 *
 * // Multiple permissions with AND logic (default)
 * @RequirePermission(['users:create', 'users:manage'])
 * async createUser() { }
 *
 * // Multiple permissions with OR logic
 * @RequirePermission(['users:update', 'users:manage'], { logic: PermissionLogic.OR })
 * async updateUser() { }
 *
 * // With ownership check
 * @RequirePermission('posts:update', { requireOwnership: true })
 * async updatePost(@Param('id') id: string) { }
 *
 * // Custom error message
 * @RequirePermission('admin:access', {
 *   errorMessage: 'Administrator access required'
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
