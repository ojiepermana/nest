import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Permission, Role, UserRole, RolePermission } from './interfaces';

/**
 * RBAC Repository
 *
 * Handles all database queries for RBAC operations
 * Uses raw SQL with parameterized queries for maximum performance
 */
@Injectable()
export class RBACRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Get all permissions for a user (direct + inherited from roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const query = `
      SELECT DISTINCT p.*
      FROM rbac.permissions p
      INNER JOIN rbac.role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
        AND ur.is_active = true
        AND p.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.resource, p.action
    `;

    const result = await this.pool.query<Permission>(query, [userId]);
    return result.rows;
  }

  /**
   * Get all active roles for a user
   */
  async getUserRoles(
    userId: string,
    activeOnly: boolean = true,
    checkExpiration: boolean = true,
  ): Promise<Role[]> {
    let query = `
      SELECT r.*
      FROM rbac.roles r
      INNER JOIN rbac.user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `;

    if (activeOnly) {
      query += ` AND ur.is_active = true AND r.is_active = true`;
    }

    if (checkExpiration) {
      query += ` AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`;
    }

    query += ` ORDER BY r.name`;

    const result = await this.pool.query<Role>(query, [userId]);
    return result.rows;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1
        FROM rbac.permissions p
        INNER JOIN rbac.role_permissions rp ON p.id = rp.permission_id
        INNER JOIN rbac.user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1
          AND p.name = $2
          AND ur.is_active = true
          AND p.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ) as has_permission
    `;

    const result = await this.pool.query<{ has_permission: boolean }>(query, [
      userId,
      permissionName,
    ]);
    return result.rows[0]?.has_permission || false;
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
    let query = `
      SELECT EXISTS(
        SELECT 1
        FROM rbac.roles r
        INNER JOIN rbac.user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND r.name = $2
    `;

    if (activeOnly) {
      query += ` AND ur.is_active = true AND r.is_active = true`;
    }

    if (checkExpiration) {
      query += ` AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`;
    }

    query += `) as has_role`;

    const result = await this.pool.query<{ has_role: boolean }>(query, [userId, roleName]);
    return result.rows[0]?.has_role || false;
  }

  /**
   * Get permission by name
   */
  async getPermissionByName(name: string): Promise<Permission | null> {
    const query = `
      SELECT * FROM rbac.permissions
      WHERE name = $1 AND is_active = true
    `;

    const result = await this.pool.query<Permission>(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    const query = `
      SELECT * FROM rbac.roles
      WHERE name = $1 AND is_active = true
    `;

    const result = await this.pool.query<Role>(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
    expiresAt?: Date,
  ): Promise<UserRole> {
    const query = `
      INSERT INTO rbac.user_roles (
        user_id, role_id, assigned_by, expires_at
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, role_id)
      DO UPDATE SET
        is_active = true,
        assigned_by = EXCLUDED.assigned_by,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query<UserRole>(query, [userId, roleId, assignedBy, expiresAt]);
    return result.rows[0];
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const query = `
      UPDATE rbac.user_roles
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND role_id = $2
    `;

    await this.pool.query(query, [userId, roleId]);
  }

  /**
   * Grant permission to role
   */
  async grantPermissionToRole(
    roleId: string,
    permissionId: string,
    grantedBy?: string,
  ): Promise<RolePermission> {
    const query = `
      INSERT INTO rbac.role_permissions (
        role_id, permission_id, granted_by
      ) VALUES ($1, $2, $3)
      ON CONFLICT (role_id, permission_id) DO NOTHING
      RETURNING *
    `;

    const result = await this.pool.query<RolePermission>(query, [roleId, permissionId, grantedBy]);
    return result.rows[0];
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const query = `
      DELETE FROM rbac.role_permissions
      WHERE role_id = $1 AND permission_id = $2
    `;

    await this.pool.query(query, [roleId, permissionId]);
  }

  /**
   * Create new permission
   */
  async createPermission(
    name: string,
    resource: string,
    action: string,
    description?: string,
  ): Promise<Permission> {
    const query = `
      INSERT INTO rbac.permissions (name, resource, action, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query<Permission>(query, [name, resource, action, description]);
    return result.rows[0];
  }

  /**
   * Create new role
   */
  async createRole(name: string, description?: string, isDefault: boolean = false): Promise<Role> {
    const query = `
      INSERT INTO rbac.roles (name, description, is_default)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.pool.query<Role>(query, [name, description, isDefault]);
    return result.rows[0];
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const query = `
      SELECT p.*
      FROM rbac.permissions p
      INNER JOIN rbac.role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1 AND p.is_active = true
      ORDER BY p.resource, p.action
    `;

    const result = await this.pool.query<Permission>(query, [roleId]);
    return result.rows;
  }

  /**
   * Check resource ownership
   */
  async checkOwnership(
    schema: string,
    table: string,
    resourceId: string,
    ownerField: string,
    userId: string,
  ): Promise<boolean> {
    // Dynamic query - ensure schema and table are validated
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM ${schema}.${table}
        WHERE id = $1 AND ${ownerField} = $2
      ) as is_owner
    `;

    const result = await this.pool.query<{ is_owner: boolean }>(query, [resourceId, userId]);
    return result.rows[0]?.is_owner || false;
  }

  /**
   * Get user's expired roles
   */
  async getExpiredRoles(userId: string): Promise<Role[]> {
    const query = `
      SELECT r.*
      FROM rbac.roles r
      INNER JOIN rbac.user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND ur.expires_at IS NOT NULL
        AND ur.expires_at <= NOW()
      ORDER BY ur.expires_at DESC
    `;

    const result = await this.pool.query<Role>(query, [userId]);
    return result.rows;
  }

  /**
   * Cleanup expired role assignments
   */
  async cleanupExpiredRoles(): Promise<number> {
    const query = `
      UPDATE rbac.user_roles
      SET is_active = false, updated_at = NOW()
      WHERE expires_at IS NOT NULL
        AND expires_at <= NOW()
        AND is_active = true
      RETURNING id
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }
}
