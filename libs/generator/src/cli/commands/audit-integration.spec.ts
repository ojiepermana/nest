/**
 * Audit Trail CLI Integration Tests
 *
 * Validates that audit logging is properly integrated when enabled via CLI
 */

import { ServiceGenerator } from '../../generators/service/service.generator';
import { ModuleGenerator } from '../../generators/module/module.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('Audit Trail CLI Integration', () => {
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    // Mock table metadata
    tableMetadata = {
      id: '123',
      schema_name: 'public',
      table_name: 'users',
      table_type: 'TABLE' as any,
      table_purpose: 'User management',
      has_soft_delete: false,
      has_created_by: true,
      primary_key_column: 'id',
      primary_key_type: 'uuid',
      is_partitioned: false,
      model_class: 'Users',
      controller_class: 'UsersController',
      request_class: 'UsersDto',
      resource_class: 'UsersResource',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      updated_by: 'system',
    };

    // Mock columns
    columns = [
      {
        id: '1',
        table_metadata_id: '123',
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: false,
        is_unique: true,
        is_primary_key: true,
        is_required: true,
        is_filterable: true,
        is_searchable: false,
        display_in_list: true,
        display_in_form: false,
        display_in_detail: true,
        column_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      },
      {
        id: '2',
        table_metadata_id: '123',
        column_name: 'username',
        data_type: 'varchar',
        is_nullable: false,
        is_unique: true,
        is_primary_key: false,
        is_required: true,
        is_filterable: true,
        is_searchable: true,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      },
    ];
  });

  describe('ServiceGenerator with Audit', () => {
    it('should import AuditLogService when audit is enabled', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
      });

      const code = generator.generate();

      expect(code).toContain(
        "import { AuditLogService } from '@ojiepermana/nest-generator/audit';",
      );
    });

    it('should inject AuditLogService in constructor', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
      });

      const code = generator.generate();

      expect(code).toContain(
        'private readonly auditLogService: AuditLogService',
      );
    });

    it('should add audit logging in create method', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
        enableErrorHandling: true,
      });

      const code = generator.generate();

      expect(code).toContain('await this.auditLogService.log({');
      expect(code).toContain("entity: 'Users'");
      expect(code).toContain("action: 'CREATE'");
    });

    it('should add audit logging in update method', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
        enableErrorHandling: true,
      });

      const code = generator.generate();

      expect(code).toContain("action: 'UPDATE'");
      expect(code).toContain('data: updateDto');
    });

    it('should add audit logging in delete method', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
        enableErrorHandling: true,
      });

      const code = generator.generate();

      expect(code).toContain("action: 'DELETE'");
    });

    it('should not import AuditLogService when audit is disabled', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: false,
      });

      const code = generator.generate();

      expect(code).not.toContain('AuditLogService');
    });

    it('should not add audit log calls when audit is disabled', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: false,
        enableErrorHandling: true,
      });

      const code = generator.generate();

      expect(code).not.toContain('auditLogService.log');
    });
  });

  describe('ModuleGenerator with Audit', () => {
    it('should import AuditModule when audit is enabled', () => {
      const generator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
      });

      const code = generator.generate();

      expect(code).toContain(
        "import { AuditModule } from '@ojiepermana/nest-generator/audit';",
      );
    });

    it('should include AuditModule in imports array', () => {
      const generator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
      });

      const code = generator.generate();

      expect(code).toContain('imports: [');
      expect(code).toContain('AuditModule');
    });

    it('should not import AuditModule when audit is disabled', () => {
      const generator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: false,
      });

      const code = generator.generate();

      expect(code).not.toContain('AuditModule');
    });

    it('should work with multiple features enabled', () => {
      const generator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
        enableCaching: true,
      });

      const code = generator.generate();

      expect(code).toContain('AuditModule');
      expect(code).toContain('CacheModule');
    });
  });

  describe('Integration Test', () => {
    it('should generate complete module with audit enabled', () => {
      // Generate service
      const serviceGenerator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
        enableErrorHandling: true,
        enableValidation: true,
      });
      const serviceCode = serviceGenerator.generate();

      // Generate module
      const moduleGenerator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: true,
      });
      const moduleCode = moduleGenerator.generate();

      // Verify service has audit
      expect(serviceCode).toContain('AuditLogService');
      expect(serviceCode).toContain('auditLogService.log');

      // Verify module imports AuditModule
      expect(moduleCode).toContain('AuditModule');

      // Verify they use compatible imports
      expect(serviceCode).toContain('@ojiepermana/nest-generator/audit');
      expect(moduleCode).toContain('@ojiepermana/nest-generator/audit');
    });

    it('should generate clean code without audit when disabled', () => {
      const serviceGenerator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: false,
      });
      const serviceCode = serviceGenerator.generate();

      const moduleGenerator = new ModuleGenerator(tableMetadata, columns, {
        tableName: 'users',
        entityName: 'Users',
        enableAuditLog: false,
      });
      const moduleCode = moduleGenerator.generate();

      // No audit references
      expect(serviceCode).not.toContain('AuditLogService');
      expect(moduleCode).not.toContain('AuditModule');
    });
  });

  describe('Feature Flags', () => {
    it('should respect auditLog feature flag', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const code = generator.generate();
      expect(code).toContain('AuditLogService');
    });

    it('should work with multiple features', () => {
      const generator = new ServiceGenerator(tableMetadata, columns, {
        tableName: 'users',
        enableAuditLog: true,
        enableCaching: true,
        enableValidation: true,
        enableTransactions: true,
      });

      const code = generator.generate();

      expect(code).toContain('AuditLogService');
      expect(code).toContain('Cache');
      expect(code).toContain('DataSource');
    });
  });
});
