/**
 * Service Test Generator Unit Tests
 */

import { ServiceTestGenerator } from './service-test.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('ServiceTestGenerator', () => {
  let generator: ServiceTestGenerator;
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    generator = new ServiceTestGenerator();

    tableMetadata = {
      id: '123',
      schema_name: 'public',
      table_name: 'users',
      table_purpose: 'User management',
      has_soft_delete: true,
      primary_key_column: 'id',
      primary_key_type: 'UUID',
      created_at: new Date(),
    } as TableMetadata;

    columns = [
      {
        id: '1',
        table_metadata_id: '123',
        column_name: 'id',
        data_type: 'uuid',
        is_primary_key: true,
        is_required: true,
        is_nullable: false,
        column_order: 1,
      },
      {
        id: '2',
        table_metadata_id: '123',
        column_name: 'username',
        data_type: 'varchar',
        is_primary_key: false,
        is_required: true,
        is_nullable: false,
        max_length: 50,
        column_order: 2,
      },
      {
        id: '3',
        table_metadata_id: '123',
        column_name: 'email',
        data_type: 'varchar',
        is_primary_key: false,
        is_required: true,
        is_nullable: false,
        max_length: 100,
        column_order: 3,
      },
    ] as ColumnMetadata[];
  });

  describe('generateServiceTest', () => {
    it('should generate test file with proper structure', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('UsersService');
      expect(result).toContain("describe('UsersService'");
      expect(result).toContain('import { Test, TestingModule }');
      expect(result).toContain('import { NotFoundException');
    });

    it('should include mock setup in beforeEach', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('let service: UsersService');
      expect(result).toContain('let repository: jest.Mocked<UsersRepository>');
      expect(result).toContain('beforeEach');
      expect(result).toContain('const mockRepository = {');
    });

    it('should include afterEach cleanup', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('afterEach');
      expect(result).toContain('jest.clearAllMocks()');
    });

    it('should include findAll test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-all');
      expect(result).toContain("describe('findAll'");
      expect(result).toContain('should return all users records');
    });

    it('should include findAll pagination test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-all-pagination');
      expect(result).toContain('should return paginated users records');
      expect(result).toContain('result.data');
      expect(result).toContain('result.meta');
    });

    it('should include findOne success test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-one-success');
      expect(result).toContain("describe('findOne'");
      expect(result).toContain('should return users when found');
    });

    it('should include findOne not found test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-one-not-found');
      expect(result).toContain('should throw NotFoundException');
      expect(result).toContain('Users not found');
    });

    it('should include create test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: create');
      expect(result).toContain("describe('create'");
      expect(result).toContain('should create and return new users');
    });

    it('should include create validation test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: create-validation');
      expect(result).toContain('should throw BadRequestException');
    });

    it('should include update test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: update');
      expect(result).toContain("describe('update'");
      expect(result).toContain('should update and return users');
    });

    it('should include update not found test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: update-not-found');
      expect(result).toContain('should throw NotFoundException when updating');
    });

    it('should include softDelete test when soft delete enabled', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: delete');
      expect(result).toContain("describe('softDelete'");
      expect(result).toContain('should soft delete users');
    });

    it('should include delete test when soft delete disabled', () => {
      const tableWithoutSoftDelete = {
        ...tableMetadata,
        has_soft_delete: false,
      };
      const result = generator.generateServiceTest(
        tableWithoutSoftDelete,
        columns,
      );

      expect(result).toContain("describe('delete'");
      expect(result).toContain('should delete users');
      expect(result).not.toContain('soft delete');
    });

    it('should include delete not found test', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: delete-not-found');
      expect(result).toContain('should throw NotFoundException when deleting');
    });

    it('should include custom tests section', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('CUSTOM_TESTS_START');
      expect(result).toContain('Add your custom service tests here');
      expect(result).toContain('CUSTOM_TESTS_END');
    });

    it('should mock repository methods in beforeEach', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('findAll: jest.fn()');
      expect(result).toContain('findOne: jest.fn()');
      expect(result).toContain('create: jest.fn()');
      expect(result).toContain('update: jest.fn()');
      expect(result).toContain('softDelete: jest.fn()');
    });
  });

  describe('options', () => {
    it('should exclude pagination tests when option is false', () => {
      const generatorWithoutPagination = new ServiceTestGenerator({
        includePaginationTests: false,
      });

      const result = generatorWithoutPagination.generateServiceTest(
        tableMetadata,
        columns,
      );

      expect(result).not.toContain('GENERATED_TEST_START: find-all-pagination');
    });

    it('should exclude error handling tests when option is false', () => {
      const generatorWithoutErrors = new ServiceTestGenerator({
        includeErrorHandlingTests: false,
      });

      const result = generatorWithoutErrors.generateServiceTest(
        tableMetadata,
        columns,
      );

      expect(result).not.toContain('GENERATED_TEST_START: find-one-not-found');
      expect(result).not.toContain('GENERATED_TEST_START: create-validation');
      expect(result).not.toContain('GENERATED_TEST_START: update-not-found');
      expect(result).not.toContain('GENERATED_TEST_START: delete-not-found');
    });
  });

  describe('test data generation', () => {
    it('should generate appropriate test data based on column types', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('username:');
      expect(result).toContain("'test-username'");
    });

    it('should verify repository method calls', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      expect(result).toContain('expect(repository.findAll).toHaveBeenCalled');
      expect(result).toContain('expect(repository.findOne).toHaveBeenCalled');
      expect(result).toContain('expect(repository.create).toHaveBeenCalled');
      expect(result).toContain('expect(repository.update).toHaveBeenCalled');
    });

    it('should test business logic layer', () => {
      const result = generator.generateServiceTest(tableMetadata, columns);

      // Service should check existence before update/delete
      expect(result).toContain('repository.findOne.mockResolvedValue(existing');
      expect(result).toContain('repository.findOne.mockResolvedValue(null)');
    });
  });
});
