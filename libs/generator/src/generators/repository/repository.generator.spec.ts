/**
 * Repository Generator Tests
 */

import { RepositoryGenerator } from './repository.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

describe('RepositoryGenerator', () => {
  const mockTableMetadata: TableMetadata = {
    table_name: 'users',
    display_name: 'Users',
    is_junction_table: false,
  } as unknown as TableMetadata;

  const mockColumns: ColumnMetadata[] = [
    {
      table_name: 'users',
      column_name: 'id',
      data_type: 'integer',
      is_nullable: false,
      is_primary_key: true,
      is_filterable: true,
    } as unknown as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'email',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
      is_filterable: true,
    } as unknown as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'name',
      data_type: 'varchar',
      is_nullable: true,
      is_primary_key: false,
      is_filterable: true,
    } as unknown as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'age',
      data_type: 'integer',
      is_nullable: true,
      is_primary_key: false,
      is_filterable: true,
    } as unknown as ColumnMetadata,
  ];

  describe('Basic Repository Generation', () => {
    it('should generate basic repository class', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('export class UsersRepository');
      expect(result).toContain('@Injectable()');
      expect(result).toContain('import { Injectable }');
      expect(result).toContain('import { InjectRepository }');
      expect(result).toContain('import { Repository');
    });

    it('should generate constructor with repository injection', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@InjectRepository(Users)');
      expect(result).toContain('private readonly repository: Repository<Users>');
      expect(result).toContain('constructor(');
    });

    it('should use custom entity name if provided', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        entityName: 'User',
      });

      const result = generator.generate();

      expect(result).toContain('export class UserRepository');
      expect(result).toContain('@InjectRepository(User)');
      expect(result).toContain('Repository<User>');
    });
  });

  describe('Import Generation', () => {
    it('should generate correct imports', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("import { Injectable } from '@nestjs/common'");
      expect(result).toContain("import { InjectRepository } from '@nestjs/typeorm'");
      expect(result).toContain(
        "import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm'",
      );
      expect(result).toContain("import { Users } from '../entities/users.entity'");
      expect(result).toContain("import { UsersFilterDto } from '../dto/users/users-filter.dto'");
      expect(result).toContain("import { CreateUsersDto } from '../dto/users/create-users.dto'");
      expect(result).toContain("import { UpdateUsersDto } from '../dto/users/update-users.dto'");
    });

    it('should include FilterCompiler import when customMethods enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customMethods: true,
      });

      const result = generator.generate();

      expect(result).toContain("import { FilterCompiler } from '@ojiepermana/nest-generator'");
      expect(result).toContain("import { QueryBuilder } from '@ojiepermana/nest-generator'");
    });

    it('should include transaction imports when transactionSupport enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        transactionSupport: true,
      });

      const result = generator.generate();

      expect(result).toContain("import { DataSource, QueryRunner } from 'typeorm'");
    });
  });

  describe('Basic CRUD Methods', () => {
    it('should generate create method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async create(createDto: CreateUsersDto)');
      expect(result).toContain('Promise<Users>');
      expect(result).toContain('this.repository.create(createDto');
      expect(result).toContain('this.repository.save(');
    });

    it('should generate findAll method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findAll(options?: FindManyOptions<Users>)');
      expect(result).toContain('Promise<Users[]>');
      expect(result).toContain('this.repository.find(options)');
    });

    it('should generate findOne method with correct PK type', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findOne(id: number)');
      expect(result).toContain('Promise<Users | null>');
      expect(result).toContain('this.repository.findOne');
    });

    it('should generate update method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async update(id: number, updateDto: UpdateUsersDto)');
      expect(result).toContain('Promise<Users>');
      expect(result).toContain('await this.findOne(id)');
      expect(result).toContain('Object.assign(');
      expect(result).toContain('this.repository.save(');
    });

    it('should generate remove method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async remove(id: number): Promise<void>');
      expect(result).toContain('this.repository.delete(id)');
    });

    it('should generate count method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async count(');
      expect(result).toContain('Promise<number>');
      expect(result).toContain('this.repository.count');
    });

    it('should generate exists method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async exists(');
      expect(result).toContain('Promise<boolean>');
      expect(result).toContain('count > 0');
    });
  });

  describe('Filter Methods', () => {
    it('should generate findWithFilters method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('async findWithFilters(');
      expect(result).toContain('filterDto: UsersFilterDto');
      expect(result).toContain('page?: number; limit?: number');
      expect(result).toContain('data: Users[]; total: number');
      expect(result).toContain('createQueryBuilder');
    });

    it('should generate applyFilter helper method', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('private applyFilter(');
      expect(result).toContain("case 'eq':");
      expect(result).toContain("case 'like':");
      expect(result).toContain("case 'in':");
      expect(result).toContain("case 'between':");
      expect(result).toContain("case 'null':");
    });

    it('should handle operator parsing in findWithFilters', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain(
        'const operatorMatch = key.match(/^(.+)_(eq|ne|gt|gte|lt|lte|like|in|between|null)$/)',
      );
      expect(result).toContain('const [, field, operator] = operatorMatch');
      expect(result).toContain('this.applyFilter(queryBuilder, field, operator, value)');
    });

    it('should apply pagination in findWithFilters', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('const page = options?.page || 1');
      expect(result).toContain('const limit = Math.min(options?.limit || 20, 100)');
      expect(result).toContain('queryBuilder.skip((page - 1) * limit).take(limit)');
    });

    it('should apply sorting in findWithFilters', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('if (options?.sort && options.sort.length > 0)');
      expect(result).toContain('queryBuilder.orderBy(');
      expect(result).toContain('queryBuilder.addOrderBy(');
    });
  });

  describe('Soft Delete Methods', () => {
    it('should generate soft delete methods when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: true,
      });

      const result = generator.generate();

      expect(result).toContain('async softDelete(id: number): Promise<void>');
      expect(result).toContain('async restore(id: number): Promise<void>');
      expect(result).toContain('async findAllWithDeleted(');
      expect(result).toContain('async findOnlyDeleted(');
    });

    it('should not generate soft delete methods when disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('async softDelete(');
      expect(result).not.toContain('async restore(');
    });

    it('should use custom deletedAt column name', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: true,
        timestampColumns: {
          deletedAt: 'deleted_on',
        },
      });

      const result = generator.generate();

      expect(result).toContain('deleted_on: new Date()');
      expect(result).toContain('deleted_on: null');
      expect(result).toContain('users.deleted_on IS NOT NULL');
    });

    it('should use default deleted_at if not specified', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: true,
      });

      const result = generator.generate();

      expect(result).toContain('deleted_at: new Date()');
      expect(result).toContain('deleted_at: null');
    });
  });

  describe('Custom Methods', () => {
    it('should generate custom methods when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customMethods: true,
      });

      const result = generator.generate();

      expect(result).toContain('async findByIds(ids: number[])');
      expect(result).toContain('async findOneOrFail(id: number)');
      expect(result).toContain('async increment(');
      expect(result).toContain('async decrement(');
    });

    it('should not generate custom methods when disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customMethods: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('async findByIds(');
      expect(result).not.toContain('async findOneOrFail(');
    });

    it('should generate findOneOrFail with error handling', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        customMethods: true,
      });

      const result = generator.generate();

      expect(result).toContain("throw new Error('Users not found')");
    });
  });

  describe('Bulk Operations', () => {
    it('should generate bulk operation methods when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        bulkOperations: true,
      });

      const result = generator.generate();

      expect(result).toContain('async bulkCreate(');
      expect(result).toContain('async bulkUpdate(');
      expect(result).toContain('async bulkDelete(');
      expect(result).toContain('async upsert(');
    });

    it('should not generate bulk methods when disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        bulkOperations: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('async bulkCreate(');
      expect(result).not.toContain('async bulkUpdate(');
    });

    it('should generate bulkCreate with array parameter', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        bulkOperations: true,
      });

      const result = generator.generate();

      expect(result).toContain('createDtos: CreateUsersDto[]');
      expect(result).toContain('this.repository.create(createDtos');
    });

    it('should generate upsert with conflict fields', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        bulkOperations: true,
      });

      const result = generator.generate();

      expect(result).toContain('conflictFields: (keyof Users)[]');
      expect(result).toContain('this.repository.upsert(');
    });
  });

  describe('Transaction Support', () => {
    it('should generate transaction methods when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        transactionSupport: true,
      });

      const result = generator.generate();

      expect(result).toContain('async transaction<T>(');
      expect(result).toContain('getRepositoryForTransaction(');
      expect(result).toContain('queryRunner: QueryRunner');
    });

    it('should not generate transaction methods when disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        transactionSupport: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('async transaction<T>(');
      expect(result).not.toContain('getRepositoryForTransaction(');
    });

    it('should include DataSource in constructor when transaction enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        transactionSupport: true,
      });

      const result = generator.generate();

      expect(result).toContain('private readonly dataSource: DataSource');
    });

    it('should generate transaction with rollback handling', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        transactionSupport: true,
      });

      const result = generator.generate();

      expect(result).toContain('await queryRunner.startTransaction()');
      expect(result).toContain('await queryRunner.commitTransaction()');
      expect(result).toContain('await queryRunner.rollbackTransaction()');
      expect(result).toContain('await queryRunner.release()');
    });
  });

  describe('Audit Logging', () => {
    it('should include AuditLogService import when audit logging enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const result = generator.generate();

      expect(result).toContain("import { AuditLogService } from '../audit/audit-log.service';");
    });

    it('should inject AuditLogService in constructor when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const result = generator.generate();

      expect(result).toContain('private readonly auditLogService: AuditLogService');
    });

    it('should generate create method with audit logging', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const result = generator.generate();

      expect(result).toContain('async create(createDto: CreateUsersDto, userId?: string)');
      expect(result).toContain('await this.auditLogService.log({');
      expect(result).toContain("action: 'CREATE'");
      expect(result).toContain("entity_type: 'users'");
    });

    it('should generate update method with audit logging', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        'async update(id: number, updateDto: UpdateUsersDto, userId?: string)',
      );
      expect(result).toContain('const oldValues = { ...users };');
      expect(result).toContain("action: 'UPDATE'");
      expect(result).toContain('old_values: oldValues');
      expect(result).toContain('new_values: updated');
    });

    it('should generate delete method with audit logging', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const result = generator.generate();

      expect(result).toContain('async remove(id: number, userId?: string)');
      expect(result).toContain('const users = await this.findOne(id)');
      expect(result).toContain("action: 'DELETE'");
      expect(result).toContain('old_values: users');
    });

    it('should not include audit code when disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('AuditLogService');
      expect(result).not.toContain('auditLogService.log');
      expect(result).toContain('async create(createDto: CreateUsersDto)');
      expect(result).toContain('async update(id: number, updateDto: UpdateUsersDto)');
      expect(result).toContain('async remove(id: number)');
    });

    it('should generate README with audit examples when enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
      });

      const readme = generator.generateReadme();

      expect(readme).toContain('# UsersRepository - Audit Logging Guide');
      expect(readme).toContain('Pass userId as second parameter');
      expect(readme).toContain('@AuditLog Decorator');
      expect(readme).toContain('Get Entity History');
      expect(readme).toContain('Rollback Changes');
    });

    it('should not generate README when audit disabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: false,
      });

      const readme = generator.generateReadme();

      expect(readme).toBe('');
    });
  });

  describe('Combined Features', () => {
    it('should generate repository with all features enabled', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: true,
        customMethods: true,
        bulkOperations: true,
        transactionSupport: true,
      });

      const result = generator.generate();

      // Check all features present
      expect(result).toContain('async softDelete(');
      expect(result).toContain('async findByIds(');
      expect(result).toContain('async bulkCreate(');
      expect(result).toContain('async transaction<T>(');
    });

    it('should generate minimal repository with no optional features', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        softDelete: false,
        customMethods: false,
        bulkOperations: false,
        transactionSupport: false,
      });

      const result = generator.generate();

      // Check only basic methods present
      expect(result).toContain('async create(');
      expect(result).toContain('async findAll(');
      expect(result).toContain('async findOne(');
      expect(result).toContain('async update(');
      expect(result).toContain('async remove(');

      // Check optional features absent
      expect(result).not.toContain('async softDelete(');
      expect(result).not.toContain('async findByIds(');
      expect(result).not.toContain('async bulkCreate(');
      expect(result).not.toContain('async transaction<T>(');
    });

    it('should generate repository with audit logging and all other features', () => {
      const generator = new RepositoryGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        auditLogging: true,
        softDelete: true,
        customMethods: true,
        bulkOperations: true,
        transactionSupport: true,
      });

      const result = generator.generate();

      // Check audit logging
      expect(result).toContain('AuditLogService');
      expect(result).toContain('userId?: string');

      // Check other features
      expect(result).toContain('async softDelete(');
      expect(result).toContain('async findByIds(');
      expect(result).toContain('async bulkCreate(');
      expect(result).toContain('async transaction<T>(');
    });
  });
});
