import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { RBACService } from '../rbac.service';
import { PermissionLogic } from '../decorators/require-permission.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let rbacService: jest.Mocked<RBACService>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    rbacService = {
      hasPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      hasAnyPermission: jest.fn(),
      checkOwnership: jest.fn(),
    } as any;

    guard = new PermissionsGuard(reflector, rbacService);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: 'user-123' },
          params: { id: 'resource-123' },
        }),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should allow access for public routes', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should allow access for skip permission routes', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      reflector.getAllAndOverride.mockReturnValueOnce(true); // skipPermission

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when no permission metadata', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if user not authenticated', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      reflector.getAllAndOverride.mockReturnValueOnce(false); // skipPermission
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.read'],
      });

      mockContext.switchToHttp().getRequest.mockReturnValue({});

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should check single permission with AND logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      reflector.getAllAndOverride.mockReturnValueOnce(false); // skipPermission
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.read'],
        logic: PermissionLogic.AND,
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: true,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasAllPermissions).toHaveBeenCalledWith('user-123', [
        'users.read',
      ]);
    });

    it('should check multiple permissions with AND logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.read', 'users.update'],
        logic: PermissionLogic.AND,
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: true,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasAllPermissions).toHaveBeenCalledWith('user-123', [
        'users.read',
        'users.update',
      ]);
    });

    it('should check permissions with OR logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.read', 'admin.access'],
        logic: PermissionLogic.OR,
      });

      rbacService.hasAnyPermission.mockResolvedValue({
        granted: true,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasAnyPermission).toHaveBeenCalledWith('user-123', [
        'users.read',
        'admin.access',
      ]);
    });

    it('should throw ForbiddenException when permission denied', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.delete'],
        logic: PermissionLogic.AND,
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: false,
        reason: 'Missing permission: users.delete',
        missingPermissions: ['users.delete'],
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should use custom error message when provided', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.delete'],
        logic: PermissionLogic.AND,
        errorMessage: 'Custom error message',
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: false,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Custom error message',
      );
    });

    it('should check ownership when required', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.update'],
        logic: PermissionLogic.AND,
        requireOwnership: true,
        ownershipField: 'created_by',
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: true,
      });

      rbacService.checkOwnership.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.checkOwnership).toHaveBeenCalled();
    });

    it('should deny access when ownership check fails', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.update'],
        logic: PermissionLogic.AND,
        requireOwnership: true,
      });

      rbacService.hasAllPermissions.mockResolvedValue({
        granted: true,
      });

      rbacService.checkOwnership.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should warn if RBACService not provided', async () => {
      const guardWithoutService = new PermissionsGuard(reflector);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        permissions: ['users.read'],
      });

      const result = await guardWithoutService.canActivate(mockContext);

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
