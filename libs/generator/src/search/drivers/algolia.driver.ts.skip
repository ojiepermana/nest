/**
 * Algolia Search Driver
 *
 * Implementation of ISearchDriver for Algolia search engine
 * Features: Fast search, typo tolerance, faceting, geo search, synonyms
 */

import { Logger } from '@nestjs/common';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import type {
  ISearchDriver,
  SearchQuery,
  SearchResult,
  SearchHit,
  FacetResult,
  BulkIndexOperation,
  AlgoliaConfig,
  IndexStats,
} from '../interfaces/search.interface';

export class AlgoliaDriver implements ISearchDriver {
  readonly name = 'algolia';
  private readonly logger = new Logger(AlgoliaDriver.name);
  private client: SearchClient;
  private indices = new Map<string, SearchIndex>();

  constructor(private readonly config: AlgoliaConfig) {
    this.client = algoliasearch(config.applicationId, config.apiKey);
    this.logger.log('Algolia driver initialized');
  }

  /**
   * Get or create index
   */
  private getIndex(indexName: string): SearchIndex {
    if (!this.indices.has(indexName)) {
      const index = this.client.initIndex(indexName);
      this.indices.set(indexName, index);
    }
    return this.indices.get(indexName)!;
  }

  /**
   * Index a document
   */
  async index<T = any>(indexName: string, document: T, id: string): Promise<void> {
    try {
      const index = this.getIndex(indexName);
      await index.saveObject({
        objectID: id,
        ...document,
      });
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
      const index = this.getIndex(indexName);
      await index.partialUpdateObject({
        objectID: id,
        ...document,
      });
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
      const index = this.getIndex(indexName);
      await index.deleteObject(id);
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
      const index = this.getIndex(indexName);
      const objects = operations
        .filter((op) => op.action === 'index' || op.action === 'update')
        .map((op) => ({
          objectID: op.id,
          ...op.document,
        }));

      const deleteIds = operations.filter((op) => op.action === 'delete').map((op) => op.id);

      if (objects.length > 0) {
        await index.saveObjects(objects);
        this.logger.debug(`Bulk indexed ${objects.length} documents`);
      }

      if (deleteIds.length > 0) {
        await index.deleteObjects(deleteIds);
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
      const index = this.getIndex(indexName);

      // Build search parameters
      const searchParams: Record<string, any> = {
        query: query.query || '',
        hitsPerPage: query.limit || 20,
        page: query.page ? query.page - 1 : 0,
      };

      // Filters
      if (query.filters && query.filters.length > 0) {
        searchParams.filters = this.buildFilterString(query.filters);
      }

      // Facets
      if (query.facets && query.facets.length > 0) {
        searchParams.facets = query.facets;
      }

      // Facet filters
      if (query.facetFilters) {
        searchParams.facetFilters = Object.entries(query.facetFilters).map(
          ([key, value]) => `${key}:${value}`,
        );
      }

      // Searchable fields
      if (query.searchFields && query.searchFields.length > 0) {
        searchParams.restrictSearchableAttributes = query.searchFields;
      }

      // Fields to retrieve
      if (query.fields && query.fields.length > 0) {
        searchParams.attributesToRetrieve = query.fields;
      }

      // Highlighting
      if (query.highlight && query.highlight.fields.length > 0) {
        searchParams.attributesToHighlight = query.highlight.fields;
        searchParams.highlightPreTag = query.highlight.preTag || '<em>';
        searchParams.highlightPostTag = query.highlight.postTag || '</em>';
      }

      // Geo search
      if (query.geo) {
        searchParams.aroundLatLng = `${query.geo.location.lat},${query.geo.location.lon}`;
        if (query.geo.radius) {
          const radiusInMeters = this.parseRadius(query.geo.radius);
          searchParams.aroundRadius = radiusInMeters;
        }
      }

      // Typo tolerance
      if (query.typoTolerance !== undefined) {
        searchParams.typoTolerance = query.typoTolerance.enabled;
        if (query.typoTolerance.maxTypos) {
          searchParams.minWordSizefor1Typo = query.typoTolerance.maxTypos >= 1 ? 4 : 999;
          searchParams.minWordSizefor2Typos = query.typoTolerance.maxTypos >= 2 ? 8 : 999;
        }
      }

      // Sorting
      if (query.sort && query.sort.length > 0) {
        const rankingFormula = query.sort.map((s) => {
          const direction = s.order === 'desc' ? 'desc' : 'asc';
          return `${direction}(${s.field})`;
        });
        searchParams.customRanking = rankingFormula;
      }

      // Execute search
      const response = await index.search<T>('', searchParams);

      // Transform facets
      const facets: Record<string, FacetResult[]> = {};
      if (response.facets) {
        const facetEntries = Object.entries(response.facets as Record<string, any>);
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
        const { objectID, _highlightResult, ...document } = hit as any;
        const result: SearchHit<T> = {
          id: objectID,
          score: 1.0,
          document: document as T,
        };

        if (_highlightResult && query.highlight) {
          result.highlight = {};
          for (const field of query.highlight.fields) {
            if (_highlightResult[field]?.value) {
              result.highlight[field] = [_highlightResult[field].value];
            }
          }
        }

        return result;
      });

      const totalPages = Math.ceil(response.nbHits / (query.limit || 20));

      return {
        hits,
        total: response.nbHits,
        took: response.processingTimeMS,
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
   * Build filter string for Algolia
   */
  private buildFilterString(
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>,
  ): string {
    const filterParts = filters.map((filter) => {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'eq':
          return typeof value === 'string' ? `${field}:"${value}"` : `${field}:${value}`;
        case 'ne':
          return typeof value === 'string' ? `NOT ${field}:"${value}"` : `NOT ${field}:${value}`;
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
            ? value.map((v) => `${field}:"${v}"`).join(' OR ')
            : `${field}:"${value}"`;
        case 'nin':
          return Array.isArray(value)
            ? value.map((v) => `NOT ${field}:"${v}"`).join(' AND ')
            : `NOT ${field}:"${value}"`;
        case 'between':
          return Array.isArray(value) && value.length === 2
            ? `${field}:${value[0]} TO ${value[1]}`
            : '';
        case 'exists':
          return value ? `${field}:*` : `NOT ${field}:*`;
        default:
          return '';
      }
    });

    return filterParts.filter((f) => f).join(' AND ');
  }

  /**
   * Parse radius string to meters
   */
  private parseRadius(radius: string): number {
    const match = radius.match(/^(\d+(?:\.\d+)?)(km|m|mi)?$/);
    if (!match) return 10000; // Default 10km

    const value = parseFloat(match[1]);
    const unit = match[2] || 'm';

    switch (unit) {
      case 'km':
        return value * 1000;
      case 'mi':
        return value * 1609.34;
      default:
        return value;
    }
  }

  /**
   * Get search suggestions
   */
  async suggest(indexName: string, query: string, field: string, size = 5): Promise<string[]> {
    try {
      const index = this.getIndex(indexName);
      const response = await index.search<any>(query, {
        hitsPerPage: size,
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
   * Find similar documents
   */
  async moreLikeThis<T = any>(
    indexName: string,
    id: string,
    fields: string[],
    size = 10,
  ): Promise<SearchResult<T>> {
    try {
      const index = this.getIndex(indexName);

      // Get the source document
      const sourceDoc = await index.getObject<any>(id);
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
      const response = await index.search<T>(queryParts, {
        hitsPerPage: size + 1,
        filters: `NOT objectID:${id}`,
      });

      const hits: SearchHit<T>[] = response.hits
        .filter((hit: any) => hit.objectID !== id)
        .slice(0, size)
        .map((hit: any) => {
          const { objectID, ...document } = hit;
          return {
            id: objectID,
            score: 1.0,
            document: document as T,
          };
        });

      return {
        hits,
        total: hits.length,
        took: response.processingTimeMS,
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
      const index = this.getIndex(indexName);
      const searchParams: Record<string, any> = {
        query: query?.query || '',
        hitsPerPage: 0,
      };

      if (query?.filters) {
        searchParams.filters = this.buildFilterString(query.filters);
      }

      const response = await index.search('', searchParams);
      return response.nbHits;
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
      const index = this.getIndex(indexName);

      const algoliaSettings: Record<string, any> = {};

      if (settings?.searchableFields) {
        algoliaSettings.searchableAttributes = settings.searchableFields;
      }

      if (settings?.filterableFields) {
        algoliaSettings.attributesForFaceting = settings.filterableFields.map(
          (field) => `filterOnly(${field})`,
        );
      }

      if (settings?.rankingRules) {
        algoliaSettings.customRanking = settings.rankingRules;
      }

      if (settings?.stopWords) {
        algoliaSettings.removeStopWords = settings.stopWords;
      }

      if (Object.keys(algoliaSettings).length > 0) {
        await index.setSettings(algoliaSettings);
      }

      // Add synonyms if provided
      if (settings?.synonyms && settings.synonyms.length > 0) {
        const synonymObjects = settings.synonyms.map((synonym, idx) => {
          const words = synonym.split(',').map((w) => w.trim());
          return {
            objectID: `synonym_${idx}`,
            type: 'synonym',
            synonyms: words,
          };
        });
        await index.saveSynonyms(synonymObjects, {
          replaceExistingSynonyms: true,
        });
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
      const index = this.getIndex(indexName);
      await index.delete();
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
      const index = this.getIndex(indexName);
      await index.getSettings();
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
      const index = this.getIndex(indexName);
      await index.setSettings(settings);
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
      const index = this.getIndex(indexName);
      await index.clearObjects();
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
      const index = this.getIndex(indexName);
      const settings = await index.getSettings();
      const searchResult = await index.search('', { hitsPerPage: 0 });

      return {
        documentCount: searchResult.nbHits,
        sizeInBytes: 0, // Algolia doesn't expose this
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
      await this.client.listIndices();
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${(error as Error).message}`);
      return false;
    }
  }
}
