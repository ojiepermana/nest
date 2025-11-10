/**
 * Search Module - Exports
 *
 * Multi-driver search system inspired by Laravel Scout
 */

// Module & Service
export { SearchModule } from './search.module';
export { SearchService } from './search.service';

// Drivers
// Note: External drivers require optional dependencies
// export { ElasticsearchDriver } from './drivers/elasticsearch.driver';
// export { AlgoliaDriver } from './drivers/algolia.driver';
// export { MeilisearchDriver } from './drivers/meilisearch.driver';
export { DatabaseDriver } from './drivers/database.driver';

// Decorators & Interceptors
export {
  Searchable,
  getSearchableConfig,
  isSearchable,
  SEARCHABLE_METADATA_KEY,
} from './decorators';
export {
  AutoSync,
  SearchSyncInterceptor,
  createSearchSyncInterceptor,
  type SyncOptions,
} from './interceptors';

// Generators
export { SearchGenerator, type SearchGeneratorOptions } from './generators';

// Interfaces & Types
export type {
  SearchDriver,
  SearchableConfig,
  SearchQuery,
  SearchFilter,
  SearchResult,
  SearchHit,
  FacetResult,
  BulkIndexOperation,
  SearchSuggestion,
  SearchAggregation,
  ISearchDriver,
  SearchModuleConfig,
  ElasticsearchConfig,
  AlgoliaConfig,
  MeilisearchConfig,
  DatabaseSearchConfig,
  SearchModuleOptions,
  SearchModuleAsyncOptions,
  SyncStatus,
  IndexStats,
} from './interfaces/search.interface';

// Constants
export { SEARCH_DRIVER, SEARCH_OPTIONS } from './search.constants';
