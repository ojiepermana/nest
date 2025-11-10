/**
 * Search Module Interfaces
 *
 * Multi-driver search system inspired by Laravel Scout
 * Supports: Elasticsearch, Algolia, Meilisearch, Database
 */

/**
 * Search driver types
 */
export type SearchDriver = 'elasticsearch' | 'algolia' | 'meilisearch' | 'database';

/**
 * Searchable model configuration
 */
export interface SearchableConfig {
  /**
   * Index name (collection name in search engine)
   */
  indexName: string;

  /**
   * Primary key field name
   */
  primaryKey: string;

  /**
   * Fields to be indexed
   */
  searchableFields: string[];

  /**
   * Fields to be returned in search results
   */
  returnFields?: string[];

  /**
   * Ranking/Relevance configuration
   */
  ranking?: {
    /**
     * Fields with their weights for relevance scoring
     * Higher weight = more important
     */
    weights?: Record<string, number>;

    /**
     * Custom ranking attributes (for sorting)
     */
    customRanking?: string[];
  };

  /**
   * Faceting configuration (for filters)
   */
  facets?: string[];

  /**
   * Synonyms for better search results
   */
  synonyms?: Record<string, string[]>;

  /**
   * Stop words to be ignored
   */
  stopWords?: string[];

  /**
   * Auto-sync on CRUD operations
   */
  autoSync?: boolean;

  /**
   * Soft delete field name (to filter out deleted records)
   */
  softDeleteField?: string;
}

/**
 * Search query options
 */
export interface SearchQuery {
  /**
   * Search term
   */
  query: string;

  /**
   * Filters to apply
   */
  filters?: SearchFilter[];

  /**
   * Facet filters
   */
  facetFilters?: Record<string, string | string[]>;

  /**
   * Pagination
   */
  page?: number;
  limit?: number;

  /**
   * Fields to search in (default: all searchable fields)
   */
  searchFields?: string[];

  /**
   * Fields to return (default: all)
   */
  select?: string[];

  /**
   * Sorting
   */
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;

  /**
   * Highlighting
   */
  highlight?: {
    enabled: boolean;
    fields?: string[];
    preTag?: string;
    postTag?: string;
  };

  /**
   * Geo search
   */
  geo?: {
    lat: number;
    lng: number;
    radius?: number; // in meters
    unit?: 'km' | 'mi';
  };

  /**
   * Typo tolerance
   */
  typoTolerance?: boolean;

  /**
   * Minimum match score
   */
  minScore?: number;
}

/**
 * Search filter
 */
export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists';
  value: any;
}

/**
 * Search result
 */
export interface SearchResult<T = any> {
  /**
   * Search hits
   */
  hits: SearchHit<T>[];

  /**
   * Total number of results
   */
  total: number;

  /**
   * Current page
   */
  page: number;

  /**
   * Results per page
   */
  limit: number;

  /**
   * Total pages
   */
  totalPages: number;

  /**
   * Query execution time (ms)
   */
  processingTimeMs: number;

  /**
   * Facets (aggregations)
   */
  facets?: Record<string, FacetResult[]>;
}

/**
 * Search hit (single result)
 */
export interface SearchHit<T = any> {
  /**
   * Document data
   */
  document: T;

  /**
   * Relevance score
   */
  score: number;

  /**
   * Highlighted fields
   */
  highlights?: Record<string, string>;

  /**
   * Matched fields
   */
  matchedFields?: string[];
}

/**
 * Facet result
 */
export interface FacetResult {
  value: string;
  count: number;
}

/**
 * Bulk index operation
 */
export interface BulkIndexOperation<T = any> {
  action: 'index' | 'update' | 'delete';
  document?: T;
  id: string;
}

/**
 * Search driver interface
 */
export interface ISearchDriver {
  /**
   * Driver name
   */
  name: SearchDriver;

  /**
   * Index a single document
   */
  index<T = any>(indexName: string, document: T, id: string): Promise<void>;

  /**
   * Update a document
   */
  update<T = any>(indexName: string, document: Partial<T>, id: string): Promise<void>;

  /**
   * Delete a document
   */
  delete(indexName: string, id: string): Promise<void>;

  /**
   * Bulk operations
   */
  bulk<T = any>(indexName: string, operations: BulkIndexOperation<T>[]): Promise<void>;

  /**
   * Search documents
   */
  search<T = any>(indexName: string, query: SearchQuery): Promise<SearchResult<T>>;

  /**
   * Create index
   */
  createIndex(indexName: string, config: SearchableConfig): Promise<void>;

  /**
   * Delete index
   */
  deleteIndex(indexName: string): Promise<void>;

  /**
   * Check if index exists
   */
  indexExists(indexName: string): Promise<boolean>;

  /**
   * Update index settings
   */
  updateIndexSettings(indexName: string, settings: Partial<SearchableConfig>): Promise<void>;

  /**
   * Get document count in index
   */
  count(indexName: string, filters?: SearchFilter[]): Promise<number>;

  /**
   * Suggest/Autocomplete
   */
  suggest(indexName: string, query: string, limit?: number): Promise<string[]>;

  /**
   * Get similar documents
   */
  moreLikeThis<T = any>(
    indexName: string,
    documentId: string,
    limit?: number,
  ): Promise<SearchResult<T>>;

  /**
   * Flush index (commit changes)
   */
  flush(indexName: string): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Search module configuration
 */
export interface SearchModuleConfig {
  /**
   * Default search driver
   */
  driver: SearchDriver;

  /**
   * Elasticsearch configuration
   */
  elasticsearch?: {
    node: string | string[];
    auth?: {
      username: string;
      password: string;
      apiKey?: string;
    };
    maxRetries?: number;
    requestTimeout?: number;
    sniffOnStart?: boolean;
  };

  /**
   * Algolia configuration
   */
  algolia?: {
    applicationId: string;
    apiKey: string;
    adminApiKey?: string;
  };

  /**
   * Meilisearch configuration
   */
  meilisearch?: {
    host: string;
    apiKey?: string;
  };

  /**
   * Database fallback configuration
   */
  database?: {
    type: 'postgresql' | 'mysql';
    // Uses existing database connection
  };

  /**
   * Queue configuration for async indexing
   */
  queue?: {
    enabled: boolean;
    name?: string;
    concurrency?: number;
  };

  /**
   * Cache configuration
   */
  cache?: {
    enabled: boolean;
    ttl?: number; // seconds
    prefix?: string;
  };
}

/**
 * Sync status
 */
export interface SyncStatus {
  indexName: string;
  documentsIndexed: number;
  documentsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

/**
 * Index statistics
 */
export interface IndexStats {
  indexName: string;
  documentCount: number;
  sizeBytes?: number;
  lastUpdated?: Date;
}
