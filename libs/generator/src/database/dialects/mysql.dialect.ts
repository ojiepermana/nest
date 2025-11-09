/**
 * MySQL Dialect Implementation
 *
 * Database-specific implementations for MySQL
 */

import type { IDatabaseDialect } from '../../interfaces/base.interface';

export class MySQLDialect implements IDatabaseDialect {
  quoteIdentifier(identifier: string): string {
    // MySQL uses backticks for identifiers
    // Handle schema.table format
    if (identifier.includes('.')) {
      const parts = identifier.split('.');
      return parts.map((p) => `\`${p}\``).join('.');
    }
    return `\`${identifier}\``;
  }

  mapDataType(genericType: string): string {
    const type = genericType.toLowerCase();

    // Map generic types to MySQL types
    if (type === 'string') return 'VARCHAR';
    if (type === 'text') return 'TEXT';
    if (type === 'int' || type === 'integer') return 'INT';
    if (type === 'bigint') return 'BIGINT';
    if (type === 'float') return 'FLOAT';
    if (type === 'double') return 'DOUBLE';
    if (type === 'decimal') return 'DECIMAL';
    if (type === 'boolean' || type === 'bool') return 'TINYINT(1)';
    if (type === 'date') return 'DATE';
    if (type === 'datetime' || type === 'timestamp') return 'DATETIME';
    if (type === 'json') return 'JSON';
    if (type === 'uuid') return 'CHAR(36)';

    return type.toUpperCase();
  }

  generateUUID(): string {
    // MySQL 8.0+ has UUID() function
    return 'UUID()';
  }

  buildPagination(page: number, limit: number): string {
    const offset = (page - 1) * limit;
    return `LIMIT ${limit} OFFSET ${offset}`;
  }

  buildLike(column: string, value: string): string {
    // MySQL LIKE is case-insensitive by default (depends on collation)
    // For case-insensitive, use LOWER on both sides
    return `LOWER(${column}) LIKE LOWER(${value})`;
  }

  jsonExtract(column: string, path: string): string {
    // MySQL JSON_EXTRACT returns JSON, use JSON_UNQUOTE for text
    return `JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${path}'))`;
  }

  arrayContains(column: string, value: string): string {
    // MySQL doesn't have native array type, typically stored as JSON
    return `JSON_CONTAINS(${column}, '"${value}"')`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getParameterPlaceholder(_index: number): string {
    // MySQL uses ? for all placeholders
    return '?';
  }
}
