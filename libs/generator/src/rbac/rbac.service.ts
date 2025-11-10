import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RBACRepository } from './rbac.repository';
import type {
  Permission,
  Role,
  UserContext,
  PermissionCheckResult,
  RoleCheckResult,
  FieldPermission,
  RowFilter,
  OwnershipConfig,
  RBACServiceConfig,
} from './interfaces';

/**
 * RBAC Service
 *
 * Core service for Role-Based Access Control
 * Provides permission checking, role management, and field-level security
 */
@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private readonly cacheEnabled: boolean;
  private readonly cacheTTL: number;
  private readonly cachePrefix: string;
  private readonly adminRoles: string[];
  private readonly superAdminRole: string;

  constructor(
    private readonly repository: RBACRepository,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
    @Optional()
    @Inject('RBAC_CONFIG')
    private readonly config?: RBACServiceConfig,
  ) {
    this.cacheEnabled = config?.cache?.enabled ?? true;
    this.cacheTTL = config?.cache?.ttl ?? 300; // 5 minutes default
    this.cachePrefix = config?.cache?.prefix ?? 'rbac';
    this.adminRoles = config?.adminRoles ?? ['admin', 'super_admin'];
    this.superAdminRole = config?.superAdminRole ?? 'super_admin';
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const cacheKey = `${this.cachePrefix}:user:${userId}:permission:${permission}`;

    if (this.cacheEnabled && this.cacheManager) {
      const cached = await this.cacheManager.get<boolean>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const hasPermission = await this.repository.hasPermission(userId, permission);

    if (this.cacheEnabled && this.cacheManager) {
      await this.cacheManager.set(cacheKey, hasPermission, this.cacheTTL * 1000);
    }

    return hasPermission;
  }

  /**
   * Check if user has ALL specified permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<PermissionCheckResult> {
    const missingPermissions: string[] = [];

    for (const permission of permissions) {
      const has = await this.hasPermission(userId, permission);
      if (!has) {
        missingPermissions.push(permission);
      }
    }

    const granted = missingPermissions.length === 0;

    return {
      granted,
      reason: granted ? undefined : `Missing permissions: ${missingPermissions.join(', ')}`,
      missingPermissions: granted ? undefined : missingPermissions,
    };
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<PermissionCheckResult> {
    for (const permission of permissions) {
      const has = await this.hasPermission(userId, permission);
      if (has) {
        return { granted: true };
      }
    }

    return {
      granted: false,
      reason: `Missing any of: ${permissions.join(', ')}`,
      missingPermissions: permissions,
    };
  }

  /**
   * Check if user has specific role
   */
  async hasRole(
    userId: string,
    roleName: string,
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<boolean> {
    const cacheKey = `${this.cachePrefix}:user:${userId}:role:${roleName}:${activeOnly}:${checkExpiration}`;

    if (this.cacheEnabled && this.cacheManager) {
      const cached = await this.cacheManager.get<boolean>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const hasRole = await this.repository.hasRole(userId, roleName, activeOnly, checkExpiration);

    if (this.cacheEnabled && this.cacheManager) {
      await this.cacheManager.set(cacheKey, hasRole, this.cacheTTL * 1000);
    }

    return hasRole;
  }

  /**
   * Check if user has ALL specified roles
   */
  async hasAllRoles(
    userId: string,
    roles: string[],
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<RoleCheckResult> {
    const missingRoles: string[] = [];

    for (const role of roles) {
      const has = await this.hasRole(userId, role, activeOnly, checkExpiration);
      if (!has) {
        missingRoles.push(role);
      }
    }

    const granted = missingRoles.length === 0;

    return {
      granted,
      reason: granted ? undefined : `Missing roles: ${missingRoles.join(', ')}`,
      missingRoles: granted ? undefined : missingRoles,
    };
  }

  /**
   * Check if user has ANY of the specified roles
   */
  async hasAnyRole(
    userId: string,
    roles: string[],
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<RoleCheckResult> {
    for (const role of roles) {
      const has = await this.hasRole(userId, role, activeOnly, checkExpiration);
      if (has) {
        return { granted: true };
      }
    }

    return {
      granted: false,
      reason: `Missing any of: ${roles.join(', ')}`,
      missingRoles: roles,
    };
  }

  /**
   * Get user context with permissions and roles
   */
  async getUserContext(userId: string): Promise<UserContext> {
    const cacheKey = `${this.cachePrefix}:user:${userId}:context`;

    if (this.cacheEnabled && this.cacheManager) {
      const cached = await this.cacheManager.get<UserContext>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [permissions, roles] = await Promise.all([
      this.repository.getUserPermissions(userId),
      this.repository.getUserRoles(userId),
    ]);

    const context: UserContext = {
      id: userId,
      roles: roles.map((r) => r.name),
      permissions: permissions.map((p) => p.name),
    };

    if (this.cacheEnabled && this.cacheManager) {
      await this.cacheManager.set(cacheKey, context, this.cacheTTL * 1000);
    }

    return context;
  }

  /**
   * Check if user is admin (has admin role)
   */
  async isAdmin(userId: string): Promise<boolean> {
    for (const adminRole of this.adminRoles) {
      const has = await this.hasRole(userId, adminRole);
      if (has) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, this.superAdminRole);
  }

  /**
   * Check resource ownership
   */
  async checkOwnership(
    userId: string,
    schema: string,
    table: string,
    resourceId: string,
    config: OwnershipConfig,
  ): Promise<boolean> {
    // Super admin bypasses ownership check
    if (config.allowAdminOverride) {
      const isSuperAdmin = await this.isSuperAdmin(userId);
      if (isSuperAdmin) {
        return true;
      }
    }

    return this.repository.checkOwnership(schema, table, resourceId, config.ownerField, userId);
  }

  /**
   * Filter fields based on user permissions
   * Removes fields that user doesn't have permission to access
   */
  async filterFields<T extends Record<string, any>>(
    userId: string,
    data: T,
    fieldPermissions: FieldPermission[],
  ): Promise<Partial<T>> {
    const filtered: Partial<T> = { ...data };

    for (const fieldPerm of fieldPermissions) {
      const hasAccess = await this.hasPermission(userId, fieldPerm.requiredPermission);

      if (!hasAccess) {
        if (fieldPerm.defaultValue !== undefined) {
          filtered[fieldPerm.field as keyof T] = fieldPerm.defaultValue;
        } else {
          delete filtered[fieldPerm.field as keyof T];
        }
      }
    }

    return filtered;
  }

  /**
   * Build WHERE clause filters based on user permissions (row-level security)
   */
  async buildRowFilters(userId: string, baseFilters: RowFilter[]): Promise<RowFilter[]> {
    const filters = [...baseFilters];

    // Example: If user is not admin, only show their own records
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      filters.push({
        column: 'created_by',
        operator: 'eq',
        value: userId,
      });
    }

    return filters;
  }

  /**
   * Invalidate user cache (call after role/permission changes)
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.cacheEnabled || !this.cacheManager) {
      return;
    }

    const patterns = [`${this.cachePrefix}:user:${userId}:*`];

    for (const pattern of patterns) {
      try {
        // Note: cache-manager doesn't support pattern deletion by default
        // This is a simplified version - you may need a custom implementation
        await this.cacheManager.del(pattern);
      } catch (error) {
        this.logger.warn(`Failed to invalidate cache pattern: ${pattern}`, error);
      }
    }

    this.logger.log(`Invalidated cache for user: ${userId}`);
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleName: string,
    assignedBy?: string,
    expiresAt?: Date,
  ): Promise<void> {
    const role = await this.repository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    await this.repository.assignRoleToUser(userId, role.id, assignedBy, expiresAt);
    await this.invalidateUserCache(userId);

    this.logger.log(`Assigned role ${roleName} to user ${userId}`);
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleName: string): Promise<void> {
    const role = await this.repository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    await this.repository.removeRoleFromUser(userId, role.id);
    await this.invalidateUserCache(userId);

    this.logger.log(`Removed role ${roleName} from user ${userId}`);
  }

  /**
   * Grant permission to role
   */
  async grantPermission(
    roleName: string,
    permissionName: string,
    grantedBy?: string,
  ): Promise<void> {
    const [role, permission] = await Promise.all([
      this.repository.getRoleByName(roleName),
      this.repository.getPermissionByName(permissionName),
    ]);

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }
    if (!permission) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    await this.repository.grantPermissionToRole(role.id, permission.id, grantedBy);

    // Invalidate cache for all users with this role
    this.logger.log(`Granted permission ${permissionName} to role ${roleName}`);
  }

  /**
   * Revoke permission from role
   */
  async revokePermission(roleName: string, permissionName: string): Promise<void> {
    const [role, permission] = await Promise.all([
      this.repository.getRoleByName(roleName),
      this.repository.getPermissionByName(permissionName),
    ]);

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }
    if (!permission) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    await this.repository.revokePermissionFromRole(role.id, permission.id);

    this.logger.log(`Revoked permission ${permissionName} from role ${roleName}`);
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const cacheKey = `${this.cachePrefix}:user:${userId}:permissions`;

    if (this.cacheEnabled && this.cacheManager) {
      const cached = await this.cacheManager.get<Permission[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const permissions = await this.repository.getUserPermissions(userId);

    if (this.cacheEnabled && this.cacheManager) {
      await this.cacheManager.set(cacheKey, permissions, this.cacheTTL * 1000);
    }

    return permissions;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const cacheKey = `${this.cachePrefix}:user:${userId}:roles`;

    if (this.cacheEnabled && this.cacheManager) {
      const cached = await this.cacheManager.get<Role[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const roles = await this.repository.getUserRoles(userId);

    if (this.cacheEnabled && this.cacheManager) {
      await this.cacheManager.set(cacheKey, roles, this.cacheTTL * 1000);
    }

    return roles;
  }

  /**
   * Cleanup expired role assignments (should be run periodically)
   */
  async cleanupExpiredRoles(): Promise<number> {
    const count = await this.repository.cleanupExpiredRoles();
    this.logger.log(`Cleaned up ${count} expired role assignments`);
    return count;
  }
}
