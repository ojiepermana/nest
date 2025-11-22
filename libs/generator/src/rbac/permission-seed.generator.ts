/**
 * Permission Seed SQL Generator
 *
 * Generates SQL INSERT statements for permissions based on generated endpoints
 */

export interface PermissionSeedOptions {
  resourceName: string;
  schema?: string;
  description?: string;
  category?: string;
  generateScopes?: boolean; // Generate scoped permissions (own, team, all)
}

export class PermissionSeedGenerator {
  /**
   * Generate permission seed SQL for CRUD operations
   * New format: {resource}:{action}:{scope}
   */
  generateCrudPermissions(options: PermissionSeedOptions): string {
    const { resourceName, schema = 'user', description, category, generateScopes = true } = options;

    const permissions: Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      scope: string;
      priority: number;
    }> = [];

    if (generateScopes) {
      // Generate scoped permissions: own, team, all
      permissions.push(
        {
          code: `${resourceName}:create:basic`,
          name: `Create ${resourceName}`,
          description: description
            ? `Create new ${description}`
            : `Permission to create new ${resourceName}`,
          category: category || resourceName,
          scope: 'own',
          priority: 10,
        },
        {
          code: `${resourceName}:read:own`,
          name: `View Own ${resourceName}`,
          description: description
            ? `View own ${description}`
            : `Permission to view own ${resourceName} records`,
          category: category || resourceName,
          scope: 'own',
          priority: 10,
        },
        {
          code: `${resourceName}:read:team`,
          name: `View Team ${resourceName}`,
          description: description
            ? `View team ${description}`
            : `Permission to view team ${resourceName} records`,
          category: category || resourceName,
          scope: 'team',
          priority: 20,
        },
        {
          code: `${resourceName}:read:all`,
          name: `View All ${resourceName}`,
          description: description
            ? `View all ${description}`
            : `Permission to view all ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 30,
        },
        {
          code: `${resourceName}:update:own`,
          name: `Update Own ${resourceName}`,
          description: description
            ? `Update own ${description}`
            : `Permission to update own ${resourceName} records`,
          category: category || resourceName,
          scope: 'own',
          priority: 10,
        },
        {
          code: `${resourceName}:update:team`,
          name: `Update Team ${resourceName}`,
          description: description
            ? `Update team ${description}`
            : `Permission to update team ${resourceName} records`,
          category: category || resourceName,
          scope: 'team',
          priority: 20,
        },
        {
          code: `${resourceName}:update:all`,
          name: `Update All ${resourceName}`,
          description: description
            ? `Update all ${description}`
            : `Permission to update all ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 30,
        },
        {
          code: `${resourceName}:delete:own`,
          name: `Delete Own ${resourceName}`,
          description: description
            ? `Delete own ${description}`
            : `Permission to delete own ${resourceName} records`,
          category: category || resourceName,
          scope: 'own',
          priority: 10,
        },
        {
          code: `${resourceName}:delete:team`,
          name: `Delete Team ${resourceName}`,
          description: description
            ? `Delete team ${description}`
            : `Permission to delete team ${resourceName} records`,
          category: category || resourceName,
          scope: 'team',
          priority: 20,
        },
        {
          code: `${resourceName}:delete:all`,
          name: `Delete All ${resourceName}`,
          description: description
            ? `Delete all ${description}`
            : `Permission to delete all ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 30,
        },
      );
    } else {
      // Simple mode: only basic CRUD (backward compatible)
      permissions.push(
        {
          code: `${resourceName}:create:basic`,
          name: `Create ${resourceName}`,
          description: description
            ? `Create new ${description}`
            : `Permission to create new ${resourceName}`,
          category: category || resourceName,
          scope: 'own',
          priority: 10,
        },
        {
          code: `${resourceName}:read:all`,
          name: `Read ${resourceName}`,
          description: description
            ? `View ${description}`
            : `Permission to view ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 10,
        },
        {
          code: `${resourceName}:update:all`,
          name: `Update ${resourceName}`,
          description: description
            ? `Edit ${description}`
            : `Permission to update ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 10,
        },
        {
          code: `${resourceName}:delete:all`,
          name: `Delete ${resourceName}`,
          description: description
            ? `Remove ${description}`
            : `Permission to delete ${resourceName} records`,
          category: category || resourceName,
          scope: 'all',
          priority: 10,
        },
      );
    }

    return this.generateInsertStatements(permissions, schema);
  }

  /**
   * Generate permission seed SQL for custom permissions
   */
  generateCustomPermissions(
    permissions: Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      scope?: string;
      priority?: number;
    }>,
    schema: string = 'user',
  ): string {
    // Add default scope and priority if not provided
    const permissionsWithDefaults = permissions.map((p) => ({
      ...p,
      scope: p.scope || 'all',
      priority: p.priority || 10,
    }));
    return this.generateInsertStatements(permissionsWithDefaults, schema);
  }

  /**
   * Generate INSERT statements
   */
  private generateInsertStatements(
    permissions: Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      scope: string;
      priority: number;
    }>,
    schema: string,
  ): string {
    const inserts = permissions.map((perm) => {
      return `INSERT INTO ${schema}.permissions (code, name, description, category, scope, priority, is_active)
VALUES ('${perm.code}', '${perm.name}', '${perm.description}', '${perm.category}', '${perm.scope}', ${perm.priority}, true)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  scope = EXCLUDED.scope,
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();`;
    });

    const comment = `-- ${permissions[0].category} Permissions
-- Auto-generated by nest-generator
-- Format: {resource}:{action}:{scope}
-- Generated at: ${new Date().toISOString()}
`;

    return comment + '\n' + inserts.join('\n\n');
  }

  /**
   * Generate permission seed SQL for complete module (CRUD + custom endpoints)
   */
  generateModulePermissions(
    resourceName: string,
    customEndpoints: Array<{
      action: string;
      name: string;
      description: string;
    }> = [],
    schema: string = 'user',
  ): string {
    // Generate CRUD permissions
    const crudSql = this.generateCrudPermissions({ resourceName, schema });

    // Generate custom endpoint permissions
    if (customEndpoints.length === 0) {
      return crudSql;
    }

    const customPermissions = customEndpoints.map((endpoint) => ({
      code: `${resourceName}.${endpoint.action}`,
      name: endpoint.name,
      description: endpoint.description,
      category: resourceName,
    }));

    const customSql = this.generateCustomPermissions(customPermissions, schema);

    return `${crudSql}\n\n-- Custom Endpoint Permissions\n${customSql}`;
  }

  /**
   * Generate role-permission mapping SQL
   */
  generateRolePermissions(
    roleCode: string,
    permissions: string[],
    schema: string = 'user',
  ): string {
    const inserts = permissions.map((permCode) => {
      return `INSERT INTO ${schema}.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM ${schema}.roles r, ${schema}.permissions p
WHERE r.code = '${roleCode}' AND p.code = '${permCode}'
ON CONFLICT (role_id, permission_id) DO NOTHING;`;
    });

    const comment = `-- Role-Permission Mapping for: ${roleCode}
-- Generated at: ${new Date().toISOString()}
`;

    return comment + '\n' + inserts.join('\n\n');
  }

  /**
   * Generate complete permission setup SQL (permissions + role mappings)
   */
  generateCompleteSetup(
    resourceName: string,
    options: {
      customEndpoints?: Array<{
        action: string;
        name: string;
        description: string;
      }>;
      roleMappings?: Array<{
        roleCode: string;
        permissions: string[];
      }>;
      schema?: string;
    } = {},
  ): string {
    const { customEndpoints = [], roleMappings = [], schema = 'user' } = options;

    // Generate permission INSERT statements
    const permissionsSql = this.generateModulePermissions(resourceName, customEndpoints, schema);

    if (roleMappings.length === 0) {
      return permissionsSql;
    }

    // Generate role-permission mappings
    const mappingsSql = roleMappings
      .map((mapping) => this.generateRolePermissions(mapping.roleCode, mapping.permissions, schema))
      .join('\n\n');

    return `${permissionsSql}\n\n-- ========================================
-- Role-Permission Mappings
-- ========================================\n\n${mappingsSql}`;
  }
}
