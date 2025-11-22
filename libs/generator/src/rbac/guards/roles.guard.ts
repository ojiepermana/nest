import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  RoleMetadata,
  RoleLogic,
  IS_PUBLIC_KEY,
  SKIP_PERMISSION_KEY,
} from '../decorators/require-role.decorator';

/**
 * Guard to check user roles based on @RequireRole decorator
 *
 * This guard should be registered globally or on specific controllers/routes.
 * It checks if the authenticated user has the required roles to access
 * the endpoint.
 *
 * @example
 * ```typescript
 * // Global registration
 * app.useGlobalGuards(new RolesGuard(reflector));
 *
 * // Or in module providers
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: RolesGuard,
 *   },
 * ]
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService?: any, // Will be injected via DI
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if permission check should be skipped
    const skipPermission = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipPermission) {
      return true;
    }

    // Get role metadata from decorator
    const roleMetadata = this.reflector.getAllAndOverride<RoleMetadata>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role decorator = allow access
    if (!roleMetadata) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { roles, options } = roleMetadata;

    // Check if permission service is available
    if (!this.permissionService) {
      console.warn('PermissionService not injected. Roles will not be checked.');
      return true;
    }

    // Check roles based on logic
    let hasRole = false;

    if (options.logic === RoleLogic.AND) {
      // User must have ALL roles
      hasRole = await this.checkAllRoles(
        user.id,
        roles,
        options.activeOnly,
        options.checkExpiration,
      );
    } else {
      // User must have AT LEAST ONE role
      hasRole = await this.checkAnyRole(
        user.id,
        roles,
        options.activeOnly,
        options.checkExpiration,
      );
    }

    if (!hasRole) {
      const errorMessage = options.errorMessage || `Missing required role(s): ${roles.join(', ')}`;
      throw new ForbiddenException(errorMessage);
    }

    return true;
  }

  /**
   * Check if user has ALL specified roles
   */
  private async checkAllRoles(
    userId: string,
    roles: string[],
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<boolean> {
    if (!this.permissionService) {
      return true;
    }

    for (const role of roles) {
      const hasRole = await this.permissionService.hasRole(
        userId,
        role,
        activeOnly,
        checkExpiration,
      );
      if (!hasRole) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has AT LEAST ONE of the specified roles
   */
  private async checkAnyRole(
    userId: string,
    roles: string[],
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<boolean> {
    if (!this.permissionService) {
      return true;
    }

    for (const role of roles) {
      const hasRole = await this.permissionService.hasRole(
        userId,
        role,
        activeOnly,
        checkExpiration,
      );
      if (hasRole) {
        return true;
      }
    }

    return false;
  }
}
