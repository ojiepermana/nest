/**
 * Metadata Repository
 *
 * Low-level data access for metadata tables
 * Handles direct database queries for table_metadata, column_metadata, and generated_files
 */

import type { DatabaseConnectionManager } from '../database/connection.manager';
import type { IDatabaseDialect } from '../interfaces/base.interface';
import type {
  TableMetadata,
  ColumnMetadata,
  GeneratedFile,
} from '../interfaces/generator.interface';
import { Logger } from '../utils/logger.util';

export class MetadataRepository {
  constructor(
    private readonly connection: DatabaseConnectionManager,
    private readonly dialect: IDatabaseDialect,
  ) {}

  /**
   * Get table metadata by schema and table name
   */
  async getTableMetadata(
    schema: string,
    tableName: string,
  ): Promise<TableMetadata | null> {
    const query = `
      SELECT *
      FROM ${this.dialect.quoteIdentifier('meta.table_metadata')}
      WHERE schema_name = ${this.dialect.getParameterPlaceholder(1)}
        AND table_name = ${this.dialect.getParameterPlaceholder(2)}
        AND status = 'active'
    `;

    const result = await this.connection.query<TableMetadata>(query, [
      schema,
      tableName,
    ]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all active table metadata
   */
  async getAllTableMetadata(): Promise<TableMetadata[]> {
    const query = `
      SELECT *
      FROM ${this.dialect.quoteIdentifier('meta.table_metadata')}
      WHERE status = 'active'
      ORDER BY schema_name, table_name
    `;

    const result = await this.connection.query<TableMetadata>(query);
    return result.rows;
  }

  /**
   * Get all columns for a table by table metadata ID
   */
  async getColumnsByTableId(
    tableMetadataId: string,
  ): Promise<ColumnMetadata[]> {
    const query = `
      SELECT *
      FROM ${this.dialect.quoteIdentifier('meta.column_metadata')}
      WHERE table_metadata_id = ${this.dialect.getParameterPlaceholder(1)}
      ORDER BY column_order, column_name
    `;

    const result = await this.connection.query<ColumnMetadata>(query, [
      tableMetadataId,
    ]);

    return result.rows;
  }

  /**
   * Get all columns for a table by schema and table name
   */
  async getColumnsBySchemaAndTable(
    schema: string,
    tableName: string,
  ): Promise<ColumnMetadata[]> {
    const tableMetadata = await this.getTableMetadata(schema, tableName);

    if (!tableMetadata) {
      Logger.warn(`Table metadata not found for ${schema}.${tableName}`);
      return [];
    }

    return this.getColumnsByTableId(tableMetadata.id);
  }

  /**
   * Get foreign key columns for a table
   */
  async getForeignKeyColumns(
    tableMetadataId: string,
  ): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter(
      (col) => col.ref_schema && col.ref_table && col.ref_column,
    );
  }

  /**
   * Get generated files for a table
   */
  async getGeneratedFilesByTableId(
    tableMetadataId: string,
  ): Promise<GeneratedFile[]> {
    const query = `
      SELECT *
      FROM ${this.dialect.quoteIdentifier('meta.generated_files')}
      WHERE table_metadata_id = ${this.dialect.getParameterPlaceholder(1)}
      ORDER BY file_type, file_path
    `;

    const result = await this.connection.query<GeneratedFile>(query, [
      tableMetadataId,
    ]);

    return result.rows;
  }

  /**
   * Save generated file record
   */
  async saveGeneratedFile(
    file: Omit<GeneratedFile, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<GeneratedFile> {
    const now = new Date();
    const query = `
      INSERT INTO ${this.dialect.quoteIdentifier('meta.generated_files')}
        (id, table_metadata_id, file_type, file_path, file_name, checksum, last_generated_at, created_at, updated_at)
      VALUES (
        ${this.dialect.generateUUID()},
        ${this.dialect.getParameterPlaceholder(1)},
        ${this.dialect.getParameterPlaceholder(2)},
        ${this.dialect.getParameterPlaceholder(3)},
        ${this.dialect.getParameterPlaceholder(4)},
        ${this.dialect.getParameterPlaceholder(5)},
        ${this.dialect.getParameterPlaceholder(6)},
        ${this.dialect.getParameterPlaceholder(7)},
        ${this.dialect.getParameterPlaceholder(8)}
      )
      RETURNING *
    `;

    const result = await this.connection.query<GeneratedFile>(query, [
      file.table_metadata_id,
      file.file_type,
      file.file_path,
      file.file_name,
      file.checksum,
      file.last_generated_at,
      now,
      now,
    ]);

    return result.rows[0];
  }

  /**
   * Update generated file checksum
   */
  async updateFileChecksum(fileId: string, checksum: string): Promise<void> {
    const query = `
      UPDATE ${this.dialect.quoteIdentifier('meta.generated_files')}
      SET checksum = ${this.dialect.getParameterPlaceholder(1)},
          last_generated_at = ${this.dialect.getParameterPlaceholder(2)},
          updated_at = ${this.dialect.getParameterPlaceholder(3)}
      WHERE id = ${this.dialect.getParameterPlaceholder(4)}
    `;

    const now = new Date();
    await this.connection.query(query, [checksum, now, now, fileId]);
  }

  /**
   * Get generated file by path
   */
  async getGeneratedFileByPath(
    filePath: string,
  ): Promise<GeneratedFile | null> {
    const query = `
      SELECT *
      FROM ${this.dialect.quoteIdentifier('meta.generated_files')}
      WHERE file_path = ${this.dialect.getParameterPlaceholder(1)}
    `;

    const result = await this.connection.query<GeneratedFile>(query, [
      filePath,
    ]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete generated file record
   */
  async deleteGeneratedFile(fileId: string): Promise<void> {
    const query = `
      DELETE FROM ${this.dialect.quoteIdentifier('meta.generated_files')}
      WHERE id = ${this.dialect.getParameterPlaceholder(1)}
    `;

    await this.connection.query(query, [fileId]);
  }

  /**
   * Get columns that should display in list view
   */
  async getListColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.display_in_list);
  }

  /**
   * Get columns that should display in form
   */
  async getFormColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.display_in_form);
  }

  /**
   * Get columns that should display in detail view
   */
  async getDetailColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.display_in_detail);
  }

  /**
   * Get filterable columns
   */
  async getFilterableColumns(
    tableMetadataId: string,
  ): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.is_filterable);
  }

  /**
   * Get searchable columns
   */
  async getSearchableColumns(
    tableMetadataId: string,
  ): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.is_searchable);
  }

  /**
   * Get sortable columns
   */
  async getSortableColumns(tableMetadataId: string): Promise<ColumnMetadata[]> {
    const columns = await this.getColumnsByTableId(tableMetadataId);
    return columns.filter((col) => col.is_sortable === true);
  }
}
