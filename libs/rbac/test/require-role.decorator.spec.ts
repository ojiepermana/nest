import { SetMetadata } from '@nestjs/common';
import {
  RequireRole,
  RequireAnyRole,
  RequireAllRoles,
  RequireAdmin,
  RequireSuperAdmin,
  RequireModerator,
  Public,
  SkipPermission,
  ROLES_KEY,
  IS_PUBLIC_KEY,
  SKIP_PERMISSION_KEY,
  RoleLogic,
} from '../src/decorators/require-role.decorator';

// Mock SetMetadata
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => {
    return (target: any) => {
      target[key] = value;
      return target;
    };
  }),
}));

describe('Role Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('@RequireRole', () => {
    it('should set metadata with single role', () => {
      const decorator = RequireRole('admin');
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });

    it('should set metadata with multiple roles', () => {
      const decorator = RequireRole(['admin', 'moderator']);
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin', 'moderator'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });

    it('should set metadata with custom error message', () => {
      const decorator = RequireRole('admin', { errorMessage: 'Custom error' });
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: 'Custom error',
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@RequireAnyRole', () => {
    it('should require any of the specified roles', () => {
      const decorator = RequireAnyRole(['admin', 'moderator']);
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin', 'moderator'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@RequireAllRoles', () => {
    it('should set metadata with AND logic', () => {
      const decorator = RequireRole(['admin', 'moderator'], { logic: RoleLogic.AND });
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin', 'moderator'],
        options: {
          logic: RoleLogic.AND,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@RequireAdmin', () => {
    it('should require admin role', () => {
      const decorator = RequireAdmin();
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['admin'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@RequireSuperAdmin', () => {
    it('should require super_admin role', () => {
      const decorator = RequireSuperAdmin();
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['super_admin'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@RequireModerator', () => {
    it('should require moderator role', () => {
      const decorator = RequireModerator();
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, {
        roles: ['moderator'],
        options: {
          logic: RoleLogic.OR,
          errorMessage: undefined,
          activeOnly: true,
          checkExpiration: true,
        },
      });
    });
  });

  describe('@Public', () => {
    it('should set public metadata to true', () => {
      const decorator = Public();
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    });
  });

  describe('@SkipPermission', () => {
    it('should set skip permission metadata to true', () => {
      const decorator = SkipPermission();
      const target = {};

      decorator(target, 'method', {} as PropertyDescriptor);

      expect(SetMetadata).toHaveBeenCalledWith(SKIP_PERMISSION_KEY, true);
    });
  });

  describe('RoleLogic Enum', () => {
    it('should have AND and OR values', () => {
      expect(RoleLogic.AND).toBe('AND');
      expect(RoleLogic.OR).toBe('OR');
    });
  });

  describe('Constants', () => {
    it('should have correct metadata keys', () => {
      expect(ROLES_KEY).toBe('roles');
      expect(IS_PUBLIC_KEY).toBe('isPublic');
      expect(SKIP_PERMISSION_KEY).toBe('skipPermission');
    });
  });
});
