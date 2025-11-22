import { SetMetadata } from '@nestjs/common';

/**
 * Role requirement metadata key
 */
export const ROLES_KEY = 'roles';

/**
 * Role logic type
 */
export enum RoleLogic {
  AND = 'AND', // User must have ALL roles
  OR = 'OR', // User must have AT LEAST ONE role
}

/**
 * Role requirement options
 */
export interface RequireRoleOptions {
  /**
   * Logic to apply when multiple roles are specified
   * @default RoleLogic.OR
   */
  logic?: RoleLogic;

  /**
   * Custom error message when role check fails
   */
  errorMessage?: string;

  /**
   * Whether to check for active roles only
   * @default true
   */
  activeOnly?: boolean;

  /**
   * Whether to check role expiration
   * @default true
   */
  checkExpiration?: boolean;
}

/**
 * Role metadata structure
 */
export interface RoleMetadata {
  roles: string[];
  options: RequireRoleOptions;
}

/**
 * Decorator to require specific roles for endpoint access
 *
 * @param roles - Role name(s) (e.g., "admin", "moderator")
 * @param options - Additional options for role checking
 *
 * @example
 * ```typescript
 * // Single role
 * @RequireRole('admin')
 * async adminPanel() { }
 *
 * // Multiple roles with OR logic (default)
 * @RequireRole(['admin', 'moderator'])
 * async managePosts() { }
 *
 * // Multiple roles with AND logic
 * @RequireRole(['admin', 'super_admin'], { logic: RoleLogic.AND })
 * async criticalOperation() { }
 *
 * // Custom error message
 * @RequireRole('admin', { errorMessage: 'Administrator access required' })
 * async adminSettings() { }
 *
 * // Allow inactive roles (for special cases)
 * @RequireRole('admin', { activeOnly: false })
 * async viewInactiveAdmins() { }
 * ```
 */
export const RequireRole = (
  roles: string | string[],
  options: RequireRoleOptions = {},
): MethodDecorator => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  const metadata: RoleMetadata = {
    roles: roleArray,
    options: {
      logic: options.logic || RoleLogic.OR,
      errorMessage: options.errorMessage,
      activeOnly: options.activeOnly !== false, // default true
      checkExpiration: options.checkExpiration !== false, // default true
    },
  };

  return SetMetadata(ROLES_KEY, metadata);
};

/**
 * Decorator to require ANY of the specified roles (shorthand for OR logic)
 *
 * @param roles - Role name(s)
 *
 * @example
 * ```typescript
 * @RequireAnyRole(['admin', 'moderator'])
 * async managePosts() { }
 * ```
 */
export const RequireAnyRole = (
  roles: string[],
  options: Omit<RequireRoleOptions, 'logic'> = {},
): MethodDecorator => {
  return RequireRole(roles, {
    ...options,
    logic: RoleLogic.OR,
  });
};

/**
 * Decorator to require ALL of the specified roles (shorthand for AND logic)
 *
 * @param roles - Role name(s)
 *
 * @example
 * ```typescript
 * @RequireAllRoles(['admin', 'super_admin'])
 * async criticalOperation() { }
 * ```
 */
export const RequireAllRoles = (
  roles: string[],
  options: Omit<RequireRoleOptions, 'logic'> = {},
): MethodDecorator => {
  return RequireRole(roles, {
    ...options,
    logic: RoleLogic.AND,
  });
};

/**
 * Common role decorators for convenience
 */

export const RequireAdmin = (options: RequireRoleOptions = {}): MethodDecorator => {
  return RequireRole('admin', options);
};

export const RequireSuperAdmin = (options: RequireRoleOptions = {}): MethodDecorator => {
  return RequireRole('super_admin', options);
};

export const RequireModerator = (options: RequireRoleOptions = {}): MethodDecorator => {
  return RequireRole('moderator', options);
};

/**
 * Decorator to allow public access (bypass permission/role checks)
 * Useful when you have global guards but need to allow specific endpoints
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator to skip permission check but still require authentication
 *
 * @example
 * ```typescript
 * @SkipPermission()
 * @Get('profile')
 * getProfile(@User() user: any) {
 *   return user;
 * }
 * ```
 */
export const SKIP_PERMISSION_KEY = 'skipPermission';
export const SkipPermission = () => SetMetadata(SKIP_PERMISSION_KEY, true);
