import { SetMetadata } from '@nestjs/common';
import {
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireOwnership,
  PERMISSIONS_KEY,
  PermissionLogic,
} from './require-permission.decorator';

// Mock SetMetadata
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => {
    return (target: any) => {
      target[key] = value;
      return target;
    };
  }),
}));

describe('Permission Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('@RequirePermission', () => {
    it('should set metadata with single permission', () => {
      const decorator = RequirePermission('users.read');
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.read'],
        logic: PermissionLogic.AND,
        requireOwnership: false,
      });
    });

    it('should set metadata with multiple permissions', () => {
      const decorator = RequirePermission(['users.read', 'users.update']);
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.read', 'users.update'],
        logic: PermissionLogic.AND,
        requireOwnership: false,
      });
    });

    it('should set metadata with custom options', () => {
      const decorator = RequirePermission('users.delete', {
        logic: PermissionLogic.OR,
        errorMessage: 'Custom error',
        requireOwnership: true,
        ownershipField: 'created_by',
      });
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.delete'],
        logic: PermissionLogic.OR,
        errorMessage: 'Custom error',
        requireOwnership: true,
        ownershipField: 'created_by',
      });
    });

    it('should default to AND logic', () => {
      const decorator = RequirePermission(['users.read', 'users.update']);
      const target = {};

      decorator(target);

      const metadata = (SetMetadata as jest.Mock).mock.calls[0][1];
      expect(metadata.logic).toBe(PermissionLogic.AND);
    });

    it('should default ownershipField to "created_by"', () => {
      const decorator = RequirePermission('users.update', {
        requireOwnership: true,
      });
      const target = {};

      decorator(target);

      const metadata = (SetMetadata as jest.Mock).mock.calls[0][1];
      expect(metadata.ownershipField).toBe('created_by');
    });
  });

  describe('@RequireAnyPermission', () => {
    it('should set OR logic for multiple permissions', () => {
      const decorator = RequireAnyPermission(['users.read', 'admin.access']);
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.read', 'admin.access'],
        logic: PermissionLogic.OR,
        requireOwnership: false,
      });
    });

    it('should accept single permission', () => {
      const decorator = RequireAnyPermission('users.read');
      const target = {};

      decorator(target);

      const metadata = (SetMetadata as jest.Mock).mock.calls[0][1];
      expect(metadata.permissions).toEqual(['users.read']);
      expect(metadata.logic).toBe(PermissionLogic.OR);
    });
  });

  describe('@RequireAllPermissions', () => {
    it('should set AND logic for multiple permissions', () => {
      const decorator = RequireAllPermissions(['users.read', 'users.update']);
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.read', 'users.update'],
        logic: PermissionLogic.AND,
        requireOwnership: false,
      });
    });

    it('should accept single permission', () => {
      const decorator = RequireAllPermissions('users.read');
      const target = {};

      decorator(target);

      const metadata = (SetMetadata as jest.Mock).mock.calls[0][1];
      expect(metadata.permissions).toEqual(['users.read']);
      expect(metadata.logic).toBe(PermissionLogic.AND);
    });
  });

  describe('@RequireOwnership', () => {
    it('should set ownership requirement with permission', () => {
      const decorator = RequireOwnership('users.update');
      const target = {};

      decorator(target);

      expect(SetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, {
        permissions: ['users.update'],
        logic: PermissionLogic.AND,
        requireOwnership: true,
        ownershipField: 'created_by',
      });
    });

    it('should use custom ownership field', () => {
      const decorator = RequireOwnership('users.update', 'user_id');
      const target = {};

      decorator(target);

      const metadata = (SetMetadata as jest.Mock).mock.calls[0][1];
      expect(metadata.requireOwnership).toBe(true);
      expect(metadata.ownershipField).toBe('user_id');
    });
  });

  describe('PermissionLogic Enum', () => {
    it('should have AND and OR values', () => {
      expect(PermissionLogic.AND).toBe('AND');
      expect(PermissionLogic.OR).toBe('OR');
    });
  });

  describe('PERMISSIONS_KEY constant', () => {
    it('should be defined', () => {
      expect(PERMISSIONS_KEY).toBe('permissions');
    });
  });
});
