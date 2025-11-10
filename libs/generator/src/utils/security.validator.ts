/**
 * Security Validator
 *
 * SQL injection prevention and input validation utilities
 * Provides identifier validation, sanitization, and security checks
 */

export class SecurityValidator {
  private static readonly IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  private static readonly SAFE_STRING_PATTERN = /^[a-zA-Z0-9\s\-_.@,()]*$/;
  private static readonly SQL_KEYWORDS = new Set([
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'UNION',
    'EXEC',
    'EXECUTE',
    '--',
    ';',
    '/*',
    '*/',
    'xp_',
    'sp_',
  ]);

  /**
   * Validate identifier (table name, column name, schema name)
   * Throws error if invalid to prevent SQL injection
   */
  static validateIdentifier(
    identifier: string,
    whitelist?: string[],
    context: string = 'identifier',
  ): string {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error(`Invalid ${context}: must be a non-empty string`);
    }

    // Trim whitespace
    const trimmed = identifier.trim();

    // Check against whitelist if provided
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.includes(trimmed.toLowerCase())) {
        throw new Error(
          `Invalid ${context}: "${trimmed}" not in allowed values`,
        );
      }
      return trimmed;
    }

    // Validate identifier pattern
    if (!this.IDENTIFIER_PATTERN.test(trimmed)) {
      throw new Error(
        `Invalid ${context}: "${trimmed}" contains invalid characters. Only alphanumeric and underscore allowed, must start with letter or underscore.`,
      );
    }

    // Check for SQL keywords
    if (this.SQL_KEYWORDS.has(trimmed.toUpperCase())) {
      throw new Error(
        `Invalid ${context}: "${trimmed}" is a reserved SQL keyword`,
      );
    }

    // Max length check (PostgreSQL/MySQL limit)
    if (trimmed.length > 63) {
      throw new Error(
        `Invalid ${context}: "${trimmed}" exceeds maximum length of 63 characters`,
      );
    }

    return trimmed;
  }

  /**
   * Validate multiple identifiers (for ORDER BY, GROUP BY, etc.)
   */
  static validateIdentifiers(
    identifiers: string[],
    whitelist?: string[],
    context: string = 'identifiers',
  ): string[] {
    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      throw new Error(`Invalid ${context}: must be a non-empty array`);
    }

    return identifiers.map((id, index) =>
      this.validateIdentifier(id, whitelist, `${context}[${index}]`),
    );
  }

  /**
   * Sanitize string input for safe use in queries
   * Note: This is NOT a replacement for parameterized queries
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove any SQL comment patterns
    let sanitized = input
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');

    // Remove common SQL injection patterns
    sanitized = sanitized
      .replace(/;\s*DROP/gi, '')
      .replace(/;\s*DELETE/gi, '')
      .replace(/;\s*UPDATE/gi, '')
      .replace(/UNION\s+SELECT/gi, '');

    return sanitized.trim();
  }

  /**
   * Check if string is safe (no special SQL characters)
   */
  static isSafeString(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    return this.SAFE_STRING_PATTERN.test(input);
  }

  /**
   * Validate numeric input
   */
  static validateNumeric(
    input: any,
    context: string = 'numeric value',
  ): number {
    const num = Number(input);

    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Invalid ${context}: must be a valid number`);
    }

    return num;
  }

  /**
   * Validate integer input
   */
  static validateInteger(input: any, context: string = 'integer'): number {
    const num = this.validateNumeric(input, context);

    if (!Number.isInteger(num)) {
      throw new Error(`Invalid ${context}: must be an integer`);
    }

    return num;
  }

  /**
   * Validate positive integer
   */
  static validatePositiveInteger(
    input: any,
    context: string = 'positive integer',
  ): number {
    const num = this.validateInteger(input, context);

    if (num <= 0) {
      throw new Error(`Invalid ${context}: must be positive`);
    }

    return num;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(
    page: any,
    limit: any,
  ): { page: number; limit: number } {
    const validPage = this.validatePositiveInteger(page, 'page');
    const validLimit = this.validatePositiveInteger(limit, 'limit');

    // Enforce maximum limit
    const maxLimit = 1000;
    if (validLimit > maxLimit) {
      throw new Error(`Invalid limit: maximum allowed is ${maxLimit}`);
    }

    return { page: validPage, limit: validLimit };
  }

  /**
   * Validate sort direction
   */
  static validateSortDirection(direction: string): 'ASC' | 'DESC' {
    const upper = direction.toUpperCase();

    if (upper !== 'ASC' && upper !== 'DESC') {
      throw new Error(
        `Invalid sort direction: must be 'ASC' or 'DESC', got '${direction}'`,
      );
    }

    return upper;
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string, context: string = 'UUID'): string {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(uuid)) {
      throw new Error(`Invalid ${context}: not a valid UUID format`);
    }

    return uuid.toLowerCase();
  }

  /**
   * Validate date string
   */
  static validateDate(dateStr: string, context: string = 'date'): Date {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${context}: '${dateStr}' is not a valid date`);
    }

    return date;
  }

  /**
   * Validate array of values
   */
  static validateArray<T>(
    input: any,
    validator: (item: any) => T,
    context: string = 'array',
  ): T[] {
    if (!Array.isArray(input)) {
      throw new Error(`Invalid ${context}: must be an array`);
    }

    if (input.length === 0) {
      throw new Error(`Invalid ${context}: must not be empty`);
    }

    // Limit array size to prevent DoS
    if (input.length > 100) {
      throw new Error(
        `Invalid ${context}: maximum 100 items allowed, got ${input.length}`,
      );
    }

    return input.map((item, index) => {
      try {
        return validator(item);
      } catch (error) {
        throw new Error(
          `Invalid ${context}[${index}]: ${error instanceof Error ? error.message : 'validation failed'}`,
        );
      }
    });
  }

  /**
   * Create whitelist from column metadata
   */
  static createColumnWhitelist(
    columns: Array<{ column_name: string }>,
  ): string[] {
    return columns.map((col) => col.column_name.toLowerCase());
  }

  /**
   * Validate filter operators
   */
  static validateFilterOperator(operator: string): string {
    const validOperators = [
      'eq',
      'ne',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'in',
      'nin',
      'between',
      'null',
      'nnull',
    ];

    const lower = operator.toLowerCase();

    if (!validOperators.includes(lower)) {
      throw new Error(
        `Invalid filter operator: '${operator}'. Allowed: ${validOperators.join(', ')}`,
      );
    }

    return lower;
  }
}
