import { Pool } from 'pg';
import { RBACRepository } from './rbac.repository';
import { Permission, Role, UserRole, RolePermission } from './interfaces';

describe('RBACRepository', () => {
  let repository: RBACRepository;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as any;

    repository = new RBACRepository(mockPool);
  });

  describe('getUserPermissions', () => {
    it('should return user permissions from database', async () => {
      const mockPermissions: Permission[] = [
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockPermissions } as any);

      const result = await repository.getUserPermissions('user-123');

      expect(result).toEqual(mockPermissions);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT p.*'),
        ['user-123'],
      );
    });

    it('should filter inactive permissions', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.getUserPermissions('user-123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.is_active = true'),
        ['user-123'],
      );
    });

    it('should check role expiration', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.getUserPermissions('user-123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'ur.expires_at IS NULL OR ur.expires_at > NOW()',
        ),
        ['user-123'],
      );
    });
  });

  describe('getUserRoles', () => {
    it('should return active user roles', async () => {
      const mockRoles: Role[] = [
        {
          id: 'role-1',
          name: 'admin',
          is_active: true,
          is_default: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRoles } as any);

      const result = await repository.getUserRoles('user-123');

      expect(result).toEqual(mockRoles);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM rbac.roles r'),
        ['user-123'],
      );
    });

    it('should filter by activeOnly when true', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.getUserRoles('user-123', true);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ur.is_active = true'),
        ['user-123'],
      );
    });

    it('should not filter activeOnly when false', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.getUserRoles('user-123', false);

      const query = (mockPool.query as jest.Mock).mock.calls[0][0];
      expect(query).not.toContain('ur.is_active = true');
    });

    it('should check expiration when enabled', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.getUserRoles('user-123', true, true);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'ur.expires_at IS NULL OR ur.expires_at > NOW()',
        ),
        ['user-123'],
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ has_permission: true }],
      } as any);

      const result = await repository.hasPermission('user-123', 'users.read');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        ['user-123', 'users.read'],
      );
    });

    it('should return false when user lacks permission', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ has_permission: false }],
      } as any);

      const result = await repository.hasPermission('user-123', 'users.delete');

      expect(result).toBe(false);
    });

    it('should return false when query returns empty', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      const result = await repository.hasPermission('user-123', 'users.read');

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ has_role: true }],
      } as any);

      const result = await repository.hasRole('user-123', 'admin');

      expect(result).toBe(true);
    });

    it('should return false when user lacks role', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ has_role: false }],
      } as any);

      const result = await repository.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const mockUserRole: UserRole = {
        id: 'ur-1',
        user_id: 'user-123',
        role_id: 'role-1',
        assigned_at: new Date(),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockUserRole] } as any);

      const result = await repository.assignRoleToUser(
        'user-123',
        'role-1',
        'admin-123',
      );

      expect(result).toEqual(mockUserRole);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rbac.user_roles'),
        ['user-123', 'role-1', 'admin-123', undefined],
      );
    });

    it('should handle conflict with ON CONFLICT', async () => {
      mockPool.query.mockResolvedValue({ rows: [{}] } as any);

      await repository.assignRoleToUser('user-123', 'role-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(Array),
      );
    });

    it('should set expiration date when provided', async () => {
      const expiresAt = new Date('2025-12-31');
      mockPool.query.mockResolvedValue({ rows: [{}] } as any);

      await repository.assignRoleToUser(
        'user-123',
        'role-1',
        undefined,
        expiresAt,
      );

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        'user-123',
        'role-1',
        undefined,
        expiresAt,
      ]);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should soft delete role assignment', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await repository.removeRoleFromUser('user-123', 'role-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rbac.user_roles'),
        ['user-123', 'role-1'],
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = false'),
        ['user-123', 'role-1'],
      );
    });
  });

  describe('grantPermissionToRole', () => {
    it('should grant permission to role', async () => {
      const mockRolePermission: RolePermission = {
        id: 'rp-1',
        role_id: 'role-1',
        permission_id: 'perm-1',
        granted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockRolePermission] } as any);

      const result = await repository.grantPermissionToRole(
        'role-1',
        'perm-1',
        'admin-123',
      );

      expect(result).toEqual(mockRolePermission);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rbac.role_permissions'),
        ['role-1', 'perm-1', 'admin-123'],
      );
    });
  });

  describe('revokePermissionFromRole', () => {
    it('should delete permission from role', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await repository.revokePermissionFromRole('role-1', 'perm-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM rbac.role_permissions'),
        ['role-1', 'perm-1'],
      );
    });
  });

  describe('checkOwnership', () => {
    it('should return true when user owns resource', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ is_owner: true }],
      } as any);

      const result = await repository.checkOwnership(
        'users',
        'profile',
        'resource-123',
        'created_by',
        'user-123',
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        ['resource-123', 'user-123'],
      );
    });

    it('should return false when user does not own resource', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ is_owner: false }],
      } as any);

      const result = await repository.checkOwnership(
        'users',
        'profile',
        'resource-123',
        'created_by',
        'user-123',
      );

      expect(result).toBe(false);
    });
  });

  describe('getExpiredRoles', () => {
    it('should return expired roles for user', async () => {
      const mockRoles: Role[] = [
        {
          id: 'role-1',
          name: 'temp_admin',
          is_active: true,
          is_default: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRoles } as any);

      const result = await repository.getExpiredRoles('user-123');

      expect(result).toEqual(mockRoles);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ur.expires_at <= NOW()'),
        ['user-123'],
      );
    });
  });

  describe('cleanupExpiredRoles', () => {
    it('should return count of cleaned up roles', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 5 } as any);

      const result = await repository.cleanupExpiredRoles();

      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rbac.user_roles'),
        [],
      );
    });

    it('should return 0 when no expired roles', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      const result = await repository.cleanupExpiredRoles();

      expect(result).toBe(0);
    });
  });

  describe('createPermission', () => {
    it('should create new permission', async () => {
      const mockPermission: Permission = {
        id: 'perm-1',
        name: 'users.create',
        resource: 'users',
        action: 'create',
        description: 'Create users',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockPermission] } as any);

      const result = await repository.createPermission(
        'users.create',
        'users',
        'create',
        'Create users',
      );

      expect(result).toEqual(mockPermission);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rbac.permissions'),
        ['users.create', 'users', 'create', 'Create users'],
      );
    });
  });

  describe('createRole', () => {
    it('should create new role', async () => {
      const mockRole: Role = {
        id: 'role-1',
        name: 'editor',
        description: 'Content editor',
        is_active: true,
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockRole] } as any);

      const result = await repository.createRole(
        'editor',
        'Content editor',
        false,
      );

      expect(result).toEqual(mockRole);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rbac.roles'),
        ['editor', 'Content editor', false],
      );
    });
  });
});
