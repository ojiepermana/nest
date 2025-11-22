import { PermissionSeedGenerator } from '../../generator/src/rbac/permission-seed.generator';

describe('PermissionSeedGenerator', () => {
  let generator: PermissionSeedGenerator;

  beforeEach(() => {
    generator = new PermissionSeedGenerator();
  });

  describe('generateCrudPermissions', () => {
    it('should generate CRUD permission SQL with scopes', () => {
      const sql = generator.generateCrudPermissions({
        resourceName: 'users',
        generateScopes: true,
      });

      expect(sql).toContain('users:create:basic');
      expect(sql).toContain('users:read:own');
      expect(sql).toContain('users:read:team');
      expect(sql).toContain('users:read:all');
      expect(sql).toContain('users:update:own');
      expect(sql).toContain('users:delete:all');
      expect(sql).toContain('INSERT INTO user.permissions');
      expect(sql).toContain('ON CONFLICT (code) DO UPDATE');
    });

    it('should use custom schema when provided', () => {
      const sql = generator.generateCrudPermissions({
        resourceName: 'products',
        schema: 'custom_schema',
      });

      expect(sql).toContain('INSERT INTO custom_schema.permissions');
    });

    it('should include description when provided', () => {
      const sql = generator.generateCrudPermissions({
        resourceName: 'users',
        description: 'user accounts',
        generateScopes: true,
      });

      expect(sql).toContain('Create new user accounts');
      expect(sql).toContain('View own user accounts');
      expect(sql).toContain('View team user accounts');
      expect(sql).toContain('Update own user accounts');
      expect(sql).toContain('Delete all user accounts');
    });

    it('should use custom category when provided', () => {
      const sql = generator.generateCrudPermissions({
        resourceName: 'users',
        category: 'user_management',
        generateScopes: true,
      });

      expect(sql).toContain("'user_management'");
      expect(sql).toContain('users:create:basic');
    });
  });

  describe('generateCustomPermissions', () => {
    it('should generate custom permission SQL', () => {
      const permissions = [
        {
          code: 'users:export:all',
          name: 'Export Users',
          description: 'Export users to CSV',
          category: 'users',
          scope: 'all',
          priority: 30,
        },
        {
          code: 'users:import:all',
          name: 'Import Users',
          description: 'Import users from CSV',
          category: 'users',
          scope: 'all',
          priority: 30,
        },
      ];

      const sql = generator.generateCustomPermissions(permissions);

      expect(sql).toContain('users:export:all');
      expect(sql).toContain('users:import:all');
      expect(sql).toContain('Export Users');
      expect(sql).toContain('Import users from CSV');
    });
  });

  describe('generateModulePermissions', () => {
    it('should generate CRUD permissions only when no custom endpoints', () => {
      const sql = generator.generateModulePermissions('products');

      expect(sql).toContain('products:create:basic');
      expect(sql).toContain('products:read:own');
      expect(sql).toContain('products:update:own');
      expect(sql).toContain('products:delete:own');
      expect(sql).not.toContain('Custom Endpoint Permissions');
    });

    it('should generate CRUD + custom endpoint permissions', () => {
      const customEndpoints = [
        {
          action: 'export',
          name: 'Export Products',
          description: 'Export products to CSV',
          scope: 'all',
        },
      ];

      const sql = generator.generateModulePermissions('products', customEndpoints);

      expect(sql).toContain('products:create:basic');
      expect(sql).toContain('products:export:all');
      expect(sql).toContain('Export Products');
      expect(sql).toContain('Custom Endpoint Permissions');
    });
  });

  describe('generateRolePermissions', () => {
    it('should generate role-permission mapping SQL', () => {
      const permissions = ['users:create:basic', 'users:read:all', 'users:update:all'];
      const sql = generator.generateRolePermissions('admin', permissions);

      expect(sql).toContain('INSERT INTO user.role_permissions');
      expect(sql).toContain("r.code = 'admin'");
      expect(sql).toContain("p.code = 'users:create:basic'");
      expect(sql).toContain("p.code = 'users:read:all'");
      expect(sql).toContain("p.code = 'users:update:all'");
      expect(sql).toContain('ON CONFLICT (role_id, permission_id) DO NOTHING');
    });
  });

  describe('generateCompleteSetup', () => {
    it('should generate permissions only when no role mappings', () => {
      const sql = generator.generateCompleteSetup('users');

      expect(sql).toContain('users:create:basic');
      expect(sql).not.toContain('Role-Permission Mappings');
    });

    it('should generate permissions + role mappings', () => {
      const sql = generator.generateCompleteSetup('users', {
        roleMappings: [
          {
            roleCode: 'admin',
            permissions: [
              'users:create:basic',
              'users:read:all',
              'users:update:all',
              'users:delete:all',
            ],
          },
          {
            roleCode: 'viewer',
            permissions: ['users:read:own'],
          },
        ],
      });

      expect(sql).toContain('users:create:basic');
      expect(sql).toContain('Role-Permission Mappings');
      expect(sql).toContain("r.code = 'admin'");
      expect(sql).toContain("r.code = 'viewer'");
    });

    it('should include custom endpoints in complete setup', () => {
      const sql = generator.generateCompleteSetup('products', {
        customEndpoints: [
          {
            action: 'export',
            name: 'Export Products',
            description: 'Export to CSV',
            scope: 'all',
          },
        ],
        roleMappings: [
          {
            roleCode: 'admin',
            permissions: ['products:export:all'],
          },
        ],
      });

      expect(sql).toContain('products:export:all');
      expect(sql).toContain('Export Products');
      expect(sql).toContain("p.code = 'products:export:all'");
    });
  });

  describe('SQL Formatting', () => {
    it('should include auto-generated comments', () => {
      const sql = generator.generateCrudPermissions({
        resourceName: 'users',
        generateScopes: true,
      });

      expect(sql).toContain('Auto-generated by nest-generator');
      expect(sql).toContain('Format: {resource}:{action}:{scope}');
      expect(sql).toContain('Generated at:');
    });

    it('should have proper SQL syntax', () => {
      const sql = generator.generateCrudPermissions({ resourceName: 'users' });

      // Check for proper INSERT structure
      expect(sql).toMatch(/INSERT INTO .+ \(/);
      expect(sql).toMatch(/VALUES \(/);

      // Check for ON CONFLICT clause
      expect(sql).toContain('ON CONFLICT (code) DO UPDATE');

      // Check for SET clause in UPDATE
      expect(sql).toContain('SET');
      expect(sql).toContain('= EXCLUDED.');
    });
  });
});
