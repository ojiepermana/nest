import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PermissionMetadata,
  PermissionLogic,
} from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY, SKIP_PERMISSION_KEY } from '../decorators/require-role.decorator';

/**
 * Guard to check user permissions based on @RequirePermission decorator
 *
 * This guard should be registered globally or on specific controllers/routes.
 * It checks if the authenticated user has the required permissions to access
 * the endpoint.
 *
 * @example
 * ```typescript
 * // Global registration
 * app.useGlobalGuards(new PermissionsGuard(reflector));
 *
 * // Or in module providers
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: PermissionsGuard,
 *   },
 * ]
 * ```
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
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

    // Get permission metadata from decorator
    const permissionMetadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission decorator = allow access
    if (!permissionMetadata) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { permissions, options } = permissionMetadata;

    // Check if permission service is available
    if (!this.permissionService) {
      console.warn('PermissionService not injected. Permissions will not be checked.');
      return true;
    }

    // Check permissions based on logic
    let hasPermission = false;

    if (options.logic === PermissionLogic.AND) {
      // User must have ALL permissions
      hasPermission = await this.checkAllPermissions(user.id, permissions);
    } else {
      // User must have AT LEAST ONE permission
      hasPermission = await this.checkAnyPermission(user.id, permissions);
    }

    if (!hasPermission) {
      const errorMessage =
        options.errorMessage || `Missing required permission(s): ${permissions.join(', ')}`;
      throw new ForbiddenException(errorMessage);
    }

    // Check ownership if required
    if (options.requireOwnership) {
      const resourceId = request.params.id;
      if (resourceId) {
        const ownsResource = await this.checkOwnership(user.id, resourceId, options.ownershipField);

        if (!ownsResource) {
          throw new ForbiddenException('You do not have permission to access this resource');
        }
      }
    }

    return true;
  }

  /**
   * Check if user has ALL specified permissions
   */
  private async checkAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    if (!this.permissionService) {
      return true;
    }

    for (const permission of permissions) {
      const hasPermission = await this.permissionService.userHasPermission(userId, permission);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has AT LEAST ONE of the specified permissions
   */
  private async checkAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    if (!this.permissionService) {
      return true;
    }

    for (const permission of permissions) {
      const hasPermission = await this.permissionService.userHasPermission(userId, permission);
      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user owns the resource
   */
  private async checkOwnership(
    userId: string,
    resourceId: string,
    ownershipField: string = 'created_by',
  ): Promise<boolean> {
    if (!this.permissionService) {
      return true;
    }

    // This would typically query the resource and check ownership
    // For now, we'll assume the permission service handles this
    return this.permissionService.checkOwnership(userId, resourceId, ownershipField);
  }
}
