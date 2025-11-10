/**
 * JOIN Helper for Templates
 *
 * Generates JOIN clauses for SQL queries based on foreign key relationships
 */

import type { ColumnMetadata } from '../../interfaces/generator.interface';
import type { IDatabaseDialect } from '../../interfaces/base.interface';

export interface JoinClause {
  type: 'LEFT' | 'INNER' | 'RIGHT';
  table: string;
  alias: string;
  condition: string;
  columns?: string[];
}

/**
 * Generate JOIN clause from foreign key column
 */
export function generateJoinClause(
  column: ColumnMetadata,
  dialect: IDatabaseDialect,
  options?: {
    joinType?: 'LEFT' | 'INNER' | 'RIGHT';
    alias?: string;
  },
): JoinClause | null {
  if (!column.ref_table || !column.ref_column) {
    return null;
  }

  const joinType = options?.joinType || 'LEFT';
  const refTable = column.ref_schema
    ? `${dialect.quoteIdentifier(column.ref_schema)}.${dialect.quoteIdentifier(column.ref_table)}`
    : dialect.quoteIdentifier(column.ref_table);

  const alias = options?.alias || column.ref_table.substring(0, 1);
  const localColumn = dialect.quoteIdentifier(column.column_name);
  const refColumn = dialect.quoteIdentifier(column.ref_column);

  return {
    type: joinType,
    table: refTable,
    alias,
    condition: `t.${localColumn} = ${alias}.${refColumn}`,
  };
}

/**
 * Generate all JOIN clauses from foreign key columns
 */
export function generateJoinClauses(
  columns: ColumnMetadata[],
  dialect: IDatabaseDialect,
  options?: {
    joinType?: 'LEFT' | 'INNER' | 'RIGHT';
  },
): JoinClause[] {
  const foreignKeyColumns = columns.filter(
    (col) => col.ref_table && col.ref_column,
  );

  return foreignKeyColumns
    .map((col, index) =>
      generateJoinClause(col, dialect, {
        ...options,
        alias: col.ref_table!.substring(0, 1) + (index > 0 ? index : ''),
      }),
    )
    .filter((join): join is JoinClause => join !== null);
}

/**
 * Build complete JOIN SQL from clauses
 */
export function buildJoinSQL(joins: JoinClause[]): string {
  return joins
    .map(
      (join) =>
        `${join.type} JOIN ${join.table} ${join.alias} ON ${join.condition}`,
    )
    .join('\n      ');
}

/**
 * Generate method name for joined query
 */
export function generateJoinMethodName(
  tableName: string,
  refTable: string,
): string {
  // Convert to camelCase
  const toPascalCase = (str: string) =>
    str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  return `findWith${toPascalCase(refTable)}`;
}
