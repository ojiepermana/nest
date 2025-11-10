import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RBACService } from './rbac.service';
import { RBACRepository } from './rbac.repository';
import {
  Permission,
  Role,
  UserContext,
  RBACConfig,
  FieldLevelPermission,
  RowLevelFilter,
} from './interfaces/rbac.interface';

describe('RBACService', () => {
  let service: RBACService;
  let repository: jest.Mocked<RBACRepository>;
  let cacheManager: jest.Mocked<Cache>;

  const mockConfig: RBACConfig = {
    enableCache: true,
    cacheTTL: 300,
    enableFieldLevel: true,
    enableRowLevel: true,
  };

  beforeEach(async () => {
    const mockRepository = {
      getUserPermissions: jest.fn(),
      getUserRoles: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn(),
      assignRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
      grantPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
      checkOwnership: jest.fn(),
      getExpiredRoles: jest.fn(),
      cleanupExpiredRoles: jest.fn(),
      createPermission: jest.fn(),
      createRole: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RBACService,
        {
          provide: RBACRepository,
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
        {
          provide: 'RBAC_CONFIG',
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<RBACService>(RBACService);
    repository = module.get(RBACRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      repository.hasPermission.mockResolvedValue(true);

      const result = await service.hasPermission('user-123', 'users.create');

      expect(result).toBe(true);
      expect(repository.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'users.create',
      );
    });

    it('should return false when user lacks permission', async () => {
      repository.hasPermission.mockResolvedValue(false);

      const result = await service.hasPermission('user-123', 'users.delete');

      expect(result).toBe(false);
    });

    it('should use cache when enabled', async () => {
      const cacheKey = 'rbac:permission:user-123:users.create';
      cacheManager.get.mockResolvedValue(true);

      const result = await service.hasPermission('user-123', 'users.create');

      expect(result).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.hasPermission).not.toHaveBeenCalled();
    });

    it('should cache result when cache miss', async () => {
      const cacheKey = 'rbac:permission:user-123:users.create';
      cacheManager.get.mockResolvedValue(undefined);
      repository.hasPermission.mockResolvedValue(true);

      await service.hasPermission('user-123', 'users.create');

      expect(cacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        true,
        mockConfig.cacheTTL,
      );
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllPermissions('user-123', [
        'users.create',
        'users.read',
        'users.update',
      ]);

      expect(result).toBe(true);
      expect(repository.hasPermission).toHaveBeenCalledTimes(3);
    });

    it('should return false when user lacks any permission', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllPermissions('user-123', [
        'users.create',
        'users.delete',
        'users.update',
      ]);

      expect(result).toBe(false);
    });

    it('should return true for empty permissions array', async () => {
      const result = await service.hasAllPermissions('user-123', []);

      expect(result).toBe(true);
      expect(repository.hasPermission).not.toHaveBeenCalled();
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.hasAnyPermission('user-123', [
        'users.delete',
        'users.read',
        'users.export',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user has no permissions', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await service.hasAnyPermission('user-123', [
        'users.delete',
        'users.export',
        'admin.access',
      ]);

      expect(result).toBe(false);
    });

    it('should return false for empty permissions array', async () => {
      const result = await service.hasAnyPermission('user-123', []);

      expect(result).toBe(false);
      expect(repository.hasPermission).not.toHaveBeenCalled();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      repository.hasRole.mockResolvedValue(true);

      const result = await service.hasRole('user-123', 'admin');

      expect(result).toBe(true);
      expect(repository.hasRole).toHaveBeenCalledWith('user-123', 'admin', {
        activeOnly: true,
        checkExpiration: true,
      });
    });

    it('should return false when user lacks role', async () => {
      repository.hasRole.mockResolvedValue(false);

      const result = await service.hasRole('user-123', 'super_admin');

      expect(result).toBe(false);
    });

    it('should respect activeOnly option', async () => {
      repository.hasRole.mockResolvedValue(true);

      await service.hasRole('user-123', 'moderator', { activeOnly: false });

      expect(repository.hasRole).toHaveBeenCalledWith('user-123', 'moderator', {
        activeOnly: false,
        checkExpiration: true,
      });
    });

    it('should respect checkExpiration option', async () => {
      repository.hasRole.mockResolvedValue(true);

      await service.hasRole('user-123', 'admin', { checkExpiration: false });

      expect(repository.hasRole).toHaveBeenCalledWith('user-123', 'admin', {
        activeOnly: true,
        checkExpiration: false,
      });
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when user has all roles', async () => {
      repository.hasRole
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllRoles('user-123', [
        'admin',
        'moderator',
      ]);

      expect(result).toBe(true);
      expect(repository.hasRole).toHaveBeenCalledTimes(2);
    });

    it('should return false when user lacks any role', async () => {
      repository.hasRole
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.hasAllRoles('user-123', [
        'admin',
        'super_admin',
      ]);

      expect(result).toBe(false);
    });

    it('should return true for empty roles array', async () => {
      const result = await service.hasAllRoles('user-123', []);

      expect(result).toBe(true);
      expect(repository.hasRole).not.toHaveBeenCalled();
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has at least one role', async () => {
      repository.hasRole
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.hasAnyRole('user-123', [
        'super_admin',
        'admin',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user has no roles', async () => {
      repository.hasRole
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await service.hasAnyRole('user-123', [
        'super_admin',
        'moderator',
      ]);

      expect(result).toBe(false);
    });

    it('should return false for empty roles array', async () => {
      const result = await service.hasAnyRole('user-123', []);

      expect(result).toBe(false);
      expect(repository.hasRole).not.toHaveBeenCalled();
    });
  });

  describe('getUserContext', () => {
    it('should return complete user context', async () => {
      const mockPermissions: Permission[] = [
        {
          id: 'perm-1',
          name: 'users.create',
          resource: 'users',
          action: 'create',
          description: 'Create users',
          is_active: true,
          created_at: new Date(),
        },
      ];

      const mockRoles: Role[] = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator',
          is_active: true,
          created_at: new Date(),
        },
      ];

      repository.getUserPermissions.mockResolvedValue(mockPermissions);
      repository.getUserRoles.mockResolvedValue(mockRoles);

      const result = await service.getUserContext('user-123');

      expect(result).toEqual({
        userId: 'user-123',
        permissions: mockPermissions,
        roles: mockRoles,
        isAdmin: false,
        isSuperAdmin: false,
      });
    });

    it('should detect admin role', async () => {
      const mockRoles: Role[] = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator',
          is_active: true,
          created_at: new Date(),
        },
      ];

      repository.getUserPermissions.mockResolvedValue([]);
      repository.getUserRoles.mockResolvedValue(mockRoles);

      const result = await service.getUserContext('user-123');

      expect(result.isAdmin).toBe(true);
      expect(result.isSuperAdmin).toBe(false);
    });

    it('should detect super_admin role', async () => {
      const mockRoles: Role[] = [
        {
          id: 'role-1',
          name: 'super_admin',
          description: 'Super Administrator',
          is_active: true,
          created_at: new Date(),
        },
      ];

      repository.getUserPermissions.mockResolvedValue([]);
      repository.getUserRoles.mockResolvedValue(mockRoles);

      const result = await service.getUserContext('user-123');

      expect(result.isAdmin).toBe(false);
      expect(result.isSuperAdmin).toBe(true);
    });

    it('should use cache when enabled', async () => {
      const cacheKey = 'rbac:context:user-123';
      const cachedContext: UserContext = {
        userId: 'user-123',
        permissions: [],
        roles: [],
        isAdmin: false,
        isSuperAdmin: false,
      };

      cacheManager.get.mockResolvedValue(cachedContext);

      const result = await service.getUserContext('user-123');

      expect(result).toEqual(cachedContext);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(repository.getUserPermissions).not.toHaveBeenCalled();
    });
  });

  describe('checkOwnership', () => {
    it('should return true when user owns resource', async () => {
      repository.checkOwnership.mockResolvedValue(true);

      const result = await service.checkOwnership(
        'user-123',
        'users',
        'resource-456',
        'created_by',
      );

      expect(result).toBe(true);
      expect(repository.checkOwnership).toHaveBeenCalledWith(
        'user-123',
        'users',
        'resource-456',
        'created_by',
      );
    });

    it('should return false when user does not own resource', async () => {
      repository.checkOwnership.mockResolvedValue(false);

      const result = await service.checkOwnership(
        'user-123',
        'posts',
        'post-789',
        'author_id',
      );

      expect(result).toBe(false);
    });

    it('should use default ownership field if not provided', async () => {
      repository.checkOwnership.mockResolvedValue(true);

      await service.checkOwnership('user-123', 'users', 'resource-456');

      expect(repository.checkOwnership).toHaveBeenCalledWith(
        'user-123',
        'users',
        'resource-456',
        'created_by',
      );
    });
  });

  describe('filterFields', () => {
    it('should return all fields when user has full access', async () => {
      const fields = ['id', 'username', 'email', 'password', 'salary'];
      const permissions: FieldLevelPermission[] = [
        {
          field: '*',
          action: 'read',
          resource: 'users',
        },
      ];

      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          field_permissions: permissions,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.filterFields('user-123', 'users', fields);

      expect(result).toEqual(fields);
    });

    it('should filter out restricted fields', async () => {
      const fields = ['id', 'username', 'email', 'password', 'salary'];
      const permissions: FieldLevelPermission[] = [
        { field: 'id', action: 'read', resource: 'users' },
        { field: 'username', action: 'read', resource: 'users' },
        { field: 'email', action: 'read', resource: 'users' },
      ];

      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          field_permissions: permissions,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.filterFields('user-123', 'users', fields);

      expect(result).toEqual(['id', 'username', 'email']);
      expect(result).not.toContain('password');
      expect(result).not.toContain('salary');
    });

    it('should return empty array when no field permissions', async () => {
      const fields = ['id', 'username', 'email'];

      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.filterFields('user-123', 'users', fields);

      expect(result).toEqual([]);
    });
  });

  describe('buildRowFilters', () => {
    it('should build SQL filters from row-level permissions', async () => {
      const filters: RowLevelFilter[] = [
        {
          field: 'department_id',
          operator: '=',
          value: 'dept-123',
        },
        {
          field: 'is_active',
          operator: '=',
          value: true,
        },
      ];

      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          row_filters: filters,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.buildRowFilters('user-123', 'users');

      expect(result).toContain('department_id = $');
      expect(result).toContain('is_active = $');
      expect(result).toContain('AND');
    });

    it('should return empty string when no row filters', async () => {
      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.buildRowFilters('user-123', 'users');

      expect(result).toBe('');
    });

    it('should handle IN operator', async () => {
      const filters: RowLevelFilter[] = [
        {
          field: 'status',
          operator: 'IN',
          value: ['active', 'pending'],
        },
      ];

      repository.getUserPermissions.mockResolvedValue([
        {
          id: 'perm-1',
          name: 'users.read',
          resource: 'users',
          action: 'read',
          row_filters: filters,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const result = await service.buildRowFilters('user-123', 'users');

      expect(result).toContain('status IN (');
    });
  });

  describe('invalidateUserCache', () => {
    it('should delete all user-related cache keys', async () => {
      await service.invalidateUserCache('user-123');

      expect(cacheManager.del).toHaveBeenCalledWith('rbac:context:user-123');
      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('rbac:permission:user-123'),
      );
    });

    it('should handle cache deletion errors gracefully', async () => {
      cacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(
        service.invalidateUserCache('user-123'),
      ).resolves.not.toThrow();
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      repository.assignRoleToUser.mockResolvedValue({
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-456',
        is_active: true,
        created_at: new Date(),
      });

      await service.assignRole('user-123', 'role-456');

      expect(repository.assignRoleToUser).toHaveBeenCalledWith(
        'user-123',
        'role-456',
        undefined,
      );
    });

    it('should invalidate cache after assignment', async () => {
      repository.assignRoleToUser.mockResolvedValue({
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-456',
        is_active: true,
        created_at: new Date(),
      });

      await service.assignRole('user-123', 'role-456');

      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should support expiration date', async () => {
      const expiresAt = new Date('2025-12-31');
      repository.assignRoleToUser.mockResolvedValue({
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-456',
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date(),
      });

      await service.assignRole('user-123', 'role-456', expiresAt);

      expect(repository.assignRoleToUser).toHaveBeenCalledWith(
        'user-123',
        'role-456',
        expiresAt,
      );
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      repository.removeRoleFromUser.mockResolvedValue(undefined);

      await service.removeRole('user-123', 'role-456');

      expect(repository.removeRoleFromUser).toHaveBeenCalledWith(
        'user-123',
        'role-456',
      );
    });

    it('should invalidate cache after removal', async () => {
      repository.removeRoleFromUser.mockResolvedValue(undefined);

      await service.removeRole('user-123', 'role-456');

      expect(cacheManager.del).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      repository.hasRole.mockResolvedValue(true);

      const result = await service.isAdmin('user-123');

      expect(result).toBe(true);
      expect(repository.hasRole).toHaveBeenCalledWith('user-123', 'admin', {
        activeOnly: true,
        checkExpiration: true,
      });
    });

    it('should return false for non-admin', async () => {
      repository.hasRole.mockResolvedValue(false);

      const result = await service.isAdmin('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for super_admin role', async () => {
      repository.hasRole.mockResolvedValue(true);

      const result = await service.isSuperAdmin('user-123');

      expect(result).toBe(true);
      expect(repository.hasRole).toHaveBeenCalledWith(
        'user-123',
        'super_admin',
        {
          activeOnly: true,
          checkExpiration: true,
        },
      );
    });

    it('should return false for non-super-admin', async () => {
      repository.hasRole.mockResolvedValue(false);

      const result = await service.isSuperAdmin('user-123');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredRoles', () => {
    it('should cleanup expired roles', async () => {
      repository.cleanupExpiredRoles.mockResolvedValue(5);

      const result = await service.cleanupExpiredRoles();

      expect(result).toBe(5);
      expect(repository.cleanupExpiredRoles).toHaveBeenCalled();
    });

    it('should return 0 when no expired roles', async () => {
      repository.cleanupExpiredRoles.mockResolvedValue(0);

      const result = await service.cleanupExpiredRoles();

      expect(result).toBe(0);
    });
  });
});
