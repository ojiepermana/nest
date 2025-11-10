/**
 * Searchable Decorator
 *
 * Marks an entity/model as searchable and auto-registers it with SearchService
 * Similar to Laravel Scout's Searchable trait
 */

import { SetMetadata } from '@nestjs/common';
import type { SearchableConfig } from '../interfaces/search.interface';

export const SEARCHABLE_METADATA_KEY = 'searchable:config';

/**
 * Decorator to mark a class as searchable
 *
 * @example
 * ```typescript
 * @Searchable({
 *   indexName: 'products',
 *   searchableFields: ['name', 'description', 'category'],
 *   filterableFields: ['price', 'in_stock', 'category'],
 *   sortableFields: ['price', 'created_at'],
 *   facets: ['category', 'brand'],
 * })
 * export class Product {
 *   id: string;
 *   name: string;
 *   description: string;
 *   // ...
 * }
 * ```
 */
export function Searchable(config: Omit<SearchableConfig, 'indexName'> & { indexName?: string }) {
  return function (target: any) {
    // Generate index name from class name if not provided
    const indexName = config.indexName || target.name.toLowerCase() + 's';

    const fullConfig: SearchableConfig = {
      indexName,
      searchableFields: config.searchableFields || [],
      filterableFields: config.filterableFields,
      sortableFields: config.sortableFields,
      facets: config.facets,
      rankingRules: config.rankingRules,
      synonyms: config.synonyms,
      stopWords: config.stopWords,
    };

    // Store metadata on the class
    SetMetadata(SEARCHABLE_METADATA_KEY, fullConfig)(target);

    return target;
  };
}

/**
 * Get searchable config from a class
 */
export function getSearchableConfig(target: object): SearchableConfig | undefined {
  return Reflect.getMetadata(SEARCHABLE_METADATA_KEY, target);
}

/**
 * Check if a class is searchable
 */
export function isSearchable(target: object): boolean {
  return Reflect.hasMetadata(SEARCHABLE_METADATA_KEY, target);
}
