/**
 * Module Generator Tests
 *
 * Tests for NestJS module generation
 */

import { ModuleGenerator } from './module.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('ModuleGenerator', () => {
  let mockTableMetadata: TableMetadata;
  let mockColumns: ColumnMetadata[];

  beforeEach(() => {
    mockTableMetadata = {
      table_name: 'users',
      schema_name: 'public',
    } as TableMetadata;

    mockColumns = [
      {
        table_name: 'users',
        column_name: 'id',
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
      } as ColumnMetadata,
      {
        table_name: 'users',
        column_name: 'name',
        data_type: 'varchar',
        is_nullable: false,
        is_primary_key: false,
      } as ColumnMetadata,
    ];
  });

  describe('Basic Module Generation', () => {
    it('should generate basic module class', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@Module({');
      expect(result).toContain('export class UsersModule {}');
    });

    it('should use custom entity name if provided', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        entityName: 'CustomUser',
      });

      const result = generator.generate();

      expect(result).toContain('export class CustomUserModule {}');
      expect(result).toContain('CustomUser');
    });
  });

  describe('Import Generation', () => {
    it('should generate correct basic imports', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("import { Module } from '@nestjs/common';");
      expect(result).toContain(
        "import { TypeOrmModule } from '@nestjs/typeorm';",
      );
      expect(result).toContain(
        "import { Users } from './entities/users.entity';",
      );
      expect(result).toContain(
        "import { UsersController } from './controllers/users.controller';",
      );
      expect(result).toContain(
        "import { UsersService } from './services/users.service';",
      );
      expect(result).toContain(
        "import { UsersRepository } from './repositories/users.repository';",
      );
    });

    it('should include CacheModule import when caching enabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { CacheModule } from '@nestjs/cache-manager';",
      );
    });

    it('should not include CacheModule import when caching disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: false,
      });

      const result = generator.generate();

      expect(result).not.toContain(
        "import { CacheModule } from '@nestjs/cache-manager';",
      );
    });

    it('should include AuditLogService import when audit enabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { AuditLogService } from '../audit/audit-log.service';",
      );
    });

    it('should not include controller import when controller disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        includeController: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('UsersController');
    });
  });

  describe('Module Decorator', () => {
    it('should include TypeOrmModule.forFeature in imports', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('imports: [TypeOrmModule.forFeature([Users])');
    });

    it('should include CacheModule.register when caching enabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain('CacheModule.register()');
    });

    it('should include controller in controllers array', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('controllers: [UsersController]');
    });

    it('should not include controller when disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        includeController: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('controllers:');
    });

    it('should include service and repository in providers', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('providers: [UsersService, UsersRepository');
    });

    it('should include AuditLogService in providers when enabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain('AuditLogService');
    });

    it('should export service and repository', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('exports: [UsersService, UsersRepository');
    });

    it('should not include service when disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        includeService: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('UsersService');
    });

    it('should not include repository when disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        includeRepository: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('UsersRepository');
    });
  });

  describe('Custom Configuration', () => {
    it('should include custom providers', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customProviders: ['CustomService', 'AnotherProvider'],
      });

      const result = generator.generate();

      expect(result).toContain('CustomService');
      expect(result).toContain('AnotherProvider');
    });

    it('should include custom imports', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customImports: ['CustomModule', 'AnotherModule'],
      });

      const result = generator.generate();

      expect(result).toContain('CustomModule');
      expect(result).toContain('AnotherModule');
    });

    it('should include custom exports', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customExports: ['CustomService'],
      });

      const result = generator.generate();

      expect(result).toContain('CustomService');
    });
  });

  describe('Combined Features', () => {
    it('should generate module with all features enabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
        enableAuditLog: true,
        customProviders: ['EmailService'],
        customImports: ['EmailModule'],
        customExports: ['UsersService'],
      });

      const result = generator.generate();

      // Check all imports present
      expect(result).toContain("import { Module } from '@nestjs/common';");
      expect(result).toContain(
        "import { TypeOrmModule } from '@nestjs/typeorm';",
      );
      expect(result).toContain(
        "import { CacheModule } from '@nestjs/cache-manager';",
      );
      expect(result).toContain('AuditLogService');

      // Check module config
      expect(result).toContain('TypeOrmModule.forFeature([Users])');
      expect(result).toContain('CacheModule.register()');
      expect(result).toContain('EmailModule');
      expect(result).toContain('controllers: [UsersController]');
      expect(result).toContain('UsersService');
      expect(result).toContain('UsersRepository');
      expect(result).toContain('EmailService');
    });

    it('should generate minimal module with optional features disabled', () => {
      const generator = new ModuleGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        includeController: false,
        enableCaching: false,
        enableAuditLog: false,
      });

      const result = generator.generate();

      // Check optional features absent
      expect(result).not.toContain('CacheModule');
      expect(result).not.toContain('AuditLogService');
      expect(result).not.toContain('controllers:');

      // Check required features present
      expect(result).toContain('TypeOrmModule.forFeature');
      expect(result).toContain('UsersService');
      expect(result).toContain('UsersRepository');
    });
  });
});
