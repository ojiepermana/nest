/**
 * Search Service
 *
 * Main search service with Laravel Scout-like API
 * Provides unified interface for all search drivers
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import type {
  ISearchDriver,
  SearchQuery,
  SearchResult,
  SearchableConfig,
  BulkIndexOperation,
  SearchFilter,
  SyncStatus,
  IndexStats,
} from './interfaces/search.interface';
import { SEARCH_DRIVER, SEARCH_CONFIG } from './search.constants';
import type { SearchModuleConfig } from './interfaces/search.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly searchableModels = new Map<string, SearchableConfig>();

  constructor(
    @Inject(SEARCH_DRIVER as symbol) private readonly driver: ISearchDriver,
    @Inject(SEARCH_CONFIG as symbol) private readonly config: SearchModuleConfig,
  ) {
    this.logger.log(`Search Service initialized with driver: ${driver.name}`);
  }

  /**
   * Register a searchable model
   */
  registerSearchableModel(modelName: string, config: SearchableConfig): void {
    this.searchableModels.set(modelName, config);
    this.logger.debug(`Registered searchable model: ${modelName}`);
  }

  /**
   * Get searchable config for a model
   */
  getSearchableConfig(modelName: string): SearchableConfig | undefined {
    return this.searchableModels.get(modelName);
  }

  /**
   * Make a model searchable (index a document)
   */
  async makeSearchable<T = any>(modelName: string, document: T, id: string): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable. Did you register it?`);
    }

    await this.driver.index(config.indexName, document, id);
  }

  /**
   * Update searchable document
   */
  async updateSearchable<T = any>(
    modelName: string,
    document: Partial<T>,
    id: string,
  ): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    await this.driver.update(config.indexName, document, id);
  }

  /**
   * Remove from search index
   */
  async removeFromSearch(modelName: string, id: string): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    await this.driver.delete(config.indexName, id);
  }

  /**
   * Bulk import documents
   */
  async importSearchable<T = any>(
    modelName: string,
    documents: Array<{ id: string; data: T }>,
  ): Promise<SyncStatus> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    const status: SyncStatus = {
      indexName: config.indexName,
      documentsIndexed: 0,
      documentsFailed: 0,
      startedAt: new Date(),
      status: 'running',
    };

    try {
      const operations: BulkIndexOperation<T>[] = documents.map((doc) => ({
        action: 'index',
        document: doc.data,
        id: doc.id,
      }));

      await this.driver.bulk(config.indexName, operations);

      status.documentsIndexed = documents.length;
      status.status = 'completed';
      status.completedAt = new Date();
    } catch (error) {
      status.status = 'failed';
      status.error = error.message;
      status.documentsFailed = documents.length;
      this.logger.error(`Bulk import failed: ${error.message}`, error.stack);
    }

    return status;
  }

  /**
   * Search (Laravel Scout-like API)
   */
  async search<T = any>(modelName: string, query: string | SearchQuery): Promise<SearchResult<T>> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    // Convert string query to SearchQuery object
    const searchQuery: SearchQuery =
      typeof query === 'string'
        ? {
            query,
            searchFields: config.searchableFields,
          }
        : query;

    return this.driver.search<T>(config.indexName, searchQuery);
  }

  /**
   * Create query builder (fluent API)
   */
  queryBuilder<T = any>(modelName: string): SearchQueryBuilder<T> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    return new SearchQueryBuilder<T>(this.driver, config);
  }

  /**
   * Get autocomplete suggestions
   */
  async suggest(modelName: string, query: string, limit: number = 10): Promise<string[]> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    return this.driver.suggest(config.indexName, query, undefined, limit);
  }

  /**
   * Find similar documents
   */
  async similar<T = any>(
    modelName: string,
    documentId: string,
    limit: number = 10,
  ): Promise<SearchResult<T>> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    return this.driver.moreLikeThis<T>(config.indexName, documentId, undefined, limit);
  }

  /**
   * Get index statistics
   */
  async getIndexStats(modelName: string): Promise<IndexStats> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    const count = await this.driver.count(config.indexName);

    return {
      indexName: config.indexName,
      documentCount: count,
      lastUpdated: new Date(),
    };
  }

  /**
   * Flush index (force refresh)
   */
  async flush(modelName: string): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    await this.driver.flush(config.indexName);
  }

  /**
   * Create index for a model
   */
  async createIndex(modelName: string): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    await this.driver.createIndex(config.indexName, config);
  }

  /**
   * Delete index for a model
   */
  async deleteIndex(modelName: string): Promise<void> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} is not searchable`);
    }

    await this.driver.deleteIndex(config.indexName);
  }

  /**
   * Check if index exists
   */
  async indexExists(modelName: string): Promise<boolean> {
    const config = this.searchableModels.get(modelName);
    if (!config) {
      return false;
    }

    return this.driver.indexExists(config.indexName);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    driver: string;
    registeredModels: number;
  }> {
    const healthy = await this.driver.healthCheck();

    return {
      healthy,
      driver: this.driver.name,
      registeredModels: this.searchableModels.size,
    };
  }
}

/**
 * Search Query Builder (Fluent API)
 */
export class SearchQueryBuilder<T = any> {
  private query: Partial<SearchQuery> = {};

  constructor(
    private driver: ISearchDriver,
    private config: SearchableConfig,
  ) {}

  /**
   * Set search query
   */
  where(query: string): this {
    this.query.query = query;
    return this;
  }

  /**
   * Add filter
   */
  filter(field: string, operator: SearchFilter['operator'], value: any): this {
    if (!this.query.filters) {
      this.query.filters = [];
    }

    this.query.filters.push({ field, operator, value });
    return this;
  }

  /**
   * Where equals
   */
  whereEquals(field: string, value: any): this {
    return this.filter(field, 'eq', value);
  }

  /**
   * Where not equals
   */
  whereNotEquals(field: string, value: any): this {
    return this.filter(field, 'ne', value);
  }

  /**
   * Where in
   */
  whereIn(field: string, values: any[]): this {
    return this.filter(field, 'in', values);
  }

  /**
   * Where between
   */
  whereBetween(field: string, min: any, max: any): this {
    this.filter(field, 'gte', min);
    this.filter(field, 'lte', max);
    return this;
  }

  /**
   * Set facet filters
   */
  facet(field: string, value: string | string[]): this {
    if (!this.query.facetFilters) {
      this.query.facetFilters = {};
    }

    this.query.facetFilters[field] = value;
    return this;
  }

  /**
   * Set pagination
   */
  paginate(page: number, limit: number): this {
    this.query.page = page;
    this.query.limit = limit;
    return this;
  }

  /**
   * Set limit
   */
  take(limit: number): this {
    this.query.limit = limit;
    return this;
  }

  /**
   * Select fields
   */
  select(...fields: string[]): this {
    this.query.select = fields;
    return this;
  }

  /**
   * Search specific fields
   */
  searchIn(...fields: string[]): this {
    this.query.searchFields = fields;
    return this;
  }

  /**
   * Order by
   */
  orderBy(field: string, order: 'asc' | 'desc' = 'asc'): this {
    if (!this.query.sort) {
      this.query.sort = [];
    }

    this.query.sort.push({ field, order });
    return this;
  }

  /**
   * Enable highlighting
   */
  highlight(fields?: string[], preTag?: string, postTag?: string): this {
    this.query.highlight = {
      enabled: true,
      fields,
      preTag,
      postTag,
    };
    return this;
  }

  /**
   * Geo search
   */
  near(lat: number, lng: number, radius?: number, unit?: 'km' | 'mi'): this {
    this.query.geo = { lat, lng, radius, unit };
    return this;
  }

  /**
   * Enable typo tolerance
   */
  typoTolerance(enabled: boolean = true): this {
    this.query.typoTolerance = enabled;
    return this;
  }

  /**
   * Set minimum score
   */
  minScore(score: number): this {
    this.query.minScore = score;
    return this;
  }

  /**
   * Get first result
   */
  async first(): Promise<T | null> {
    const result = await this.take(1).get();
    return result.hits.length > 0 ? result.hits[0].document : null;
  }

  /**
   * Execute search and get results
   */
  async get(): Promise<SearchResult<T>> {
    const searchQuery: SearchQuery = {
      query: this.query.query || '',
      filters: this.query.filters,
      facetFilters: this.query.facetFilters,
      page: this.query.page,
      limit: this.query.limit,
      select: this.query.select,
      searchFields: this.query.searchFields || this.config.searchableFields,
      sort: this.query.sort,
      highlight: this.query.highlight,
      geo: this.query.geo,
      typoTolerance: this.query.typoTolerance,
      minScore: this.query.minScore,
    };

    return this.driver.search<T>(this.config.indexName, searchQuery);
  }

  /**
   * Count results
   */
  async count(): Promise<number> {
    return this.driver.count(this.config.indexName, this.query.filters);
  }
}
