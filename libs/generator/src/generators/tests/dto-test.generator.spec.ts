/**
 * DTO Test Generator Unit Tests
 */

import { DtoTestGenerator } from './dto-test.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

describe('DtoTestGenerator', () => {
  let generator: DtoTestGenerator;
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    generator = new DtoTestGenerator();

    tableMetadata = {
      id: '123',
      schema_name: 'public',
      table_name: 'users',
      table_purpose: 'User management',
      has_soft_delete: true,
      primary_key_column: 'id',
      primary_key_type: 'UUID',
      created_at: new Date(),
    } as unknown as TableMetadata;

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
        validation_rules: { email: true },
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
        min_value: 18,
        max_value: 120,
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
        column_order: 5,
      },
    ] as ColumnMetadata[];
  });

  describe('generateCreateDtoTest', () => {
    it('should generate test file with proper structure', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('CreateUsersDto');
      expect(result).toContain("describe('CreateUsersDto'");
      expect(result).toContain('import { validate } from');
      expect(result).toContain('import { plainToClass } from');
    });

    it('should include validation success test', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: validation-success');
      expect(result).toContain('should pass validation with valid data');
    });

    it('should include required fields validation test', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: validation-required-fields');
      expect(result).toContain('should fail validation when required fields are missing');
    });

    it('should include email validation test for email fields', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: validation-email-email');
      expect(result).toContain('should fail validation with invalid email');
    });

    it('should include max length validation test', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: validation-max-length-username');
      expect(result).toContain('should fail validation when username exceeds');
    });

    it('should include numeric range validation tests', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: validation-min-value-age');
      expect(result).toContain('should fail validation when age is below');

      expect(result).toContain('GENERATED_TEST_START: validation-max-value-age');
      expect(result).toContain('should fail validation when age is above');
    });

    it('should include custom tests section', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toContain('CUSTOM_TESTS_START');
      expect(result).toContain('Add your custom DTO tests here');
      expect(result).toContain('CUSTOM_TESTS_END');
    });

    it('should exclude system columns from test data', () => {
      const result = generator.generateCreateDtoTest(tableMetadata, columns);

      expect(result).not.toContain('id:');
      expect(result).not.toContain('createdAt:');
      expect(result).not.toContain('updatedAt:');
    });
  });

  describe('generateUpdateDtoTest', () => {
    it('should generate update DTO test file', () => {
      const result = generator.generateUpdateDtoTest(tableMetadata, columns);

      expect(result).toContain('UpdateUsersDto');
      expect(result).toContain("describe('UpdateUsersDto'");
    });

    it('should include partial update test', () => {
      const result = generator.generateUpdateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: partial-update');
      expect(result).toContain('should allow partial updates');
    });

    it('should include empty update test', () => {
      const result = generator.generateUpdateDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: empty-update');
      expect(result).toContain('should pass validation with no fields specified');
    });
  });

  describe('generateFilterDtoTest', () => {
    beforeEach(() => {
      // Mark some columns as filterable
      columns[1].is_filterable = true; // username
      columns[2].is_filterable = true; // email
      columns[3].is_filterable = true; // age
    });

    it('should generate filter DTO test file', () => {
      const result = generator.generateFilterDtoTest(tableMetadata, columns);

      expect(result).toContain('UsersFilterDto');
      expect(result).toContain("describe('UsersFilterDto'");
    });

    it('should include filter operators test', () => {
      const result = generator.generateFilterDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: filter-operators');
      expect(result).toContain('should accept valid filter operators');
    });

    it('should include optional filters test', () => {
      const result = generator.generateFilterDtoTest(tableMetadata, columns);

      expect(result).toContain('GENERATED_TEST_START: optional-filters');
      expect(result).toContain('should pass validation with no filters specified');
    });
  });

  describe('sample value generation', () => {
    it('should generate email for email fields', () => {
      const emailColumn: ColumnMetadata = {
        id: '1',
        table_metadata_id: '123',
        column_name: 'email',
        data_type: 'varchar',
        validation_rules: { email: true },
        is_primary_key: false,
        is_required: true,
        is_nullable: false,
        column_order: 1,
      } as unknown as ColumnMetadata;

      const result = generator.generateCreateDtoTest(tableMetadata, [emailColumn]);

      expect(result).toContain('test@example.com');
    });

    it('should generate enum value for enum fields', () => {
      const enumColumn: ColumnMetadata = {
        id: '1',
        table_metadata_id: '123',
        column_name: 'status',
        data_type: 'varchar',
        enum_values: ['active', 'inactive', 'pending'],
        is_primary_key: false,
        is_required: true,
        is_nullable: false,
        column_order: 1,
      } as unknown as ColumnMetadata;

      const result = generator.generateCreateDtoTest(tableMetadata, [enumColumn]);

      expect(result).toContain("'active'");
    });

    it('should generate numeric value within range', () => {
      const numericColumn: ColumnMetadata = {
        id: '1',
        table_metadata_id: '123',
        column_name: 'quantity',
        data_type: 'integer',
        min_value: 1,
        max_value: 100,
        is_primary_key: false,
        is_required: true,
        is_nullable: false,
        column_order: 1,
      } as unknown as ColumnMetadata;

      const result = generator.generateCreateDtoTest(tableMetadata, [numericColumn]);

      expect(result).toMatch(/quantity: \d+/);
    });
  });

  describe('options', () => {
    it('should respect includeEdgeCases option', () => {
      const generatorWithoutEdgeCases = new DtoTestGenerator({
        includeEdgeCases: false,
      });

      const result = generatorWithoutEdgeCases.generateCreateDtoTest(tableMetadata, columns);

      expect(result).toBeDefined();
      expect(result).toContain('CreateUsersDto');
    });
  });
});
