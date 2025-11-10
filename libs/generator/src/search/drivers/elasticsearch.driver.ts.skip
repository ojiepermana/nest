/**
 * Elasticsearch Search Driver
 *
 * High-performance search driver using Elasticsearch
 * Supports: Full-text search, aggregations, geo search, suggestions
 */

import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import type {
  ISearchDriver,
  SearchQuery,
  SearchResult,
  SearchableConfig,
  BulkIndexOperation,
  SearchFilter,
} from '../interfaces/search.interface';

export interface ElasticsearchConfig {
  node: string | string[];
  auth?: {
    username: string;
    password: string;
    apiKey?: string;
  };
  maxRetries?: number;
  requestTimeout?: number;
  sniffOnStart?: boolean;
}

@Injectable()
export class ElasticsearchDriver implements ISearchDriver {
  readonly name = 'elasticsearch' as const;
  private readonly logger = new Logger(ElasticsearchDriver.name);
  private client: Client;

  constructor(private config: ElasticsearchConfig) {
    this.client = new Client({
      node: config.node,
      auth: config.auth?.apiKey
        ? { apiKey: config.auth.apiKey }
        : config.auth?.username
          ? {
              username: config.auth.username,
              password: config.auth.password,
            }
          : undefined,
      maxRetries: config.maxRetries || 3,
      requestTimeout: config.requestTimeout || 30000,
      sniffOnStart: config.sniffOnStart ?? false,
    });
  }

  /**
   * Index a single document
   */
  async index<T = any>(indexName: string, document: T, id: string): Promise<void> {
    try {
      await this.client.index({
        index: indexName,
        id,
        document,
        refresh: 'wait_for',
      });

      this.logger.debug(`Indexed document ${id} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to index document ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update<T = any>(indexName: string, document: Partial<T>, id: string): Promise<void> {
    try {
      await this.client.update({
        index: indexName,
        id,
        doc: document,
        refresh: 'wait_for',
      });

      this.logger.debug(`Updated document ${id} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to update document ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(indexName: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index: indexName,
        id,
        refresh: 'wait_for',
      });

      this.logger.debug(`Deleted document ${id} from ${indexName}`);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        this.logger.warn(`Document ${id} not found in ${indexName}`);
        return;
      }
      this.logger.error(`Failed to delete document ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulk<T = any>(indexName: string, operations: BulkIndexOperation<T>[]): Promise<void> {
    try {
      const body: any[] = [];

      for (const op of operations) {
        if (op.action === 'index') {
          body.push({ index: { _index: indexName, _id: op.id } });
          body.push(op.document);
        } else if (op.action === 'update') {
          body.push({ update: { _index: indexName, _id: op.id } });
          body.push({ doc: op.document });
        } else if (op.action === 'delete') {
          body.push({ delete: { _index: indexName, _id: op.id } });
        }
      }

      const response = await this.client.bulk({
        refresh: 'wait_for',
        body,
      });

      if (response.errors) {
        const errorItems = response.items.filter(
          (item: any) => item.index?.error || item.update?.error || item.delete?.error,
        );
        this.logger.error(`Bulk operation had ${errorItems.length} errors`);
      } else {
        this.logger.debug(`Bulk operation completed: ${operations.length} operations`);
      }
    } catch (error) {
      this.logger.error(`Bulk operation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search<T = any>(indexName: string, query: SearchQuery): Promise<SearchResult<T>> {
    try {
      const startTime = Date.now();

      // Build Elasticsearch query
      const esQuery = this.buildElasticsearchQuery(query);

      // Execute search
      const response = await this.client.search({
        index: indexName,
        from: ((query.page || 1) - 1) * (query.limit || 10),
        size: query.limit || 10,
        query: esQuery.query,
        sort: this.buildSort(query.sort),
        aggs: this.buildAggregations(query),
        highlight: query.highlight?.enabled ? this.buildHighlight(query.highlight) : undefined,
        _source: query.select || true,
      });

      const processingTimeMs = Date.now() - startTime;

      // Transform response
      const hits = response.hits.hits.map((hit: any) => ({
        document: hit._source as T,
        score: hit._score || 0,
        highlights: hit.highlight || undefined,
        matchedFields: hit.matched_queries || undefined,
      }));

      const total =
        typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total;
      const limit = query.limit || 10;

      return {
        hits,
        total,
        page: query.page || 1,
        limit,
        totalPages: Math.ceil(total / limit),
        processingTimeMs,
        facets: this.transformAggregations(response.aggregations),
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create index
   */
  async createIndex(indexName: string, config: SearchableConfig): Promise<void> {
    try {
      const exists = await this.indexExists(indexName);
      if (exists) {
        this.logger.warn(`Index ${indexName} already exists`);
        return;
      }

      const mappings = this.buildMappings(config);
      const settings = this.buildSettings(config);

      await this.client.indices.create({
        index: indexName,
        mappings,
        settings,
      });

      this.logger.log(`Created index ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to create index ${indexName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete index
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.delete({
        index: indexName,
      });

      this.logger.log(`Deleted index ${indexName}`);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        this.logger.warn(`Index ${indexName} not found`);
        return;
      }
      this.logger.error(`Failed to delete index ${indexName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: indexName,
      });
      return response;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update index settings
   */
  async updateIndexSettings(indexName: string, settings: Partial<SearchableConfig>): Promise<void> {
    try {
      const esSettings = this.buildSettings(settings as SearchableConfig);

      await this.client.indices.close({ index: indexName });
      await this.client.indices.putSettings({
        index: indexName,
        settings: esSettings.analysis,
      });
      await this.client.indices.open({ index: indexName });

      this.logger.log(`Updated settings for index ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to update index settings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get document count
   */
  async count(indexName: string, filters?: SearchFilter[]): Promise<number> {
    try {
      const query = filters ? this.buildFilterQuery(filters) : { match_all: {} };

      const response = await this.client.count({
        index: indexName,
        query,
      });

      return response.count;
    } catch (error) {
      this.logger.error(`Count query failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Autocomplete/Suggestions
   */
  async suggest(indexName: string, query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: indexName,
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: 'suggest',
              size: limit,
              skip_duplicates: true,
            },
          },
        },
      });

      const suggestions = response.suggest?.suggestions?.[0]?.options || [];
      return suggestions.map((opt: any) => opt.text);
    } catch (error) {
      this.logger.error(`Suggest query failed: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * More Like This (similar documents)
   */
  async moreLikeThis<T = any>(
    indexName: string,
    documentId: string,
    limit: number = 10,
  ): Promise<SearchResult<T>> {
    try {
      const startTime = Date.now();

      const response = await this.client.search({
        index: indexName,
        size: limit,
        query: {
          more_like_this: {
            fields: ['*'],
            like: [
              {
                _index: indexName,
                _id: documentId,
              },
            ],
            min_term_freq: 1,
            min_doc_freq: 1,
          },
        },
      });

      const processingTimeMs = Date.now() - startTime;

      const hits = response.hits.hits.map((hit: any) => ({
        document: hit._source as T,
        score: hit._score || 0,
      }));

      const total =
        typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total;

      return {
        hits,
        total,
        page: 1,
        limit,
        totalPages: Math.ceil(total / limit),
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`More Like This query failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Flush index (force refresh)
   */
  async flush(indexName: string): Promise<void> {
    try {
      await this.client.indices.refresh({
        index: indexName,
      });
      this.logger.debug(`Flushed index ${indexName}`);
    } catch (error) {
      this.logger.error(`Flush failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.cluster.health();
      return response.status !== 'red';
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Build Elasticsearch query from SearchQuery
   */
  private buildElasticsearchQuery(query: SearchQuery): any {
    const must: any[] = [];
    const filter: any[] = [];

    // Text search
    if (query.query) {
      if (query.searchFields && query.searchFields.length > 0) {
        must.push({
          multi_match: {
            query: query.query,
            fields: query.searchFields,
            type: 'best_fields',
            fuzziness: query.typoTolerance !== false ? 'AUTO' : 0,
          },
        });
      } else {
        must.push({
          query_string: {
            query: query.query,
            fuzziness: query.typoTolerance !== false ? 'AUTO' : 0,
          },
        });
      }
    } else {
      must.push({ match_all: {} });
    }

    // Filters
    if (query.filters && query.filters.length > 0) {
      const filterQueries = this.buildFilterQuery(query.filters);
      for (const fq of filterQueries) {
        filter.push(fq);
      }
    }

    // Facet filters
    if (query.facetFilters) {
      for (const [field, value] of Object.entries(query.facetFilters)) {
        if (Array.isArray(value)) {
          filter.push({ terms: { [field]: value } });
        } else {
          filter.push({ term: { [field]: value } });
        }
      }
    }

    // Geo search
    if (query.geo) {
      filter.push({
        geo_distance: {
          distance: `${query.geo.radius || 1000}${query.geo.unit === 'mi' ? 'mi' : 'm'}`,
          location: {
            lat: query.geo.lat,
            lon: query.geo.lng,
          },
        },
      });
    }

    // Minimum score
    const result: any = {
      query: {
        bool: {
          must,
          filter: filter.length > 0 ? filter : undefined,
        },
      },
    };

    if (query.minScore) {
      result.min_score = query.minScore;
    }

    return result;
  }

  /**
   * Build filter query
   */
  private buildFilterQuery(filters: SearchFilter[]): any[] {
    return filters.map((f) => {
      switch (f.operator) {
        case 'eq':
          return { term: { [f.field]: f.value } };
        case 'ne':
          return { bool: { must_not: { term: { [f.field]: f.value } } } };
        case 'gt':
          return { range: { [f.field]: { gt: f.value } } };
        case 'gte':
          return { range: { [f.field]: { gte: f.value } } };
        case 'lt':
          return { range: { [f.field]: { lt: f.value } } };
        case 'lte':
          return { range: { [f.field]: { lte: f.value } } };
        case 'in':
          return { terms: { [f.field]: Array.isArray(f.value) ? f.value : [f.value] } };
        case 'nin':
          return {
            bool: {
              must_not: {
                terms: { [f.field]: Array.isArray(f.value) ? f.value : [f.value] },
              },
            },
          };
        case 'exists':
          return { exists: { field: f.field } };
        default:
          return { term: { [f.field]: f.value } };
      }
    });
  }

  /**
   * Build sort configuration
   */
  private buildSort(sort?: Array<{ field: string; order: 'asc' | 'desc' }>): any {
    if (!sort || sort.length === 0) {
      return [{ _score: { order: 'desc' } }];
    }

    return sort.map((s) => ({ [s.field]: { order: s.order } }));
  }

  /**
   * Build aggregations
   */
  private buildAggregations(query: SearchQuery): any {
    if (!query.facetFilters || Object.keys(query.facetFilters).length === 0) {
      return undefined;
    }

    const aggs: any = {};
    for (const facetField of Object.keys(query.facetFilters)) {
      aggs[facetField] = {
        terms: {
          field: facetField,
          size: 100,
        },
      };
    }

    return aggs;
  }

  /**
   * Build highlight configuration
   */
  private buildHighlight(highlight: NonNullable<SearchQuery['highlight']>): any {
    return {
      pre_tags: [highlight.preTag || '<em>'],
      post_tags: [highlight.postTag || '</em>'],
      fields: highlight.fields?.reduce(
        (acc, field) => {
          acc[field] = {};
          return acc;
        },
        {} as Record<string, any>,
      ) || { '*': {} },
    };
  }

  /**
   * Build index mappings
   */
  private buildMappings(config: SearchableConfig): any {
    const properties: any = {};

    for (const field of config.searchableFields) {
      properties[field] = {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      };
    }

    // Add suggestion field
    properties.suggest = {
      type: 'completion',
    };

    return { properties };
  }

  /**
   * Build index settings
   */
  private buildSettings(config: SearchableConfig): any {
    const settings: any = {
      analysis: {
        analyzer: {
          default: {
            type: 'standard',
          },
        },
      },
    };

    // Stop words
    if (config.stopWords && config.stopWords.length > 0) {
      settings.analysis.filter = {
        custom_stop: {
          type: 'stop',
          stopwords: config.stopWords,
        },
      };
    }

    // Synonyms
    if (config.synonyms && Object.keys(config.synonyms).length > 0) {
      const synonymList: string[] = [];
      for (const [key, values] of Object.entries(config.synonyms)) {
        synonymList.push(`${key} => ${values.join(', ')}`);
      }

      settings.analysis.filter.synonym = {
        type: 'synonym',
        synonyms: synonymList,
      };
    }

    return settings;
  }

  /**
   * Transform Elasticsearch aggregations to facets
   */
  private transformAggregations(aggregations?: any): Record<string, any[]> | undefined {
    if (!aggregations || typeof aggregations !== 'object') {
      return undefined;
    }

    const facets: Record<string, any[]> = {};

    for (const [key, value] of Object.entries(aggregations as Record<string, any>)) {
      if (value && typeof value === 'object' && 'buckets' in value) {
        facets[key] = (value as any).buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
        }));
      }
    }

    return facets;
  }
}
