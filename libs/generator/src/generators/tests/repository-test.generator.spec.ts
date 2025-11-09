/**
 * Repository Test Generator Unit Tests
 */

import { RepositoryTestGenerator } from './repository-test.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('RepositoryTestGenerator', () => {
  let generator: RepositoryTestGenerator;
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    generator = new RepositoryTestGenerator();

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
        is_filterable: false,
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
        is_filterable: true,
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
        is_filterable: true,
        max_length: 100,
        column_order: 3,
      },
      {
        id: '4',
        table_metadata_id: '123',
        column_name: 'age',
        data_type: 'integer',
        is_primary_key: false,
        is_required: false,
        is_nullable: true,
        is_filterable: true,
        column_order: 4,
      },
      {
        id: '5',
        table_metadata_id: '123',
        column_name: 'created_at',
        data_type: 'timestamp',
        is_primary_key: false,
        is_required: false,
        is_nullable: false,
        is_filterable: false,
        column_order: 5,
      },
    ] as ColumnMetadata[];
  });

  describe('generateRepositoryTest', () => {
    it('should generate test file with proper structure', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('UsersRepository');
      expect(result).toContain("describe('UsersRepository'");
      expect(result).toContain('import { Test, TestingModule }');
      expect(result).toContain('import { Pool } from');
    });

    it('should include mock setup in beforeEach', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('let mockPool: jest.Mocked<Pool>');
      expect(result).toContain('beforeEach');
      expect(result).toContain('query: jest.fn()');
    });

    it('should include afterEach cleanup', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('afterEach');
      expect(result).toContain('jest.clearAllMocks()');
    });

    it('should include findAll test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-all');
      expect(result).toContain("describe('findAll'");
      expect(result).toContain('should return all users records');
    });

    it('should include findAll with filters test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-all-with-filters');
      expect(result).toContain('should apply filters correctly');
    });

    it('should include soft delete exclusion test when soft delete enabled', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: soft-delete-exclusion');
      expect(result).toContain('should exclude soft-deleted records');
      expect(result).toContain('deleted_at IS NULL');
    });

    it('should not include soft delete tests when soft delete disabled', () => {
      const tableWithoutSoftDelete = { ...tableMetadata, has_soft_delete: false };
      const result = generator.generateRepositoryTest(tableWithoutSoftDelete, columns);

      expect(result).not.toContain('GENERATED_TEST_START: soft-delete');
      expect(result).toContain('GENERATED_TEST_START: hard-delete');
    });

    it('should include findOne test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-one');
      expect(result).toContain("describe('findOne'");
      expect(result).toContain('should return a users by id');
    });

    it('should include findOne not found test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-one-not-found');
      expect(result).toContain('should return null when users not found');
    });

    it('should include create test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: create');
      expect(result).toContain("describe('create'");
      expect(result).toContain('should insert new users and return it');
      expect(result).toContain('INSERT INTO');
    });

    it('should include update test', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: update');
      expect(result).toContain("describe('update'");
      expect(result).toContain('should update existing users');
      expect(result).toContain('UPDATE');
    });

    it('should include soft delete test when enabled', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: soft-delete');
      expect(result).toContain("describe('softDelete'");
      expect(result).toContain('should soft delete users by setting deleted_at');
    });

    it('should include custom tests section', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('CUSTOM_TESTS_START');
      expect(result).toContain('Add your custom repository tests here');
      expect(result).toContain('CUSTOM_TESTS_END');
    });

    it('should use correct primary key column name', () => {
      const tableWithCustomPK = {
        ...tableMetadata,
        primary_key_column: 'user_id',
      };
      const result = generator.generateRepositoryTest(tableWithCustomPK, columns);

      expect(result).toContain('WHERE user_id = $1');
    });

    it('should include schema name in SQL queries', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('"public"."users"');
    });
  });

  describe('options', () => {
    it('should include bulk operation tests when enabled', () => {
      const generatorWithBulk = new RepositoryTestGenerator({
        includeBulkOperationTests: true,
      });

      const result = generatorWithBulk.generateRepositoryTest(
        tableMetadata,
        columns,
      );

      expect(result).toContain('GENERATED_TEST_START: bulk-create');
      expect(result).toContain('should insert multiple users records');
      expect(result).toContain('GENERATED_TEST_START: bulk-update');
      expect(result).toContain('should update multiple users records');
    });

    it('should not include bulk operation tests by default', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).not.toContain('GENERATED_TEST_START: bulk-create');
      expect(result).not.toContain('GENERATED_TEST_START: bulk-update');
    });
  });

  describe('mock data generation', () => {
    it('should generate appropriate mock data for varchar fields', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain("'test-username'");
    });

    it('should generate mock data for filterable columns', () => {
      const result = generator.generateRepositoryTest(tableMetadata, columns);

      expect(result).toContain('filters:');
      expect(result).toContain('username');
    });
  });
});
