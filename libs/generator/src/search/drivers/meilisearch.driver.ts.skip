/**
 * Meilisearch Driver
 *
 * Implementation of ISearchDriver for Meilisearch
 * Features: Lightweight, self-hosted, easy to deploy, typo tolerance, faceting
 */

import { Logger } from '@nestjs/common';
import { MeiliSearch, Index, SearchResponse } from 'meilisearch';
import type {
  ISearchDriver,
  SearchQuery,
  SearchResult,
  SearchHit,
  FacetResult,
  BulkIndexOperation,
  MeilisearchConfig,
  IndexStats,
} from '../interfaces/search.interface';

export class MeilisearchDriver implements ISearchDriver {
  readonly name = 'meilisearch';
  private readonly logger = new Logger(MeilisearchDriver.name);
  private client: MeiliSearch;
  private indices = new Map<string, Index>();

  constructor(private readonly config: MeilisearchConfig) {
    this.client = new MeiliSearch({
      host: config.host,
      apiKey: config.apiKey,
    });
    this.logger.log('Meilisearch driver initialized');
  }

  /**
   * Get or create index
   */
  private async getIndex(indexName: string): Promise<Index> {
    if (!this.indices.has(indexName)) {
      try {
        const index = this.client.index(indexName);
        await index.fetchInfo();
        this.indices.set(indexName, index);
      } catch (error) {
        // Index doesn't exist, will be created on first document
        const index = this.client.index(indexName);
        this.indices.set(indexName, index);
      }
    }
    return this.indices.get(indexName)!;
  }

  /**
   * Index a document
   */
  async index<T = any>(indexName: string, document: T, id: string): Promise<void> {
    try {
      const index = await this.getIndex(indexName);
      await index.addDocuments([{ id, ...document }], { primaryKey: 'id' });
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
      const index = await this.getIndex(indexName);
      await index.updateDocuments([{ id, ...document }]);
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
      const index = await this.getIndex(indexName);
      await index.deleteDocument(id);
      this.logger.debug(`Deleted document ${id} from ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulk<T = any>(indexName: string, operations: BulkIndexOperation<T>[]): Promise<void> {
    try {
      const index = await this.getIndex(indexName);

      const indexDocs = operations
        .filter((op) => op.action === 'index' || op.action === 'update')
        .map((op) => ({ id: op.id, ...op.document }));

      const deleteIds = operations.filter((op) => op.action === 'delete').map((op) => op.id);

      if (indexDocs.length > 0) {
        await index.addDocuments(indexDocs);
        this.logger.debug(`Bulk indexed ${indexDocs.length} documents`);
      }

      if (deleteIds.length > 0) {
        await index.deleteDocuments(deleteIds);
        this.logger.debug(`Bulk deleted ${deleteIds.length} documents`);
      }
    } catch (error) {
      this.logger.error(`Bulk operation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search<T = any>(indexName: string, query: SearchQuery): Promise<SearchResult<T>> {
    try {
      const index = await this.getIndex(indexName);

      const searchParams: Record<string, any> = {
        limit: query.limit || 20,
        offset: query.page ? (query.page - 1) * (query.limit || 20) : 0,
      };

      // Filters
      if (query.filters && query.filters.length > 0) {
        searchParams.filter = this.buildFilterArray(query.filters);
      }

      // Facets
      if (query.facets && query.facets.length > 0) {
        searchParams.facets = query.facets;
      }

      // Searchable fields
      if (query.searchFields && query.searchFields.length > 0) {
        searchParams.attributesToSearchOn = query.searchFields;
      }

      // Fields to retrieve
      if (query.fields && query.fields.length > 0) {
        searchParams.attributesToRetrieve = query.fields;
      }

      // Highlighting
      if (query.highlight && query.highlight.fields.length > 0) {
        searchParams.attributesToHighlight = query.highlight.fields;
      }

      // Sorting
      if (query.sort && query.sort.length > 0) {
        searchParams.sort = query.sort.map((s) => {
          const direction = s.order === 'desc' ? 'desc' : 'asc';
          return `${s.field}:${direction}`;
        });
      }

      // Execute search
      const response = (await index.search(query.query || '', searchParams)) as SearchResponse<
        T & { id: string; _formatted?: any }
      >;

      // Transform facets
      const facets: Record<string, FacetResult[]> = {};
      if (response.facetDistribution) {
        const facetEntries = Object.entries(response.facetDistribution as Record<string, any>);
        for (const [field, values] of facetEntries) {
          const valueEntries = Object.entries(values as Record<string, number>);
          facets[field] = valueEntries.map(([value, count]) => ({
            value,
            count,
          }));
        }
      }

      // Transform hits
      const hits: SearchHit<T>[] = response.hits.map((hit) => {
        const { id, _formatted, ...document } = hit;
        const result: SearchHit<T> = {
          id: id as string,
          score: 1.0,
          document: document as T,
        };

        if (_formatted && query.highlight) {
          result.highlight = {};
          for (const field of query.highlight.fields) {
            if (_formatted[field]) {
              result.highlight[field] = [_formatted[field] as string];
            }
          }
        }

        return result;
      });

      const totalPages = Math.ceil((response.estimatedTotalHits || 0) / (query.limit || 20));

      return {
        hits,
        total: response.estimatedTotalHits || 0,
        took: response.processingTimeMs,
        facets: Object.keys(facets).length > 0 ? facets : undefined,
        page: query.page || 1,
        perPage: query.limit || 20,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Search failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Build filter array for Meilisearch
   */
  private buildFilterArray(
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>,
  ): string[] {
    return filters.map((filter) => {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'eq':
          return typeof value === 'string' ? `${field} = "${value}"` : `${field} = ${value}`;
        case 'ne':
          return typeof value === 'string' ? `${field} != "${value}"` : `${field} != ${value}`;
        case 'gt':
          return `${field} > ${value}`;
        case 'gte':
          return `${field} >= ${value}`;
        case 'lt':
          return `${field} < ${value}`;
        case 'lte':
          return `${field} <= ${value}`;
        case 'in':
          return Array.isArray(value)
            ? `${field} IN [${value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ')}]`
            : `${field} = "${value}"`;
        case 'between':
          return Array.isArray(value) && value.length === 2
            ? `${field} ${value[0]} TO ${value[1]}`
            : '';
        case 'exists':
          return value ? `${field} EXISTS` : `${field} NOT EXISTS`;
        default:
          return '';
      }
    });
  }

  /**
   * Get search suggestions
   */
  async suggest(indexName: string, query: string, field: string, size = 5): Promise<string[]> {
    try {
      const index = await this.getIndex(indexName);
      const response = await index.search<any>(query, {
        limit: size,
        attributesToRetrieve: [field],
      });

      return response.hits
        .map((hit) => hit[field])
        .filter((value) => value)
        .slice(0, size);
    } catch (error) {
      this.logger.error(`Suggest failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Find similar documents (basic implementation)
   */
  async moreLikeThis<T = any>(
    indexName: string,
    id: string,
    fields: string[],
    size = 10,
  ): Promise<SearchResult<T>> {
    try {
      const index = await this.getIndex(indexName);

      // Get the source document
      const sourceDoc = await index.getDocument<any>(id);
      if (!sourceDoc) {
        return {
          hits: [],
          total: 0,
          took: 0,
        };
      }

      // Build query from similar fields
      const queryParts = fields
        .map((field) => sourceDoc[field])
        .filter((value) => value)
        .join(' ');

      // Search for similar documents
      const response = await index.search<T & { id: string }>(queryParts, {
        limit: size + 1,
      });

      const hits: SearchHit<T>[] = response.hits
        .filter((hit) => hit.id !== id)
        .slice(0, size)
        .map((hit) => {
          const { id: docId, ...document } = hit;
          return {
            id: docId as string,
            score: 1.0,
            document: document as T,
          };
        });

      return {
        hits,
        total: hits.length,
        took: response.processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`More like this failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get document count
   */
  async count(indexName: string, query?: SearchQuery): Promise<number> {
    try {
      const index = await this.getIndex(indexName);

      if (!query?.query && (!query?.filters || query.filters.length === 0)) {
        const stats = await index.getStats();
        return stats.numberOfDocuments;
      }

      const searchParams: Record<string, any> = { limit: 0 };

      if (query?.filters) {
        searchParams.filter = this.buildFilterArray(query.filters);
      }

      const response = await index.search(query?.query || '', searchParams);
      return response.estimatedTotalHits || 0;
    } catch (error) {
      this.logger.error(`Count failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create index with settings
   */
  async createIndex(
    indexName: string,
    settings?: {
      searchableFields?: string[];
      filterableFields?: string[];
      sortableFields?: string[];
      synonyms?: string[];
      stopWords?: string[];
      rankingRules?: string[];
    },
  ): Promise<void> {
    try {
      await this.client.createIndex(indexName, { primaryKey: 'id' });
      const index = await this.getIndex(indexName);

      const meiliSettings: Record<string, any> = {};

      if (settings?.searchableFields) {
        meiliSettings.searchableAttributes = settings.searchableFields;
      }

      if (settings?.filterableFields) {
        meiliSettings.filterableAttributes = settings.filterableFields;
      }

      if (settings?.sortableFields) {
        meiliSettings.sortableAttributes = settings.sortableFields;
      }

      if (settings?.rankingRules) {
        meiliSettings.rankingRules = settings.rankingRules;
      }

      if (settings?.stopWords) {
        meiliSettings.stopWords = settings.stopWords;
      }

      if (settings?.synonyms) {
        const synonymMap: Record<string, string[]> = {};
        settings.synonyms.forEach((synonym) => {
          const words = synonym.split(',').map((w) => w.trim());
          if (words.length > 1) {
            const key = words[0];
            synonymMap[key] = words.slice(1);
          }
        });
        meiliSettings.synonyms = synonymMap;
      }

      if (Object.keys(meiliSettings).length > 0) {
        await index.updateSettings(meiliSettings);
      }

      this.logger.log(`Index ${indexName} created with settings`);
    } catch (error) {
      this.logger.error(`Failed to create index: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete index
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.deleteIndex(indexName);
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
      const index = this.client.index(indexName);
      await index.fetchInfo();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update index settings
   */
  async updateIndexSettings(indexName: string, settings: Record<string, any>): Promise<void> {
    try {
      const index = await this.getIndex(indexName);
      await index.updateSettings(settings);
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
      const index = await this.getIndex(indexName);
      await index.deleteAllDocuments();
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
      const index = await this.getIndex(indexName);
      const stats = await index.getStats();

      return {
        documentCount: stats.numberOfDocuments,
        sizeInBytes: 0, // Meilisearch doesn't expose this in stats
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
      await this.client.health();
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${(error as Error).message}`);
      return false;
    }
  }
}
