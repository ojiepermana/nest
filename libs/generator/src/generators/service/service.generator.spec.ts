/**
 * Service Generator Tests
 */

import { ServiceGenerator } from './service.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('ServiceGenerator', () => {
  const mockTableMetadata: TableMetadata = {
    table_name: 'users',
    display_name: 'Users',
    is_junction_table: false,
  } as TableMetadata;

  const mockColumns: ColumnMetadata[] = [
    {
      table_name: 'users',
      column_name: 'id',
      data_type: 'integer',
      is_nullable: false,
      is_primary_key: true,
      is_unique: false,
      is_filterable: true,
    } as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'email',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
      is_unique: true,
      is_filterable: true,
    } as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'name',
      data_type: 'varchar',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_filterable: true,
    } as ColumnMetadata,
  ];

  describe('Basic Service Generation', () => {
    it('should generate basic service class', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('export class UsersService');
      expect(result).toContain('@Injectable()');
      expect(result).toContain('import { Injectable');
    });

    it('should generate constructor with repository injection', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('private readonly repository: UsersRepository');
      expect(result).toContain('constructor(');
    });

    it('should use custom entity name if provided', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        entityName: 'User',
      });

      const result = generator.generate();

      expect(result).toContain('export class UserService');
      expect(result).toContain('UserRepository');
    });
  });

  describe('Import Generation', () => {
    it('should generate correct basic imports', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'",
      );
      expect(result).toContain(
        "import { UsersRepository } from '../repositories/users.repository'",
      );
      expect(result).toContain(
        "import { Users } from '../entities/users.entity'",
      );
      expect(result).toContain(
        "import { CreateUsersDto } from '../dto/create-users.dto'",
      );
      expect(result).toContain(
        "import { UpdateUsersDto } from '../dto/update-users.dto'",
      );
      expect(result).toContain(
        "import { UsersFilterDto } from '../dto/users-filter.dto'",
      );
    });

    it('should include caching imports when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { CACHE_MANAGER } from '@nestjs/cache-manager'",
      );
      expect(result).toContain("import { Inject } from '@nestjs/common'");
      expect(result).toContain("import { Cache } from 'cache-manager'");
    });

    it('should include transaction imports when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableTransactions: true,
      });

      const result = generator.generate();

      expect(result).toContain("import { DataSource } from 'typeorm'");
    });

    it('should include audit log imports when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { AuditLogService } from '../audit/audit-log.service'",
      );
    });
  });

  describe('CRUD Methods', () => {
    it('should generate create method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async create(createDto: CreateUsersDto)');
      expect(result).toContain('Promise<Users>');
      expect(result).toContain('await this.repository.create(createDto)');
    });

    it('should generate findAll method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findAll(): Promise<Users[]>');
      expect(result).toContain('this.repository.findAll()');
    });

    it('should generate findOne method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findOne(id: number): Promise<Users>');
      expect(result).toContain('await this.repository.findOne(id)');
    });

    it('should generate update method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain(
        'async update(id: number, updateDto: UpdateUsersDto)',
      );
      expect(result).toContain('Promise<Users>');
      expect(result).toContain('await this.repository.update(id, updateDto)');
    });

    it('should generate remove method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async remove(id: number): Promise<void>');
      expect(result).toContain('await this.repository.remove(id)');
    });
  });

  describe('Error Handling', () => {
    it('should include error handling when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableErrorHandling: true,
      });

      const result = generator.generate();

      expect(result).toContain('try {');
      expect(result).toContain('catch (error)');
      expect(result).toContain('throw new BadRequestException');
    });

    it('should include NotFoundException in findOne when error handling enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableErrorHandling: true,
      });

      const result = generator.generate();

      expect(result).toContain('if (!users) {');
      expect(result).toContain('throw new NotFoundException');
    });

    it('should not include try-catch when error handling disabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableErrorHandling: false,
      });

      const result = generator.generate();

      const createMethod = result.substring(
        result.indexOf('async create('),
        result.indexOf('async findAll('),
      );
      expect(createMethod).not.toContain('try {');
    });
  });

  describe('Caching', () => {
    it('should include cache manager in constructor when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        '@Inject(CACHE_MANAGER) private readonly cacheManager: Cache',
      );
    });

    it('should include cache logic in findAll when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain("const cacheKey = 'users:all'");
      expect(result).toContain('await this.cacheManager.get');
      expect(result).toContain('await this.cacheManager.set');
    });

    it('should include cache invalidation in create when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain('await this.invalidateCache()');
    });

    it('should include invalidateCache helper method when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      expect(result).toContain('private async invalidateCache()');
      expect(result).toContain("key.startsWith('users:')");
    });

    it('should not include cache logic when disabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('cacheManager');
      expect(result).not.toContain('invalidateCache');
    });
  });

  describe('Validation', () => {
    it('should include validation when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: true,
      });

      const result = generator.generate();

      expect(result).toContain('await this.validateUniqueConstraints');
      expect(result).toContain('private async validateUniqueConstraints');
    });

    it('should validate unique constraints for unique columns', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: true,
      });

      const result = generator.generate();

      expect(result).toContain("if ('email' in data && data.email)");
      expect(result).toContain(
        "throw new ConflictException('email already exists')",
      );
    });

    it('should validate exists before update when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: true,
      });

      const result = generator.generate();

      const updateMethod = result.substring(
        result.indexOf('async update('),
        result.indexOf('async remove('),
      );
      expect(updateMethod).toContain('await this.findOne(id)');
    });

    it('should not include validation when disabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('validateUniqueConstraints');
    });
  });

  describe('Audit Logging', () => {
    it('should include audit log service in constructor when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        'private readonly auditLogService: AuditLogService',
      );
    });

    it('should log create action when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain('await this.auditLogService.log');
      expect(result).toContain("action: 'CREATE'");
    });

    it('should log update action when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain("action: 'UPDATE'");
    });

    it('should log delete action when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: true,
      });

      const result = generator.generate();

      expect(result).toContain("action: 'DELETE'");
    });

    it('should not include audit logging when disabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableAuditLog: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('auditLogService');
    });
  });

  describe('Transactions', () => {
    it('should include DataSource in constructor when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableTransactions: true,
      });

      const result = generator.generate();

      expect(result).toContain('private readonly dataSource: DataSource');
    });

    it('should generate transaction helper method when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableTransactions: true,
      });

      const result = generator.generate();

      expect(result).toContain('async transaction<T>(');
      expect(result).toContain(
        'const queryRunner = this.dataSource.createQueryRunner()',
      );
      expect(result).toContain('await queryRunner.startTransaction()');
      expect(result).toContain('await queryRunner.commitTransaction()');
      expect(result).toContain('await queryRunner.rollbackTransaction()');
    });

    it('should not include transaction support when disabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableTransactions: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('dataSource');
      expect(result).not.toContain('queryRunner');
    });
  });

  describe('Filter Methods', () => {
    it('should generate findWithFilters method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findWithFilters(');
      expect(result).toContain('filterDto: UsersFilterDto');
      expect(result).toContain('page?: number; limit?: number');
      expect(result).toContain('data: Users[]; total: number');
      expect(result).toContain('await this.repository.findWithFilters');
    });

    it('should include caching in findWithFilters when enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
      });

      const result = generator.generate();

      const filterMethod = result.substring(
        result.indexOf('async findWithFilters('),
        result.indexOf('async count('),
      );
      expect(filterMethod).toContain('JSON.stringify({ filterDto, options })');
      expect(filterMethod).toContain('await this.cacheManager.get');
    });
  });

  describe('Custom Methods', () => {
    it('should generate count method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async count(): Promise<number>');
      expect(result).toContain('this.repository.count()');
    });

    it('should generate exists method', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async exists(id: number): Promise<boolean>');
      expect(result).toContain('this.repository.exists');
    });
  });

  describe('Combined Features', () => {
    it('should generate service with all features enabled', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: true,
        enableErrorHandling: true,
        enableTransactions: true,
        enableValidation: true,
        enableAuditLog: true,
      });

      const result = generator.generate();

      // Check all features present
      expect(result).toContain('cacheManager');
      expect(result).toContain('try {');
      expect(result).toContain('dataSource');
      expect(result).toContain('validateUniqueConstraints');
      expect(result).toContain('auditLogService');
    });

    it('should generate minimal service with no optional features', () => {
      const generator = new ServiceGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableCaching: false,
        enableErrorHandling: false,
        enableTransactions: false,
        enableValidation: false,
        enableAuditLog: false,
      });

      const result = generator.generate();

      // Check only basic methods present
      expect(result).toContain('async create(');
      expect(result).toContain('async findAll(');
      expect(result).toContain('async findOne(');
      expect(result).toContain('async update(');
      expect(result).toContain('async remove(');

      // Check optional features absent
      expect(result).not.toContain('cacheManager');
      expect(result).not.toContain('dataSource');
      expect(result).not.toContain('validateUniqueConstraints');
      expect(result).not.toContain('auditLogService');
    });
  });
});
