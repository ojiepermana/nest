/**
 * PostgreSQL Dialect Implementation
 *
 * Database-specific implementations for PostgreSQL
 */

import type { IDatabaseDialect } from '../../interfaces/base.interface';

export class PostgresDialect implements IDatabaseDialect {
  quoteIdentifier(identifier: string): string {
    // PostgreSQL uses double quotes for identifiers
    // Handle schema.table format
    if (identifier.includes('.')) {
      const parts = identifier.split('.');
      return parts.map((p) => `"${p}"`).join('.');
    }
    return `"${identifier}"`;
  }

  mapDataType(genericType: string): string {
    const type = genericType.toLowerCase();

    // Map generic types to PostgreSQL types
    if (type === 'string') return 'VARCHAR';
    if (type === 'text') return 'TEXT';
    if (type === 'int' || type === 'integer') return 'INTEGER';
    if (type === 'bigint') return 'BIGINT';
    if (type === 'float') return 'REAL';
    if (type === 'double') return 'DOUBLE PRECISION';
    if (type === 'decimal') return 'DECIMAL';
    if (type === 'boolean' || type === 'bool') return 'BOOLEAN';
    if (type === 'date') return 'DATE';
    if (type === 'datetime' || type === 'timestamp') return 'TIMESTAMP';
    if (type === 'json') return 'JSONB';
    if (type === 'uuid') return 'UUID';

    return type.toUpperCase();
  }

  generateUUID(): string {
    // Use uuid_generate_v7() if available
    return 'uuid_generate_v7()';
  }

  buildPagination(page: number, limit: number): string {
    const offset = (page - 1) * limit;
    return `LIMIT ${limit} OFFSET ${offset}`;
  }

  buildLike(column: string, value: string): string {
    // PostgreSQL has native ILIKE for case-insensitive
    return `${column} ILIKE ${value}`;
  }

  jsonExtract(column: string, path: string): string {
    // Returns text: column->>'key'
    return `${column}->>'${path}'`;
  }

  arrayContains(column: string, value: string): string {
    // Array containment operator
    return `${column} @> ARRAY['${value}']`;
  }

  getParameterPlaceholder(index: number): string {
    // PostgreSQL uses $1, $2, $3, etc.
    return `$${index}`;
  }
}
