/**
 * Filter Compiler
 *
 * Compiles FilterDto fields into QueryBuilder WHERE conditions with type validation
 */

import { QueryBuilder } from './query-builder';
import { QueryFilterOperator } from './query-types';
import type { ColumnMetadata } from '../../interfaces/generator.interface';

/**
 * Filter compilation options
 */
export interface FilterCompilerOptions {
  strictTypeChecking?: boolean; // Validate types against column metadata
  allowUnknownColumns?: boolean; // Allow filters for columns not in metadata
  columnMetadata?: ColumnMetadata[]; // Column definitions for validation
}

/**
 * Filter validation error
 */
export class FilterValidationError extends Error {
  constructor(
    public field: string,
    public operator: string,
    public reason: string,
  ) {
    super(`Filter validation failed for ${field}_${operator}: ${reason}`);
    this.name = 'FilterValidationError';
  }
}

/**
 * Compiled filter result
 */
export interface CompiledFilter {
  field: string;
  operator: QueryFilterOperator;
  value: any;
  isValid: boolean;
  error?: string;
}

export class FilterCompiler {
  private options: Required<FilterCompilerOptions>;
  private columnMap: Map<string, ColumnMetadata>;

  constructor(options: FilterCompilerOptions = {}) {
    this.options = {
      strictTypeChecking: options.strictTypeChecking ?? false,
      allowUnknownColumns: options.allowUnknownColumns ?? true,
      columnMetadata: options.columnMetadata ?? [],
    };

    // Build column map for fast lookup
    this.columnMap = new Map();
    if (this.options.columnMetadata) {
      this.options.columnMetadata.forEach((col) => {
        this.columnMap.set(col.column_name, col);
      });
    }
  }

  /**
   * Compile filter DTO into QueryBuilder conditions
   */
  compile(filterDto: Record<string, any>, builder: QueryBuilder): QueryBuilder {
    const compiledFilters = this.compileFilters(filterDto);

    compiledFilters.forEach((filter) => {
      if (filter.isValid) {
        builder.where(filter.field, filter.operator, filter.value);
      } else if (this.options.strictTypeChecking) {
        throw new FilterValidationError(
          filter.field,
          this.getOperatorString(filter.operator),
          filter.error || 'Invalid filter',
        );
      }
    });

    return builder;
  }

  /**
   * Compile filters and return results without applying to builder
   */
  compileFilters(filterDto: Record<string, any>): CompiledFilter[] {
    const results: CompiledFilter[] = [];

    Object.keys(filterDto).forEach((key) => {
      const value = filterDto[key];

      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }

      const parsed = this.parseFilterKey(key);
      if (!parsed) {
        return;
      }

      const { field, operator } = parsed;

      // Validate filter
      const validation = this.validateFilter(field, operator, value);

      results.push({
        field,
        operator,
        value,
        isValid: validation.isValid,
        error: validation.error,
      });
    });

    return results;
  }

  /**
   * Parse filter key into field and operator
   */
  private parseFilterKey(key: string): {
    field: string;
    operator: QueryFilterOperator;
  } | null {
    // Match operator suffix pattern: field_operator
    const operatorMatch = key.match(/^(.+)_(eq|ne|gt|gte|lt|lte|like|in|between|null)$/);

    if (operatorMatch) {
      const [, field, operatorStr] = operatorMatch;
      const operator = this.mapOperatorString(operatorStr);

      if (operator !== null) {
        return { field, operator };
      }
    }

    // If no operator suffix, assume equality
    return {
      field: key,
      operator: QueryFilterOperator.EQUALS,
    };
  }

  /**
   * Validate filter against column metadata
   */
  private validateFilter(
    field: string,
    operator: QueryFilterOperator,
    value: any,
  ): { isValid: boolean; error?: string } {
    // Check if column exists in metadata
    const column = this.columnMap.get(field);

    if (!column) {
      if (!this.options.allowUnknownColumns) {
        return {
          isValid: false,
          error: `Column '${field}' not found in metadata`,
        };
      }
      // If unknown columns allowed, skip further validation
      return { isValid: true };
    }

    // Check if column is filterable
    if (column.is_filterable === false) {
      return {
        isValid: false,
        error: `Column '${field}' is not filterable`,
      };
    }

    // Validate operator for data type
    const typeValidation = this.validateOperatorForType(column.data_type, operator);
    if (!typeValidation.isValid) {
      return typeValidation;
    }

    // Validate value type
    const valueValidation = this.validateValueType(column.data_type, operator, value);
    if (!valueValidation.isValid) {
      return valueValidation;
    }

    // Validate enum values
    if (column.enum_values && column.enum_values.length > 0) {
      if (operator === QueryFilterOperator.EQUALS) {
        if (!column.enum_values.includes(value)) {
          return {
            isValid: false,
            error: `Value '${value}' not in enum: [${column.enum_values.join(', ')}]`,
          };
        }
      } else if (operator === QueryFilterOperator.IN) {
        if (!Array.isArray(value)) {
          return {
            isValid: false,
            error: `IN operator requires array value`,
          };
        }
        const invalidValues = value.filter((v) => !column.enum_values!.includes(v));
        if (invalidValues.length > 0) {
          return {
            isValid: false,
            error: `Invalid enum values: [${invalidValues.join(', ')}]`,
          };
        }
      }
    }

    // Validate range constraints
    if (
      operator === QueryFilterOperator.GREATER_THAN ||
      operator === QueryFilterOperator.GREATER_THAN_OR_EQUAL ||
      operator === QueryFilterOperator.LESS_THAN ||
      operator === QueryFilterOperator.LESS_THAN_OR_EQUAL
    ) {
      if (column.min_value !== undefined && value < column.min_value) {
        return {
          isValid: false,
          error: `Value ${value} is less than minimum ${column.min_value}`,
        };
      }
      if (column.max_value !== undefined && value > column.max_value) {
        return {
          isValid: false,
          error: `Value ${value} is greater than maximum ${column.max_value}`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate operator compatibility with data type
   */
  private validateOperatorForType(
    dataType: string,
    operator: QueryFilterOperator,
  ): { isValid: boolean; error?: string } {
    const numericTypes = [
      'integer',
      'bigint',
      'smallint',
      'decimal',
      'numeric',
      'real',
      'double precision',
      'float',
      'int',
      'tinyint',
      'mediumint',
    ];
    const stringTypes = ['varchar', 'char', 'text', 'string', 'character varying'];
    const dateTypes = ['date', 'timestamp', 'datetime', 'time'];
    const booleanTypes = ['boolean', 'bool'];

    const isNumeric = numericTypes.includes(dataType.toLowerCase());
    const isString = stringTypes.includes(dataType.toLowerCase());
    const isDate = dateTypes.includes(dataType.toLowerCase());
    const isBoolean = booleanTypes.includes(dataType.toLowerCase());

    // LIKE operator only for strings
    if (operator === QueryFilterOperator.LIKE) {
      if (!isString) {
        return {
          isValid: false,
          error: `LIKE operator not supported for type '${dataType}'`,
        };
      }
    }

    // Comparison operators for numeric, date, or string types
    if (
      operator === QueryFilterOperator.GREATER_THAN ||
      operator === QueryFilterOperator.GREATER_THAN_OR_EQUAL ||
      operator === QueryFilterOperator.LESS_THAN ||
      operator === QueryFilterOperator.LESS_THAN_OR_EQUAL
    ) {
      if (!isNumeric && !isDate && !isString) {
        return {
          isValid: false,
          error: `Comparison operators not supported for type '${dataType}'`,
        };
      }
    }

    // BETWEEN operator for numeric, date types
    if (operator === QueryFilterOperator.BETWEEN) {
      if (!isNumeric && !isDate) {
        return {
          isValid: false,
          error: `BETWEEN operator not supported for type '${dataType}'`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate value type matches expected type for operator
   */
  private validateValueType(
    dataType: string,
    operator: QueryFilterOperator,
    value: any,
  ): { isValid: boolean; error?: string } {
    // IN operator requires array
    if (operator === QueryFilterOperator.IN) {
      if (!Array.isArray(value)) {
        return {
          isValid: false,
          error: `IN operator requires array value, got ${typeof value}`,
        };
      }
      if (value.length === 0) {
        return {
          isValid: false,
          error: `IN operator requires non-empty array`,
        };
      }
    }

    // BETWEEN operator requires array with 2 elements
    if (operator === QueryFilterOperator.BETWEEN) {
      if (!Array.isArray(value)) {
        return {
          isValid: false,
          error: `BETWEEN operator requires array value, got ${typeof value}`,
        };
      }
      if (value.length !== 2) {
        return {
          isValid: false,
          error: `BETWEEN operator requires array with 2 elements, got ${value.length}`,
        };
      }
    }

    // IS_NULL operator requires boolean
    if (operator === QueryFilterOperator.IS_NULL) {
      if (typeof value !== 'boolean') {
        return {
          isValid: false,
          error: `IS_NULL operator requires boolean value, got ${typeof value}`,
        };
      }
    }

    // Type checking for numeric types
    const numericTypes = [
      'integer',
      'bigint',
      'smallint',
      'decimal',
      'numeric',
      'real',
      'double precision',
      'float',
      'int',
      'tinyint',
      'mediumint',
    ];
    if (this.options.strictTypeChecking && numericTypes.includes(dataType.toLowerCase())) {
      if (
        operator !== QueryFilterOperator.IN &&
        operator !== QueryFilterOperator.BETWEEN &&
        operator !== QueryFilterOperator.IS_NULL
      ) {
        if (typeof value !== 'number') {
          return {
            isValid: false,
            error: `Expected number for type '${dataType}', got ${typeof value}`,
          };
        }
      }
    }

    // Type checking for boolean types
    const booleanTypes = ['boolean', 'bool'];
    if (this.options.strictTypeChecking && booleanTypes.includes(dataType.toLowerCase())) {
      if (operator !== QueryFilterOperator.IN && operator !== QueryFilterOperator.IS_NULL) {
        if (typeof value !== 'boolean') {
          return {
            isValid: false,
            error: `Expected boolean for type '${dataType}', got ${typeof value}`,
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Map operator string to QueryFilterOperator
   */
  private mapOperatorString(operatorStr: string): QueryFilterOperator | null {
    const operatorMap: Record<string, QueryFilterOperator> = {
      eq: QueryFilterOperator.EQUALS,
      ne: QueryFilterOperator.NOT_EQUALS,
      gt: QueryFilterOperator.GREATER_THAN,
      gte: QueryFilterOperator.GREATER_THAN_OR_EQUAL,
      lt: QueryFilterOperator.LESS_THAN,
      lte: QueryFilterOperator.LESS_THAN_OR_EQUAL,
      like: QueryFilterOperator.LIKE,
      in: QueryFilterOperator.IN,
      between: QueryFilterOperator.BETWEEN,
      null: QueryFilterOperator.IS_NULL,
    };

    return operatorMap[operatorStr] || null;
  }

  /**
   * Get operator string from QueryFilterOperator
   */
  private getOperatorString(operator: QueryFilterOperator): string {
    const operatorMap: Record<QueryFilterOperator, string> = {
      [QueryFilterOperator.EQUALS]: 'eq',
      [QueryFilterOperator.NOT_EQUALS]: 'ne',
      [QueryFilterOperator.GREATER_THAN]: 'gt',
      [QueryFilterOperator.GREATER_THAN_OR_EQUAL]: 'gte',
      [QueryFilterOperator.LESS_THAN]: 'lt',
      [QueryFilterOperator.LESS_THAN_OR_EQUAL]: 'lte',
      [QueryFilterOperator.LIKE]: 'like',
      [QueryFilterOperator.IN]: 'in',
      [QueryFilterOperator.BETWEEN]: 'between',
      [QueryFilterOperator.IS_NULL]: 'null',
    };

    return operatorMap[operator] || 'unknown';
  }

  /**
   * Get column metadata
   */
  getColumnMetadata(columnName: string): ColumnMetadata | undefined {
    return this.columnMap.get(columnName);
  }

  /**
   * Check if column is filterable
   */
  isFilterable(columnName: string): boolean {
    const column = this.columnMap.get(columnName);
    return column ? column.is_filterable !== false : true;
  }

  /**
   * Get available operators for a column
   */
  getAvailableOperators(columnName: string): QueryFilterOperator[] {
    const column = this.columnMap.get(columnName);
    if (!column) {
      return Object.values(QueryFilterOperator);
    }

    const dataType = column.data_type.toLowerCase();
    const operators: QueryFilterOperator[] = [
      QueryFilterOperator.EQUALS,
      QueryFilterOperator.NOT_EQUALS,
      QueryFilterOperator.IS_NULL,
    ];

    const numericTypes = [
      'integer',
      'bigint',
      'smallint',
      'decimal',
      'numeric',
      'real',
      'double precision',
      'float',
      'int',
      'tinyint',
      'mediumint',
    ];
    const stringTypes = ['varchar', 'char', 'text', 'string', 'character varying'];
    const dateTypes = ['date', 'timestamp', 'datetime', 'time'];

    if (stringTypes.includes(dataType)) {
      operators.push(QueryFilterOperator.LIKE);
    }

    if (
      numericTypes.includes(dataType) ||
      dateTypes.includes(dataType) ||
      stringTypes.includes(dataType)
    ) {
      operators.push(
        QueryFilterOperator.GREATER_THAN,
        QueryFilterOperator.GREATER_THAN_OR_EQUAL,
        QueryFilterOperator.LESS_THAN,
        QueryFilterOperator.LESS_THAN_OR_EQUAL,
      );
    }

    if (numericTypes.includes(dataType) || dateTypes.includes(dataType)) {
      operators.push(QueryFilterOperator.BETWEEN);
    }

    operators.push(QueryFilterOperator.IN);

    return operators;
  }
}
