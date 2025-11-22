import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RBACService } from '../rbac.service';
import { RoleLogic } from '../decorators/require-role.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let rbacService: jest.Mocked<RBACService>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    rbacService = {
      hasRole: jest.fn(),
    } as any;

    guard = new RolesGuard(reflector, rbacService);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: 'user-123' },
        }),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should allow access for public routes', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access for skip permission routes', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      reflector.getAllAndOverride.mockReturnValueOnce(true); // skipPermission

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when no role metadata', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if user not authenticated', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      reflector.getAllAndOverride.mockReturnValueOnce(false); // skipPermission
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
      });

      (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({});

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should check single role with AND logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'admin', true, true);
    });

    it('should check multiple roles with AND logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin', 'moderator'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'admin', true, true);
      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'moderator', true, true);
    });

    it('should check roles with OR logic', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin', 'moderator'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'admin', true, true);
      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'moderator', true, true);
    });

    it('should throw ForbiddenException when role check fails', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should use custom error message when provided', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: 'Admin access required',
          activeOnly: true,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Admin access required');
    });

    it('should respect activeOnly option', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: false,
          checkExpiration: true,
        },
      });

      rbacService.hasRole.mockResolvedValue(true);

      await guard.canActivate(mockContext);

      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'admin', false, true);
    });

    it('should respect checkExpiration option', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: false,
        },
      });

      rbacService.hasRole.mockResolvedValue(true);

      await guard.canActivate(mockContext);

      expect(rbacService.hasRole).toHaveBeenCalledWith('user-123', 'admin', true, false);
    });

    it('should warn if RBACService not provided', async () => {
      const guardWithoutService = new RolesGuard(reflector);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce({
        roles: ['admin'],
      });

      const result = await guardWithoutService.canActivate(mockContext);

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
