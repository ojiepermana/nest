/**
 * Database Search Driver
 *
 * Simple fallback search driver using SQL LIKE/ILIKE queries
 * No external dependencies - uses existing database connection
 * Best for: Simple search, development, small datasets
 */

import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  ISearchDriver,
  SearchQuery,
  SearchResult,
  SearchHit,
  FacetResult,
  BulkIndexOperation,
  DatabaseSearchConfig,
  IndexStats,
} from '../interfaces/search.interface';

export class DatabaseDriver implements ISearchDriver {
  readonly name = 'database';
  private readonly logger = new Logger(DatabaseDriver.name);
  private pool: Pool;
  private readonly schema: string;
  private indices = new Map<string, { tableName: string; columns: string[] }>();

  constructor(private readonly config: DatabaseSearchConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      max: config.poolSize || 10,
    });
    this.schema = config.schema || 'search';
    this.logger.log('Database search driver initialized');
  }

  /**
   * Index a document (insert into search table)
   */
  async index<T = any>(indexName: string, document: T, id: string): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);
      const data = JSON.stringify(document);

      const query = `
        INSERT INTO ${this.schema}.${tableName} (id, data, indexed_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE
        SET data = $2::jsonb, indexed_at = NOW()
      `;

      await this.pool.query(query, [id, data]);
      this.logger.debug(`Indexed document ${id} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to index document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update<T = any>(indexName: string, document: Partial<T>, id: string): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);

      // Get existing document and merge with updates
      const selectQuery = `SELECT data FROM ${this.schema}.${tableName} WHERE id = $1`;
      const result = await this.pool.query(selectQuery, [id]);

      if (result.rows.length === 0) {
        throw new Error(`Document ${id} not found`);
      }

      const existingData = result.rows[0].data;
      const mergedData = { ...existingData, ...document };

      const updateQuery = `
        UPDATE ${this.schema}.${tableName}
        SET data = $1::jsonb, indexed_at = NOW()
        WHERE id = $2
      `;

      await this.pool.query(updateQuery, [JSON.stringify(mergedData), id]);
      this.logger.debug(`Updated document ${id} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to update document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(indexName: string, id: string): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);
      const query = `DELETE FROM ${this.schema}.${tableName} WHERE id = $1`;
      await this.pool.query(query, [id]);
      this.logger.debug(`Deleted document ${id} from ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulk<T = any>(indexName: string, operations: BulkIndexOperation<T>[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const op of operations) {
        if (op.action === 'index') {
          await this.index(indexName, op.document!, op.id);
        } else if (op.action === 'update') {
          await this.update(indexName, op.document!, op.id);
        } else if (op.action === 'delete') {
          await this.delete(indexName, op.id);
        }
      }

      await client.query('COMMIT');
      this.logger.debug(`Bulk operation completed: ${operations.length} operations`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Bulk operation failed: ${(error as Error).message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search documents using LIKE/ILIKE
   */
  async search<T = any>(indexName: string, query: SearchQuery): Promise<SearchResult<T>> {
    try {
      const tableName = this.getTableName(indexName);
      const limit = query.limit || 20;
      const offset = query.page ? (query.page - 1) * limit : 0;

      // Build WHERE clause
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Full-text search using ILIKE
      if (query.query) {
        const searchFields = query.searchFields || ['data'];
        const searchConditions = searchFields.map(() => {
          const condition = `data::text ILIKE $${paramIndex}`;
          params.push(`%${query.query}%`);
          paramIndex++;
          return condition;
        });
        whereClauses.push(`(${searchConditions.join(' OR ')})`);
      }

      // Filters
      if (query.filters && query.filters.length > 0) {
        for (const filter of query.filters) {
          const filterClause = this.buildFilterClause(filter, paramIndex);
          if (filterClause) {
            whereClauses.push(filterClause.clause);
            for (const param of filterClause.params) {
              params.push(param);
            }
            paramIndex += filterClause.params.length;
          }
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Build ORDER BY
      let orderBy = 'ORDER BY indexed_at DESC';
      if (query.sort && query.sort.length > 0) {
        const sortClauses = query.sort.map((s) => {
          const direction = s.order === 'desc' ? 'DESC' : 'ASC';
          return `data->>'${s.field}' ${direction}`;
        });
        orderBy = `ORDER BY ${sortClauses.join(', ')}`;
      }

      // Count total
      const countQuery = `SELECT COUNT(*) FROM ${this.schema}.${tableName} ${whereClause}`;
      const countResult = await this.pool.query(countQuery, params);
      const total = parseInt(String(countResult.rows[0].count), 10);

      // Execute search
      const searchQuery = `
        SELECT id, data
        FROM ${this.schema}.${tableName}
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const startTime = Date.now();
      const result = await this.pool.query(searchQuery, params);
      const took = Date.now() - startTime;

      // Transform results
      const hits: SearchHit<T>[] = result.rows.map((row) => ({
        id: row.id,
        score: 1.0,
        document: row.data as T,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        hits,
        total,
        took,
        page: query.page || 1,
        perPage: limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Search failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Build filter clause for SQL
   */
  private buildFilterClause(
    filter: { field: string; operator: string; value: any },
    startIndex: number,
  ): { clause: string; params: any[] } | null {
    const { field, operator, value } = filter;
    const params: any[] = [];

    let clause = '';
    switch (operator) {
      case 'eq':
        clause = `data->>'${field}' = $${startIndex}`;
        params.push(String(value));
        break;
      case 'ne':
        clause = `data->>'${field}' != $${startIndex}`;
        params.push(String(value));
        break;
      case 'gt':
        clause = `(data->>'${field}')::numeric > $${startIndex}`;
        params.push(value);
        break;
      case 'gte':
        clause = `(data->>'${field}')::numeric >= $${startIndex}`;
        params.push(value);
        break;
      case 'lt':
        clause = `(data->>'${field}')::numeric < $${startIndex}`;
        params.push(value);
        break;
      case 'lte':
        clause = `(data->>'${field}')::numeric <= $${startIndex}`;
        params.push(value);
        break;
      case 'in':
        if (Array.isArray(value)) {
          const placeholders = value.map((_, i) => `$${startIndex + i}`).join(', ');
          clause = `data->>'${field}' IN (${placeholders})`;
          params.push(...value.map(String));
        }
        break;
      case 'nin':
        if (Array.isArray(value)) {
          const placeholders = value.map((_, i) => `$${startIndex + i}`).join(', ');
          clause = `data->>'${field}' NOT IN (${placeholders})`;
          params.push(...value.map(String));
        }
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          clause = `(data->>'${field}')::numeric BETWEEN $${startIndex} AND $${startIndex + 1}`;
          params.push(value[0], value[1]);
        }
        break;
      case 'exists':
        clause = value ? `data ? '${field}'` : `NOT (data ? '${field}')`;
        break;
      default:
        return null;
    }

    return clause ? { clause, params } : null;
  }

  /**
   * Get suggestions (simple autocomplete)
   */
  async suggest(indexName: string, query: string, field: string, size = 5): Promise<string[]> {
    try {
      const tableName = this.getTableName(indexName);
      const searchQuery = `
        SELECT DISTINCT data->>'${field}' as value
        FROM ${this.schema}.${tableName}
        WHERE data->>'${field}' ILIKE $1
        LIMIT $2
      `;

      const result = await this.pool.query(searchQuery, [`${query}%`, size]);
      return result.rows.map((row) => row.value).filter((v) => v);
    } catch (error) {
      this.logger.error(`Suggest failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Find similar documents (basic implementation using common words)
   */
  async moreLikeThis<T = any>(
    indexName: string,
    id: string,
    fields: string[],
    size = 10,
  ): Promise<SearchResult<T>> {
    try {
      const tableName = this.getTableName(indexName);

      // Get source document
      const sourceQuery = `SELECT data FROM ${this.schema}.${tableName} WHERE id = $1`;
      const sourceResult = await this.pool.query(sourceQuery, [id]);

      if (sourceResult.rows.length === 0) {
        return { hits: [], total: 0, took: 0 };
      }

      const sourceDoc = sourceResult.rows[0].data;

      // Build search conditions based on similar field values
      const conditions = fields
        .map((field) => {
          const value = sourceDoc[field];
          if (!value) return null;
          return `data->>'${field}' ILIKE '%${value}%'`;
        })
        .filter((c) => c);

      if (conditions.length === 0) {
        return { hits: [], total: 0, took: 0 };
      }

      const similarQuery = `
        SELECT id, data
        FROM ${this.schema}.${tableName}
        WHERE (${conditions.join(' OR ')})
          AND id != $1
        LIMIT $2
      `;

      const startTime = Date.now();
      const result = await this.pool.query(similarQuery, [id, size]);
      const took = Date.now() - startTime;

      const hits: SearchHit<T>[] = result.rows.map((row) => ({
        id: row.id,
        score: 1.0,
        document: row.data as T,
      }));

      return {
        hits,
        total: hits.length,
        took,
      };
    } catch (error) {
      this.logger.error(`More like this failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Count documents
   */
  async count(indexName: string, query?: SearchQuery): Promise<number> {
    try {
      const tableName = this.getTableName(indexName);

      if (!query || (!query.query && !query.filters)) {
        const result = await this.pool.query(`SELECT COUNT(*) FROM ${this.schema}.${tableName}`);
        return parseInt(String(result.rows[0].count), 10);
      }

      // Build WHERE clause for filtered count
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (query.query) {
        whereClauses.push(`data::text ILIKE $${paramIndex}`);
        params.push(`%${query.query}%`);
        paramIndex++;
      }

      if (query.filters) {
        for (const filter of query.filters) {
          const filterClause = this.buildFilterClause(filter, paramIndex);
          if (filterClause) {
            whereClauses.push(filterClause.clause);
            for (const param of filterClause.params) {
              params.push(param);
            }
            paramIndex += filterClause.params.length;
          }
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const countQuery = `SELECT COUNT(*) FROM ${this.schema}.${tableName} ${whereClause}`;
      const result = await this.pool.query(countQuery, params);
      return parseInt(String(result.rows[0].count), 10);
    } catch (error) {
      this.logger.error(`Count failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create search table for index
   */
  async createIndex(
    indexName: string,
    settings?: {
      searchableFields?: string[];
      filterableFields?: string[];
      sortableFields?: string[];
    },
  ): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);

      // Create schema if not exists
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);

      // Create table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.schema}.${tableName} (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          indexed_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await this.pool.query(createTableQuery);

      // Create GIN index for JSONB
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS ${tableName}_data_idx
        ON ${this.schema}.${tableName} USING GIN (data)
      `;
      await this.pool.query(createIndexQuery);

      // Create indexes for filterable fields
      if (settings?.filterableFields) {
        for (const field of settings.filterableFields) {
          const indexName = `${tableName}_${field}_idx`;
          const createFieldIndexQuery = `
            CREATE INDEX IF NOT EXISTS ${indexName}
            ON ${this.schema}.${tableName} ((data->>'${field}'))
          `;
          await this.pool.query(createFieldIndexQuery);
        }
      }

      // Store index configuration
      this.indices.set(indexName, {
        tableName,
        columns: settings?.searchableFields || [],
      });

      this.logger.log(`Index ${indexName} created as table ${this.schema}.${tableName}`);
    } catch (error) {
      this.logger.error(`Failed to create index: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete index (drop table)
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);
      await this.pool.query(`DROP TABLE IF EXISTS ${this.schema}.${tableName}`);
      this.indices.delete(indexName);
      this.logger.log(`Index ${indexName} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete index: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const tableName = this.getTableName(indexName);
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1 AND table_name = $2
        )
      `;
      const result = await this.pool.query(query, [this.schema, tableName]);
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update index settings (add indexes)
   */
  async updateIndexSettings(indexName: string, settings: Record<string, any>): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);

      if (settings.filterableFields && Array.isArray(settings.filterableFields)) {
        for (const field of settings.filterableFields) {
          const indexName = `${tableName}_${field}_idx`;
          const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS ${indexName}
            ON ${this.schema}.${tableName} ((data->>'${field}'))
          `;
          await this.pool.query(createIndexQuery);
        }
      }

      this.logger.log(`Index ${indexName} settings updated`);
    } catch (error) {
      this.logger.error(`Failed to update index settings: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Clear all documents from index
   */
  async flush(indexName: string): Promise<void> {
    try {
      const tableName = this.getTableName(indexName);
      await this.pool.query(`TRUNCATE TABLE ${this.schema}.${tableName}`);
      this.logger.log(`Index ${indexName} flushed`);
    } catch (error) {
      this.logger.error(`Failed to flush index: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexName: string): Promise<IndexStats> {
    try {
      const tableName = this.getTableName(indexName);

      const countQuery = `SELECT COUNT(*) FROM ${this.schema}.${tableName}`;
      const countResult = await this.pool.query(countQuery);

      const sizeQuery = `
        SELECT pg_total_relation_size($1::regclass) as size
      `;
      const sizeResult = await this.pool.query(sizeQuery, [`${this.schema}.${tableName}`]);

      return {
        documentCount: parseInt(String(countResult.rows[0].count), 10),
        sizeInBytes: parseInt(String(sizeResult.rows[0].size), 10),
        indexName,
      };
    } catch (error) {
      this.logger.error(`Failed to get index stats: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get table name from index name
   */
  private getTableName(indexName: string): string {
    return indexName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.log('Database driver closed');
  }
}
