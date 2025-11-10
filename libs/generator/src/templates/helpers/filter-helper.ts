/**
 * Filter Helper for Templates
 *
 * Generates filter clauses for SQL queries based on column metadata
 */

import type { ColumnMetadata } from '../../interfaces/generator.interface';
import type { IDatabaseDialect } from '../../interfaces/base.interface';

export interface FilterClause {
  condition: string;
  parameter: string;
  operator: string;
}

/**
 * Generate filter clause for a column
 */
export function generateFilterClause(
  column: ColumnMetadata,
  dialect: IDatabaseDialect,
  paramIndex: number,
): FilterClause {
  const columnName = dialect.quoteIdentifier(column.column_name);
  const dataType = column.data_type.toLowerCase();

  // Determine operators based on data type
  const operators: string[] = [];

  if (['varchar', 'text', 'char', 'string'].includes(dataType)) {
    operators.push('_eq', '_like', '_in');
  } else if (
    [
      'integer',
      'int',
      'bigint',
      'smallint',
      'decimal',
      'numeric',
      'float',
      'double',
    ].includes(dataType)
  ) {
    operators.push('_eq', '_gt', '_gte', '_lt', '_lte', '_between', '_in');
  } else if (['boolean', 'bool'].includes(dataType)) {
    operators.push('_eq');
  } else if (['date', 'timestamp', 'datetime'].includes(dataType)) {
    operators.push('_eq', '_gt', '_gte', '_lt', '_lte', '_between');
  } else {
    operators.push('_eq');
  }

  // Return first operator as default
  const operator = operators[0];

  return {
    condition: `${columnName} = $${paramIndex}`,
    parameter: column.column_name,
    operator,
  };
}

/**
 * Generate all filter clauses for filterable columns
 */
export function generateFilterClauses(
  columns: ColumnMetadata[],
  dialect: IDatabaseDialect,
): FilterClause[] {
  const filterableColumns = columns.filter((col) => col.is_filterable);

  return filterableColumns.map((col, index) =>
    generateFilterClause(col, dialect, index + 1),
  );
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  columns: ColumnMetadata[],
  dialect: IDatabaseDialect,
): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    // Parse operator from key (e.g., username_like -> username, like)
    const parts = key.split('_');
    const operator = parts[parts.length - 1];
    const columnName = parts.slice(0, -1).join('_');

    const column = columns.find((c) => c.column_name === columnName);
    if (!column || !column.is_filterable) continue;

    const quotedColumn = dialect.quoteIdentifier(columnName);

    // Build condition based on operator
    if (operator === 'eq') {
      conditions.push(`${quotedColumn} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    } else if (operator === 'like') {
      conditions.push(`${quotedColumn} ILIKE $${paramIndex}`);
      params.push(`%${value}%`);
      paramIndex++;
    } else if (operator === 'in') {
      const values = Array.isArray(value) ? value : [value];
      const placeholders = values
        .map((_, i) => `$${paramIndex + i}`)
        .join(', ');
      conditions.push(`${quotedColumn} IN (${placeholders})`);
      params.push(...values);
      paramIndex += values.length;
    } else if (operator === 'between') {
      const [start, end] = Array.isArray(value) ? value : value.split(',');
      conditions.push(
        `${quotedColumn} BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
      );
      params.push(start, end);
      paramIndex += 2;
    } else if (['gt', 'gte', 'lt', 'lte'].includes(operator)) {
      const sqlOp = {
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
      }[operator];
      conditions.push(`${quotedColumn} ${sqlOp} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  const sql = conditions.length > 0 ? conditions.join(' AND ') : '';

  return { sql, params };
}
