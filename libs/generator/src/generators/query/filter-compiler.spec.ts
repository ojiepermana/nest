/**
 * Filter Compiler Tests
 */

import { FilterCompiler, FilterValidationError } from './filter-compiler';
import { QueryBuilder } from './query-builder';
import { QueryFilterOperator } from './query-types';
import type { ColumnMetadata } from '../../interfaces/generator.interface';

describe('FilterCompiler', () => {
  describe('Basic Filter Compilation', () => {
    it('should compile simple equality filter', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        status: 'active',
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.params).toEqual({ param1: 'active' });
    });

    it('should compile filter with operator suffix', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        age_gt: 18,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE age > $param1');
      expect(query.params).toEqual({ param1: 18 });
    });

    it('should compile multiple filters', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        status_eq: 'active',
        age_gte: 18,
        name_like: 'John',
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.sql).toContain('AND age >= $param2');
      expect(query.sql).toContain('AND name LIKE $param3');
      expect(query.params).toEqual({
        param1: 'active',
        param2: 18,
        param3: '%John%', // QueryBuilder auto-wraps LIKE values
      });
    });

    it('should skip undefined and null values', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        status: 'active',
        age: undefined,
        name: null,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.sql).not.toContain('age');
      expect(query.sql).not.toContain('name');
      expect(query.params).toEqual({ param1: 'active' });
    });
  });

  describe('Operator Parsing', () => {
    it('should parse all operator suffixes', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        field1_eq: 'value1',
        field2_ne: 'value2',
        field3_gt: 10,
        field4_gte: 20,
        field5_lt: 30,
        field6_lte: 40,
        field7_like: 'pattern',
        field8_in: ['a', 'b'],
        field9_between: [1, 10],
        field10_null: true,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('field1 = $param1');
      expect(query.sql).toContain('field2 != $param2');
      expect(query.sql).toContain('field3 > $param3');
      expect(query.sql).toContain('field4 >= $param4');
      expect(query.sql).toContain('field5 < $param5');
      expect(query.sql).toContain('field6 <= $param6');
      expect(query.sql).toContain('field7 LIKE $param7');
      expect(query.sql).toContain('field8 IN ($param8_0, $param8_1)'); // Array params start at 0
      expect(query.sql).toContain('field9 BETWEEN $param9_start AND $param9_end'); // BETWEEN uses _start/_end
      expect(query.sql).toContain('field10 IS NULL');
    });

    it('should default to equality for fields without operator suffix', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        status: 'active',
        category: 'tech',
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.sql).toContain('AND category = $param2');
    });
  });

  describe('compileFilters Method', () => {
    it('should return compiled filter results', () => {
      const compiler = new FilterCompiler();

      const filterDto = {
        status_eq: 'active',
        age_gt: 18,
      };

      const results = compiler.compileFilters(filterDto);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        field: 'status',
        operator: QueryFilterOperator.EQUALS,
        value: 'active',
        isValid: true,
      });
      expect(results[1]).toMatchObject({
        field: 'age',
        operator: QueryFilterOperator.GREATER_THAN,
        value: 18,
        isValid: true,
      });
    });

    it('should include validation errors in results', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: false,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        allowUnknownColumns: false,
      });

      const filterDto = {
        status_eq: 'active',
      };

      const results = compiler.compileFilters(filterDto);

      expect(results).toHaveLength(1);
      expect(results[0].isValid).toBe(false);
      expect(results[0].error).toContain('not filterable');
    });
  });

  describe('Column Metadata Validation', () => {
    it('should validate against column metadata when provided', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_eq: 'active',
        age_gt: 18,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.sql).toContain('AND age > $param2');
    });

    it('should reject filters for non-filterable columns', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'password',
          data_type: 'varchar',
          is_filterable: false,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        password_eq: 'secret',
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
    });

    it('should allow unknown columns by default', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        allowUnknownColumns: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        unknown_field: 'value',
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE unknown_field = $param1');
    });

    it('should reject unknown columns when configured', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        allowUnknownColumns: false,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        unknown_field: 'value',
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
    });
  });

  describe('Type Validation', () => {
    it('should validate LIKE operator only for string types', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_like: '25',
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/LIKE operator not supported for type/);
    });

    it('should validate BETWEEN operator for numeric types', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_between: ['a', 'z'],
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/BETWEEN operator not supported for type/);
    });

    it('should validate IN operator requires array', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_in: 'active', // Should be array
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/IN operator requires array value/);
    });

    it('should validate BETWEEN operator requires 2-element array', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_between: [18], // Should have 2 elements
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/BETWEEN operator requires array with 2 elements/);
    });

    it('should validate IS_NULL operator requires boolean', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'deleted_at',
          data_type: 'timestamp',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        deleted_at_null: 'yes', // Should be boolean
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/IS_NULL operator requires boolean value/);
    });

    it('should validate numeric values when strict type checking enabled', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_gt: '18', // Should be number
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/Expected number for type/);
    });

    it('should validate boolean values when strict type checking enabled', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'is_active',
          data_type: 'boolean',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        is_active_eq: 'true', // Should be boolean
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/Expected boolean for type/);
    });
  });

  describe('Enum Validation', () => {
    it('should validate enum values for equality filter', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
          enum_values: ['active', 'inactive', 'pending'],
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_eq: 'invalid_status',
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/not in enum/);
    });

    it('should allow valid enum values', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
          enum_values: ['active', 'inactive', 'pending'],
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_eq: 'active',
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.params).toEqual({ param1: 'active' });
    });

    it('should validate enum values in IN operator', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
          enum_values: ['active', 'inactive', 'pending'],
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_in: ['active', 'invalid_status'],
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/Invalid enum values/);
    });
  });

  describe('Range Validation', () => {
    it('should validate minimum value constraint', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
          min_value: 18,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_gt: 15, // Less than minimum
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/less than minimum/);
    });

    it('should validate maximum value constraint', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
          max_value: 120,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
        strictTypeChecking: true,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_lt: 150, // Greater than maximum
      };

      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(FilterValidationError);
      expect(() => {
        compiler.compile(filterDto, builder);
      }).toThrow(/greater than maximum/);
    });

    it('should allow values within range', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
          min_value: 18,
          max_value: 120,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        age_gte: 25,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE age >= $param1');
      expect(query.params).toEqual({ param1: 25 });
    });
  });

  describe('Helper Methods', () => {
    it('should get column metadata', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const metadata = compiler.getColumnMetadata('status');
      expect(metadata).toBeDefined();
      expect(metadata?.column_name).toBe('status');
    });

    it('should check if column is filterable', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
        {
          column_name: 'password',
          data_type: 'varchar',
          is_filterable: false,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      expect(compiler.isFilterable('status')).toBe(true);
      expect(compiler.isFilterable('password')).toBe(false);
      expect(compiler.isFilterable('unknown')).toBe(true); // Default to true
    });

    it('should get available operators for string column', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'name',
          data_type: 'varchar',
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const operators = compiler.getAvailableOperators('name');
      expect(operators).toContain(QueryFilterOperator.EQUALS);
      expect(operators).toContain(QueryFilterOperator.NOT_EQUALS);
      expect(operators).toContain(QueryFilterOperator.LIKE);
      expect(operators).toContain(QueryFilterOperator.IN);
      expect(operators).toContain(QueryFilterOperator.GREATER_THAN);
      expect(operators).toContain(QueryFilterOperator.IS_NULL);
    });

    it('should get available operators for numeric column', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'age',
          data_type: 'integer',
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const operators = compiler.getAvailableOperators('age');
      expect(operators).toContain(QueryFilterOperator.EQUALS);
      expect(operators).toContain(QueryFilterOperator.GREATER_THAN);
      expect(operators).toContain(QueryFilterOperator.BETWEEN);
      expect(operators).toContain(QueryFilterOperator.IN);
      expect(operators).not.toContain(QueryFilterOperator.LIKE);
    });

    it('should get available operators for date column', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'created_at',
          data_type: 'timestamp',
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const operators = compiler.getAvailableOperators('created_at');
      expect(operators).toContain(QueryFilterOperator.EQUALS);
      expect(operators).toContain(QueryFilterOperator.GREATER_THAN);
      expect(operators).toContain(QueryFilterOperator.BETWEEN);
      expect(operators).not.toContain(QueryFilterOperator.LIKE);
    });
  });

  describe('Complex Scenarios', () => {
    it('should compile complex filter with multiple types', () => {
      const columns: ColumnMetadata[] = [
        {
          column_name: 'status',
          data_type: 'varchar',
          is_filterable: true,
          enum_values: ['active', 'inactive'],
        } as ColumnMetadata,
        {
          column_name: 'age',
          data_type: 'integer',
          is_filterable: true,
          min_value: 18,
          max_value: 120,
        } as ColumnMetadata,
        {
          column_name: 'name',
          data_type: 'varchar',
          is_filterable: true,
        } as ColumnMetadata,
        {
          column_name: 'is_verified',
          data_type: 'boolean',
          is_filterable: true,
        } as ColumnMetadata,
      ];

      const compiler = new FilterCompiler({
        columnMetadata: columns,
      });

      const builder = new QueryBuilder('users', 'postgresql');
      const filterDto = {
        status_eq: 'active',
        age_between: [25, 65],
        name_like: 'John',
        is_verified: true,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = $param1');
      expect(query.sql).toContain('AND age BETWEEN $param2_start AND $param2_end');
      expect(query.sql).toContain('AND name LIKE $param3');
      expect(query.sql).toContain('AND is_verified = $param4');
    });

    it('should work without strict type checking by default', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'postgresql');

      const filterDto = {
        age_gt: '18', // String instead of number - should pass without strict checking
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE age > $param1');
      expect(query.params).toEqual({ param1: '18' });
    });

    it('should handle MySQL parameter style', () => {
      const compiler = new FilterCompiler();
      const builder = new QueryBuilder('users', 'mysql');

      const filterDto = {
        status_eq: 'active',
        age_gt: 18,
      };

      compiler.compile(filterDto, builder);
      const query = builder.buildSelect();

      expect(query.sql).toContain('WHERE status = :param1'); // MySQL uses :paramN
      expect(query.sql).toContain('AND age > :param2');
      expect(query.params).toEqual({ param1: 'active', param2: 18 });
    });
  });
});
