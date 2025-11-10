/**
 * Controller Test Generator Unit Tests
 */

import { ControllerTestGenerator } from './controller-test.generator';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

describe('ControllerTestGenerator', () => {
  let generator: ControllerTestGenerator;
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    generator = new ControllerTestGenerator();

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

  describe('generateControllerTest', () => {
    it('should generate test file with proper structure', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('UsersController');
      expect(result).toContain("describe('UsersController'");
      expect(result).toContain('import { Test, TestingModule }');
    });

    it('should include mock setup in beforeEach', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('let controller: UsersController');
      expect(result).toContain('let service: jest.Mocked<UsersService>');
      expect(result).toContain('beforeEach');
      expect(result).toContain('const mockService = {');
    });

    it('should include afterEach cleanup', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('afterEach');
      expect(result).toContain('jest.clearAllMocks()');
    });

    it('should include controller defined test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: controller-defined');
      expect(result).toContain('should be defined');
      expect(result).toContain('expect(controller).toBeDefined()');
    });

    it('should include findAll endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-all-endpoint');
      expect(result).toContain("describe('GET /'");
      expect(result).toContain('should return all users records');
    });

    it('should include findAll pagination endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain(
        'GENERATED_TEST_START: find-all-pagination-endpoint',
      );
      expect(result).toContain("describe('GET / with pagination'");
      expect(result).toContain('should return paginated users records');
    });

    it('should include findOne endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: find-one-endpoint');
      expect(result).toContain("describe('GET /:id'");
      expect(result).toContain('should return users by id');
    });

    it('should include create endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: create-endpoint');
      expect(result).toContain("describe('POST /'");
      expect(result).toContain('should create new users');
    });

    it('should include update endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: update-endpoint');
      expect(result).toContain("describe('PUT /:id'");
      expect(result).toContain('should update users');
    });

    it('should include delete endpoint test', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: delete-endpoint');
      expect(result).toContain("describe('DELETE /:id'");
      expect(result).toContain('should delete users');
    });

    it('should include custom tests section', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('CUSTOM_TESTS_START');
      expect(result).toContain('Add your custom controller tests here');
      expect(result).toContain('CUSTOM_TESTS_END');
    });

    it('should mock service methods in beforeEach', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('findAll: jest.fn()');
      expect(result).toContain('findOne: jest.fn()');
      expect(result).toContain('create: jest.fn()');
      expect(result).toContain('update: jest.fn()');
      expect(result).toContain('delete: jest.fn()');
    });
  });

  describe('test structure', () => {
    it('should verify controller calls service methods', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('expect(service.findAll).toHaveBeenCalled');
      expect(result).toContain('expect(service.findOne).toHaveBeenCalled');
      expect(result).toContain('expect(service.create).toHaveBeenCalled');
      expect(result).toContain('expect(service.update).toHaveBeenCalled');
      expect(result).toContain('expect(service.delete).toHaveBeenCalled');
    });

    it('should verify controller returns service results', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('const result = await controller.findAll');
      expect(result).toContain('const result = await controller.findOne');
      expect(result).toContain('const result = await controller.create');
      expect(result).toContain('const result = await controller.update');
      expect(result).toContain('await controller.delete');
    });

    it('should verify controller passes parameters correctly', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      // findOne passes ID
      expect(result).toContain("controller.findOne('123')");
      expect(result).toContain("service.findOne).toHaveBeenCalledWith('123')");

      // create passes DTO
      expect(result).toContain('controller.create(createDto)');
      expect(result).toContain(
        'service.create).toHaveBeenCalledWith(createDto)',
      );

      // update passes ID and DTO
      expect(result).toContain("controller.update('123', updateDto)");
      expect(result).toContain(
        "service.update).toHaveBeenCalledWith('123', updateDto)",
      );

      // delete passes ID
      expect(result).toContain("controller.delete('123')");
      expect(result).toContain("service.delete).toHaveBeenCalledWith('123')");
    });
  });

  describe('test data generation', () => {
    it('should generate appropriate test data based on column types', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('username:');
      expect(result).toContain("'test-username'");
    });

    it('should generate mock response data', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('const mockUserss =');
      expect(result).toContain('const mockUsers =');
      expect(result).toContain('service.findAll.mockResolvedValue');
      expect(result).toContain('service.findOne.mockResolvedValue');
    });

    it('should generate pagination metadata in response', () => {
      const result = generator.generateControllerTest(tableMetadata, columns);

      expect(result).toContain('const mockResponse = {');
      expect(result).toContain('data:');
      expect(result).toContain('meta:');
      expect(result).toContain('page:');
      expect(result).toContain('limit:');
      expect(result).toContain('total:');
    });
  });
});
