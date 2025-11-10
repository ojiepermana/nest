/**
 * Metadata Service
 *
 * High-level service for metadata operations with caching support
 * Provides business logic layer on top of MetadataRepository
 */

import type { DatabaseConnectionManager } from '../database/connection.manager';
import type { IDatabaseDialect } from '../interfaces/base.interface';
import type {
  TableMetadata,
  ColumnMetadata,
  GeneratedFile,
} from '../interfaces/generator.interface';
import { MetadataRepository } from './metadata.repository';
import { Logger } from '../utils/logger.util';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class MetadataService {
  private readonly repository: MetadataRepository;
  private readonly cache: Map<string, CacheEntry<any>>;
  private readonly cacheTTL: number;

  constructor(
    connection: DatabaseConnectionManager,
    dialect: IDatabaseDialect,
    cacheTTL: number = 300000, // 5 minutes default
  ) {
    this.repository = new MetadataRepository(connection, dialect);
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  /**
   * Get cached data or fetch from repository
   */
  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      Logger.debug(`Cache hit for key: ${key}`);
      return cached.data as T;
    }

    Logger.debug(`Cache miss for key: ${key}`);
    const data = await fetcher();

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * Invalidate cache for specific key or all cache
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      Logger.debug(`Cache invalidated for key: ${key}`);
    } else {
      this.cache.clear();
      Logger.debug('All cache cleared');
    }
  }

  /**
   * Get table metadata with caching
   */
  async getTableMetadata(schema: string, tableName: string): Promise<TableMetadata | null> {
    const cacheKey = `table:${schema}.${tableName}`;
    return this.getCached(cacheKey, () => this.repository.getTableMetadata(schema, tableName));
  }

  /**
   * Get all active table metadata with caching
   */
  async getAllTableMetadata(): Promise<TableMetadata[]> {
    const cacheKey = 'tables:all';
    return this.getCached(cacheKey, () => this.repository.getAllTableMetadata());
  }

  /**
   * Get columns for a table with caching
   */
  async getColumnsByTableId(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `columns:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getColumnsByTableId(tableMetadataId));
  }

  /**
   * Get columns by schema and table name with caching
   */
  async getColumnsBySchemaAndTable(schema: string, tableName: string): Promise<ColumnMetadata[]> {
    const cacheKey = `columns:${schema}.${tableName}`;
    return this.getCached(cacheKey, () =>
      this.repository.getColumnsBySchemaAndTable(schema, tableName),
    );
  }

  /**
   * Alias for getColumnsBySchemaAndTable (for backward compatibility)
   */
  async getColumnMetadata(schema: string, tableName: string): Promise<ColumnMetadata[]> {
    return this.getColumnsBySchemaAndTable(schema, tableName);
  }

  /**
   * Get foreign key columns with caching
   */
  async getForeignKeyColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `fk:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getForeignKeyColumns(tableMetadataId));
  }

  /**
   * Get complete table configuration (table + columns + fks)
   */
  async getCompleteTableConfig(
    schema: string,
    tableName: string,
  ): Promise<{
    table: TableMetadata;
    columns: ColumnMetadata[];
    foreignKeys: ColumnMetadata[];
  } | null> {
    const table = await this.getTableMetadata(schema, tableName);

    if (!table) {
      return null;
    }

    const [columns, foreignKeys] = await Promise.all([
      this.getColumnsByTableId(table.id),
      this.getForeignKeyColumns(table.id),
    ]);

    return {
      table,
      columns,
      foreignKeys,
    };
  }

  /**
   * Get validation rules for a table
   */
  async getValidationRules(tableMetadataId: string): Promise<Map<string, any>> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    const rules = new Map<string, any>();

    for (const col of columns) {
      if (col.validation_rules) {
        rules.set(col.column_name, col.validation_rules);
      }
    }

    return rules;
  }

  /**
   * Get generated files for a table
   */
  async getGeneratedFiles(tableMetadataId: string): Promise<GeneratedFile[]> {
    // Don't cache generated files as they change frequently
    return this.repository.getGeneratedFilesByTableId(tableMetadataId);
  }

  /**
   * Save generated file (invalidates cache)
   */
  async saveGeneratedFile(
    file: Omit<GeneratedFile, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<GeneratedFile> {
    const result = await this.repository.saveGeneratedFile(file);
    this.invalidateCache(`files:${file.table_metadata_id}`);
    return result;
  }

  /**
   * Update file checksum (invalidates cache)
   */
  async updateFileChecksum(fileId: string, checksum: string): Promise<void> {
    await this.repository.updateFileChecksum(fileId, checksum);
    // Invalidate all file caches as we don't know which table this belongs to
    this.invalidateCache();
  }

  /**
   * Get generated file by path
   */
  async getGeneratedFileByPath(filePath: string): Promise<GeneratedFile | null> {
    return this.repository.getGeneratedFileByPath(filePath);
  }

  /**
   * Delete generated file
   */
  async deleteGeneratedFile(fileId: string): Promise<void> {
    await this.repository.deleteGeneratedFile(fileId);
    this.invalidateCache();
  }

  /**
   * Get columns for different views
   */
  async getListColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `list-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getListColumns(tableMetadataId));
  }

  async getFormColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `form-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getFormColumns(tableMetadataId));
  }

  async getDetailColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `detail-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getDetailColumns(tableMetadataId));
  }

  async getFilterableColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `filter-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getFilterableColumns(tableMetadataId));
  }

  async getSearchableColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `search-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getSearchableColumns(tableMetadataId));
  }

  async getSortableColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const cacheKey = `sort-cols:${tableMetadataId}`;
    return this.getCached(cacheKey, () => this.repository.getSortableColumns(tableMetadataId));
  }

  /**
   * Check if table has specific features
   */
  async hasFeature(
    schema: string,
    tableName: string,
    feature:
      | 'soft_delete'
      | 'timestamps'
      | 'created_by'
      | 'search'
      | 'export'
      | 'import'
      | 'recap'
      | 'cache'
      | 'audit'
      | 'rbac',
  ): Promise<boolean> {
    const table = await this.getTableMetadata(schema, tableName);

    if (!table) {
      return false;
    }

    switch (feature) {
      case 'soft_delete':
        return table.has_soft_delete;
      case 'timestamps':
        return true; // Default enabled
      case 'created_by':
        return table.has_created_by;
      case 'search':
        return false; // Not in current interface
      case 'export':
        return false; // Not in current interface
      case 'import':
        return false; // Not in current interface
      case 'recap':
        return false; // Not in current interface
      case 'cache':
        return table.cache_enabled || false;
      case 'audit':
        return false; // Not in current interface
      case 'rbac':
        return false; // Not in current interface
      default:
        return false;
    }
  }

  /**
   * Get primary key column for a table
   */
  async getPrimaryKeyColumn(schema: string, tableName: string): Promise<string | null> {
    const table = await this.getTableMetadata(schema, tableName);
    return table?.primary_key_column || null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    ttl: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      ttl: this.cacheTTL,
    };
  }
}
