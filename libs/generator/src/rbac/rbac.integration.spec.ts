import { RBACService } from './rbac.service';
import { RBACRepository } from './rbac.repository';

describe('RBAC Integration Tests', () => {
  let service: RBACService;
  let repository: jest.Mocked<RBACRepository>;

  beforeEach(() => {
    repository = {
      getUserPermissions: jest.fn(),
      getUserRoles: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn(),
      assignRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
      checkOwnership: jest.fn(),
      getRoleByName: jest.fn(),
      isSuperAdmin: jest.fn(),
    } as any;

    service = new RBACService(repository, undefined, {
      cache: { enabled: false },
    });
  });

  describe('Permission-based Access Control', () => {
    it('should check if user has permission', async () => {
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
  });

  describe('Role-based Access Control', () => {
    it('should check if user has role', async () => {
      repository.hasRole.mockResolvedValue(true);

      const result = await service.hasRole('user-123', 'admin');

      expect(result).toBe(true);
      expect(repository.hasRole).toHaveBeenCalledWith(
        'user-123',
        'admin',
        true,
        true,
      );
    });

    it('should return false when user lacks role', async () => {
      repository.hasRole.mockResolvedValue(false);

      const result = await service.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('Combined Checks - Multiple Permissions', () => {
    it('should handle multiple permissions with AND logic', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllPermissions('user-123', [
        'users.create',
        'users.update',
        'users.read',
      ]);

      expect(result.granted).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle multiple permissions with OR logic', async () => {
      repository.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.hasAnyPermission('user-123', [
        'users.delete',
        'users.update',
      ]);

      expect(result.granted).toBe(true);
    });
  });

  describe('Combined Checks - Multiple Roles', () => {
    it('should handle multiple roles with AND logic', async () => {
      repository.hasRole
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllRoles('user-123', [
        'admin',
        'moderator',
      ]);

      expect(result.granted).toBe(true);
    });

    it('should handle multiple roles with OR logic', async () => {
      repository.hasRole
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.hasAnyRole('user-123', [
        'admin',
        'moderator',
      ]);

      expect(result.granted).toBe(true);
    });
  });

  describe('Role Management', () => {
    it('should assign role to user', async () => {
      const roleAssignment = {
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-1',
        assigned_at: new Date(),
      };

      repository.getRoleByName.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
      } as any);
      repository.assignRoleToUser.mockResolvedValue(roleAssignment as any);

      await service.assignRole('user-123', 'admin');

      expect(repository.getRoleByName).toHaveBeenCalledWith('admin');
      expect(repository.assignRoleToUser).toHaveBeenCalledWith(
        'user-123',
        'role-1',
        undefined,
        undefined,
      );
    });

    it('should remove role from user', async () => {
      repository.getRoleByName.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
      } as any);
      repository.removeRoleFromUser.mockResolvedValue(undefined);

      await service.removeRole('user-123', 'admin');

      expect(repository.getRoleByName).toHaveBeenCalledWith('admin');
      expect(repository.removeRoleFromUser).toHaveBeenCalledWith(
        'user-123',
        'role-1',
      );
    });
  });

  describe('Ownership Verification', () => {
    it('should verify user owns resource', async () => {
      repository.isSuperAdmin.mockResolvedValue(false);
      repository.checkOwnership.mockResolvedValue(true);

      const result = await service.checkOwnership(
        'user-123',
        'app',
        'posts',
        'post-1',
        { ownerField: 'user_id', allowAdminOverride: false },
      );

      expect(result).toBe(true);
      expect(repository.checkOwnership).toHaveBeenCalledWith(
        'app',
        'posts',
        'post-1',
        'user_id',
        'user-123',
      );
    });

    it('should detect when user does not own resource', async () => {
      repository.isSuperAdmin.mockResolvedValue(false);
      repository.checkOwnership.mockResolvedValue(false);

      const result = await service.checkOwnership(
        'user-123',
        'app',
        'posts',
        'post-2',
        { ownerField: 'user_id', allowAdminOverride: false },
      );

      expect(result).toBe(false);
    });
  });
});
