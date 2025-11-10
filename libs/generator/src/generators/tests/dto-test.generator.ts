/**
 * DTO Test Generator
 *
 * Generates unit test files for DTO classes with validation tests
 */

import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface DtoTestGeneratorOptions {
  includeE2ETests?: boolean;
  includeEdgeCases?: boolean;
}

export class DtoTestGenerator {
  constructor(private options: DtoTestGeneratorOptions = {}) {
    this.options = {
      includeE2ETests: false,
      includeEdgeCases: true,
      ...options,
    };
  }

  /**
   * Generate DTO test file
   */
  generateCreateDtoTest(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const className = `Create${toPascalCase(table.table_name)}Dto`;
    const formColumns = columns.filter(
      (col) =>
        !col.is_primary_key &&
        col.column_name !== 'created_at' &&
        col.column_name !== 'updated_at' &&
        col.column_name !== 'deleted_at',
    );

    let testCode = this.generateFileHeader(table, className);
    testCode += this.generateImports(className, table.table_name);
    testCode += this.generateDescribeBlock(className, table, formColumns);

    return testCode;
  }

  /**
   * Generate Update DTO test file
   */
  generateUpdateDtoTest(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const className = `Update${toPascalCase(table.table_name)}Dto`;
    const formColumns = columns.filter(
      (col) =>
        !col.is_primary_key &&
        col.column_name !== 'created_at' &&
        col.column_name !== 'updated_at' &&
        col.column_name !== 'deleted_at',
    );

    let testCode = this.generateFileHeader(table, className);
    testCode += this.generateImports(className, table.table_name);
    testCode += this.generateUpdateDtoDescribeBlock(
      className,
      table,
      formColumns,
    );

    return testCode;
  }

  /**
   * Generate Filter DTO test file
   */
  generateFilterDtoTest(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const className = `${toPascalCase(table.table_name)}FilterDto`;
    const filterableColumns = columns.filter((col) => col.is_filterable);

    let testCode = this.generateFileHeader(table, className);
    testCode += this.generateImports(className, table.table_name);
    testCode += this.generateFilterDtoDescribeBlock(
      className,
      table,
      filterableColumns,
    );

    return testCode;
  }

  /**
   * Generate file header comment
   */
  private generateFileHeader(table: TableMetadata, className: string): string {
    return `/**
 * ${className} Unit Tests
 * Auto-generated test file for ${table.table_name} DTO
 * 
 * @group unit
 * @group dto
 */

`;
  }

  /**
   * Generate imports
   */
  private generateImports(className: string, tableName: string): string {
    return `import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ${className} } from './${tableName}.dto';

`;
  }

  /**
   * Generate describe block for Create DTO
   */
  private generateDescribeBlock(
    className: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const requiredFields = columns.filter((col) => col.is_required);
    const emailFields = columns.filter(
      (col) =>
        col.validation_rules &&
        typeof col.validation_rules === 'object' &&
        'email' in col.validation_rules &&
        (col.validation_rules as any).email === true,
    );
    const stringFields = columns.filter(
      (col) => col.data_type === 'varchar' || col.data_type === 'text',
    );
    const numericFields = columns.filter((col) =>
      ['integer', 'bigint', 'numeric', 'decimal'].includes(col.data_type),
    );

    let code = `describe('${className}', () => {
  // GENERATED_TEST_START: validation-success
  it('should pass validation with valid data', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  // GENERATED_TEST_END: validation-success

`;

    // Add required fields test
    if (requiredFields.length > 0) {
      code += `  // GENERATED_TEST_START: validation-required-fields
  it('should fail validation when required fields are missing', async () => {
    const dto = new ${className}();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    // Check specific required fields
${requiredFields
  .map(
    (col) =>
      `    const ${toCamelCase(col.column_name)}Error = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(${toCamelCase(col.column_name)}Error).toBeDefined();`,
  )
  .join('\n')}
  });
  // GENERATED_TEST_END: validation-required-fields

`;
    }

    // Add email validation test
    if (emailFields.length > 0) {
      emailFields.forEach((col) => {
        code += `  // GENERATED_TEST_START: validation-email-${col.column_name}
  it('should fail validation with invalid email format for ${col.column_name}', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
      ${toCamelCase(col.column_name)}: 'invalid-email',
    });

    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty('isEmail');
  });
  // GENERATED_TEST_END: validation-email-${col.column_name}

`;
      });
    }

    // Add string length validation test
    if (stringFields.length > 0 && stringFields.some((col) => col.max_length)) {
      const fieldsWithMaxLength = stringFields.filter((col) => col.max_length);
      fieldsWithMaxLength.forEach((col) => {
        code += `  // GENERATED_TEST_START: validation-max-length-${col.column_name}
  it('should fail validation when ${col.column_name} exceeds max length', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
      ${toCamelCase(col.column_name)}: 'a'.repeat(${(col.max_length || 0) + 1}),
    });

    const errors = await validate(dto);
    const error = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('maxLength');
  });
  // GENERATED_TEST_END: validation-max-length-${col.column_name}

`;
      });
    }

    // Add numeric range validation test
    if (
      numericFields.length > 0 &&
      numericFields.some(
        (col) => col.min_value !== null || col.max_value !== null,
      )
    ) {
      const fieldsWithRange = numericFields.filter(
        (col) => col.min_value !== null || col.max_value !== null,
      );
      fieldsWithRange.forEach((col) => {
        if (col.min_value !== null) {
          code += `  // GENERATED_TEST_START: validation-min-value-${col.column_name}
  it('should fail validation when ${col.column_name} is below minimum', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
      ${toCamelCase(col.column_name)}: ${Number(col.min_value) - 1},
    });

    const errors = await validate(dto);
    const error = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('min');
  });
  // GENERATED_TEST_END: validation-min-value-${col.column_name}

`;
        }

        if (col.max_value !== null) {
          code += `  // GENERATED_TEST_START: validation-max-value-${col.column_name}
  it('should fail validation when ${col.column_name} is above maximum', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
      ${toCamelCase(col.column_name)}: ${Number(col.max_value) + 1},
    });

    const errors = await validate(dto);
    const error = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('max');
  });
  // GENERATED_TEST_END: validation-max-value-${col.column_name}

`;
        }
      });
    }

    // Add enum validation test
    const enumFields = columns.filter(
      (col) => col.enum_values && col.enum_values.length > 0,
    );
    if (enumFields.length > 0) {
      enumFields.forEach((col) => {
        code += `  // GENERATED_TEST_START: validation-enum-${col.column_name}
  it('should fail validation with invalid enum value for ${col.column_name}', async () => {
    const dto = plainToClass(${className}, {
${this.generateValidTestData(columns, '      ')}
      ${toCamelCase(col.column_name)}: 'INVALID_VALUE',
    });

    const errors = await validate(dto);
    const error = errors.find((e) => e.property === '${toCamelCase(col.column_name)}');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('isEnum');
  });
  // GENERATED_TEST_END: validation-enum-${col.column_name}

`;
      });
    }

    code += `  // CUSTOM_TESTS_START
  // Add your custom DTO tests here
  // CUSTOM_TESTS_END
});
`;

    return code;
  }

  /**
   * Generate describe block for Update DTO
   */
  private generateUpdateDtoDescribeBlock(
    className: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    return `describe('${className}', () => {
  // GENERATED_TEST_START: partial-update
  it('should allow partial updates (all fields optional)', async () => {
    const dto = plainToClass(${className}, {
      ${columns[0] ? `${toCamelCase(columns[0].column_name)}: ${this.generateSampleValue(columns[0])}` : ''}
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  // GENERATED_TEST_END: partial-update

  // GENERATED_TEST_START: empty-update
  it('should pass validation with no fields specified', async () => {
    const dto = new ${className}();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  // GENERATED_TEST_END: empty-update

  // CUSTOM_TESTS_START
  // Add your custom Update DTO tests here
  // CUSTOM_TESTS_END
});
`;
  }

  /**
   * Generate describe block for Filter DTO
   */
  private generateFilterDtoDescribeBlock(
    className: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    return `describe('${className}', () => {
  // GENERATED_TEST_START: filter-operators
  it('should accept valid filter operators', async () => {
    const dto = plainToClass(${className}, {
${columns
  .slice(0, 3)
  .map((col) => {
    const operators = this.getFilterOperators(col);
    if (operators.length > 0) {
      return `      ${toCamelCase(col.column_name)}_${operators[0]}: ${this.generateSampleValue(col)}`;
    }
    return null;
  })
  .filter((line) => line !== null)
  .join(',\n')}
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  // GENERATED_TEST_END: filter-operators

  // GENERATED_TEST_START: optional-filters
  it('should pass validation with no filters specified', async () => {
    const dto = new ${className}();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  // GENERATED_TEST_END: optional-filters

  // CUSTOM_TESTS_START
  // Add your custom Filter DTO tests here
  // CUSTOM_TESTS_END
});
`;
  }

  /**
   * Generate valid test data for a set of columns
   */
  private generateValidTestData(
    columns: ColumnMetadata[],
    indent: string,
  ): string {
    return columns
      .map((col) => {
        const value = this.generateSampleValue(col);
        return `${indent}${toCamelCase(col.column_name)}: ${value}`;
      })
      .join(',\n');
  }

  /**
   * Generate sample value based on column type and constraints
   */
  private generateSampleValue(col: ColumnMetadata): string {
    // Check for enum values
    if (col.enum_values && col.enum_values.length > 0) {
      return `'${col.enum_values[0]}'`;
    }

    // Check for email validation
    if (
      col.validation_rules &&
      typeof col.validation_rules === 'object' &&
      'email' in col.validation_rules &&
      (col.validation_rules as any).email === true
    ) {
      return `'test@example.com'`;
    }

    // Generate based on data type
    switch (col.data_type) {
      case 'varchar':
      case 'text':
      case 'char':
        if (col.max_length && col.max_length > 0) {
          const sampleLength = Math.min(col.max_length, 20);
          return `'${'test'.repeat(Math.ceil(sampleLength / 4)).substring(0, sampleLength)}'`;
        }
        return `'test-${toCamelCase(col.column_name)}'`;

      case 'integer':
      case 'bigint':
      case 'smallint':
        if (col.min_value !== null && col.max_value !== null) {
          return String(
            Math.floor((Number(col.min_value) + Number(col.max_value)) / 2),
          );
        }
        return '1';

      case 'numeric':
      case 'decimal':
      case 'float':
      case 'double':
        if (col.min_value !== null && col.max_value !== null) {
          return ((Number(col.min_value) + Number(col.max_value)) / 2).toFixed(
            2,
          );
        }
        return '1.5';

      case 'boolean':
        return 'true';

      case 'date':
        return `'2024-01-01'`;

      case 'timestamp':
      case 'timestamptz':
      case 'datetime':
        return `'2024-01-01T00:00:00.000Z'`;

      case 'uuid':
        return `'123e4567-e89b-12d3-a456-426614174000'`;

      case 'json':
      case 'jsonb':
        return `{ key: 'value' }`;

      default:
        return `'test-value'`;
    }
  }

  /**
   * Get available filter operators for a column
   */
  private getFilterOperators(col: ColumnMetadata): string[] {
    const operators: string[] = [];

    switch (col.data_type) {
      case 'varchar':
      case 'text':
      case 'char':
        operators.push('eq', 'like', 'in');
        break;

      case 'integer':
      case 'bigint':
      case 'smallint':
      case 'numeric':
      case 'decimal':
      case 'float':
      case 'double':
        operators.push('eq', 'gt', 'gte', 'lt', 'lte', 'between');
        break;

      case 'boolean':
        operators.push('eq');
        break;

      case 'date':
      case 'timestamp':
      case 'timestamptz':
      case 'datetime':
        operators.push('eq', 'gte', 'lte', 'between');
        break;

      default:
        operators.push('eq');
    }

    return operators;
  }
}
