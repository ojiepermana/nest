/**
 * Base interface for all code generators
 */
export interface ICodeGenerator {
  /**
   * Generate code based on context
   */
  generate(context: any): Promise<string>;

  /**
   * Validate if generation is possible
   */
  validate(context: any): Promise<boolean>;
}

/**
 * Interface for database dialect implementations
 */
export interface IDatabaseDialect {
  /**
   * Quote identifier (table, column, schema names)
   */
  quoteIdentifier(name: string): string;

  /**
   * Get data type mapping from generic to database-specific
   */
  mapDataType(genericType: string): string;

  /**
   * Generate UUID
   */
  generateUUID(): string;

  /**
   * Build pagination clause
   */
  buildPagination(page: number, limit: number): string;

  /**
   * Build LIKE clause for pattern matching
   */
  buildLike(column: string, value: string): string;

  /**
   * Build JSON operations
   */
  jsonExtract(column: string, path: string): string;

  /**
   * Build array operations
   */
  arrayContains(column: string, value: string): string;

  /**
   * Get parameter placeholder
   */
  getParameterPlaceholder(index: number): string;
}

/**
 * Interface for metadata service
 */
export interface IMetadataService {
  /**
   * Get table metadata by schema and table name
   */
  getTableMetadata(schema: string, table: string): Promise<any>;

  /**
   * Get all columns for a table
   */
  getColumns(tableMetadataId: string): Promise<any[]>;

  /**
   * Get generated files for a table
   */
  getGeneratedFiles(tableMetadataId: string): Promise<any[]>;

  /**
   * Save generated file record
   */
  saveGeneratedFile(file: any): Promise<void>;

  /**
   * Update file checksum
   */
  updateChecksum(fileId: string, checksum: string): Promise<void>;
}

/**
 * Interface for file merger (custom code preservation)
 */
export interface IFileMerger {
  /**
   * Merge new generated code with existing custom code
   */
  merge(existingContent: string, newContent: string): string;

  /**
   * Extract custom code blocks
   */
  extractCustomBlocks(content: string): Map<string, string>;

  /**
   * Calculate file checksum
   */
  calculateChecksum(content: string): string;
}
